// =====================================================================
// ENTRENADOR PERSONAL
// 1. Indica peso y repeticiones de cada ejercicio (progresión doble + "¿cuántas más podías?").
// 2. Mide la fuerza estimada (fórmula de Epley) para ver si mejorás, te estancás o bajás.
// 3. Cuenta las series por músculo por semana y prioriza los que van atrás.
// 4. Chequeo de 10 segundos al empezar (sueño, energía, dolor, estrés).
// 5. Detecta cambios (faltar, bajar la fuerza, cortar antes) y pregunta el motivo.
// 6. Modos especiales: liviano, corto, mantenimiento, viaje, pausa.
// =====================================================================

// ---------- Fuerza estimada ----------
let pesoCorporalActual = 64;
async function cargarPesoCorporal() {
  const p = (await DB.todos("pesoCorporal")).sort((a, b) => b.fecha - a.fecha)[0];
  if (p) pesoCorporalActual = p.kg;
}
// Epley: peso × (1 + reps/30). En dominadas y fondos se suma el peso del cuerpo.
const e1rm = (x) => ((equipo(x.ejercicio) === "corporal" ? pesoCorporalActual : 0) + x.peso) * (1 + x.reps / 30);
const redondear = (v, paso) => Math.max(0, Math.round(v / paso) * paso);

// Historial de un ejercicio agrupado por sesión (de la más vieja a la más nueva)
async function historialDe(e, excluirSesion) {
  const xs = (await DB.porIndice("series", "ejercicio", e)).filter((x) => x.sesion !== excluirSesion);
  const por = {};
  xs.forEach((x) => (por[x.sesion] = por[x.sesion] || []).push(x));
  return Object.values(por).map((ss) => ({ fecha: Math.min(...ss.map((x) => x.hora)), series: ss.sort((a, b) => a.n - b.n) }))
    .sort((a, b) => a.fecha - b.fecha);
}

// ---------- Indicación del día para un ejercicio ----------
async function prescribir(e, s) {
  const hist = await historialDe(e, s.id);
  if (!hist.length) return null; // primera vez: elegís vos
  const r = reglas(e), ult = hist[hist.length - 1];
  const u = (await unidadDe(e)) || "kg";
  const paso = await pasoDe(e, u);
  const conv = (x) => (uSerie(x) === u ? x.peso : uSerie(x) === "lb" ? x.peso * 0.4536 : x.peso / 0.4536);
  // peso de trabajo: el que más usaste la última vez (si empatan, el más pesado)
  const cuenta = {};
  ult.series.forEach((x) => { const p = redondear(conv(x), 0.25); cuenta[p] = (cuenta[p] || 0) + 1; });
  const peso = +Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || b - a)[0];
  const reps = ult.series.filter((x) => redondear(conv(x), 0.25) === peso).map((x) => x.reps);
  const minR = Math.min(...reps);
  const conRir = ult.series.filter((x) => x.rir != null);
  const rir = conRir.length ? conRir[conRir.length - 1].rir : null; // 0 = nada, 1 = 1-2, 3 = 3 o más
  const uTxt = (v) => fmtPeso(v, u, e);
  let p = peso, objetivoReps, accion, razon;
  const todasMax = reps.every((x) => x >= r.repsMax);
  if (todasMax || (rir === 3 && minR >= r.repsMax - 2)) {
    p = peso + paso; objetivoReps = r.repsMin; accion = "subir";
    razon = todasMax
      ? `Subimos a ${uTxt(p)}: la última vez hiciste todas las series en ${r.repsMax} o más, el máximo del rango. Volvés a ${r.repsMin} repeticiones y a sumar de nuevo.`
      : `Subimos a ${uTxt(p)}: la última vez te sobraban 3 o más repeticiones.`;
  } else if (minR < r.repsMin - 1 && rir === 0 && peso - paso >= 0) {
    p = peso - paso; objetivoReps = r.repsMin; accion = "bajar";
    razon = `Bajamos a ${uTxt(p)}: la última vez no llegaste al mínimo (${r.repsMin}) y quedaste sin margen.`;
  } else {
    objetivoReps = Math.min(r.repsMax, Math.max(r.repsMin, minR + 1)); accion = "mantener";
    razon = `Mismo peso: buscá ${objetivoReps} repeticiones en todas las series (la última vez: ${reps.join(", ")}).`;
  }
  // ¿Estancado? La mejor fuerza de las últimas 3 sesiones no supera a las anteriores
  const mejores = hist.map((h) => Math.max(...h.series.map(e1rm)));
  let nota = "";
  if (mejores.length >= 4 && Math.max(...mejores.slice(-3)) <= Math.max(...mejores.slice(0, -3)))
    nota = "Hace 3 sesiones que no mejorás en este ejercicio. Si sigue así, probá bajar un 10% el peso y sumar 2 repeticiones, o pedile a Emiliano una variante.";
  if (s.vuelta) { p = redondear(p * 0.9, paso); razon = `Volvés después de ${s.vuelta} días: bajamos un 10% para retomar sin lesionarte. ` + razon; }
  if (s.liviano) nota = "Día liviano: dejá 2 repeticiones en reserva, sin llegar al fallo. " + nota;
  return { peso: Math.max(0, p), reps: objetivoReps, accion, razon, nota, unidad: u, mejores };
}

// ---------- Series por músculo por semana ----------
async function volumenMuscular(desde, hasta) {
  const v = Object.fromEntries(MUSCULOS_SEMANA.map((m) => [m, 0]));
  for (const x of await DB.todos("series")) {
    if (x.hora < desde || x.hora >= hasta) continue;
    const ej = EJERCICIOS[x.ejercicio]; if (!ej || ej.tipo === "calentamiento") continue;
    if (ej.principal in v) v[ej.principal] += 1;
    ej.secundarios.forEach((m) => { if (m in v) v[m] += 0.5; });
  }
  return v;
}
async function sesionesEntre(desde, hasta) {
  return (await DB.todos("sesiones")).filter((s) => s.fin && s.inicio >= desde && s.inicio < hasta);
}
// Músculos que quedaron por debajo del mínimo dos semanas seguidas, entrenando normal
async function rezagados() {
  const D = 86400000, ahora = Date.now();
  const [s1, s2] = [await sesionesEntre(ahora - 7 * D, ahora), await sesionesEntre(ahora - 14 * D, ahora - 7 * D)];
  if (s1.length < 3 || s2.length < 3) return [];
  const [v1, v2] = [await volumenMuscular(ahora - 7 * D, ahora), await volumenMuscular(ahora - 14 * D, ahora - 7 * D)];
  return MUSCULOS_SEMANA.filter((m) => v1[m] < REGLAS.volumen.min && v2[m] < REGLAS.volumen.min);
}

// ---------- Modo de entrenamiento y eventos ----------
const leerModo = async () => (await ajuste("modo")) || null;
const guardarModo = (m) => guardarAjuste("modo", m);
async function leerEventos() { return (await ajuste("eventos")) || []; }
async function registrarEvento(ev) {
  const l = await leerEventos(); l.push({ id: nuevoId(), fecha: Date.now(), ...ev });
  await guardarAjuste("eventos", l.slice(-200));
}
const MOTIVOS = { salud: "Salud", tiempo: "Tiempo o agenda", viaje: "Viaje", deporte: "Otro deporte", estres: "Estrés o desmotivación", cansancio: "Cansancio o dormí mal", otro: "Otro motivo" };
const MODOS = {
  liviano: { titulo: "Modo liviano", texto: "Sesiones con una serie menos por ejercicio y sin llegar al fallo, hasta que te sientas bien." },
  corto: { titulo: "Sesiones cortas", texto: "Seguís con tu rutina, pero con límite de 1 hora." },
  mantenimiento: { titulo: "Modo mantenimiento", texto: "2 días por semana, cuerpo completo, ~50 min. Alcanza para no perder lo que ganaste." },
  viaje: { titulo: "Modo viaje", texto: "Rutina sin gimnasio, con el peso del cuerpo, ~30 min." },
  pausa: { titulo: "Pausa", texto: "Hoy toca descansar. Si fue por fiebre, esperá 24 a 48 h sin fiebre antes de volver y consultá a un médico si no mejorás." },
};

// Días que se pueden elegir y día sugerido según el modo
function diasDelModo(modo) {
  if (modo && modo.tipo === "mantenimiento") return ["MA", "MB"];
  if (modo && modo.tipo === "viaje") return ["V"];
  return [1, 2, 3];
}
function diaSugerido(modo, terminadas) {
  const opciones = diasDelModo(modo);
  const ult = terminadas.find((x) => x.tipo !== "pendientes" && opciones.includes(x.dia));
  if (!ult) return opciones[0];
  return opciones[(opciones.indexOf(ult.dia) + 1) % opciones.length];
}
function limiteDe(dia, modo) {
  if (DIAS[dia].especial === "mantenimiento") return REGLAS.limiteMantenimiento;
  if (DIAS[dia].especial === "viaje") return 40;
  if (modo && modo.limite) return modo.limite;
  return REGLAS.limiteMin;
}
const seriesDe = (dia, e) => (DIAS[dia] && DIAS[dia].series && DIAS[dia].series[e]) || reglas(e).series;
const textoDia = (d) => (DIAS[d].especial === "mantenimiento" ? "Mantenimiento " + d.slice(1) : DIAS[d].especial === "viaje" ? "Viaje" : "Día " + d);

// ---------- Detección de cambios ----------
async function detectarCambio() {
  const D = 86400000, ahora = Date.now();
  const modo = await leerModo();
  const eventos = await leerEventos();
  const reciente = (origen, dias) => eventos.some((ev) => ev.origen === origen && ahora - ev.fecha < dias * D);
  const sesiones = (await DB.todos("sesiones")).filter((s) => s.fin).sort((a, b) => b.inicio - a.inicio);
  if (!sesiones.length) return null;
  // Si está en mantenimiento y viene entrenando más, propone volver
  if (modo && modo.tipo === "mantenimiento") {
    const n = sesiones.filter((s) => ahora - s.inicio < 7 * D).length;
    if (n >= 3 && !reciente("volver", 7)) return { origen: "volver", titulo: "Estás pudiendo entrenar más", texto: `Hiciste ${n} entrenamientos esta semana. ¿Volvemos a tu rutina habitual?` };
    return null;
  }
  if (modo) return null;
  if (eventos.some((ev) => ahora - ev.fecha < 2 * D)) return null; // ya preguntamos hace poco
  // 1) Días sin entrenar
  const dias = Math.floor((ahora - sesiones[0].fin) / D);
  if (dias >= 3 && !reciente("ausencia", 5)) return { origen: "ausencia", titulo: `Hace ${dias} días que no entrenás`, texto: "¿Pasó algo? Contame así adapto lo que viene." };
  // 2) Menos días que lo habitual (últimas 2 semanas contra las 4 anteriores)
  const ult2 = sesiones.filter((s) => ahora - s.inicio < 14 * D).length / 2;
  const prev = sesiones.filter((s) => ahora - s.inicio >= 14 * D && ahora - s.inicio < 42 * D).length / 4;
  if (prev >= 3 && ult2 < prev * 0.6 && !reciente("frecuencia", 7))
    return { origen: "frecuencia", titulo: "Estás entrenando menos de lo habitual", texto: `Estas dos semanas: ${Math.round(ult2 * 10) / 10} por semana. Antes: ${Math.round(prev * 10) / 10}. ¿Qué está pasando?` };
  // 3) Bajó la fuerza en el último entrenamiento
  const ultima = sesiones[0];
  const bajas = [];
  for (const e of new Set((await DB.porIndice("series", "sesion", ultima.id)).map((x) => x.ejercicio))) {
    const hist = await historialDe(e);
    const i = hist.findIndex((h) => h.series[0].sesion === ultima.id);
    if (i < 1) continue;
    const ant = Math.max(...hist.slice(Math.max(0, i - 3), i).map((h) => Math.max(...h.series.map(e1rm))));
    const hoy = Math.max(...hist[i].series.map(e1rm));
    if (hoy < ant * 0.9) bajas.push(EJERCICIOS[e].nombre);
  }
  if (bajas.length >= 2 && !reciente("rendimiento", 7))
    return { origen: "rendimiento", titulo: "En tu último entrenamiento bajó tu fuerza", texto: `Bajaste más de un 10% en: ${bajas.join(", ")}. ¿Pasó algo?` };
  return null;
}
function botonesMotivo(origen) {
  return `<div class="motivos">${Object.entries(MOTIVOS).map(([k, t]) => `<button class="sec chico" data-accion="motivo" data-m="${k}" data-o="${origen}">${t}</button>`).join("")}</div>`;
}

// ---------- Aviso si los músculos de hoy no descansaron (ej.: partido de fútbol) ----------
async function avisoRecuperacion(dia) {
  if (DIAS[dia].especial) return "";
  const ult = await ultimoTrabajo();
  const H = 3600000, ahora = Date.now();
  const cansados = [...new Set(DIAS[dia].ejercicios.map((e) => EJERCICIOS[e].principal)
    .filter((m) => (ult.prin[m] || 0) + REGLAS.recuperacion.principalH * H > ahora))];
  if (!cansados.length) return "";
  const mejor = [1, 2, 3].filter((d) => d !== dia).map((d) => ({ d, n: DIAS[d].ejercicios.filter((e) => (ult.prin[EJERCICIOS[e].principal] || 0) + 48 * H > ahora).length }))
    .sort((a, b) => a.n - b.n)[0];
  return `<div class="tarjeta aviso"><b>Ojo: ${cansados.map((m) => NOMBRES_MUSCULOS[m]).join(", ")} todavía no ${cansados.length > 1 ? "descansaron" : "descansó"} 48 h</b>
    ${mejor && mejor.n === 0 ? `<p class="chico">Hoy te conviene el <b>Día ${mejor.d}</b> (${DIAS[mejor.d].nombre}).</p><button class="sec" data-accion="elegir-dia" data-d="${mejor.d}">Cambiar a Día ${mejor.d}</button>` : `<p class="chico">Si podés, hacé una sesión liviana.</p>`}</div>`;
}

// ---------- Tarjetas del inicio ----------
async function tarjetasEntrenador(dia) {
  const D = 86400000, ahora = Date.now();
  const modo = await leerModo();
  let html = "";
  if (modo && MODOS[modo.tipo]) {
    html += `<div class="tarjeta aviso"><b>${MODOS[modo.tipo].titulo}</b>${modo.motivo ? ` <span class="suave chico">(${MOTIVOS[modo.motivo] || modo.motivo})</span>` : ""}
      <p class="chico">${MODOS[modo.tipo].texto}</p>
      <button class="sec" data-accion="volver-normal">Ya volví a la normalidad</button></div>`;
  }
  const cambio = await detectarCambio();
  if (cambio) {
    html += cambio.origen === "volver"
      ? `<div class="tarjeta aviso"><b>${cambio.titulo}</b><p class="chico">${cambio.texto}</p>
          <div class="fila2"><button data-accion="volver-normal">Sí, volver</button><button class="sec" data-accion="motivo" data-m="otro" data-o="volver">Todavía no</button></div></div>`
      : `<div class="tarjeta aviso"><b>${cambio.titulo}</b><p class="chico">${cambio.texto}</p>${botonesMotivo(cambio.origen)}
          <button class="sec chico" data-accion="motivo" data-m="ok" data-o="${cambio.origen}" style="margin-top:8px">Todo bien, fue algo puntual</button></div>`;
  }
  html += await avisoRecuperacion(dia);
  return html;
}

async function tarjetaSemana() {
  const D = 86400000, ahora = Date.now();
  if (!(await sesionesEntre(ahora - 14 * D, ahora)).length) return "";
  const v = await volumenMuscular(ahora - 7 * D, ahora);
  const atras = await rezagados();
  const { min, max } = REGLAS.volumen;
  return `<div class="tarjeta"><b>Series por músculo (últimos 7 días)</b>
    <p class="chico suave" style="margin-top:2px">Para ganar músculo: entre ${min} y ${max} por semana. Directas cuentan 1, indirectas ½.</p>
    ${MUSCULOS_SEMANA.map((m) => { const n = v[m], col = n < min ? "var(--rojo)" : n > max ? "var(--naranja)" : "var(--verde)";
      return `<div class="barra-m"><span>${NOMBRES_MUSCULOS[m]}</span><div class="barra-f"><i style="width:${Math.min(100, (n / max) * 100)}%;background:${col}"></i><em style="left:${(min / max) * 100}%"></em></div><b>${Math.round(n * 10) / 10}</b></div>`; }).join("")}
    ${atras.length ? `<p class="chico mal">Van atrás hace 2 semanas: <b>${atras.map((m) => NOMBRES_MUSCULOS[m]).join(", ")}</b>. Cuando haya que recortar por tiempo, a estos no se les saca.</p>` : ""}
  </div>`;
}

async function tarjetaMedidas() {
  const l = (await ajuste("medidas")) || [];
  const ult = l[l.length - 1];
  if (ult && Date.now() - ult.fecha < 30 * 86400000) return "";
  return `<div class="tarjeta"><b>${ult ? "Hace más de un mes que no cargás tus medidas" : "Cargá tus medidas"}</b>
    <p class="chico suave">Brazo, pecho, cintura y muslo, una vez por mes. Es la forma de saber si el músculo crece de verdad.</p>
    <button class="sec" data-accion="ir" data-p="medidas">Cargar medidas</button></div>`;
}

// ---------- Chequeo de 10 segundos al empezar ----------
const CHEQUEO = [
  { k: "sueno", t: "¿Cómo dormiste?", o: ["Mal", "Normal", "Bien"] },
  { k: "energia", t: "Energía", o: ["Baja", "Normal", "Alta"] },
  { k: "dolor", t: "Dolor muscular", o: ["Mucho", "Algo", "Nada"] },
  { k: "estres", t: "Estrés", o: ["Alto", "Medio", "Bajo"] },
];
function hojaChequeo() {
  const c = E.chk;
  hoja(`<h2>Antes de empezar</h2><p class="chico suave" style="margin-top:-4px">10 segundos: así adapto el entrenamiento de hoy.</p>
    ${CHEQUEO.map((q) => `<p style="margin:12px 0 4px"><b>${q.t}</b></p><div class="fila3">${q.o.map((o, i) =>
      `<button class="${c[q.k] === i ? "" : "sec"}" data-accion="chk" data-k="${q.k}" data-v="${i}">${o}</button>`).join("")}</div>`).join("")}
    <button data-accion="chk-listo" ${CHEQUEO.every((q) => c[q.k] != null) ? "" : "disabled"} style="margin-top:14px">Listo</button>
    <button class="sec" data-accion="chk-saltear">Saltear chequeo</button>`);
}
function hojaRecomendacion(malos) {
  const fuerte = malos >= 3;
  hoja(`<h2>${fuerte ? "Hoy tu cuerpo pide recuperación" : "Hoy conviene una sesión liviana"}</h2>
    <p>Sesión liviana: una serie menos por ejercicio, mismo peso y sin llegar al fallo. Te sigue sumando y te recuperás mejor.</p>
    <button data-accion="chk-empezar" data-l="1">Sesión liviana (recomendado)</button>
    <button class="sec" data-accion="chk-empezar" data-l="0">Entrenar normal igual</button>
    ${fuerte ? `<button class="sec" data-accion="chk-descanso">Hoy descanso</button>` : ""}
    <p style="margin:14px 0 4px"><b>¿A qué se debe?</b> <span class="suave chico">(opcional)</span></p>
    <div class="motivos">${["cansancio", "estres", "salud", "deporte"].map((k) => `<button class="${E.chkMotivo === k ? "" : "sec"} chico" data-accion="chk-motivo" data-m="${k}">${MOTIVOS[k]}</button>`).join("")}</div>`);
}

// ---------- Pantalla de medidas ----------
const CAMPOS_MEDIDAS = [["brazo", "Brazo (cm)"], ["pecho", "Pecho (cm)"], ["cintura", "Cintura (cm)"], ["muslo", "Muslo (cm)"], ["grasa", "Grasa (%)"], ["musculo", "Músculo esquelético (kg)"]];
PANTALLAS.medidas = async function () {
  const l = (await ajuste("medidas")) || [];
  const ult = l[l.length - 1] || {}, pri = l[0];
  app.innerHTML = `
    <button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
    <h1>Mis medidas</h1>
    <p class="suave">Una vez por mes, a la mañana y antes de entrenar. Medí siempre en el mismo lugar del cuerpo.</p>
    <div class="tarjeta">${CAMPOS_MEDIDAS.map(([k, t]) => `<label>${t}<input type="text" inputmode="decimal" id="m-${k}" placeholder="${ult[k] != null ? kg(ult[k]) : ""}"></label>`).join("")}
      <button data-accion="guardar-medidas">Guardar</button></div>
    ${l.length ? `<div class="tarjeta"><b>Historial</b>${l.slice().reverse().map((m) => `<div class="serie"><span>${fecha(m.fecha)}</span><span class="chico">${CAMPOS_MEDIDAS.filter(([k]) => m[k] != null).map(([k, t]) => t.split(" ")[0] + " " + kg(m[k])).join(" · ")}</span></div>`).join("")}
      ${pri && l.length > 1 ? `<p class="chico ok">Desde el ${fecha(pri.fecha)}: ${CAMPOS_MEDIDAS.filter(([k]) => pri[k] != null && ult[k] != null).map(([k, t]) => { const d = Math.round((ult[k] - pri[k]) * 10) / 10; return t.split(" ")[0] + " " + (d > 0 ? "+" : "") + kg(d); }).join(" · ")}</p>` : ""}</div>` : ""}`;
};

// ---------- Acciones nuevas ----------
Object.assign(ACCIONES, {
  // Chequeo
  chk(d) { E.chk[d.k] = +d.v; hojaChequeo(); },
  "chk-saltear"() { cerrarHoja(); ACCIONES.empezar({ ...E.empezarArgs, chk: "1" }); },
  "chk-listo"() {
    const c = E.chk, malos = Object.values(c).filter((v) => v === 0).length;
    if (malos >= 2 || c.dolor === 0) { E.chkMotivo = null; return hojaRecomendacion(malos); }
    cerrarHoja(); ACCIONES.empezar({ ...E.empezarArgs, chk: "1" });
  },
  "chk-motivo"(d) { E.chkMotivo = E.chkMotivo === d.m ? null : d.m; hojaRecomendacion(Object.values(E.chk).filter((v) => v === 0).length); },
  async "chk-empezar"(d) {
    if (E.chkMotivo) await registrarEvento({ tipo: E.chkMotivo, origen: "chequeo", ...(E.chkMotivo === "deporte" ? { hora: Date.now() - 12 * 3600000, musculos: ["cuadriceps", "isquios", "gluteos", "gemelos"] } : {}) });
    cerrarHoja(); ACCIONES.empezar({ ...E.empezarArgs, chk: "1", liviano: d.l === "1" ? "1" : "" });
  },
  async "chk-descanso"() {
    await registrarEvento({ tipo: E.chkMotivo || "cansancio", origen: "chequeo", decision: "descanso" });
    cerrarHoja(); toast("Bien hecho: descansar también es entrenar. Mañana seguimos."); mostrar("inicio");
  },

  // Motivos (cuando la app detecta un cambio)
  async motivo(d) {
    E.motivoOrigen = d.o;
    if (d.m === "ok" || d.m === "otro") { await registrarEvento({ tipo: d.m, origen: d.o }); toast("Anotado"); return mostrar("inicio"); }
    if (d.m === "cansancio") { await registrarEvento({ tipo: d.m, origen: d.o }); await guardarAjuste("livianoProxima", true); toast("La próxima sesión va a ser liviana"); return mostrar("inicio"); }
    const H = {
      salud: `<h2>¿Qué síntomas tenés?</h2>
        <button data-accion="motivo-fin" data-m="salud" data-x="arriba">Solo de cuello para arriba (mocos, garganta)</button>
        <button data-accion="motivo-fin" data-m="salud" data-x="fiebre">Fiebre, pecho o el cuerpo dolorido</button>
        <button data-accion="motivo-fin" data-m="salud" data-x="lesion">Una lesión o un dolor puntual</button>
        <p class="chico suave">No reemplaza a un médico: si los síntomas siguen, consultá.</p>`,
      tiempo: `<h2>Poco tiempo o agenda complicada</h2>
        <button data-accion="motivo-fin" data-m="tiempo" data-x="mantenimiento">Pasar a mantenimiento (2 días por semana, ~50 min)</button>
        <button data-accion="motivo-fin" data-m="tiempo" data-x="corto">Seguir con mi rutina pero en 1 hora</button>
        <button class="sec" data-accion="motivo-fin" data-m="tiempo" data-x="puntual">Fue algo puntual</button>`,
      viaje: `<h2>Estás de viaje</h2>
        <button data-accion="motivo-fin" data-m="viaje" data-x="viaje">Rutina de viaje sin gimnasio (~30 min)</button>
        <button data-accion="motivo-fin" data-m="viaje" data-x="mantenimiento">Tengo gimnasio: mantenimiento</button>
        <button class="sec" data-accion="motivo-fin" data-m="viaje" data-x="pausa">No voy a poder entrenar</button>`,
      deporte: `<h2>¿Cuándo fue?</h2>
        <button data-accion="motivo-fin" data-m="deporte" data-x="hoy">Hoy</button>
        <button data-accion="motivo-fin" data-m="deporte" data-x="ayer">Ayer</button>
        <p class="chico suave">Lo cuento como trabajo de piernas, para respetar sus 48 h de descanso.</p>`,
      estres: `<h2>Estrés o desmotivación</h2>
        <p class="chico">Entrenar suele ayudar, pero sin exigirte de más.</p>
        <button data-accion="motivo-fin" data-m="estres" data-x="corto">Sesiones más cortas (1 hora) por un tiempo</button>
        <button class="sec" data-accion="motivo-fin" data-m="estres" data-x="normal">Sigo normal, me hace bien</button>`,
    }[d.m];
    hoja(H + `<button class="sec" data-accion="tiempo-seguir">Cancelar</button>`);
  },
  async "motivo-fin"(d) {
    const D = 86400000;
    await registrarEvento({ tipo: d.m, detalle: d.x, origen: E.motivoOrigen,
      ...(d.m === "deporte" ? { hora: Date.now() - (d.x === "ayer" ? D : 2 * 3600000), musculos: ["cuadriceps", "isquios", "gluteos", "gemelos"] } : {}) });
    let msg = "Anotado";
    const modos = { arriba: "liviano", lesion: "liviano", fiebre: "pausa", mantenimiento: "mantenimiento", corto: "corto", viaje: "viaje", pausa: "pausa" };
    if (modos[d.x]) {
      await guardarModo({ tipo: modos[d.x], motivo: d.m, desde: Date.now(), ...(modos[d.x] === "corto" ? { limite: REGLAS.limiteCorto } : {}) });
      E.diaElegido = null;
      msg = MODOS[modos[d.x]].titulo + " activado";
    }
    if (d.x === "lesion") msg = "Modo liviano. Salteá lo que te duela y consultá a un profesional";
    if (d.m === "deporte") msg = "Anotado: tus piernas necesitan 48 h de descanso";
    if (d.m === "estres") {
      const n = (await leerEventos()).filter((ev) => ev.tipo === "estres" && Date.now() - ev.fecha < 14 * D).length;
      if (n >= 3) msg = "Van varias veces este mes. Si el bajón sigue, hablarlo con alguien de confianza o un profesional ayuda mucho.";
    }
    cerrarHoja(); toast(msg); mostrar("inicio");
  },
  async "volver-normal"() {
    await guardarModo(null); await registrarEvento({ tipo: "vuelta", origen: "volver" });
    E.diaElegido = null; toast("¡Volvemos a tu rutina habitual!"); mostrar("inicio");
  },

  // Indicación del entrenador
  async cumpli() { E.peso = E.pres.peso; E.reps = E.pres.reps; await ACCIONES["confirmar-serie"](); },
  manual() { E.manual = true; E.valoresListos = true; PANTALLAS.ejercicio(); },
  "volver-indicado"() { E.manual = false; E.peso = E.pres.peso; E.reps = E.pres.reps; PANTALLAS.ejercicio(); },
  async rir(d) {
    if (!E.ultimaSerieId) return;
    const x = await DB.get("series", E.ultimaSerieId);
    if (x) { x.rir = +d.v; await DB.put("series", x); }
    document.querySelectorAll("#d-rir button").forEach((b) => b.classList.toggle("sec", b.dataset.v !== d.v));
    $("#d-rir-ok").textContent = "Anotado ✓";
  },

  // Medidas
  async "guardar-medidas"() {
    const m = { id: nuevoId(), fecha: Date.now() };
    for (const [k] of CAMPOS_MEDIDAS) { const v = parseFloat(String($("#m-" + k).value).replace(",", ".")); if (!isNaN(v)) m[k] = v; }
    if (Object.keys(m).length <= 2) return toast("Cargá al menos una medida");
    const l = (await ajuste("medidas")) || []; l.push(m); await guardarAjuste("medidas", l);
    toast("Medidas guardadas"); PANTALLAS.medidas();
  },
});

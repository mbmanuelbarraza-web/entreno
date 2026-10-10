// Mi Entrenamiento – Etapa 1
// Organización del archivo:
//   1. Base de datos (todo se guarda en el teléfono)
//   2. Utilidades
//   3. Pantallas (inicio, sesión, ejercicio, historial, peso, respaldo, ajustes)
//   4. Descanso, sonido y notificaciones
//   5. Arranque

const SERVIDOR = "https://entreno-avisos.manuel-entreno.workers.dev";
const VERSION_APP = "Etapa 3 · v1";

// =====================================================================
// 1. BASE DE DATOS (IndexedDB)
// Para agregar funciones nuevas (comidas, lesiones...) se suben de versión
// y se crean "cajones" nuevos sin tocar los datos existentes.
// =====================================================================
const DB = {
  db: null,
  abrir() {
    return new Promise((ok, mal) => {
      const r = indexedDB.open("entreno", 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore("ajustes");                                   // perfil, pasos de peso, etc.
        db.createObjectStore("sesiones", { keyPath: "id" });               // cada entrenamiento
        const s = db.createObjectStore("series", { keyPath: "id" });       // cada serie hecha
        s.createIndex("ejercicio", "ejercicio"); s.createIndex("sesion", "sesion");
        db.createObjectStore("pesoCorporal", { keyPath: "id" });           // registros de peso
      };
      r.onsuccess = () => { this.db = r.result; ok(); };
      r.onerror = () => mal(r.error);
    });
  },
  _req(store, modo, fn) {
    return new Promise((ok, mal) => {
      const t = this.db.transaction(store, modo), r = fn(t.objectStore(store));
      t.oncomplete = () => ok(r && r.result); t.onerror = () => mal(t.error);
    });
  },
  get: (s, k) => DB._req(s, "readonly", (o) => o.get(k)),
  put: (s, v, k) => DB._req(s, "readwrite", (o) => (k === undefined ? o.put(v) : o.put(v, k))),
  borrar: (s, k) => DB._req(s, "readwrite", (o) => o.delete(k)),
  todos: (s) => DB._req(s, "readonly", (o) => o.getAll()),
  claves: (s) => DB._req(s, "readonly", (o) => o.getAllKeys()),
  limpiar: (s) => DB._req(s, "readwrite", (o) => o.clear()),
  porIndice: (s, i, v) => DB._req(s, "readonly", (o) => o.index(i).getAll(v)),
};
const ajuste = (k) => DB.get("ajustes", k);
const guardarAjuste = (k, v) => DB.put("ajustes", v, k);

// =====================================================================
// 2. UTILIDADES
// =====================================================================
const $ = (sel) => document.querySelector(sel);
const app = $("#app");
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const kg = (n) => (Math.round(n * 100) / 100).toString().replace(".", ",");
const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const hhmm = (ms) => { const m = Math.floor(ms / 60000); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min"; };
const fecha = (ts) => new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
const fechaLarga = (ts) => new Date(ts).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
const reglas = (ej) => { const b = REGLAS[EJERCICIOS[ej].tipo] || REGLAS.aislamiento; return EJERCICIOS[ej].series ? { ...b, series: EJERCICIOS[ej].series } : b; };
const gifUrl = (ej) => GIF_BASE + EJERCICIOS[ej].gif;

function toast(texto) {
  const t = $("#toast"); t.textContent = texto; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600);
}
function edad(nac) {
  if (!nac) return null;
  const n = new Date(nac), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
  return e;
}

// ---------- Unidades y equipo ----------
const equipo = (e) => (typeof EQUIPO !== "undefined" && EQUIPO[e]) || "corporal";
async function unidadDe(e) {
  const u = (await ajuste("unidades")) || {};
  return u[e] || (equipo(e) === "maquina" ? null : "kg");
}
async function pasoDe(e, u) {
  const pasos = (await ajuste("pasos")) || {};
  return pasos[e] || (u === "lb" ? 10 : REGLAS.pasoPeso);
}
const uSerie = (x) => x.unidad || "kg";
// Texto del peso: "50 lb", "12 kg c/u", "60 kg"
const fmtPeso = (peso, u, e) => kg(peso) + " " + u + (equipo(e) === "mancuernas2" ? " c/u" : "");
const fmtSerie = (x) => fmtPeso(x.peso, uSerie(x), x.ejercicio) + " × " + x.reps;
const fmtCorta = (x) => kg(x.peso) + (uSerie(x) === "lb" ? "lb" : "") + "×" + x.reps;
// Peso real movido en kg (para el volumen): pasa libras a kg y cuenta las dos mancuernas
const pesoKg = (x) => (uSerie(x) === "lb" ? x.peso * 0.4536 : x.peso) * (equipo(x.ejercicio) === "mancuernas2" ? 2 : 1);
function etiquetaPeso(e, u) {
  return { barra: "kg de discos (sin la barra)", mancuernas2: "kg cada mancuerna", mancuerna1: "kg (una mancuerna)",
    corporal: "kg extra", maquina: u === "lb" ? "lb (número de la máquina)" : "kg (número de la máquina)" }[equipo(e)];
}

// Recordatorio de cómo anotar el peso según el equipo
function recordatorio(e, u) {
  const t = {
    barra: "Anotá <b>solo los discos</b>, sin contar la barra.",
    mancuernas2: "Anotá el peso de <b>una</b> mancuerna (el número que dice). La app ya sabe que usás dos.",
    mancuerna1: "Anotá el peso de la mancuerna que usás.",
    maquina: `Cargá el <b>número que ves en la pila</b> de la máquina${u ? " (en " + (u === "lb" ? "libras" : "kilos") + ")" : ""}.`,
    corporal: "Anotá solo el <b>peso extra</b> que agregás. Si lo hacés solo con tu cuerpo, dejalo en 0.",
  }[equipo(e)];
  return t ? `<p class="recordatorio">📌 ${t}</p>` : "";
}

// Estado en memoria
const E = { pantalla: "inicio", sesion: null, ejercicio: null, peso: 0, reps: 0, diaElegido: null, confirmarFin: false, histEj: null };

// =====================================================================
// 3. PANTALLAS
// =====================================================================
async function mostrar(pantalla, extra) {
  E.pantalla = pantalla; Object.assign(E, extra || {});
  E.confirmarFin = false;
  await PANTALLAS[pantalla]();
  window.scrollTo(0, 0);
}

const PANTALLAS = {
  // ---------- Configuración inicial ----------
  async config() {
    const p = (await ajuste("perfil")) || {};
    app.innerHTML = `
      ${p.nacimiento ? `<button class="volver" data-accion="ir" data-p="ajustes">← Volver</button>` : ""}
      <h1>${p.nacimiento ? "Mis datos" : "¡Hola Manuel!"}</h1>
      <p class="suave">${p.nacimiento ? "" : "Antes de empezar, completá tus datos. Se guardan solo en tu teléfono."}</p>
      <div class="tarjeta">
        <label>Fecha de nacimiento<input type="date" id="c-nac" value="${p.nacimiento || ""}"></label>
        <label>Altura (m)<input type="number" id="c-alt" inputmode="decimal" step="0.01" value="${p.altura || 1.64}"></label>
        ${p.nacimiento ? "" : `<label>Peso actual (kg)<input type="number" id="c-peso" inputmode="decimal" step="0.05" value="64.35"></label>`}
        <button data-accion="guardar-config">Guardar</button>
      </div>`;
  },

  // ---------- Inicio ----------
  async inicio() {
    const [sesiones, perfil, ultResp, pesos] = await Promise.all([DB.todos("sesiones"), ajuste("perfil"), ajuste("ultimoRespaldo"), DB.todos("pesoCorporal")]);
    const activa = sesiones.find((s) => !s.fin);
    const terminadas = sesiones.filter((s) => s.fin).sort((a, b) => b.inicio - a.inicio);
    const ultima = terminadas[0];
    const modo = await leerModo();
    const opcionesDia = diasDelModo(modo);
    const sugerido = diaSugerido(modo, terminadas);
    const dia = E.diaElegido && DIAS[E.diaElegido] ? E.diaElegido : sugerido;
    const limiteHoy = limiteDe(dia, modo);
    const pesoAct = pesos.sort((a, b) => b.fecha - a.fecha)[0];
    const sinRespaldo = terminadas.length > 0 && (!ultResp || Date.now() - ultResp > 7 * 86400000);
    const notif = await estadoNotificaciones();
    const plan = activa ? null : await planDelDia(DIAS[dia].ejercicios, limiteHoy, dia);
    const extras = activa ? "" : await tarjetasEntrenador(dia);
    const semana = await tarjetaSemana();
    const medidas = activa ? "" : await tarjetaMedidas();
    const pend = activa ? [] : await pendientesConEstado();
    const pendListos = pend.filter((p) => p.listo <= Date.now() && !DIAS[dia].ejercicios.includes(p.e));
    let planHtml = "";
    if (plan) {
      if (plan.entra) planHtml = `<p class="ok"><b>Estimado ≈ ${durTxt(plan.completo)}</b> · entra en tu límite de ${durTxt(limiteHoy * 60)}</p>`;
      else {
        const cambios = Object.entries(plan.recortes).filter(([e]) => !plan.pendientes.includes(e)).sort((a, b) => DIAS[dia].ejercicios.indexOf(a[0]) - DIAS[dia].ejercicios.indexOf(b[0])).map(([e, n]) => `${EJERCICIOS[e].nombre}: ${seriesDe(dia, e) - n} series en vez de ${seriesDe(dia, e)}`);
        planHtml = `<p>Completo te llevaría <b class="mal">≈ ${durTxt(plan.completo)}</b>. Para entrar en ${durTxt(limiteHoy * 60)}:</p>
          <ul class="chico">${cambios.map((c) => `<li>${c}</li>`).join("")}${plan.pendientes.map((e) => `<li>${EJERCICIOS[e].nombre}: <b>queda pendiente para otro día</b></li>`).join("")}</ul>
          <p class="ok chico">Plan ajustado ≈ ${durTxt(plan.ajustado)}</p>`;
      }
      planHtml += `<p class="chico suave">Calculado con tu ritmo real: ${Math.round(plan.rit.compuesto)} s por serie pesada y ${Math.round(plan.rit.aislamiento)} s por serie de aislamiento (además del descanso), ${Math.round(plan.rit.cambio / 60 * 10) / 10} min por cambio de ejercicio.</p>`;
    }

    app.innerHTML = `
      <div class="cabecera"><span class="suave chico">${fechaLarga(Date.now())}</span>
        <button class="chico sec" data-accion="ir" data-p="ajustes">Ajustes</button></div>
      ${notif !== "activas" ? `<div class="tarjeta aviso"><b>Activá las notificaciones</b><p class="chico suave">Para que te avise al terminar cada descanso.</p>
        <button data-accion="activar-notif">Activar notificaciones</button></div>` : ""}
      ${sinRespaldo ? `<div class="tarjeta aviso"><b>Hace más de una semana que no guardás un respaldo</b>
        <button class="sec" data-accion="ir" data-p="respaldo">Guardar respaldo</button></div>` : ""}
      ${activa ? `
        <div class="tarjeta"><h2>Entrenamiento en curso</h2>
          <p>${tituloSesion(activa)} · ${nombreSesion(activa)}<br><span class="suave chico">Empezaste a las ${hora(activa.inicio)}</span></p>
          <button class="grande" data-accion="seguir">Seguir entrenando</button></div>` : `
        ${extras}
        <h1>Hoy toca ${textoDia(dia)}</h1>
        <p class="suave" style="margin-top:0">${DIAS[dia].nombre}${dia !== sugerido ? " (elegido a mano)" : ""}</p>
        ${opcionesDia.length > 1 ? `<div class="fila${opcionesDia.length} dias">${opcionesDia.map((d) => `<button class="sec ${d === dia ? "activo" : ""}" data-accion="elegir-dia" data-d="${d}">${textoDia(d)}</button>`).join("")}</div>` : ""}
        <div class="tarjeta" style="margin-top:12px">
          ${DIAS[dia].ejercicios.map((e) => `<div class="chico">· ${EJERCICIOS[e].nombre} <span class="suave">${plan.pendientes.includes(e) ? "otro día" : `${plan.objetivos[e] || 0}×${reglas(e).repsMin}-${reglas(e).repsMax}`}${plan.prioridad.includes(EJERCICIOS[e].principal) ? " · prioridad" : ""}</span></div>`).join("")}
        </div>
        <div class="tarjeta">${planHtml}</div>
        ${plan.entra ? `<button class="grande" data-accion="empezar" data-d="${dia}" data-modo="completo">Empezar</button>` : `
          <button class="grande" data-accion="empezar" data-d="${dia}" data-modo="ajustado">Empezar (plan ajustado)</button>
          <button class="sec" data-accion="empezar" data-d="${dia}" data-modo="completo">Hacer todo (≈ ${durTxt(plan.completo)})</button>`}
        ${pend.length ? `<div class="tarjeta" style="margin-top:12px"><b>Pendientes de otros días</b>
          ${pend.map((p) => `<div class="serie"><span>${EJERCICIOS[p.e].nombre}<br>${cuandoTxt(p.listo)}</span>
            <button data-accion="quitar-pendiente" data-id="${p.id}" data-confirmar="1" aria-label="Quitar">×</button></div>`).join("")}
          <p class="chico suave">Se ofrecen cuando sus músculos ya descansaron (48 h el principal, 24 h los secundarios). Ideal para tu día libre.</p>
          ${pendListos.length ? `<button class="sec" data-accion="empezar-pendientes">Entrenar solo pendientes listos (${pendListos.length})</button>` : ""}
        </div>` : ""}`}
      ${semana}${medidas}
      <div class="fila3" style="margin-top:10px">
        <button class="sec" data-accion="ir" data-p="historial">Historial</button>
        <button class="sec" data-accion="ir" data-p="peso">Peso</button>
        <button class="sec" data-accion="ir" data-p="medidas">Medidas</button>
      </div>
      <div class="tarjeta" style="margin-top:12px">
        <p class="chico suave">${ultima ? `Último entrenamiento: ${fecha(ultima.inicio)} · ${tituloSesion(ultima)} · ${hhmm(ultima.fin - ultima.inicio)}` : "Todavía no registraste entrenamientos."}</p>
        <p class="chico suave">${pesoAct ? `Peso: ${kg(pesoAct.kg)} kg (${fecha(pesoAct.fecha)})` : ""}${perfil && perfil.nacimiento ? ` · ${edad(perfil.nacimiento)} años` : ""}</p>
      </div>`;
  },

  // ---------- Sesión (lista de ejercicios del día) ----------
  async sesion() {
    const s = await DB.get("sesiones", E.sesion);
    if (!s) return mostrar("inicio");
    const series = await DB.porIndice("series", "sesion", s.id);
    const hechas = (ej) => series.filter((x) => x.ejercicio === ej).length;
    const bloque = (k, nombre, desc) => {
      const v = s.bloques[k];
      return `<div class="item ${v ? "hecho" : ""}">
        <div class="txt"><b>${nombre}</b><span class="chico suave">${desc}</span></div>
        ${v ? `<span class="prog">${v === "hecho" ? "✓" : "salteado"}</span>` :
          `<button class="chico" data-accion="bloque" data-k="${k}" data-v="hecho">Hecho</button>
           <button class="chico sec" data-accion="bloque" data-k="${k}" data-v="salteado">Saltear</button>`}
      </div>`;
    };
    app.innerHTML = `
      <div class="cabecera"><button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
        <span class="reloj" id="reloj-sesion">${mmss((Date.now() - s.inicio) / 1000)}</span></div>
      <h1>${tituloSesion(s)}</h1><p class="suave" style="margin-top:0">${nombreSesion(s)}</p>
      <div class="tarjeta"><div id="proy">Calculando hora de fin…</div></div>
      <h3>Antes de empezar</h3>
      <div class="item ${s.bloques.calentamiento ? "hecho" : ""}" data-accion="ir" data-p="calentamiento">
        <img src="${gifUrl("bici")}" alt="" loading="lazy">
        <div class="txt"><b>Entrada en calor</b><span class="chico suave">≈ ${Math.round(CALENTAMIENTO[s.dia].reduce((t, x) => t + x.seg, 0) / 60)} min · para ${DIAS[s.dia].nombre.toLowerCase()}</span></div>
        <span class="prog">${s.bloques.calentamiento === "hecho" ? "✓" : s.bloques.calentamiento ? "salteada" : "›"}</span></div>
      <h3>Ejercicios</h3>
      ${s.ejercicios.map((e) => {
        const n = hechas(e), tot = objetivo(s, e), salt = s.saltados.includes(e), mov = (s.movidos || []).includes(e);
        return `<div class="item ${n >= tot || salt || mov ? "hecho" : ""}" data-accion="abrir-ej" data-e="${e}">
          <img src="${gifUrl(e)}" alt="" loading="lazy">
          <div class="txt"><b>${EJERCICIOS[e].nombre}</b><span class="chico suave">${mov ? "pendiente para otro día" : `${tot} series · ${reglas(e).repsMin}-${reglas(e).repsMax} reps`}${tot < seriesDe(s.dia, e) && !mov ? (s.liviano ? " (liviano)" : " (ajustado)") : ""}</span></div>
          <span class="prog">${mov ? "→ otro día" : salt ? "salteado" : n + "/" + tot}</span></div>`;
      }).join("")}
      <button class="${series.length ? "" : "sec"}" data-accion="terminar" id="b-terminar">Terminar entrenamiento</button>
      <button class="sec" data-accion="descartar" data-confirmar="1">Descartar entrenamiento (no se guarda)</button>`;
  },

  // ---------- Ejercicio ----------
  async ejercicio() {
    const e = E.ejercicio, info = EJERCICIOS[e];
    const s = await DB.get("sesiones", E.sesion);
    const r = { ...reglas(e), series: objetivo(s, e) };
    const hoy = (await DB.porIndice("series", "sesion", s.id)).filter((x) => x.ejercicio === e).sort((a, b) => a.n - b.n);
    const ant = await seriesAnteriores(e, s.id);
    const u = await unidadDe(e);
    const paso = await pasoDe(e, u || "kg");
    const n = hoy.length + 1;
    // Indicación del entrenador (si ya hay historial)
    const pres = u === null ? null : await prescribir(e, s);
    E.pres = pres;
    if (!E.valoresListos && pres) { E.peso = pres.peso; E.reps = pres.reps; E.valoresListos = true; }
    // Valores iniciales: lo de la última vez (misma serie), o la serie anterior de hoy
    if (!E.valoresListos) {
      const ref = hoy[hoy.length - 1] || ant.series[n - 1] || ant.series[ant.series.length - 1];
      E.peso = ref ? ref.peso : 0;
      E.reps = (ant.series[n - 1] && ant.series[n - 1].reps) || (ref && ref.reps) || r.repsMin;
      E.valoresListos = true;
    }
    const primeraVez = !ant.series.length && !hoy.length;
    const idx = s.ejercicios.indexOf(e), siguiente = s.ejercicios[idx + 1];

    app.innerHTML = `
      <div class="cabecera"><button class="volver" data-accion="ir" data-p="sesion">← Lista</button>
        <span class="reloj" id="reloj-sesion"></span></div>
      <h2>${info.nombre}</h2>
      <img class="gif" src="${gifUrl(e)}" alt="Cómo se hace ${info.nombre}">
      <div class="atrib">${ATRIBUCION}</div>
      <details><summary>Cómo se hace</summary><button class="chico sec" data-accion="letra" style="margin:4px 0 8px">Aa  Cambiar tamaño de letra</button><ol>${info.pasos.map((p) => `<li>${p}</li>`).join("")}</ol>
        <p class="chico suave">Trabaja: <b>${NOMBRES_MUSCULOS[info.principal]}</b>${info.secundarios.length ? " · también " + info.secundarios.map((m) => NOMBRES_MUSCULOS[m]).join(", ") : ""}</p></details>

      <div class="tarjeta" style="margin-top:10px">
        <p class="chico" id="proy" style="margin:0 0 6px"></p><p class="chico"><b>Objetivo:</b> ${r.series} series de ${r.repsMin} a ${r.repsMax} reps · descanso ${mmss(r.descanso)}</p>
        <p class="chico suave">${ant.series.length ? `Última vez (${fecha(ant.fecha)}): ${ant.series.map(fmtCorta).join(" · ")}${equipo(e) === "mancuernas2" ? " (c/u)" : ""}` : "Primera vez que lo registrás."}</p>
      </div>

      ${hoy.length ? `<div class="tarjeta"><b>Hoy</b>${hoy.map((x) => `
        <div class="serie editable" data-accion="editar-serie" data-id="${x.id}"><span>Serie ${x.n}: <b>${fmtSerie(x)}</b></span>
        <span class="lapiz">✎ Editar</span></div>`).join("")}</div>` : ""}

      ${u === null ? `<div class="tarjeta aviso">
        <b>¿Esta máquina marca el peso en kilos o en libras?</b>
        <p class="chico suave">Se pregunta una sola vez por máquina. Si los números de la pila van 10, 30, 50… o es de marca Cybex, Life Fitness o Hammer Strength, casi siempre son libras.</p>
        <div class="fila2"><button data-accion="set-unidad" data-u="kg">Kilos</button><button data-accion="set-unidad" data-u="lb">Libras</button></div>
      </div>` : `
      ${pres ? `<div class="tarjeta receta">
        <p class="chico suave" style="margin:0">Tu entrenador indica para hoy</p>
        <div class="receta-num">${fmtPeso(pres.peso, pres.unidad, e)} × ${pres.reps}</div>
        <p class="chico">${pres.razon}</p>${pres.nota ? `<p class="chico mal">${pres.nota}</p>` : ""}
      </div>` : ""}
      <div class="tarjeta">
        <h2>${n <= r.series ? `Serie ${n} de ${r.series}` : `Serie extra (${n})`}</h2>
        ${recordatorio(e, u)}
        ${primeraVez ? `<p class="chico ok">Primera vez: elegí un peso con el que llegues a unas ${r.repsMin}-${r.repsMax} repeticiones. Tocá el número para escribirlo, o usá + y −. Desde la próxima, el peso lo indica la app.</p>` : ""}
        ${pres && !E.manual ? `
        <button class="grande" data-accion="cumpli">✓ Cumplí: ${fmtPeso(pres.peso, pres.unidad, e)} × ${pres.reps}</button>
        <button class="sec" data-accion="manual">Hice otra cosa (corregir)</button>` : `
        ${pres ? `<p class="chico suave">Cargá lo que hiciste de verdad. <span class="lapiz" data-accion="volver-indicado">Volver a lo indicado</span></p>` : ""}
        <div class="ajuste">
          <button class="sec" data-accion="peso" data-d="-1">−</button>
          <div class="valor"><b id="v-peso" data-accion="escribir-peso">${kg(E.peso)}</b><span>${etiquetaPeso(e, u)}</span><br>
            <span class="paso" data-accion="cambiar-paso">de a ${kg(paso)} ${u}</span>
            ${equipo(e) === "maquina" ? `<span class="paso" data-accion="set-unidad" data-u="${u === "lb" ? "kg" : "lb"}">cambiar a ${u === "lb" ? "kg" : "lb"}</span>` : ""}</div>
          <button class="sec" data-accion="peso" data-d="1">+</button>
        </div>
        <div class="ajuste">
          <button class="sec" data-accion="reps" data-d="-1">−</button>
          <div class="valor"><b id="v-reps">${E.reps}</b><span>repeticiones</span></div>
          <button class="sec" data-accion="reps" data-d="1">+</button>
        </div>
        <button class="grande" data-accion="confirmar-serie">✓ Confirmar serie</button>`}
      </div>`}
      <div class="fila2">
        <button class="sec" data-accion="saltear-ej">Saltear ejercicio</button>
        <button class="sec" data-accion="${siguiente ? "abrir-ej" : "ir"}" data-e="${siguiente || ""}" data-p="sesion">${siguiente ? "Siguiente →" : "Ver lista"}</button>
      </div>`;
    actualizarReloj();
  },

  // ---------- Entrada en calor ----------
  async calentamiento() {
    const s = await DB.get("sesiones", E.sesion);
    if (!s) return mostrar("inicio");
    if (!s.calInicio) { s.calInicio = Date.now(); await DB.put("sesiones", s); }
    const hechos = s.calentamiento || {};
    const lista = CALENTAMIENTO[s.dia];
    const total = Math.round(lista.reduce((t, x) => t + x.seg, 0) / 60);
    app.innerHTML = `
      <div class="cabecera"><button class="volver" data-accion="ir" data-p="sesion">← Lista</button>
        <span class="reloj" id="reloj-sesion"></span></div>
      <h1>Entrada en calor</h1>
      <p class="suave" style="margin-top:0">Preparada para ${DIAS[s.dia].nombre.toLowerCase()}</p>
      <div class="tarjeta"><span id="cal-reloj">Previsto ≈ ${total} min</span></div>
      ${lista.map((x, i) => {
        const info = EJERCICIOS[x.e], ok = hechos[i];
        return `<div class="tarjeta" style="${ok ? "opacity:.5" : ""}">
          <div class="cabecera"><b>${i + 1}. ${info.nombre}</b>${ok ? `<button class="chico sec" data-accion="cal-deshacer" data-i="${i}">✓ Deshacer</button>` : ""}</div>
          <p class="chico">${x.dosis}</p>
          ${ok ? "" : `<img class="gif" src="${gifUrl(x.e)}" alt="Cómo se hace ${info.nombre}" loading="lazy" style="width:150px;height:150px">
            <div class="atrib">${ATRIBUCION}</div>
            <details><summary>Cómo se hace</summary><button class="chico sec" data-accion="letra" style="margin:4px 0 8px">Aa  Cambiar tamaño de letra</button><ol>${info.pasos.map((p) => `<li>${p}</li>`).join("")}</ol></details>
            <div class="fila2">
              <button class="sec" data-accion="cal-timer" data-i="${i}">▶ Iniciar ${mmss(x.seg)}</button>
              <button data-accion="cal-hecho" data-i="${i}">Hecho</button>
            </div>`}
        </div>`;
      }).join("")}
      <button class="grande" data-accion="bloque" data-k="calentamiento" data-v="hecho">Terminé la entrada en calor</button>
      <button class="sec" data-accion="bloque" data-k="calentamiento" data-v="salteado">Saltear entrada en calor</button>
      ${s.calInicio && (Object.keys(hechos).length || s.bloques.calentamiento) ? `<button class="sec" data-accion="cal-reiniciar" data-confirmar="1">↺ Reiniciar entrada en calor</button>` : ""}`;
    actualizarReloj();
  },

  // ---------- Resumen al terminar ----------
  async resumen() {
    const s = await DB.get("sesiones", E.sesion);
    const series = await DB.porIndice("series", "sesion", s.id);
    const vol = series.reduce((t, x) => t + pesoKg(x) * x.reps, 0);
    const ejs = new Set(series.map((x) => x.ejercicio)).size;
    app.innerHTML = `
      <h1>¡Entrenamiento terminado!</h1>
      <p class="suave">${tituloSesion(s)} · ${nombreSesion(s)}</p>
      <div class="tarjeta">
        <p>Duración: <b class="${s.fin - s.inicio > (s.limite || REGLAS.limiteMin) * 60000 ? "mal" : "ok"}">${hhmm(s.fin - s.inicio)}</b> <span class="suave chico">(límite ${durTxt((s.limite || REGLAS.limiteMin) * 60)}${s.limite > (s.limiteOriginal || REGLAS.limiteMin) ? `, sumaste ${s.limite - s.limiteOriginal} min` : ""})</span></p>
        ${(s.quedaronPendientes || []).length ? `<p>Quedan pendientes para otro día: <b>${s.quedaronPendientes.map((e) => EJERCICIOS[e].nombre).join(", ")}</b></p>` : ""}
        ${(s.quedaronPendientes || []).length && s.fin - s.inicio < ((s.limite || REGLAS.limiteMin) - 10) * 60000 ? `<div class="tarjeta aviso" style="margin-top:10px"><b>Terminaste antes de lo previsto</b><p class="chico">¿Por qué? Me ayuda a adaptar lo que viene.</p>${botonesMotivo("corte")}
          <button class="sec chico" data-accion="motivo" data-m="ok" data-o="corte" style="margin-top:8px">Fue algo puntual</button></div>` : ""}
        ${s.calInicio && s.calFin ? `<p>Entrada en calor: <b>${mmss((s.calFin - s.calInicio) / 1000)}</b> <span class="suave chico">(previsto ≈ ${Math.round(CALENTAMIENTO[s.dia].reduce((t, x) => t + x.seg, 0) / 60)} min)</span></p>` : ""}
        <p>Ejercicios: <b>${ejs}</b> · Series: <b>${series.length}</b></p>
        <p>Volumen total: <b>${kg(Math.round(vol))} kg</b> <span class="suave chico">(peso real × repeticiones, en kg)</span></p>
      </div>
      <button class="grande" data-accion="ir" data-p="inicio">Volver al inicio</button>`;
  },

  // ---------- Historial ----------
  async historial() {
    if (E.histEj) return PANTALLAS.historialEj();
    const series = await DB.todos("series");
    const cuenta = (e) => new Set(series.filter((x) => x.ejercicio === e).map((x) => x.sesion)).size;
    app.innerHTML = `
      <button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
      <h1>Historial</h1>
      ${[1, 2, 3].map((d) => `<h3>Día ${d} · ${DIAS[d].nombre}</h3>` + DIAS[d].ejercicios.map((e) => `
        <div class="item" data-accion="hist-ej" data-e="${e}">
          <img src="${gifUrl(e)}" alt="" loading="lazy">
          <div class="txt"><b>${EJERCICIOS[e].nombre}</b><span class="chico suave">${cuenta(e)} sesiones registradas</span></div>
          <span class="suave">›</span></div>`).join("")).join("")}`;
  },
  async historialEj() {
    const e = E.histEj;
    const [series, sesiones] = await Promise.all([DB.porIndice("series", "ejercicio", e), DB.todos("sesiones")]);
    const porSesion = {};
    series.forEach((x) => (porSesion[x.sesion] = porSesion[x.sesion] || []).push(x));
    const lista = Object.entries(porSesion).map(([id, xs]) => ({
      fecha: (sesiones.find((s) => s.id === id) || {}).inicio || xs[0].hora,
      series: xs.sort((a, b) => a.n - b.n),
      max: Math.max(...xs.map((x) => x.peso)),
    })).sort((a, b) => a.fecha - b.fecha);
    app.innerHTML = `
      <button class="volver" data-accion="hist-volver">← Historial</button>
      <h2>${EJERCICIOS[e].nombre}</h2>
      <div class="tarjeta"><b>Fuerza estimada</b><p class="chico suave" style="margin:2px 0">Combina peso y repeticiones (fórmula de Epley): si sube, estás mejorando.</p>${grafico(lista.map((x) => ({ x: x.fecha, y: Math.round(Math.max(...x.series.map(e1rm)) * 10) / 10 })), "")}</div>
      <div class="tarjeta"><b>Peso máximo por sesión</b>${grafico(lista.map((x) => ({ x: x.fecha, y: x.max })), "kg")}</div>
      <div class="tarjeta">${lista.length ? lista.slice().reverse().map((x) => `
        <div class="serie"><span>${fecha(x.fecha)}</span><span>${x.series.map((s) => `<span class="chip" data-accion="editar-serie" data-id="${s.id}">${fmtCorta(s)}</span>`).join("")}</span></div>`).join("") + `<p class="chico suave">Tocá una serie para corregirla.</p>`
        : `<p class="suave">Todavía no hay registros.</p>`}</div>`;
  },

  // ---------- Peso corporal ----------
  async peso() {
    const pesos = (await DB.todos("pesoCorporal")).sort((a, b) => a.fecha - b.fecha);
    const ult = pesos[pesos.length - 1];
    if (E.pesoCorp == null) E.pesoCorp = ult ? ult.kg : 64.35;
    app.innerHTML = `
      <button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
      <h1>Peso corporal</h1>
      <div class="tarjeta">
        <div class="ajuste">
          <button class="sec" data-accion="peso-corp" data-d="-0.1">−</button>
          <div class="valor"><b id="v-pc">${kg(E.pesoCorp)}</b><span>kg</span></div>
          <button class="sec" data-accion="peso-corp" data-d="0.1">+</button>
        </div>
        <button data-accion="guardar-peso">Guardar peso de hoy</button>
      </div>
      <div class="tarjeta"><b>Evolución</b>${grafico(pesos.map((p) => ({ x: p.fecha, y: p.kg })), "kg")}</div>
      <div class="tarjeta">${pesos.slice().reverse().map((p) => `
        <div class="serie"><span>${fecha(p.fecha)}</span><span><b>${kg(p.kg)} kg</b>
        <button data-accion="borrar-peso" data-id="${p.id}" aria-label="Borrar">×</button></span></div>`).join("") || `<p class="suave">Sin registros.</p>`}</div>`;
  },

  // ---------- Respaldo ----------
  async respaldo() {
    const ult = await ajuste("ultimoRespaldo");
    app.innerHTML = `
      <button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
      <h1>Respaldo</h1>
      <p class="suave">Tus datos están solo en este teléfono. Guardá un respaldo cada semana en iCloud Drive o Archivos.</p>
      <div class="tarjeta">
        <p>Último respaldo: <b>${ult ? fecha(ult) : "nunca"}</b></p>
        <button data-accion="exportar">Guardar respaldo</button>
        <p class="chico suave">Se abre el menú de compartir: elegí <b>Guardar en Archivos</b>.</p>
      </div>
      <div class="tarjeta">
        <b>Restaurar desde un respaldo</b>
        <p class="chico suave">Reemplaza todos los datos de la app por los del archivo.</p>
        <button class="sec" data-accion="elegir-archivo">Elegir archivo de respaldo</button>
        <input type="file" id="archivo" accept=".json,application/json" hidden>
      </div>`;
  },

  // ---------- Ajustes ----------
  async ajustes() {
    const perfil = (await ajuste("perfil")) || {};
    const pantalla = await ajuste("pantallaEncendida");
    const notif = await estadoNotificaciones();
    app.innerHTML = `
      <button class="volver" data-accion="ir" data-p="inicio">← Inicio</button>
      <h1>Ajustes</h1>
      <div class="tarjeta"><b>Notificaciones</b>
        <p class="chico ${notif === "activas" ? "ok" : "mal"}">${{ activas: "✓ Activadas", no: "Desactivadas", instalar: "Abrí la app desde el ícono de inicio para activarlas", "no-soportado": "Este iPhone no las permite" }[notif]}</p>
        ${notif !== "activas" ? `<button data-accion="activar-notif">Activar notificaciones</button>` : `<button class="sec" data-accion="probar-notif">Probar notificación (5 s)</button>`}
      </div>
      <div class="tarjeta"><b>Pantalla encendida durante el entrenamiento</b>
        <p class="chico suave">Gasta más batería. Con las notificaciones activas no hace falta.</p>
        <button class="sec" data-accion="toggle-pantalla">${pantalla ? "Activada · tocar para apagar" : "Desactivada · tocar para activar"}</button>
      </div>
      <div class="tarjeta"><b>Mis datos</b>
        <p class="chico suave">${perfil.nacimiento ? edad(perfil.nacimiento) + " años · " : ""}${perfil.altura ? kg(perfil.altura) + " m" : ""}</p>
        <button class="sec" data-accion="ir" data-p="config">Editar mis datos</button>
      </div>
      <div class="tarjeta"><button class="sec" data-accion="ir" data-p="respaldo">Respaldo de datos</button></div>
      <div class="tarjeta"><b>Borrar historial de entrenamientos</b>
        <p class="chico suave">Borra todos los entrenamientos y series (por ejemplo, las pruebas). Tus datos y tu peso corporal se mantienen.</p>
        <button class="sec" data-accion="borrar-historial" data-confirmar="1">Borrar historial</button></div>
      <p class="chico suave" style="text-align:center">${VERSION_APP}<br>Imágenes de ejercicios ${ATRIBUCION}</p>`;
  },
};

// Últimas series de un ejercicio en una sesión anterior
async function seriesAnteriores(e, sesionActual) {
  const todas = (await DB.porIndice("series", "ejercicio", e)).filter((x) => x.sesion !== sesionActual);
  if (!todas.length) return { series: [], fecha: null };
  const ultimaSesion = todas.sort((a, b) => b.hora - a.hora)[0].sesion;
  const series = todas.filter((x) => x.sesion === ultimaSesion).sort((a, b) => a.n - b.n);
  return { series, fecha: series[0].hora };
}

// Gráfico simple de línea (SVG)
function grafico(puntos, unidad) {
  if (puntos.length < 2) return `<p class="chico suave">El gráfico aparece cuando haya 2 registros o más.</p>`;
  const W = 340, H = 170, m = { i: 34, d: 10, a: 12, b: 22 };
  const ys = puntos.map((p) => p.y), min = Math.min(...ys), max = Math.max(...ys), rango = max - min || 1;
  const X = (i) => m.i + (i * (W - m.i - m.d)) / (puntos.length - 1);
  const Y = (v) => m.a + (H - m.a - m.b) * (1 - (v - min) / rango);
  const linea = puntos.map((p, i) => `${X(i)},${Y(p.y)}`).join(" ");
  return `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <text x="0" y="${Y(max) + 4}">${kg(max)}</text><text x="0" y="${Y(min) + 4}">${kg(min)}</text>
    <polyline points="${linea}" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linejoin="round"/>
    ${puntos.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3.5" fill="#f97316"/>`).join("")}
    <text x="${m.i}" y="${H - 4}">${fecha(puntos[0].x)}</text>
    <text x="${W - m.d}" y="${H - 4}" text-anchor="end">${fecha(puntos[puntos.length - 1].x)}</text>
  </svg>`;
}

// Reloj de la sesión (arriba a la derecha)
async function actualizarReloj() {
  const el = $("#reloj-sesion");
  if (!el || !E.sesion) return;
  const s = await DB.get("sesiones", E.sesion);
  if (s) el.textContent = mmss((Date.now() - s.inicio) / 1000);
  const pr = $("#proy");
  if (pr && s && !s.fin && Date.now() - (E.proyCache || 0) > 5000) {
    E.proyCache = Date.now();
    const p = await proyeccion(s);
    const dif = Math.round((p.fin - p.limite) / 60000);
    pr.innerHTML = p.faltanSeries
      ? `Fin estimado <b class="${dif > 2 ? "mal" : dif > 0 ? "" : "ok"}">${hora(p.fin)}</b> · límite ${hora(p.limite)}${dif > 2 ? ` <span class="mal">(+${dif} min)</span>` : ""}`
      : `Todo hecho · límite ${hora(p.limite)}`;
    if (Date.now() >= p.limite && p.faltanSeries && document.visibilityState === "visible") revisarTiempo("limite");
  }
  const cal = $("#cal-reloj");
  if (cal && s && s.calInicio) {
    const prev = Math.round(CALENTAMIENTO[s.dia].reduce((t, x) => t + x.seg, 0) / 60);
    const llevo = ((s.calFin || Date.now()) - s.calInicio) / 1000;
    cal.innerHTML = (s.calFin ? "Te llevó <b>" : "Llevás <b>") + mmss(llevo) + "</b> · previsto ≈ " + prev + " min" + (!s.calFin && llevo > prev * 60 ? ' <span class="mal">(te estás pasando)</span>' : "");
  }
}
setInterval(actualizarReloj, 1000);

// =====================================================================
// ACCIONES (qué pasa al tocar cada botón)
// =====================================================================
const ACCIONES = {
  ir: (d) => mostrar(d.p, { histEj: null, pesoCorp: null }),

  async "guardar-config"() {
    const nac = $("#c-nac").value, alt = parseFloat($("#c-alt").value), pesoEl = $("#c-peso");
    if (!nac) return toast("Completá la fecha de nacimiento");
    const anterior = (await ajuste("perfil")) || {};
    await guardarAjuste("perfil", { ...anterior, nacimiento: nac, altura: alt || 1.64 });
    if (pesoEl && parseFloat(pesoEl.value)) {
      await DB.put("pesoCorporal", { id: nuevoId(), fecha: Date.parse("2026-09-14T08:00:00"), kg: parseFloat(pesoEl.value), nota: "bioimpedancia" });
    }
    mostrar(anterior.nacimiento ? "ajustes" : "inicio");
  },

  "elegir-dia": (d) => { E.diaElegido = isNaN(+d.d) ? d.d : +d.d; mostrar("inicio"); },

  async empezar(d) {
    if (!d.chk) { E.empezarArgs = { d: d.d, modo: d.modo }; E.chk = {}; return hojaChequeo(); }
    const dia = isNaN(+d.d) ? d.d : +d.d;
    const modo = await leerModo();
    const limite = limiteDe(dia, modo);
    const plan = await planDelDia(DIAS[dia].ejercicios, limite, dia);
    const ajustado = d.modo === "ajustado";
    const liviano = d.liviano === "1" || (modo && modo.tipo === "liviano") || (await ajuste("livianoProxima"));
    if (await ajuste("livianoProxima")) await guardarAjuste("livianoProxima", false);
    const objetivos = ajustado ? { ...plan.objetivos } : Object.fromEntries(DIAS[dia].ejercicios.map((e) => [e, seriesDe(dia, e)]));
    if (liviano) for (const e in objetivos) if (objetivos[e] > 0) objetivos[e] = Math.max(2, objetivos[e] - 1);
    // ¿vuelve después de muchos días sin entrenar?
    const ultimaFin = Math.max(0, ...(await DB.todos("sesiones")).filter((x) => x.fin).map((x) => x.fin));
    const diasSin = ultimaFin ? Math.floor((Date.now() - ultimaFin) / 86400000) : 0;
    const s = { id: nuevoId(), dia, inicio: Date.now(), fin: null, ejercicios: DIAS[dia].ejercicios.slice(), saltados: [], bloques: {},
      opcion: ajustado ? "ajustado" : "completo", limite, limiteOriginal: limite,
      objetivos, movidos: ajustado ? plan.pendientes.slice() : [],
      checkin: E.chk && Object.keys(E.chk).length ? { ...E.chk } : null, liviano: !!liviano, vuelta: diasSin > REGLAS.vueltaDias ? diasSin : 0 };
    await DB.put("sesiones", s);
    // los pendientes de este mismo día se hacen hoy: ya no hacen falta
    await guardarPendientes((await leerPendientes()).filter((p) => !s.ejercicios.includes(p.e)));
    E.diaElegido = null;
    await fijarLimiteActivo(s); programarAvisos([]);
    activarPantalla();
    mostrar("sesion", { sesion: s.id });
  },
  async "empezar-pendientes"() {
    const pend = (await pendientesConEstado()).filter((p) => p.listo <= Date.now());
    if (!pend.length) return toast("No hay pendientes listos");
    const s = { id: nuevoId(), tipo: "pendientes", dia: pend[0].dia, inicio: Date.now(), fin: null, ejercicios: pend.map((p) => p.e), saltados: [], bloques: {},
      opcion: "completo", limite: REGLAS.limiteMin, limiteOriginal: REGLAS.limiteMin, objetivos: Object.fromEntries(pend.map((p) => [p.e, p.series])), movidos: [] };
    await DB.put("sesiones", s);
    await fijarLimiteActivo(s); programarAvisos([]);
    activarPantalla();
    mostrar("sesion", { sesion: s.id });
  },
  async "quitar-pendiente"(d) {
    await guardarPendientes((await leerPendientes()).filter((p) => p.id !== d.id));
    PANTALLAS.inicio();
  },
  async seguir() {
    const activa = (await DB.todos("sesiones")).find((s) => !s.fin);
    await fijarLimiteActivo(activa);
    activarPantalla();
    mostrar("sesion", { sesion: activa.id });
  },
  async bloque(d) {
    const s = await DB.get("sesiones", E.sesion);
    s.bloques[d.k] = d.v;
    if (d.k === "calentamiento" && s.calInicio && !s.calFin) s.calFin = Date.now();
    await DB.put("sesiones", s);
    mostrar("sesion");
  },
  async "cal-hecho"(d) {
    const s = await DB.get("sesiones", E.sesion);
    s.calentamiento = s.calentamiento || {}; s.calentamiento[d.i] = true;
    if (CALENTAMIENTO[s.dia].every((x, i) => s.calentamiento[i])) { s.bloques.calentamiento = "hecho"; if (!s.calFin) s.calFin = Date.now(); }
    await DB.put("sesiones", s);
    if (E.pantalla !== "calentamiento") return;
    if (s.bloques.calentamiento === "hecho") { toast("¡Entrada en calor completa! Te llevó " + mmss((s.calFin - s.calInicio) / 1000)); return mostrar("sesion"); }
    PANTALLAS.calentamiento();
  },
  async "cal-deshacer"(d) {
    const s = await DB.get("sesiones", E.sesion);
    if (s.calentamiento) delete s.calentamiento[d.i];
    if (s.bloques.calentamiento) { delete s.bloques.calentamiento; delete s.calFin; }
    await DB.put("sesiones", s); PANTALLAS.calentamiento();
  },
  async "cal-reiniciar"() {
    const s = await DB.get("sesiones", E.sesion);
    delete s.calentamiento; delete s.calInicio; delete s.calFin; delete s.bloques.calentamiento;
    await DB.put("sesiones", s); toast("Entrada en calor reiniciada"); PANTALLAS.calentamiento();
  },
  async descartar() {
    const series = await DB.porIndice("series", "sesion", E.sesion);
    for (const x of series) await DB.borrar("series", x.id);
    await DB.borrar("sesiones", E.sesion);
    E.limiteActivo = null;
    cancelarDescanso(); soltarPantalla();
    E.sesion = null; toast("Entrenamiento descartado"); mostrar("inicio");
  },
  async "borrar-historial"() {
    await DB.limpiar("series"); await DB.limpiar("sesiones"); await guardarAjuste("descanso", null); await guardarPendientes([]);
    E.limiteActivo = null;
    cancelarDescanso(); E.sesion = null;
    toast("Historial borrado"); mostrar("inicio");
  },
  async "cal-timer"(d) {
    prepararSonido();
    const s = await DB.get("sesiones", E.sesion);
    const x = CALENTAMIENTO[s.dia][d.i];
    empezarDescanso(x.seg, "Terminó: " + EJERCICIOS[x.e].nombre, { titulo: EJERCICIOS[x.e].nombre, aviso: "¡Listo!", alTerminar: () => ACCIONES["cal-hecho"]({ i: d.i }) });
  },
  "abrir-ej": (d) => mostrar("ejercicio", { ejercicio: d.e, valoresListos: false, manual: false }),

  peso: async (d) => {
    const paso = await pasoDe(E.ejercicio, (await unidadDe(E.ejercicio)) || "kg");
    E.peso = Math.max(0, Math.round((E.peso + d.d * paso) * 100) / 100);
    $("#v-peso").textContent = kg(E.peso);
  },
  "escribir-peso"() {
    const b = $("#v-peso");
    if (b.querySelector("input")) return;
    b.innerHTML = `<input type="text" inputmode="decimal" value="${E.peso ? kg(E.peso) : ""}" style="font-size:30px;text-align:center;margin:0;padding:4px">`;
    const inp = b.querySelector("input"); inp.focus();
    const listo = () => { const v = parseFloat(String(inp.value).replace(",", ".")); if (!isNaN(v) && v >= 0) E.peso = v; b.textContent = kg(E.peso); };
    inp.addEventListener("blur", listo); inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") inp.blur(); });
  },
  reps: (d) => { E.reps = Math.max(1, E.reps + +d.d); $("#v-reps").textContent = E.reps; },
  async "cambiar-paso"() {
    const u = (await unidadDe(E.ejercicio)) || "kg";
    const opciones = u === "lb" ? PASOS_LB : PASOS_KG;
    const pasos = (await ajuste("pasos")) || {};
    const actual = await pasoDe(E.ejercicio, u);
    pasos[E.ejercicio] = opciones[(opciones.indexOf(actual) + 1) % opciones.length];
    await guardarAjuste("pasos", pasos);
    $("[data-accion=cambiar-paso]").textContent = "de a " + kg(pasos[E.ejercicio]) + " " + u;
  },
  async "set-unidad"(d) {
    const unidades = (await ajuste("unidades")) || {};
    unidades[E.ejercicio] = d.u; await guardarAjuste("unidades", unidades);
    const pasos = (await ajuste("pasos")) || {};
    delete pasos[E.ejercicio]; await guardarAjuste("pasos", pasos); // vuelve al salto por defecto de esa unidad
    toast(EJERCICIOS[E.ejercicio].nombre + ": " + (d.u === "lb" ? "libras" : "kilos"));
    E.valoresListos = true; PANTALLAS.ejercicio();
  },

  async "confirmar-serie"() {
    prepararSonido();
    const e = E.ejercicio;
    const s = await DB.get("sesiones", E.sesion);
    const r = { ...reglas(e), series: objetivo(s, e) };
    const hoy = (await DB.porIndice("series", "sesion", s.id)).filter((x) => x.ejercicio === e);
    const n = hoy.length + 1;
    const unidad = (await unidadDe(e)) || "kg";
    const idSerie = nuevoId(); E.ultimaSerieId = idSerie;
    await DB.put("series", { id: idSerie, sesion: s.id, ejercicio: e, n, peso: E.peso, unidad, reps: E.reps, hora: Date.now(), descanso: r.descanso, objetivo: E.pres ? { peso: E.pres.peso, reps: E.pres.reps } : null });
    if (s.calInicio && !s.calFin) s.calFin = Date.now();
    s.saltados = s.saltados.filter((x) => x !== e);
    s.movidos = (s.movidos || []).filter((x) => x !== e);
    await DB.put("sesiones", s);
    // ¿Qué viene después?
    let prox, siguienteEj = null;
    let ultima = false;
    if (n < r.series) {
      ultima = n + 1 === r.series;
      prox = `${ultima ? `Última serie (${n + 1} de ${r.series})` : `Serie ${n + 1} de ${r.series}`} · ${EJERCICIOS[e].nombre}: ${fmtPeso(E.peso, unidad, e)} × ${E.reps}`;
    }
    else {
      siguienteEj = s.ejercicios.slice(s.ejercicios.indexOf(e) + 1).find((x) => !s.saltados.includes(x) && !s.movidos.includes(x));
      prox = siguienteEj ? `Ahora: ${EJERCICIOS[siguienteEj].nombre}` : "¡Último ejercicio terminado!";
    }
    if (siguienteEj) { E.ejercicio = siguienteEj; E.valoresListos = false; E.manual = false; }
    else E.valoresListos = true; // mantiene peso y reps para la próxima serie
    await mostrar(n >= r.series && !siguienteEj ? "sesion" : "ejercicio");
    if (n < r.series || siguienteEj) empezarDescanso(r.descanso, prox, { ...(ultima ? { aviso: "¡Última serie de este ejercicio!", ultima: true } : {}), rir: true });
    else toast("¡Terminaste todos los ejercicios! Tocá «Terminar entrenamiento».");
    E.proyCache = 0; revisarTiempo("serie");
  },
  async "borrar-serie"(d) {
    await DB.borrar("series", d.id);
    // renumerar
    const s = await DB.get("sesiones", E.sesion);
    const hoy = (await DB.porIndice("series", "sesion", s.id)).filter((x) => x.ejercicio === E.ejercicio).sort((a, b) => a.n - b.n);
    for (let i = 0; i < hoy.length; i++) if (hoy[i].n !== i + 1) { hoy[i].n = i + 1; await DB.put("series", hoy[i]); }
    E.valoresListos = true; PANTALLAS.ejercicio();
  },
  async "saltear-ej"() {
    const s = await DB.get("sesiones", E.sesion);
    if (!s.saltados.includes(E.ejercicio)) s.saltados.push(E.ejercicio);
    await DB.put("sesiones", s);
    const sig = s.ejercicios.slice(s.ejercicios.indexOf(E.ejercicio) + 1)[0];
    sig ? mostrar("ejercicio", { ejercicio: sig, valoresListos: false }) : mostrar("sesion");
  },
  async terminar() {
    if (!E.confirmarFin) { E.confirmarFin = true; $("#b-terminar").textContent = "Tocá de nuevo para confirmar"; return; }
    const s = await DB.get("sesiones", E.sesion);
    s.fin = Date.now();
    const series = await DB.porIndice("series", "sesion", s.id);
    const hechos = new Set(series.map((x) => x.ejercicio));
    s.quedaronPendientes = DIAS[s.dia].especial ? [] : s.ejercicios.filter((e) => !hechos.has(e));
    await DB.put("sesiones", s);
    // los pendientes que se hicieron hoy se borran; los ejercicios que no se hicieron pasan a pendientes
    await guardarPendientes((await leerPendientes()).filter((p) => !hechos.has(p.e)));
    await moverAPendientes(s, s.quedaronPendientes);
    E.limiteActivo = null; cerrarHoja();
    cancelarDescanso(); soltarPantalla();
    mostrar("resumen");
  },

  // ----- Decisiones de tiempo -----
  "min-extra": (d) => { E.minExtra = Math.min(120, Math.max(5, E.minExtra + +d.d)); $("#v-min").textContent = E.minExtra; },
  async "tiempo-sumar"() {
    const s = await DB.get("sesiones", E.sesion);
    s.limite = (s.limite || REGLAS.limiteMin) + E.minExtra;
    s.avisoProyeccion = null; await DB.put("sesiones", s);
    await fijarLimiteActivo(s); programarAvisos(D.fin > Date.now() ? avisosDescanso() : []);
    cerrarHoja(); E.proyCache = 0;
    toast(`Sumaste ${E.minExtra} min: nuevo límite ${hora(s.inicio + s.limite * 60000)}`);
    if (E.pantalla === "sesion" || E.pantalla === "ejercicio") PANTALLAS[E.pantalla]();
  },
  async "tiempo-ajustar"() {
    const s = await DB.get("sesiones", E.sesion);
    const p = await proyeccion(s);
    const items = p.items.map((x) => ({ e: x.e, n: x.n, min: Math.max(0, REGLAS.minSeries[tipoDe(x.e)] - x.hechas), nuevo: x.hechas === 0 }));
    const aj = ajustar(items, p.rit, Math.max(0, (p.limite - Date.now()) / 1000));
    s.objetivos = s.objetivos || {};
    for (const x of aj.items) s.objetivos[x.e] = (x.n || 0) + (p.items.find((y) => y.e === x.e).hechas);
    s.movidos = [...new Set([...(s.movidos || []), ...aj.pendientes])];
    s.opcion = "ajustado"; await DB.put("sesiones", s);
    cerrarHoja(); E.proyCache = 0;
    const nRec = Object.values(aj.recortes).reduce((t, n) => t + n, 0);
    toast(`Ajustado: ${nRec} series menos${aj.pendientes.length ? " y " + aj.pendientes.length + " ejercicio(s) para otro día" : ""}`);
    if (E.pantalla === "sesion" || E.pantalla === "ejercicio") { E.valoresListos = true; PANTALLAS[E.pantalla](); }
  },
  "tiempo-seguir": () => { cerrarHoja(); },
  async "tiempo-terminar"() {
    cerrarHoja(); E.confirmarFin = true; await ACCIONES.terminar();
  },

  // ----- Editor de series (corregir peso o repeticiones ya cargadas) -----
  async "editar-serie"(d) {
    const x = await DB.get("series", d.id);
    if (!x) return;
    E.ed = { serie: x, peso: x.peso, reps: x.reps, unidad: uSerie(x), paso: await pasoDe(x.ejercicio, uSerie(x)) };
    let ed = $("#editor");
    if (!ed) { ed = document.createElement("div"); ed.id = "editor"; document.body.appendChild(ed); }
    ed.innerHTML = `<div class="hoja">
      <h2>Corregir serie ${x.n}</h2>
      <p class="chico suave" style="margin-top:-4px">${EJERCICIOS[x.ejercicio].nombre} · ${fecha(x.hora)}</p>
      ${recordatorio(x.ejercicio, uSerie(x))}
      <div class="ajuste">
        <button class="sec" data-accion="ed-peso" data-d="-1">−</button>
        <div class="valor"><b id="ed-peso" data-accion="ed-escribir">${kg(x.peso)}</b><span id="ed-u">${etiquetaPeso(x.ejercicio, uSerie(x))}</span><br><span class="chico suave">tocá el número para escribir</span>
          ${equipo(x.ejercicio) === "maquina" ? `<br><span class="paso" data-accion="ed-unidad">cambiar a ${uSerie(x) === "lb" ? "kg" : "lb"}</span>` : ""}</div>
        <button class="sec" data-accion="ed-peso" data-d="1">+</button>
      </div>
      <div class="ajuste">
        <button class="sec" data-accion="ed-reps" data-d="-1">−</button>
        <div class="valor"><b id="ed-reps">${x.reps}</b><span>repeticiones</span></div>
        <button class="sec" data-accion="ed-reps" data-d="1">+</button>
      </div>
      <button data-accion="ed-guardar">Guardar cambios</button>
      <div class="fila2"><button class="sec" data-accion="ed-cancelar">Cancelar</button>
        <button class="sec" data-accion="ed-borrar" data-confirmar="1">Borrar serie</button></div>
    </div>`;
    ed.hidden = false;
  },
  "ed-peso": (d) => { E.ed.peso = Math.max(0, Math.round((E.ed.peso + d.d * E.ed.paso) * 100) / 100); $("#ed-peso").textContent = kg(E.ed.peso); },
  "ed-reps": (d) => { E.ed.reps = Math.max(1, E.ed.reps + +d.d); $("#ed-reps").textContent = E.ed.reps; },
  "ed-escribir"() {
    const b = $("#ed-peso"); if (b.querySelector("input")) return;
    b.innerHTML = `<input type="text" inputmode="decimal" value="${kg(E.ed.peso)}" style="font-size:30px;text-align:center;margin:0;padding:4px">`;
    const inp = b.querySelector("input"); inp.focus(); inp.select();
    const listo = () => { const v = parseFloat(String(inp.value).replace(",", ".")); if (!isNaN(v) && v >= 0) E.ed.peso = v; b.textContent = kg(E.ed.peso); };
    inp.addEventListener("blur", listo); inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") inp.blur(); });
  },
  "ed-unidad"() {
    E.ed.unidad = E.ed.unidad === "lb" ? "kg" : "lb";
    $("#ed-u").textContent = etiquetaPeso(E.ed.serie.ejercicio, E.ed.unidad);
    $("[data-accion=ed-unidad]").textContent = "cambiar a " + (E.ed.unidad === "lb" ? "kg" : "lb");
  },
  "ed-cancelar": () => ($("#editor").hidden = true),
  async "ed-guardar"() {
    const inp = $("#ed-peso input"); if (inp) inp.blur();
    const x = E.ed.serie; x.peso = E.ed.peso; x.reps = E.ed.reps; x.unidad = E.ed.unidad;
    await DB.put("series", x);
    $("#editor").hidden = true; toast("Serie corregida");
    E.valoresListos = true; PANTALLAS[E.pantalla]();
  },
  async "ed-borrar"() {
    const x = E.ed.serie;
    await DB.borrar("series", x.id);
    const resto = (await DB.porIndice("series", "sesion", x.sesion)).filter((y) => y.ejercicio === x.ejercicio).sort((a, b) => a.n - b.n);
    for (let i = 0; i < resto.length; i++) if (resto[i].n !== i + 1) { resto[i].n = i + 1; await DB.put("series", resto[i]); }
    $("#editor").hidden = true; toast("Serie borrada");
    E.valoresListos = true; PANTALLAS[E.pantalla]();
  },
  async letra() {
    const tam = [20, 24, 28, 17];
    const actual = (await ajuste("letra")) || 20;
    const nuevo = tam[(tam.indexOf(actual) + 1) % tam.length];
    await guardarAjuste("letra", nuevo); aplicarLetra(nuevo);
    toast("Tamaño de letra: " + { 17: "chico", 20: "normal", 24: "grande", 28: "muy grande" }[nuevo]);
  },

  "hist-ej": (d) => mostrar("historial", { histEj: d.e }),
  "hist-volver": () => mostrar("historial", { histEj: null }),

  "peso-corp": (d) => { E.pesoCorp = Math.max(30, Math.round((E.pesoCorp + +d.d) * 100) / 100); $("#v-pc").textContent = kg(E.pesoCorp); },
  async "guardar-peso"() {
    await DB.put("pesoCorporal", { id: nuevoId(), fecha: Date.now(), kg: E.pesoCorp });
    toast("Peso guardado"); PANTALLAS.peso();
  },
  async "borrar-peso"(d) { await DB.borrar("pesoCorporal", d.id); PANTALLAS.peso(); },

  exportar: () => exportarRespaldo(),
  "elegir-archivo": () => $("#archivo").click(),

  "activar-notif": () => activarNotificaciones(),
  async "probar-notif"() {
    await programarAvisos([{ enSegundos: 5, titulo: "Prueba", texto: "Las notificaciones funcionan", etiqueta: "prueba" }]);
    toast("Bloqueá el teléfono: llega en 5 segundos");
  },
  async "toggle-pantalla"() {
    await guardarAjuste("pantallaEncendida", !(await ajuste("pantallaEncendida")));
    PANTALLAS.ajustes();
  },

  "descanso-mas": () => { D.fin += 15000; reprogramarDescanso(); },
  "descanso-saltear": () => cancelarDescanso(),
  "descanso-ver"(d) {
    $("#descanso").hidden = true;
    $("#mini-tit").textContent = D.titulo || "Descanso";
    $("#mini-descanso").hidden = false; document.body.classList.add("con-mini");
    mostrar(d.v === "lista" ? "sesion" : d.v === "calentamiento" ? "calentamiento" : "ejercicio");
  },
  "descanso-volver"() { ocultarMini(); $("#descanso").hidden = false; },
  "cerrar-flash": () => ($("#flash").hidden = true),
};

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-accion]");
  if (!el) return;
  const fn = ACCIONES[el.dataset.accion];
  if (el.dataset.confirmar && el.dataset.armado !== "1") {
    el.dataset.armado = "1"; const txt = el.textContent; el.textContent = "Tocá de nuevo para confirmar";
    setTimeout(() => { if (el.isConnected) { el.dataset.armado = ""; el.textContent = txt; } }, 4000);
    return;
  }
  if (fn) fn(el.dataset);
});
document.addEventListener("change", (ev) => { if (ev.target.id === "archivo" && ev.target.files[0]) importarRespaldo(ev.target.files[0]); });

// =====================================================================
// RESPALDO
// =====================================================================
async function exportarRespaldo() {
  const datos = { app: "entreno", version: 1, fecha: Date.now(), ajustes: {}, sesiones: await DB.todos("sesiones"), series: await DB.todos("series"), pesoCorporal: await DB.todos("pesoCorporal") };
  for (const k of await DB.claves("ajustes")) datos.ajustes[k] = await ajuste(k);
  const nombre = "entreno-respaldo-" + new Date().toISOString().slice(0, 10) + ".json";
  const archivo = new File([JSON.stringify(datos)], nombre, { type: "application/json" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) await navigator.share({ files: [archivo], title: nombre });
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(archivo); a.download = nombre; a.click(); }
    await guardarAjuste("ultimoRespaldo", Date.now());
    toast("Respaldo listo"); if (E.pantalla === "respaldo") PANTALLAS.respaldo();
  } catch (e) { if (e.name !== "AbortError") toast("No se pudo guardar: " + e.message); }
}
async function importarRespaldo(archivo) {
  try {
    const datos = JSON.parse(await archivo.text());
    if (datos.app !== "entreno") throw new Error("No es un respaldo de esta app");
    for (const s of ["sesiones", "series", "pesoCorporal", "ajustes"]) await DB.limpiar(s);
    for (const [k, v] of Object.entries(datos.ajustes || {})) await guardarAjuste(k, v);
    for (const s of ["sesiones", "series", "pesoCorporal"]) for (const x of datos[s] || []) await DB.put(s, x);
    toast("Datos restaurados (" + (datos.sesiones || []).length + " entrenamientos)");
    mostrar("inicio");
  } catch (e) { toast("Error: " + e.message); }
}

// =====================================================================
// 4. DESCANSO, SONIDO Y NOTIFICACIONES
// =====================================================================
const D = { fin: 0, texto: "", timer: null };

function empezarDescanso(segundos, texto, op = {}) {
  D.fin = Date.now() + segundos * 1000; D.texto = texto;
  D.aviso = op.aviso || "¡A entrenar!";
  D.alTerminar = op.alTerminar || null;
  D.titulo = op.titulo || "Descanso";
  D.esCal = !!op.alTerminar;
  $(".d-titulo").textContent = D.titulo;
  $("#d-prox").classList.toggle("ultima", !!op.ultima);
  $("#d-rir").hidden = !op.rir;
  document.querySelectorAll("#d-rir button").forEach((b) => b.classList.add("sec"));
  $("#d-rir-ok").textContent = "Me ayuda a elegir el peso de la próxima vez";
  $("#d-ver-ej").hidden = D.esCal;
  $("#d-ver-lista").textContent = D.esCal ? "Ver entrada en calor" : "Ver lista del día";
  $("#d-ver-lista").dataset.v = D.esCal ? "calentamiento" : "lista";
  $("#d-ver-lista").parentElement.className = D.esCal ? "" : "fila2";
  $("[data-accion=descanso-saltear]").textContent = op.titulo ? "Terminar" : "Saltear descanso";
  guardarAjuste("descanso", { fin: D.fin, texto });
  $("#descanso").hidden = false; $("#d-prox").textContent = texto;
  reprogramarDescanso();
}
function avisosDescanso() {
  const falta = Math.round((D.fin - Date.now()) / 1000);
  if (falta <= 0) return [];
  const a = [{ enSegundos: falta, titulo: D.aviso || "¡A entrenar!", texto: D.texto, etiqueta: "fin" }];
  if (falta > REGLAS.avisoPrevio) a.unshift({ enSegundos: falta - REGLAS.avisoPrevio, titulo: "Quedan 10 segundos", texto: D.texto, etiqueta: "previo" });
  return a;
}
function reprogramarDescanso() {
  guardarAjuste("descanso", { fin: D.fin, texto: D.texto });
  const falta = Math.round((D.fin - Date.now()) / 1000);
  const avisos = [{ enSegundos: falta, titulo: D.aviso || "¡A entrenar!", texto: D.texto, etiqueta: "fin" }];
  if (falta > REGLAS.avisoPrevio) avisos.unshift({ enSegundos: falta - REGLAS.avisoPrevio, titulo: "Quedan 10 segundos", texto: D.texto, etiqueta: "previo" });
  programarAvisos(avisos);
  clearInterval(D.timer);
  const tic = () => {
    const f = (D.fin - Date.now()) / 1000;
    $("#d-reloj").textContent = mmss(f);
    $("#mini-reloj").textContent = mmss(f);
    if (f <= 0) {
      clearInterval(D.timer); $("#descanso").hidden = true; ocultarMini(); guardarAjuste("descanso", null);
      if (D.alTerminar) { const f = D.alTerminar; D.alTerminar = null; f(); }
      if (document.visibilityState === "visible" && Date.now() - D.fin < 3000) { sonar(); $("#flash-tit").textContent = D.aviso || "¡A entrenar!"; $("#flash-txt").textContent = D.texto; $("#flash").hidden = false; }
    }
  };
  tic(); D.timer = setInterval(tic, 250);
}
function ocultarMini() { $("#mini-descanso").hidden = true; document.body.classList.remove("con-mini"); }
function cancelarDescanso() {
  clearInterval(D.timer); $("#descanso").hidden = true; ocultarMini(); guardarAjuste("descanso", null);
  if (D.alTerminar) { const f = D.alTerminar; D.alTerminar = null; f(); } // "Terminar" antes de tiempo también cuenta como hecho
  cancelarAvisos();
}
// Si la app se cerró durante un descanso, lo retoma
async function retomarDescanso() {
  const d = await ajuste("descanso");
  if (d && d.fin > Date.now()) { D.fin = d.fin; D.texto = d.texto; $("#descanso").hidden = false; $("#d-prox").textContent = d.texto;
    clearInterval(D.timer); D.timer = setInterval(() => { const f = (D.fin - Date.now()) / 1000; $("#d-reloj").textContent = mmss(f); $("#mini-reloj").textContent = mmss(f);
      if (f <= 0) { clearInterval(D.timer); $("#descanso").hidden = true; ocultarMini(); guardarAjuste("descanso", null); } }, 250); }
}

// Pitido (se mezcla con Spotify)
let ctx = null;
function prepararSonido() {
  if (navigator.audioSession) { try { navigator.audioSession.type = "ambient"; } catch (e) {} }
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume();
}
function sonar() {
  if (!ctx) return;
  ctx.resume();
  const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
  const t0 = ctx.currentTime;
  [0, 0.22, 0.44, 0.9, 1.12, 1.34].forEach((d) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = 1320; o.connect(g); g.connect(comp);
    g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(1, t0 + d + 0.01);
    g.gain.setValueAtTime(1, t0 + d + 0.14); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.17);
    o.start(t0 + d); o.stop(t0 + d + 0.18);
  });
}

// Pantalla encendida (opcional)
let candado = null;
async function activarPantalla() {
  if (!(await ajuste("pantallaEncendida")) || !("wakeLock" in navigator)) return;
  try { candado = await navigator.wakeLock.request("screen"); } catch (e) {}
}
function soltarPantalla() { if (candado) { candado.release(); candado = null; } }
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;
  const activa = (await DB.todos("sesiones")).find((s) => !s.fin);
  if (activa) activarPantalla();
});

// Notificaciones push (servidor en Cloudflare)
let registro = null;
const b64aBytes = (s) => { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
const instalada = () => window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;

async function estadoNotificaciones() {
  if (!registro || !("pushManager" in registro)) return instalada() ? "no-soportado" : "instalar";
  const sus = await registro.pushManager.getSubscription();
  return sus && Notification.permission === "granted" ? "activas" : instalada() ? "no" : "instalar";
}
async function activarNotificaciones() {
  try {
    if (!instalada()) throw new Error("Abrí la app desde el ícono de la pantalla de inicio");
    if (!registro || !("pushManager" in registro)) throw new Error("Este iPhone no permite notificaciones web");
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") throw new Error("Sin permiso. Activalo en Ajustes → Notificaciones → Entreno");
    const { clave } = await (await fetch(SERVIDOR + "/clave")).json();
    if (!(await registro.pushManager.getSubscription()))
      await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64aBytes(clave) });
    toast("Notificaciones activadas");
    mostrar(E.pantalla);
  } catch (e) { toast(e.message); }
}
async function programarAvisos(avisos) {
  try {
    const sus = registro && (await registro.pushManager.getSubscription());
    if (!sus) return;
    avisos = avisos.concat(avisosLimite()); // los avisos de "quedan 10 min" y "llegaste al límite" siempre van
    if (!avisos.length) return fetch(SERVIDOR + "/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suscripcion: sus }) });
    await fetch(SERVIDOR + "/programar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suscripcion: sus, avisos }) });
  } catch (e) { /* sin internet: queda el pitido dentro de la app */ }
}
// Cancela los avisos del descanso pero mantiene los del límite de tiempo
async function cancelarAvisos() { await programarAvisos([]); }

// =====================================================================
// CONTROL DE TIEMPO Y PENDIENTES
// - Mide tu ritmo real (cuánto tarda cada serie además del descanso, y cada cambio de ejercicio).
// - Estima cuánto vas a tardar y, si no entra en el límite, arma un plan ajustado.
// - Durante el entrenamiento proyecta la hora de fin y te pregunta qué hacer si no llegás.
// - Lo que no se hace queda "pendiente" y se ofrece cuando los músculos ya descansaron.
// =====================================================================
const tipoDe = (e) => (EJERCICIOS[e].tipo === "compuesto" ? "compuesto" : "aislamiento");
const mediana = (a) => { const b = a.slice().sort((x, y) => x - y), m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const objetivo = (s, e) => (s.objetivos && s.objetivos[e] != null ? s.objetivos[e] : reglas(e).series);
const hora = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const durTxt = (seg) => hhmm(seg * 1000);
const nombreSesion = (s) => (s.tipo === "pendientes" ? "Pendientes de otros días" : DIAS[s.dia].nombre);
const tituloSesion = (s) => (s.tipo === "pendientes" ? "Pendientes" : textoDia(s.dia));

// Ritmo real a partir del historial (si hay pocos datos, usa el ritmo inicial medido)
async function ritmoReal() {
  const series = (await DB.todos("series")).sort((a, b) => a.hora - b.hora);
  const ov = { compuesto: [], aislamiento: [] }, cambio = [], cal = [];
  const porSesion = {};
  series.forEach((x) => (porSesion[x.sesion] = porSesion[x.sesion] || []).push(x));
  for (const xs of Object.values(porSesion)) for (let i = 1; i < xs.length; i++) {
    const a = xs[i - 1], b = xs[i]; if (!EJERCICIOS[a.ejercicio]) continue;
    const t = tipoDe(a.ejercicio);
    const desc = a.descanso != null ? a.descanso : t === "compuesto" ? 120 : 75; // series viejas: descansos de antes
    const extra = (b.hora - a.hora) / 1000 - desc;
    if (extra < 0 || extra > 600) continue; // pausas raras (una llamada, etc.) no cuentan
    (a.ejercicio === b.ejercicio ? ov[t] : cambio).push(extra);
  }
  (await DB.todos("sesiones")).forEach((s) => { if (s.calInicio && s.calFin) cal.push((s.calFin - s.calInicio) / 1000); });
  const R = REGLAS.ritmoInicial, med = (a, d) => (a.length >= 3 ? mediana(a) : d);
  return { compuesto: med(ov.compuesto, R.compuesto), aislamiento: med(ov.aislamiento, R.aislamiento), cambio: med(cambio, R.cambio), calentamiento: med(cal, R.calentamiento) };
}

// Segundos para hacer una lista [{e, n}] en orden (n = series que faltan)
function estimar(items, rit) {
  let t = 0, cuantos = 0;
  for (const { e, n } of items) {
    if (n <= 0) continue;
    t += n * (reglas(e).descanso + rit[tipoDe(e)]);
    if (cuantos++ > 0) t += rit.cambio;
  }
  return t;
}

// Recorta para que entre en "disponible" segundos.
// items: [{e, n, min}] → primero saca series de aislamiento (desde el final), después de los pesados,
// y si igual no alcanza, los últimos ejercicios sin empezar quedan pendientes para otro día.
function ajustar(items, rit, disponible) {
  const it = items.map((x) => ({ ...x }));
  let t = estimar(it, rit);
  const recortes = {};
  for (const [tipo, conPrioridad] of [["aislamiento", false], ["compuesto", false], ["aislamiento", true], ["compuesto", true]]) {
    let hubo = true;
    while (t > disponible && hubo) {
      hubo = false;
      for (const x of it.slice().reverse()) {
        if (t <= disponible) break;
        if (tipoDe(x.e) !== tipo || x.n <= x.min || (!!x.prioridad && !conPrioridad)) continue;
        x.n--; recortes[x.e] = (recortes[x.e] || 0) + 1; t = estimar(it, rit); hubo = true;
      }
    }
  }
  const pendientes = [];
  while (t > disponible) {
    let vivos = it.filter((x) => x.n > 0 && x.nuevo && !x.prioridad);
    if (vivos.length <= 1) vivos = it.filter((x) => x.n > 0 && x.nuevo);
    if (vivos.length <= 1) break;
    const x = vivos[vivos.length - 1]; pendientes.unshift(x.e); x.n = 0; t = estimar(it, rit);
  }
  return { items: it, t, recortes, pendientes };
}

// Plan para un día antes de empezar
async function planDelDia(ejercicios, limiteMin, dia) {
  const rit = await ritmoReal();
  const prioridad = await rezagados();
  const especial = dia != null && DIAS[dia] && DIAS[dia].especial;
  const base = ejercicios.map((e) => ({ e, n: seriesDe(dia, e), min: REGLAS.minSeries[tipoDe(e)], nuevo: !especial, prioridad: prioridad.includes(EJERCICIOS[e].principal) }));
  const completo = rit.calentamiento + estimar(base, rit);
  const aj = ajustar(base, rit, limiteMin * 60 - rit.calentamiento);
  return { rit, prioridad, completo, ajustado: rit.calentamiento + aj.t, recortes: aj.recortes, pendientes: aj.pendientes,
    objetivos: Object.fromEntries(aj.items.map((x) => [x.e, x.n])), entra: completo <= limiteMin * 60 };
}

// Lo que falta de la sesión en curso
async function faltante(s) {
  const series = await DB.porIndice("series", "sesion", s.id);
  const hechas = (e) => series.filter((x) => x.ejercicio === e).length;
  const movidos = s.movidos || [];
  return s.ejercicios.filter((e) => !s.saltados.includes(e) && !movidos.includes(e))
    .map((e) => ({ e, hechas: hechas(e), n: Math.max(0, objetivo(s, e) - hechas(e)) }));
}
async function proyeccion(s) {
  const rit = await ritmoReal();
  const items = await faltante(s);
  let seg = estimar(items, rit);
  if (!s.bloques.calentamiento && s.tipo !== "pendientes") {
    const llevo = s.calInicio ? (Date.now() - s.calInicio) / 1000 : 0;
    seg += Math.max(0, rit.calentamiento - llevo);
  }
  const limite = s.inicio + (s.limite || REGLAS.limiteMin) * 60000;
  return { fin: Date.now() + seg * 1000, limite, faltanSeries: items.reduce((t, x) => t + x.n, 0), rit, items };
}

// ---------- Recuperación muscular ----------
async function ultimoTrabajo(excluirSesion) {
  const prin = {}, total = {};
  for (const x of await DB.todos("series")) {
    if (x.sesion === excluirSesion) continue;
    const ej = EJERCICIOS[x.ejercicio]; if (!ej) continue;
    prin[ej.principal] = Math.max(prin[ej.principal] || 0, x.hora);
    for (const m of [ej.principal, ...ej.secundarios]) total[m] = Math.max(total[m] || 0, x.hora);
  }
  for (const ev of (await ajuste("eventos")) || []) {
    if (ev.tipo !== "deporte" || !ev.musculos) continue;
    for (const m of ev.musculos) { prin[m] = Math.max(prin[m] || 0, ev.hora || ev.fecha); total[m] = Math.max(total[m] || 0, ev.hora || ev.fecha); }
  }
  return { prin, total };
}
// Desde cuándo se puede hacer un ejercicio: músculo principal 48 h desde que fue principal
// (y 24 h desde cualquier trabajo); músculos secundarios 24 h.
function listoDesde(e, ult) {
  const ej = EJERCICIOS[e], H = 3600000, R = REGLAS.recuperacion;
  let t = Math.max((ult.prin[ej.principal] || 0) + R.principalH * H, (ult.total[ej.principal] || 0) + R.secundarioH * H);
  for (const m of ej.secundarios) t = Math.max(t, (ult.total[m] || 0) + R.secundarioH * H);
  return t;
}

// ---------- Pendientes ----------
async function leerPendientes() {
  const lim = Date.now() - REGLAS.pendientesDias * 86400000;
  return ((await ajuste("pendientes")) || []).filter((p) => p.desde > lim && EJERCICIOS[p.e]);
}
const guardarPendientes = (lista) => guardarAjuste("pendientes", lista);
async function pendientesConEstado() {
  const ult = await ultimoTrabajo();
  return (await leerPendientes()).map((p) => ({ ...p, listo: listoDesde(p.e, ult) }));
}
function cuandoTxt(ts) {
  if (ts <= Date.now()) return '<span class="ok">✓ listo para hoy</span>';
  const d = new Date(ts), hoy = new Date();
  const dia = d.toDateString() === hoy.toDateString() ? "hoy" : "el " + d.toLocaleDateString("es-AR", { weekday: "long" });
  return `<span class="suave">listo ${dia} desde las ${hora(ts)}</span>`;
}

// ---------- Avisos de límite de tiempo (push) ----------
function avisosLimite() {
  const L = E.limiteActivo; if (!L) return [];
  const fin = L.inicio + L.limite * 60000, ahora = Date.now(), out = [];
  if (fin - 600000 > ahora) out.push({ enSegundos: Math.round((fin - 600000 - ahora) / 1000), titulo: "Quedan 10 minutos", texto: "Tu límite de entrenamiento es a las " + hora(fin), etiqueta: "limite10" });
  if (fin > ahora) out.push({ enSegundos: Math.round((fin - ahora) / 1000), titulo: "Llegaste a tu límite de tiempo", texto: "Abrí la app para terminar o sumar minutos", etiqueta: "limite" });
  return out;
}
async function fijarLimiteActivo(s) {
  E.limiteActivo = s && !s.fin ? { inicio: s.inicio, limite: s.limite || REGLAS.limiteMin } : null;
}

// ---------- Hoja de decisión cuando no llegás ----------
function hoja(html) {
  let h = $("#hoja-tiempo");
  if (!h) { h = document.createElement("div"); h.id = "hoja-tiempo"; h.className = "hoja-fondo"; document.body.appendChild(h); }
  h.innerHTML = `<div class="hoja">${html}</div>`; h.hidden = false;
}
const cerrarHoja = () => { const h = $("#hoja-tiempo"); if (h) h.hidden = true; };

async function revisarTiempo(motivo) {
  if (!E.sesion) return;
  const s = await DB.get("sesiones", E.sesion);
  if (!s || s.fin) return;
  const p = await proyeccion(s);
  if (!p.faltanSeries) return;
  const pasaMin = Math.round((p.fin - p.limite) / 60000);
  const llegoAlLimite = Date.now() >= p.limite;
  if (llegoAlLimite) {
    if (s.avisoLimite === p.limite) return;
    s.avisoLimite = p.limite; await DB.put("sesiones", s);
    E.minExtra = Math.max(5, Math.ceil((p.fin - Date.now()) / 300000) * 5);
    return hoja(`<h2>Llegaste a tu límite (${hora(p.limite)})</h2>
      <p>Te faltan <b>${p.faltanSeries} series</b>, unos ${Math.max(1, Math.round((p.fin - Date.now()) / 60000))} min más.</p>
      ${selectorMinutos()}
      <button class="sec" data-accion="tiempo-terminar">Terminar ahora y dejar lo que falta pendiente</button>`);
  }
  if (pasaMin < 3 || s.avisoProyeccion === p.limite) return;
  s.avisoProyeccion = p.limite; await DB.put("sesiones", s);
  E.minExtra = Math.max(5, Math.ceil(pasaMin / 5) * 5);
  hoja(`<h2>A este ritmo no llegás a tiempo</h2>
    <p>Terminarías ≈ <b>${hora(p.fin)}</b>, ${pasaMin} min después de tu límite (${hora(p.limite)}).</p>
    <button data-accion="tiempo-ajustar">Ajustar para llegar a las ${hora(p.limite)}</button>
    <p class="chico suave">Recorta series de los últimos ejercicios; lo que no entre queda pendiente para otro día.</p>
    ${selectorMinutos()}
    <button class="sec" data-accion="tiempo-seguir">Seguir igual (te aviso al llegar al límite)</button>`);
}
function selectorMinutos() {
  return `<div class="tarjeta" style="margin:10px 0"><b>Tengo más tiempo</b>
    <div class="ajuste"><button class="sec" data-accion="min-extra" data-d="-5">−</button>
      <div class="valor"><b id="v-min">${E.minExtra}</b><span>minutos más</span></div>
      <button class="sec" data-accion="min-extra" data-d="5">+</button></div>
    <button data-accion="tiempo-sumar">Sumar estos minutos</button></div>`;
}
// Mueve lo que no entra (o lo que falta) a pendientes de otro día
async function moverAPendientes(s, ejercicios) {
  if (!ejercicios.length) return;
  const lista = await leerPendientes();
  for (const e of ejercicios) if (!lista.some((p) => p.e === e))
    lista.push({ id: nuevoId(), e, series: reglas(e).series, dia: s.tipo === "pendientes" ? (lista.find((p) => p.e === e) || {}).dia || s.dia : s.dia, desde: Date.now() });
  await guardarPendientes(lista);
}

// =====================================================================
// 5. ARRANQUE
// =====================================================================
// Corrección única (v7): antes se cargaba la SUMA de las dos mancuernas; ahora se anota el peso de UNA.
// Las series viejas no tienen el campo "unidad", así se reconocen.
async function corregirMancuernasV7() {
  if (await ajuste("migracionMancuernasV7")) return;
  let n = 0;
  for (const x of await DB.todos("series")) {
    if (x.unidad) continue;
    if (equipo(x.ejercicio) === "mancuernas2") { x.peso = Math.round((x.peso / 2) * 100) / 100; n++; }
    x.unidad = "kg";
    await DB.put("series", x);
  }
  await guardarAjuste("migracionMancuernasV7", Date.now());
  if (n) setTimeout(() => toast(`Corregí ${n} series de mancuernas: ahora muestran el peso de cada una`), 800);
}

function aplicarLetra(px) { document.documentElement.style.setProperty("--letra", px + "px"); }

(async function arrancar() {
  if (document.readyState === "loading") await new Promise((r) => document.addEventListener("DOMContentLoaded", r));
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); registro = await navigator.serviceWorker.ready; } catch (e) {}
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  await DB.abrir();
  aplicarLetra((await ajuste("letra")) || 20);
  await cargarPesoCorporal();
  await corregirMancuernasV7();
  const perfil = await ajuste("perfil");
  if (!perfil || !perfil.nacimiento) return mostrar("config");
  const activa = (await DB.todos("sesiones")).find((s) => !s.fin);
  if (activa) { E.sesion = activa.id; await fijarLimiteActivo(activa); }
  await mostrar("inicio");
  retomarDescanso();
})();

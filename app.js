// Mi Entrenamiento – Etapa 1
// Organización del archivo:
//   1. Base de datos (todo se guarda en el teléfono)
//   2. Utilidades
//   3. Pantallas (inicio, sesión, ejercicio, historial, peso, respaldo, ajustes)
//   4. Descanso, sonido y notificaciones
//   5. Arranque

const SERVIDOR = "https://entreno-avisos.manuel-entreno.workers.dev";
const VERSION_APP = "Etapa 1 · v4";

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
const reglas = (ej) => REGLAS[EJERCICIOS[ej].tipo] || REGLAS.aislamiento;
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
    const sugerido = ultima ? (ultima.dia % 3) + 1 : 1;
    const dia = E.diaElegido || sugerido;
    const pesoAct = pesos.sort((a, b) => b.fecha - a.fecha)[0];
    const sinRespaldo = terminadas.length > 0 && (!ultResp || Date.now() - ultResp > 7 * 86400000);
    const notif = await estadoNotificaciones();

    app.innerHTML = `
      <div class="cabecera"><span class="suave chico">${fechaLarga(Date.now())}</span>
        <button class="chico sec" data-accion="ir" data-p="ajustes">Ajustes</button></div>
      ${notif !== "activas" ? `<div class="tarjeta aviso"><b>Activá las notificaciones</b><p class="chico suave">Para que te avise al terminar cada descanso.</p>
        <button data-accion="activar-notif">Activar notificaciones</button></div>` : ""}
      ${sinRespaldo ? `<div class="tarjeta aviso"><b>Hace más de una semana que no guardás un respaldo</b>
        <button class="sec" data-accion="ir" data-p="respaldo">Guardar respaldo</button></div>` : ""}
      ${activa ? `
        <div class="tarjeta"><h2>Entrenamiento en curso</h2>
          <p>Día ${activa.dia} · ${DIAS[activa.dia].nombre}<br><span class="suave chico">Empezaste a las ${new Date(activa.inicio).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span></p>
          <button class="grande" data-accion="seguir">Seguir entrenando</button></div>` : `
        <h1>Hoy toca Día ${dia}</h1>
        <p class="suave" style="margin-top:0">${DIAS[dia].nombre}${dia !== sugerido ? " (elegido a mano)" : ""}</p>
        <div class="fila3 dias">${[1, 2, 3].map((d) => `<button class="sec ${d === dia ? "activo" : ""}" data-accion="elegir-dia" data-d="${d}">Día ${d}</button>`).join("")}</div>
        <div class="tarjeta" style="margin-top:12px">
          ${DIAS[dia].ejercicios.map((e) => `<div class="chico">· ${EJERCICIOS[e].nombre} <span class="suave">${reglas(e).series}×${reglas(e).repsMin}-${reglas(e).repsMax}</span></div>`).join("")}
        </div>
        <button class="grande" data-accion="empezar" data-d="${dia}">Empezar</button>`}
      <div class="fila2" style="margin-top:10px">
        <button class="sec" data-accion="ir" data-p="historial">Historial</button>
        <button class="sec" data-accion="ir" data-p="peso">Peso corporal</button>
      </div>
      <div class="tarjeta" style="margin-top:12px">
        <p class="chico suave">${ultima ? `Último entrenamiento: ${fecha(ultima.inicio)} · Día ${ultima.dia} · ${hhmm(ultima.fin - ultima.inicio)}` : "Todavía no registraste entrenamientos."}</p>
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
      <h1>Día ${s.dia}</h1><p class="suave" style="margin-top:0">${DIAS[s.dia].nombre}</p>
      <h3>Antes de empezar</h3>
      <div class="item ${s.bloques.calentamiento ? "hecho" : ""}" data-accion="ir" data-p="calentamiento">
        <img src="${gifUrl("bici")}" alt="" loading="lazy">
        <div class="txt"><b>Entrada en calor</b><span class="chico suave">≈ ${Math.round(CALENTAMIENTO[s.dia].reduce((t, x) => t + x.seg, 0) / 60)} min · para ${DIAS[s.dia].nombre.toLowerCase()}</span></div>
        <span class="prog">${s.bloques.calentamiento === "hecho" ? "✓" : s.bloques.calentamiento ? "salteada" : "›"}</span></div>
      <h3>Ejercicios</h3>
      ${s.ejercicios.map((e) => {
        const n = hechas(e), tot = reglas(e).series, salt = s.saltados.includes(e);
        return `<div class="item ${n >= tot || salt ? "hecho" : ""}" data-accion="abrir-ej" data-e="${e}">
          <img src="${gifUrl(e)}" alt="" loading="lazy">
          <div class="txt"><b>${EJERCICIOS[e].nombre}</b><span class="chico suave">${tot} series · ${reglas(e).repsMin}-${reglas(e).repsMax} reps</span></div>
          <span class="prog">${salt ? "salteado" : n + "/" + tot}</span></div>`;
      }).join("")}
      <button class="${series.length ? "" : "sec"}" data-accion="terminar" id="b-terminar">Terminar entrenamiento</button>`;
  },

  // ---------- Ejercicio ----------
  async ejercicio() {
    const e = E.ejercicio, info = EJERCICIOS[e], r = reglas(e);
    const s = await DB.get("sesiones", E.sesion);
    const hoy = (await DB.porIndice("series", "sesion", s.id)).filter((x) => x.ejercicio === e).sort((a, b) => a.n - b.n);
    const ant = await seriesAnteriores(e, s.id);
    const pasos = (await ajuste("pasos")) || {};
    const paso = pasos[e] || REGLAS.pasoPeso;
    const n = hoy.length + 1;
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
      <details><summary>Cómo se hace</summary><ol>${info.pasos.map((p) => `<li>${p}</li>`).join("")}</ol>
        <p class="chico suave">Trabaja: <b>${NOMBRES_MUSCULOS[info.principal]}</b>${info.secundarios.length ? " · también " + info.secundarios.map((m) => NOMBRES_MUSCULOS[m]).join(", ") : ""}</p></details>

      <div class="tarjeta" style="margin-top:10px">
        <p class="chico"><b>Objetivo:</b> ${r.series} series de ${r.repsMin} a ${r.repsMax} reps · descanso ${mmss(r.descanso)}</p>
        <p class="chico suave">${ant.series.length ? `Última vez (${fecha(ant.fecha)}): ${ant.series.map((x) => kg(x.peso) + "×" + x.reps).join(" · ")}` : "Primera vez que lo registrás."}</p>
      </div>

      ${hoy.length ? `<div class="tarjeta"><b>Hoy</b>${hoy.map((x) => `
        <div class="serie"><span>Serie ${x.n}: <b>${kg(x.peso)} kg × ${x.reps}</b></span>
        <button data-accion="borrar-serie" data-id="${x.id}" aria-label="Borrar">×</button></div>`).join("")}</div>` : ""}

      <div class="tarjeta">
        <h2>${n <= r.series ? `Serie ${n} de ${r.series}` : `Serie extra (${n})`}</h2>
        ${primeraVez ? `<p class="chico ok">Primera vez: tocá el número para escribir el peso, o usá + y −.</p>` : ""}
        <div class="ajuste">
          <button class="sec" data-accion="peso" data-d="-1">−</button>
          <div class="valor"><b id="v-peso" data-accion="escribir-peso">${kg(E.peso)}</b><span>${info.pesoCorporal ? "kg extra" : "kg"}</span><br>
            <span class="paso" data-accion="cambiar-paso">de a ${kg(paso)} kg</span></div>
          <button class="sec" data-accion="peso" data-d="1">+</button>
        </div>
        <div class="ajuste">
          <button class="sec" data-accion="reps" data-d="-1">−</button>
          <div class="valor"><b id="v-reps">${E.reps}</b><span>repeticiones</span></div>
          <button class="sec" data-accion="reps" data-d="1">+</button>
        </div>
        <button class="grande" data-accion="confirmar-serie">✓ Confirmar serie</button>
      </div>
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
          <div class="cabecera"><b>${i + 1}. ${info.nombre}</b>${ok ? `<span class="ok">✓</span>` : ""}</div>
          <p class="chico">${x.dosis}</p>
          ${ok ? "" : `<img class="gif" src="${gifUrl(x.e)}" alt="Cómo se hace ${info.nombre}" loading="lazy" style="width:150px;height:150px">
            <div class="atrib">${ATRIBUCION}</div>
            <details><summary>Cómo se hace</summary><ol>${info.pasos.map((p) => `<li>${p}</li>`).join("")}</ol></details>
            <div class="fila2">
              <button class="sec" data-accion="cal-timer" data-i="${i}">▶ Iniciar ${mmss(x.seg)}</button>
              <button data-accion="cal-hecho" data-i="${i}">Hecho</button>
            </div>`}
        </div>`;
      }).join("")}
      <button class="grande" data-accion="bloque" data-k="calentamiento" data-v="hecho">Terminé la entrada en calor</button>
      <button class="sec" data-accion="bloque" data-k="calentamiento" data-v="salteado">Saltear entrada en calor</button>`;
    actualizarReloj();
  },

  // ---------- Resumen al terminar ----------
  async resumen() {
    const s = await DB.get("sesiones", E.sesion);
    const series = await DB.porIndice("series", "sesion", s.id);
    const vol = series.reduce((t, x) => t + x.peso * x.reps, 0);
    const ejs = new Set(series.map((x) => x.ejercicio)).size;
    app.innerHTML = `
      <h1>¡Entrenamiento terminado!</h1>
      <p class="suave">Día ${s.dia} · ${DIAS[s.dia].nombre}</p>
      <div class="tarjeta">
        <p>Duración: <b>${hhmm(s.fin - s.inicio)}</b> <span class="suave chico">(objetivo: 1 h 15 min)</span></p>
        ${s.calInicio && s.calFin ? `<p>Entrada en calor: <b>${mmss((s.calFin - s.calInicio) / 1000)}</b> <span class="suave chico">(previsto ≈ ${Math.round(CALENTAMIENTO[s.dia].reduce((t, x) => t + x.seg, 0) / 60)} min)</span></p>` : ""}
        <p>Ejercicios: <b>${ejs}</b> · Series: <b>${series.length}</b></p>
        <p>Volumen total: <b>${kg(Math.round(vol))} kg</b> <span class="suave chico">(peso × repeticiones)</span></p>
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
      <div class="tarjeta"><b>Peso máximo por sesión</b>${grafico(lista.map((x) => ({ x: x.fecha, y: x.max })), "kg")}</div>
      <div class="tarjeta">${lista.length ? lista.slice().reverse().map((x) => `
        <div class="serie"><span>${fecha(x.fecha)}</span><span>${x.series.map((s) => kg(s.peso) + "×" + s.reps).join(" · ")}</span></div>`).join("")
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

  "elegir-dia": (d) => { E.diaElegido = +d.d; PANTALLAS.inicio(); },

  async empezar(d) {
    const dia = +d.d;
    const s = { id: nuevoId(), dia, inicio: Date.now(), fin: null, ejercicios: DIAS[dia].ejercicios.slice(), saltados: [], bloques: {}, opcion: "completa" };
    await DB.put("sesiones", s);
    E.diaElegido = null;
    activarPantalla();
    mostrar("sesion", { sesion: s.id });
  },
  async seguir() {
    const activa = (await DB.todos("sesiones")).find((s) => !s.fin);
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
  async "cal-timer"(d) {
    prepararSonido();
    const s = await DB.get("sesiones", E.sesion);
    const x = CALENTAMIENTO[s.dia][d.i];
    empezarDescanso(x.seg, "Terminó: " + EJERCICIOS[x.e].nombre, { titulo: EJERCICIOS[x.e].nombre, aviso: "¡Listo!", alTerminar: () => ACCIONES["cal-hecho"]({ i: d.i }) });
  },
  "abrir-ej": (d) => mostrar("ejercicio", { ejercicio: d.e, valoresListos: false }),

  peso: async (d) => {
    const pasos = (await ajuste("pasos")) || {};
    const paso = pasos[E.ejercicio] || REGLAS.pasoPeso;
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
    const opciones = [0.5, 1, 1.25, 2, 2.5, 5, 10];
    const pasos = (await ajuste("pasos")) || {};
    const actual = pasos[E.ejercicio] || REGLAS.pasoPeso;
    pasos[E.ejercicio] = opciones[(opciones.indexOf(actual) + 1) % opciones.length];
    await guardarAjuste("pasos", pasos);
    $("[data-accion=cambiar-paso]").textContent = "de a " + kg(pasos[E.ejercicio]) + " kg";
  },

  async "confirmar-serie"() {
    prepararSonido();
    const e = E.ejercicio, r = reglas(e);
    const s = await DB.get("sesiones", E.sesion);
    const hoy = (await DB.porIndice("series", "sesion", s.id)).filter((x) => x.ejercicio === e);
    const n = hoy.length + 1;
    await DB.put("series", { id: nuevoId(), sesion: s.id, ejercicio: e, n, peso: E.peso, reps: E.reps, hora: Date.now() });
    if (s.calInicio && !s.calFin) { s.calFin = Date.now(); await DB.put("sesiones", s); }
    // ¿Qué viene después?
    let prox, siguienteEj = null;
    if (n < r.series) prox = `Serie ${n + 1} de ${EJERCICIOS[e].nombre}: ${kg(E.peso)} kg × ${E.reps}`;
    else {
      siguienteEj = s.ejercicios.slice(s.ejercicios.indexOf(e) + 1).find((x) => !s.saltados.includes(x));
      prox = siguienteEj ? `Ahora: ${EJERCICIOS[siguienteEj].nombre}` : "¡Último ejercicio terminado!";
    }
    if (siguienteEj) { E.ejercicio = siguienteEj; E.valoresListos = false; }
    else E.valoresListos = true; // mantiene peso y reps para la próxima serie
    await mostrar(n >= r.series && !siguienteEj ? "sesion" : "ejercicio");
    if (n < r.series || siguienteEj) empezarDescanso(r.descanso, prox);
    else toast("¡Terminaste todos los ejercicios! Tocá «Terminar entrenamiento».");
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
    s.fin = Date.now(); await DB.put("sesiones", s);
    cancelarDescanso(); soltarPantalla();
    mostrar("resumen");
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
  "cerrar-flash": () => ($("#flash").hidden = true),
};

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-accion]");
  if (!el) return;
  const fn = ACCIONES[el.dataset.accion];
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
  $(".d-titulo").textContent = op.titulo || "Descanso";
  $("[data-accion=descanso-saltear]").textContent = op.titulo ? "Terminar" : "Saltear descanso";
  guardarAjuste("descanso", { fin: D.fin, texto });
  $("#descanso").hidden = false; $("#d-prox").textContent = texto;
  reprogramarDescanso();
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
    if (f <= 0) {
      clearInterval(D.timer); $("#descanso").hidden = true; guardarAjuste("descanso", null);
      if (D.alTerminar) { const f = D.alTerminar; D.alTerminar = null; f(); }
      if (document.visibilityState === "visible" && Date.now() - D.fin < 3000) { sonar(); $("#flash-txt").textContent = D.texto; $("#flash").hidden = false; }
    }
  };
  tic(); D.timer = setInterval(tic, 250);
}
function cancelarDescanso() {
  clearInterval(D.timer); $("#descanso").hidden = true; guardarAjuste("descanso", null);
  if (D.alTerminar) { const f = D.alTerminar; D.alTerminar = null; f(); } // "Terminar" antes de tiempo también cuenta como hecho
  cancelarAvisos();
}
// Si la app se cerró durante un descanso, lo retoma
async function retomarDescanso() {
  const d = await ajuste("descanso");
  if (d && d.fin > Date.now()) { D.fin = d.fin; D.texto = d.texto; $("#descanso").hidden = false; $("#d-prox").textContent = d.texto;
    clearInterval(D.timer); D.timer = setInterval(() => { const f = (D.fin - Date.now()) / 1000; $("#d-reloj").textContent = mmss(f);
      if (f <= 0) { clearInterval(D.timer); $("#descanso").hidden = true; guardarAjuste("descanso", null); } }, 250); }
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
    await fetch(SERVIDOR + "/programar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suscripcion: sus, avisos }) });
  } catch (e) { /* sin internet: queda el pitido dentro de la app */ }
}
async function cancelarAvisos() {
  try {
    const sus = registro && (await registro.pushManager.getSubscription());
    if (sus) await fetch(SERVIDOR + "/cancelar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suscripcion: sus }) });
  } catch (e) {}
}

// =====================================================================
// 5. ARRANQUE
// =====================================================================
(async function arrancar() {
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); registro = await navigator.serviceWorker.ready; } catch (e) {}
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  await DB.abrir();
  const perfil = await ajuste("perfil");
  if (!perfil || !perfil.nacimiento) return mostrar("config");
  const activa = (await DB.todos("sesiones")).find((s) => !s.fin);
  if (activa) E.sesion = activa.id;
  await mostrar("inicio");
  retomarDescanso();
})();

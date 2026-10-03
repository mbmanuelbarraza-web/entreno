// Servidor de avisos de "Mi Entrenamiento".
// La app le dice: "mandame estas notificaciones dentro de X segundos".
// El servidor espera (con una alarma) y las envía al iPhone por Web Push.
//
// Rutas:
//   GET  /clave      -> devuelve la clave pública (la necesita el iPhone para suscribirse)
//   POST /programar  -> { suscripcion, avisos: [{ enSegundos, titulo, texto, etiqueta }] }
//                       reemplaza los avisos pendientes de ese teléfono
//   POST /cancelar   -> { suscripcion } borra los avisos pendientes

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { "Content-Type": "application/json", ...CORS } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/clave") {
      if (!env.VAPID_PUBLIC) return json({ error: "Faltan las claves del servidor" }, 500);
      return json({ clave: env.VAPID_PUBLIC });
    }

    if (request.method === "POST" && (url.pathname === "/programar" || url.pathname === "/cancelar")) {
      let datos;
      try { datos = await request.json(); } catch { return json({ error: "Datos inválidos" }, 400); }
      const endpoint = datos?.suscripcion?.endpoint;
      if (!endpoint || !/^https:\/\//.test(endpoint)) return json({ error: "Falta la suscripción" }, 400);
      // Un temporizador por teléfono (identificado por su suscripción)
      const id = env.TEMPORIZADOR.idFromName(endpoint);
      return env.TEMPORIZADOR.get(id).fetch(new Request("https://interno" + url.pathname, { method: "POST", body: JSON.stringify(datos) }))
        .then(async (r) => json(await r.json(), r.status));
    }

    return json({ ok: true, servicio: "entreno-avisos" });
  },
};

// ---------- Temporizador (uno por teléfono) ----------
export class Temporizador {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  async fetch(request) {
    const url = new URL(request.url);
    const datos = await request.json();
    if (url.pathname === "/cancelar") {
      await this.ctx.storage.deleteAll();
      await this.ctx.storage.deleteAlarm();
      return Response.json({ ok: true, cancelados: true });
    }
    const ahora = Date.now();
    const avisos = (datos.avisos || []).slice(0, 20).map((a) => ({
      cuando: ahora + Math.max(0, Math.min(Number(a.enSegundos) || 0, 6 * 3600)) * 1000,
      titulo: String(a.titulo || "Mi Entrenamiento").slice(0, 120),
      texto: String(a.texto || "").slice(0, 300),
      etiqueta: String(a.etiqueta || "entreno").slice(0, 60),
    }));
    await this.ctx.storage.put("suscripcion", datos.suscripcion);
    await this.ctx.storage.put("avisos", avisos);
    await this.programarAlarma(avisos);
    return Response.json({ ok: true, programados: avisos.length });
  }

  async programarAlarma(avisos) {
    if (avisos.length) await this.ctx.storage.setAlarm(Math.min(...avisos.map((a) => a.cuando)));
    else await this.ctx.storage.deleteAlarm();
  }

  async alarm() {
    const avisos = (await this.ctx.storage.get("avisos")) || [];
    const suscripcion = await this.ctx.storage.get("suscripcion");
    const ahora = Date.now() + 250; // margen chico
    const toca = avisos.filter((a) => a.cuando <= ahora);
    const quedan = avisos.filter((a) => a.cuando > ahora);
    await this.ctx.storage.put("avisos", quedan);
    for (const a of toca) {
      const r = await enviarPush(suscripcion, { titulo: a.titulo, texto: a.texto, etiqueta: a.etiqueta }, this.env);
      if (r.status === 404 || r.status === 410) { await this.ctx.storage.deleteAll(); return; } // suscripción vencida
    }
    await this.programarAlarma(quedan);
  }
}

// ---------- Web Push (cifrado RFC 8291 + firma VAPID RFC 8292) ----------
const te = new TextEncoder();
const b64u = {
  enc(buf) {
    let s = ""; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  dec(str) {
    const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  },
};
const unir = (...partes) => {
  const total = partes.reduce((n, p) => n + p.length, 0), out = new Uint8Array(total);
  let i = 0; for (const p of partes) { out.set(p, i); i += p.length; } return out;
};
async function hkdf(salt, ikm, info, bytes) {
  const clave = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, clave, bytes * 8));
}

export async function cifrar(payloadTexto, p256dh, auth) {
  const uaPublic = b64u.dec(p256dh), secretoAuth = b64u.dec(auth);
  const efimera = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", efimera.publicKey));
  const clavePublicaUA = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const compartido = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clavePublicaUA }, efimera.privateKey, 256));
  const ikm = await hkdf(secretoAuth, compartido, unir(te.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const claveAES = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const texto = unir(te.encode(payloadTexto), new Uint8Array([2]));
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, claveAES, texto));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return unir(salt, rs, new Uint8Array([asPublic.length]), asPublic, cifrado);
}

async function firmaVapid(endpoint, env) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const clave = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const cab = b64u.enc(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const cuerpo = b64u.enc(te.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUBJECT,
  })));
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, clave, te.encode(cab + "." + cuerpo));
  return `vapid t=${cab}.${cuerpo}.${b64u.enc(firma)}, k=${env.VAPID_PUBLIC}`;
}

export async function enviarPush(suscripcion, mensaje, env) {
  const cuerpo = await cifrar(JSON.stringify(mensaje), suscripcion.keys.p256dh, suscripcion.keys.auth);
  return fetch(suscripcion.endpoint, {
    method: "POST",
    headers: {
      Authorization: await firmaVapid(suscripcion.endpoint, env),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "60",
      Urgency: "high",
    },
    body: cuerpo,
  });
}

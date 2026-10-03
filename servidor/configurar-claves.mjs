// Crea las claves de las notificaciones y las guarda como "secretos" en Cloudflare.
// Las claves nunca se muestran en pantalla ni quedan guardadas en tu Mac.
// Se corre una sola vez (si lo volvés a correr, hay que volver a activar las notificaciones en el iPhone).
import { spawnSync } from "node:child_process";
import { webcrypto as crypto } from "node:crypto";

const par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const { kty, crv, d, x, y } = await crypto.subtle.exportKey("jwk", par.privateKey);
const publica = Buffer.from(await crypto.subtle.exportKey("raw", par.publicKey)).toString("base64url");

function guardar(nombre, valor) {
  console.log(`\nGuardando ${nombre} en Cloudflare...`);
  const r = spawnSync("npx", ["wrangler", "secret", "put", nombre], { input: valor, stdio: ["pipe", "inherit", "inherit"] });
  if (r.status !== 0) { console.error(`\n✗ No se pudo guardar ${nombre}. Copiá el error y pasáselo a Claude.`); process.exit(1); }
}

guardar("VAPID_PRIVATE_JWK", JSON.stringify({ kty, crv, d, x, y }));
guardar("VAPID_PUBLIC", publica);
console.log("\n✓ Listo: claves creadas y guardadas en Cloudflare.");

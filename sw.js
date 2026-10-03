// Guarda la app en el teléfono para que funcione sin internet,
// y muestra las notificaciones que manda el servidor de avisos.
// Cada vez que cambiemos la app, subimos el número de VERSION.
const VERSION = "etapa0b-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Primero intenta internet (para recibir versiones nuevas); si no hay, usa lo guardado.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

// Llega un aviso del servidor -> mostrar notificación
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data.json(); } catch (err) { d = { titulo: "Mi Entrenamiento", texto: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Mi Entrenamiento", {
    body: d.texto || "",
    tag: d.etiqueta || "entreno",
    icon: "icon-192.png",
    badge: "icon-192.png",
  }));
});

// Tocar la notificación -> abrir la app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) =>
      ventanas.length ? ventanas[0].focus() : self.clients.openWindow("./")
    )
  );
});

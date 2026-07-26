// Service worker mínimo: sólo habilita la instalación de la PWA (Windows,
// Android). A propósito no cachea nada todavía — todas las páginas muestran
// datos en vivo (scoring, tarifas, consultas) y cachearlas podría mostrar
// información vieja. Si más adelante se agrega soporte offline, hacerlo con
// una lista explícita de rutas estáticas seguras de cachear.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* Owluxe offline support: keeps the app working with no signal. Bump VERSION to force an update. */
const VERSION = "owluxe-v2";
const CORE = ["./", "index.html", "manifest.webmanifest", "favicon.svg", "favicon.ico", "favicon-32.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (r.mode === "navigate") {   // app page: try the network first so updates show, fall back to the saved copy offline
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put("index.html", cp)); return res; }).catch(() => caches.match("index.html")));
    return;
  }
  const mine = u.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!mine && !fonts) return;   // never cache analytics or other sites
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; })));
});

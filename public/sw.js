const CACHE = 'money-shell-v4'
const BASE = new URL('./', self.registration.scope).pathname
const SHELL = [BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}icon.svg?v=2`]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.ok ? response.clone() : null
      if (copy) caches.open(CACHE).then((cache) => cache.put(`${BASE}index.html`, copy))
      return response
    }).catch(() => caches.match(`${BASE}index.html`)))
    return
  }
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request).then((response) => {
    const copy = response.ok ? response.clone() : null
    if (copy) caches.open(CACHE).then((cache) => cache.put(event.request, copy))
    return response
  })))
})

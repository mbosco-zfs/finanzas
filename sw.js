const CACHE_NAME = 'finanzas-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API calls
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache Anthropic API calls
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({error: 'Sin conexión'}), {
        headers: {'Content-Type': 'application/json'}
      })
    ));
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
// --- Share Target handler (Android/Chrome PWA) ---
// Intercepta el POST del "Compartir" y guarda el archivo para que index.html lo lea.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cambiá el path si usás otro action
  if (url.pathname.endsWith("/share-target") && event.request.method === "POST") {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get("file"); // coincide con params.files[0].name en manifest

        if (!file) {
          return Response.redirect("./?shared=0", 303);
        }

        // Guardamos el archivo en Cache Storage como Response
        const cache = await caches.open("finanzas-shared");
        const meta = {
          name: file.name || "archivo",
          type: file.type || "application/octet-stream",
          size: file.size || 0,
          ts: Date.now()
        };

        await cache.put(
          new Request("./__shared_meta__"),
          new Response(JSON.stringify(meta), { headers: { "Content-Type": "application/json" } })
        );

        await cache.put(
          new Request("./__shared_file__"),
          new Response(file, { headers: { "Content-Type": meta.type } })
        );

        // Redirige a la app (GET) para que pueda leer desde cache
        return Response.redirect("./?shared=1", 303);
      } catch (e) {
        return Response.redirect("./?shared=0", 303);
      }
    })());
  }
});

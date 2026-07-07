// sw.js - Service Worker para mantener la página activa
self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});

// Mantener el Service Worker activo
self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

console.log('✅ Service Worker de MediTech activo');
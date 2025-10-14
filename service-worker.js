const CACHE_NAME = 'antropo-cache-v1';
const urlsToCache = [
    '/calculadora-antropometrica/index.html', 
    '/calculadora-antropometrica/style.css', 
    '/calculadora-antropometrica/script.js',
    '/calculadora-antropometrica/manifest.json',
    '/calculadora-antropometrica/icon-192.png', 
    '/calculadora-antropometrica/icon-512.png'
];

// Instalação: Armazena os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache preenchido com sucesso!');
        return cache.addAll(urlsToCache);
      })
  );
});

// Busca: Serve arquivos do cache primeiro, se disponíveis
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o arquivo do cache se for encontrado
        if (response) {
          return response;
        }
        // Caso contrário, busca na rede
        return fetch(event.request);
      })
  );
});

// Limpeza: Remove caches antigos (para quando você atualizar o site)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

});



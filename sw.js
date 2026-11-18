// DAAT. Assistente: guarda a página para abrir mesmo sem sinal.
// Os dados (vendas, agenda) NÃO passam por aqui: a fila de lançamentos fica no próprio app.
const CACHE = 'daat-assistente-v1';
const SHELL = ['./assistente.html', './manifest.webmanifest', './icon-192.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // nunca guarda chamadas ao banco (supabase)
  if (url.hostname.endsWith('supabase.co')) return;
  const mesmoSite = url.origin === self.location.origin;
  const cdn = /(^|\.)jsdelivr\.net$|fonts\.googleapis\.com$|fonts\.gstatic\.com$/.test(url.hostname);
  if (!mesmoSite && !cdn) return;
  // rede primeiro (pega versão nova); sem rede, usa o que está guardado
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./assistente.html') : Response.error())))
  );
});

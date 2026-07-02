// Service Worker для приложения Стойка
// Файл должен лежать в КОРНЕ сайта (рядом с index.html)

self.addEventListener('install', e => {
  console.log('[SW] Установлен');
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Активирован');
  e.waitUntil(self.clients.claim());
});

// Получение push-уведомления
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/zakup/icon-192.png',
    badge: data.badge || '/zakup/icon-192.png',
    vibrate: [100, 50, 100, 50, 200],
    requireInteraction: false,
    data: { url: '/zakup/' },
  };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Стойка', options)
  );
});

// Клик по уведомлению — открываем приложение
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/zakup/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/zakup/');
    })
  );
});

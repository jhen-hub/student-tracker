self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Registrar', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: './logo.svg',
    badge: './logo.svg',
    tag: payload.tag || 'registrar-notification',
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(payload.title || 'Registrar', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
// Service Worker for background vibration notifications
// Handles PREPARING_VIBRATION messages from the main thread

self.addEventListener("message", (event) => {
  if (event.data?.type === "PREPARING_VIBRATION") {
    const pattern = event.data.pattern || [200, 100, 200, 100, 400];

    self.registration.showNotification("🍳 Your order is being prepared!", {
      body: "The kitchen has started preparing your order.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: pattern,
      silent: false,
      tag: "order-preparing",
      renotify: true,
      requireInteraction: false,
    }).catch(() => {});
  }
});

// Auto-close preparing notifications after 5 seconds
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

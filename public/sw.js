// Service Worker voor Push Notificaties – Talk To Benji

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      data: { url: data.url || "/account" },
      vibrate: [100, 50, 100],
      tag: "benji-notification",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Talk To Benji", options)
    );
  } catch (e) {
    console.error("Push event error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/account";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Als er al een tabblad open is, focus dat
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Anders open een nieuw tabblad
      return clients.openWindow(url);
    })
  );
});

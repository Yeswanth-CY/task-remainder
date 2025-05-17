// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data")
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "New notification",
      icon: data.icon || "/favicon.ico",
      badge: data.badge || "/favicon.ico",
      data: data.data || {},
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      tag: data.tag || "calendar-notification",
      renotify: data.renotify || false,
    }

    event.waitUntil(self.registration.showNotification(data.title || "Calendar Reminder", options))
  } catch (error) {
    console.error("Error showing notification:", error)
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        // If we have a matching client, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === "/" && "focus" in client) {
            return client.focus()
          }
        }
        // If no matching client, open a new window
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
  )
})

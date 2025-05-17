// Convert a base64 string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Check if push notifications are supported
export function isPushNotificationSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return "denied"
  }

  // Check if permission is already granted
  if (Notification.permission === "granted") {
    return "granted"
  }

  // Request permission
  try {
    return await Notification.requestPermission()
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return "denied"
  }
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    return null
  }

  try {
    return await navigator.serviceWorker.register("/service-worker.js")
  } catch (error) {
    console.error("Service worker registration failed:", error)
    return null
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  publicKey: string,
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    return subscription
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error)
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error)
    return false
  }
}

// Get current subscription
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (error) {
    console.error("Failed to get current push subscription:", error)
    return null
  }
}

// Send a test notification
export function sendTestNotification(): void {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications")
    return
  }

  if (Notification.permission === "granted") {
    new Notification("Calendar App", {
      body: "Notifications are working correctly!",
      icon: "/favicon.ico",
    })
  } else {
    alert("Please enable notifications to receive reminders")
  }
}

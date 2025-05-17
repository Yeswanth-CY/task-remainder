"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, AlertTriangle, Check } from "lucide-react"
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  sendTestNotification,
} from "@/utils/notification-utils"

interface NotificationSettingsProps {
  userId: string
}

export default function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // VAPID public key - in production, this would be an environment variable
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BLBx-hf5h3Z-NV-DWt9-dQfpNpH9MJhf0nEEalzQJKPTAcpVhzCLXqNxOxzXshiR6Wm4XE6VPg-5-vk7H7cZ9vA"

  useEffect(() => {
    const checkNotificationStatus = async () => {
      setLoading(true)
      try {
        // Check if push notifications are supported
        const isSupported = isPushNotificationSupported()
        setSupported(isSupported)

        if (!isSupported) {
          setLoading(false)
          return
        }

        // Check current permission status
        setPermission(Notification.permission)

        // Check if already subscribed
        const subscription = await getCurrentPushSubscription()
        setSubscribed(!!subscription)
      } catch (err) {
        console.error("Error checking notification status:", err)
        setError("Failed to check notification status")
      } finally {
        setLoading(false)
      }
    }

    checkNotificationStatus()
  }, [])

  const handleEnableNotifications = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Request permission
      const permissionResult = await requestNotificationPermission()
      setPermission(permissionResult)

      if (permissionResult !== "granted") {
        setError("Notification permission denied")
        setLoading(false)
        return
      }

      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setError("Failed to register service worker")
        setLoading(false)
        return
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(registration, publicKey)
      if (!subscription) {
        setError("Failed to subscribe to push notifications")
        setLoading(false)
        return
      }

      // Save subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to save subscription")
      }

      setSubscribed(true)
      setSuccess("Notifications enabled successfully!")
    } catch (err: any) {
      console.error("Error enabling notifications:", err)
      setError(err.message || "Failed to enable notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get current subscription
      const subscription = await getCurrentPushSubscription()
      if (!subscription) {
        setSubscribed(false)
        setSuccess("Notifications already disabled")
        setLoading(false)
        return
      }

      // Unsubscribe from push notifications
      const unsubscribed = await unsubscribeFromPushNotifications()
      if (!unsubscribed) {
        setError("Failed to unsubscribe from push notifications")
        setLoading(false)
        return
      }

      // Remove subscription from server
      const response = await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          userId,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to remove subscription")
      }

      setSubscribed(false)
      setSuccess("Notifications disabled successfully!")
    } catch (err: any) {
      console.error("Error disabling notifications:", err)
      setError(err.message || "Failed to disable notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = () => {
    setError(null)
    setSuccess(null)

    try {
      sendTestNotification()
      setSuccess("Test notification sent!")
    } catch (err: any) {
      console.error("Error sending test notification:", err)
      setError(err.message || "Failed to send test notification")
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="text-white">Checking notification status...</div>
        </div>
      </div>
    )
  }

  if (!supported) {
    return (
      <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
        <div className="flex items-center text-amber-300 mb-2">
          <AlertTriangle className="mr-2 h-5 w-5" />
          <h3 className="font-medium">Push Notifications Not Supported</h3>
        </div>
        <p className="text-white/70 text-sm">
          Your browser doesn't support push notifications. Please try using a modern browser like Chrome, Firefox, or
          Edge.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
      <h3 className="text-white font-medium text-lg mb-3">Notification Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {subscribed ? (
              <Bell className="mr-2 h-5 w-5 text-green-400" />
            ) : (
              <BellOff className="mr-2 h-5 w-5 text-white/70" />
            )}
            <span className="text-white">
              {subscribed ? "Notifications are enabled" : "Notifications are disabled"}
            </span>
          </div>

          <button
            onClick={subscribed ? handleDisableNotifications : handleEnableNotifications}
            disabled={loading || permission === "denied"}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              subscribed ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Processing..." : subscribed ? "Disable" : "Enable"}
          </button>
        </div>

        {permission === "denied" && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-3 text-sm text-white">
            <div className="flex items-center mb-1">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span className="font-medium">Notifications Blocked</span>
            </div>
            <p>
              You've blocked notifications for this site. Please update your browser settings to enable notifications.
            </p>
          </div>
        )}

        {subscribed && (
          <button
            onClick={handleTestNotification}
            className="w-full mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
          >
            Send Test Notification
          </button>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-3 text-sm text-white">
            <AlertTriangle className="inline-block mr-1 h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded p-3 text-sm text-white">
            <Check className="inline-block mr-1 h-4 w-4" />
            {success}
          </div>
        )}

        <div className="text-xs text-white/60 mt-2">
          <p>You'll receive notifications for upcoming events and work items, even when the app is closed.</p>
        </div>
      </div>
    </div>
  )
}

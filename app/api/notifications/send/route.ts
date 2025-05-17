import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"
import webpush from "web-push"

// Set VAPID keys - in production, these would be environment variables
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLBx-hf5h3Z-NV-DWt9-dQfpNpH9MJhf0nEEalzQJKPTAcpVhzCLXqNxOxzXshiR6Wm4XE6VPg-5-vk7H7cZ9vA"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UUxqIGGVJMrFHQF9rI7FuFZCpjcaYKYvKQEpIBmNmLg"
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@example.com"

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Get all subscriptions for this user
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching subscriptions:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: false, error: "No subscriptions found for this user" }, { status: 404 })
    }

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = sub.subscription
          const payload = JSON.stringify({
            title,
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: data || {},
            tag: "calendar-notification",
            renotify: true,
          })

          await webpush.sendNotification(subscription, payload)
          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("subscription->endpoint", sub.subscription.endpoint)
          }

          return {
            success: false,
            endpoint: sub.subscription.endpoint,
            error: error.message,
          }
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length
    const failed = results.filter((r) => r.status === "rejected" || !(r.value as any).success).length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error("Error in send notification endpoint:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}

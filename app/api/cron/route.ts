import { NextResponse } from "next/server"
import { sendEventReminders, cleanupPastEvents } from "@/actions/event-actions"
import { getServerClient } from "@/lib/supabase"
import { formatTimeForDisplay } from "@/utils/date-utils"

// This route can be called by a cron job service like Vercel Cron
export async function GET() {
  try {
    // Send reminders for upcoming events
    const reminderResult = await sendEventReminders()

    // Clean up past events
    const cleanupResult = await cleanupPastEvents()

    // Send push notifications for upcoming events
    const notificationResult = await sendPushNotificationsForUpcomingEvents()

    return NextResponse.json({
      success: true,
      reminderResult,
      cleanupResult,
      notificationResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process cron job",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Send push notifications for upcoming events
async function sendPushNotificationsForUpcomingEvents() {
  try {
    const supabase = getServerClient()
    const now = new Date()

    // Events starting in the next hour
    const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    // Get events starting in the next hour
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("*, users!inner(id, email, name)")
      .gte("start_time", now.toISOString())
      .lt("start_time", hourFromNow.toISOString())

    if (eventsError) {
      console.error("Error fetching upcoming events:", eventsError)
      return { success: false, error: eventsError.message }
    }

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return { success: true, sent: 0, message: "No upcoming events found" }
    }

    // Send notifications for each event
    let sent = 0
    let failed = 0

    for (const event of upcomingEvents) {
      try {
        // Check if we have push subscriptions for this user
        const { data: subscriptions, error: subError } = await supabase
          .from("push_subscriptions")
          .select("subscription")
          .eq("user_id", event.users.id)

        if (subError || !subscriptions || subscriptions.length === 0) {
          continue // Skip if no subscriptions
        }

        // Send notification via the API
        const response = await fetch(
          new URL("/api/notifications/send", process.env.VERCEL_URL || "http://localhost:3000").toString(),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: event.users.id,
              title: "Upcoming Event: " + event.title,
              body: `Your event starts at ${formatTimeForDisplay(event.start_time)}${event.location ? ` at ${event.location}` : ""}`,
              data: {
                type: "event",
                eventId: event.id,
                url: "/",
              },
            }),
          },
        )

        const result = await response.json()
        if (result.success) {
          sent += result.sent || 0
          failed += result.failed || 0
        }
      } catch (error) {
        console.error(`Error sending notification for event ${event.id}:`, error)
        failed++
      }
    }

    return { success: true, sent, failed, total: upcomingEvents.length }
  } catch (error) {
    console.error("Error sending push notifications:", error)
    return { success: false, error: "Failed to send push notifications" }
  }
}

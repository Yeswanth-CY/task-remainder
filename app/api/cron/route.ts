import { NextResponse } from "next/server"
import { sendEventReminders, cleanupPastEvents } from "@/actions/event-actions"

// This route can be called by a cron job service like Vercel Cron
export async function GET() {
  try {
    // Send reminders for upcoming events
    const reminderResult = await sendEventReminders()

    // Clean up past events
    const cleanupResult = await cleanupPastEvents()

    return NextResponse.json({
      success: true,
      reminderResult,
      cleanupResult,
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

"use server"

import { getServerClient } from "@/lib/supabase"
import type { EventType } from "@/types/event"
import type { WorkItem } from "@/actions/work-item-actions"

interface UpcomingRemindersResult {
  todayEvents: EventType[]
  tomorrowEvents: EventType[]
  todayWorkItems: WorkItem[]
  tomorrowWorkItems: WorkItem[]
  error?: string
}

export async function getUpcomingReminders(userId: string): Promise<UpcomingRemindersResult> {
  try {
    const supabase = getServerClient()

    // Get current date info
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Convert to ISO strings for database queries
    const todayStart = today.toISOString()
    const tomorrowStart = tomorrow.toISOString()
    const dayAfterTomorrowStart = dayAfterTomorrow.toISOString()

    // Fetch today's events
    const { data: todayEvents, error: todayEventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", todayStart)
      .lt("start_time", tomorrowStart)
      .order("start_time", { ascending: true })

    if (todayEventsError) {
      console.error("Error fetching today's events:", todayEventsError)
      return {
        todayEvents: [],
        tomorrowEvents: [],
        todayWorkItems: [],
        tomorrowWorkItems: [],
        error: "Failed to fetch today's events",
      }
    }

    // Fetch tomorrow's events
    const { data: tomorrowEvents, error: tomorrowEventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", tomorrowStart)
      .lt("start_time", dayAfterTomorrowStart)
      .order("start_time", { ascending: true })

    if (tomorrowEventsError) {
      console.error("Error fetching tomorrow's events:", tomorrowEventsError)
      return {
        todayEvents: todayEvents || [],
        tomorrowEvents: [],
        todayWorkItems: [],
        tomorrowWorkItems: [],
        error: "Failed to fetch tomorrow's events",
      }
    }

    // Check if work_items table exists
    const { error: checkError } = await supabase.from("work_items").select("id").limit(1).maybeSingle()

    let todayWorkItems: WorkItem[] = []
    let tomorrowWorkItems: WorkItem[] = []

    // Only try to fetch work items if the table exists
    if (!checkError || !checkError.message.includes("does not exist")) {
      // Fetch today's work items
      const { data: todayItems, error: todayItemsError } = await supabase
        .from("work_items")
        .select("*")
        .eq("user_id", userId)
        .gte("due_date", todayStart)
        .lt("due_date", tomorrowStart)
        .order("due_date", { ascending: true })

      if (!todayItemsError) {
        todayWorkItems = (todayItems as WorkItem[]) || []
      }

      // Fetch tomorrow's work items
      const { data: tomorrowItems, error: tomorrowItemsError } = await supabase
        .from("work_items")
        .select("*")
        .eq("user_id", userId)
        .gte("due_date", tomorrowStart)
        .lt("due_date", dayAfterTomorrowStart)
        .order("due_date", { ascending: true })

      if (!tomorrowItemsError) {
        tomorrowWorkItems = (tomorrowItems as WorkItem[]) || []
      }
    }

    return {
      todayEvents: todayEvents || [],
      tomorrowEvents: tomorrowEvents || [],
      todayWorkItems,
      tomorrowWorkItems,
    }
  } catch (error) {
    console.error("Error in getUpcomingReminders:", error)
    return {
      todayEvents: [],
      tomorrowEvents: [],
      todayWorkItems: [],
      tomorrowWorkItems: [],
      error: "An unexpected error occurred",
    }
  }
}

// Send push notification for an event
export async function sendEventPushNotification(userId: string, event: EventType): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title: "Upcoming Event: " + event.title,
        body: `Your event starts at ${new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${event.location ? ` at ${event.location}` : ""}`,
        data: {
          type: "event",
          eventId: event.id,
          url: "/",
        },
      }),
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

// Send push notification for a work item
export async function sendWorkItemPushNotification(userId: string, workItem: WorkItem): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title: "Work Item Due: " + workItem.title,
        body: `Priority: ${workItem.priority.charAt(0).toUpperCase() + workItem.priority.slice(1)} - Due at ${new Date(workItem.due_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        data: {
          type: "workItem",
          workItemId: workItem.id,
          url: "/",
        },
      }),
    })

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}

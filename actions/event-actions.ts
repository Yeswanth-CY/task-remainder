"use server"

import { getServerClient } from "@/lib/supabase"
import type { EventType, User } from "@/types/event"
import { parseDateTime, formatDateForDisplay, formatTimeForDisplay } from "@/utils/date-utils"
import { sendEventReminder } from "@/utils/email-utils"
import { revalidatePath } from "next/cache"
import { seedEvents } from "@/utils/seed-utils"

// Create a new user or get existing user
export async function getOrCreateUser(email: string, name?: string): Promise<User | null> {
  const supabase = getServerClient()

  // Check if user exists
  const { data: existingUser } = await supabase.from("users").select("*").eq("email", email).single()

  if (existingUser) {
    return existingUser as User
  }

  // Create new user
  const { data: newUser, error } = await supabase.from("users").insert([{ email, name }]).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  // Seed sample events for new users
  try {
    await seedEvents(newUser.id)
  } catch (error) {
    console.error("Error seeding events:", error)
    // Continue even if seeding fails
  }

  return newUser as User
}

// Create a new event
export async function createEvent(
  formData: FormData,
): Promise<{ success: boolean; message: string; eventId?: string }> {
  try {
    const supabase = getServerClient()

    // Get form data
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const startDate = formData.get("start_date") as string
    const startTime = formData.get("start_time") as string
    const endDate = formData.get("end_date") as string
    const endTime = formData.get("end_time") as string
    const location = formData.get("location") as string
    const color = formData.get("color") as string
    const isAllDay = formData.get("is_all_day") === "on"
    const attendees = (formData.get("attendees") as string)
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
    const organizer = formData.get("organizer") as string
    const userEmail = formData.get("user_email") as string

    // Validate required fields
    if (!title || !startDate || !startTime || !endDate || !endTime || !userEmail) {
      return { success: false, message: "Missing required fields" }
    }

    // Get or create user
    const user = await getOrCreateUser(userEmail)
    if (!user) {
      return { success: false, message: "Failed to create or get user" }
    }

    // Parse dates
    const startDateTime = parseDateTime(startDate, startTime)
    const endDateTime = parseDateTime(endDate, endTime)

    // Validate dates
    if (endDateTime <= startDateTime) {
      return { success: false, message: "End time must be after start time" }
    }

    // Create event
    const { data: event, error } = await supabase
      .from("events")
      .insert([
        {
          user_id: user.id,
          title,
          description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location,
          color,
          is_all_day: isAllDay,
          attendees,
          organizer,
          reminder_day_before_sent: false,
          reminder_hour_before_sent: false,
          reminder_five_min_before_sent: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating event:", error)
      return { success: false, message: "Failed to create event" }
    }

    // Schedule reminders
    scheduleEventReminders(event, user)

    revalidatePath("/")
    return { success: true, message: "Event created successfully", eventId: event.id }
  } catch (error) {
    console.error("Error in createEvent:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Update an existing event
export async function updateEvent(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    const eventId = formData.get("event_id") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const startDate = formData.get("start_date") as string
    const startTime = formData.get("start_time") as string
    const endDate = formData.get("end_date") as string
    const endTime = formData.get("end_time") as string
    const location = formData.get("location") as string
    const color = formData.get("color") as string
    const isAllDay = formData.get("is_all_day") === "on"
    const attendees = (formData.get("attendees") as string)
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
    const organizer = formData.get("organizer") as string
    const userEmail = formData.get("user_email") as string

    // Validate required fields
    if (!eventId || !title || !startDate || !startTime || !endDate || !endTime) {
      return { success: false, message: "Missing required fields" }
    }

    // Parse dates
    const startDateTime = parseDateTime(startDate, startTime)
    const endDateTime = parseDateTime(endDate, endTime)

    // Validate dates
    if (endDateTime <= startDateTime) {
      return { success: false, message: "End time must be after start time" }
    }

    // Get user
    const user = await getOrCreateUser(userEmail)
    if (!user) {
      return { success: false, message: "Failed to get user" }
    }

    // Reset reminder flags if the event time has changed
    const { data: existingEvent } = await supabase.from("events").select("*").eq("id", eventId).single()

    const resetReminders =
      existingEvent &&
      (existingEvent.start_time !== startDateTime.toISOString() || existingEvent.end_time !== endDateTime.toISOString())

    // Update event
    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update({
        title,
        description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location,
        color,
        is_all_day: isAllDay,
        attendees,
        organizer,
        updated_at: new Date().toISOString(),
        ...(resetReminders
          ? {
              reminder_day_before_sent: false,
              reminder_hour_before_sent: false,
              reminder_five_min_before_sent: false,
            }
          : {}),
      })
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      console.error("Error updating event:", error)
      return { success: false, message: "Failed to update event" }
    }

    // Reschedule reminders if needed
    if (resetReminders && updatedEvent) {
      scheduleEventReminders(updatedEvent, user)
    }

    revalidatePath("/")
    return { success: true, message: "Event updated successfully" }
  } catch (error) {
    console.error("Error in updateEvent:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Helper function to schedule event reminders
function scheduleEventReminders(event: any, user: User) {
  const startTime = new Date(event.start_time)
  const now = new Date()

  // Calculate reminder times
  const dayBeforeTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
  const hourBeforeTime = new Date(startTime.getTime() - 60 * 60 * 1000) // 1 hour before
  const fiveMinBeforeTime = new Date(startTime.getTime() - 5 * 60 * 1000) // 5 minutes before

  const formattedDate = formatDateForDisplay(event.start_time)
  const formattedTime = formatTimeForDisplay(event.start_time)

  // Schedule day before reminder
  if (dayBeforeTime > now) {
    const delay = dayBeforeTime.getTime() - now.getTime()
    setTimeout(
      async () => {
        await sendDayBeforeReminder(event.id, user.email, event.title, formattedDate, formattedTime, event.location)
      },
      Math.min(delay, 2147483647),
    ) // setTimeout has a max delay
  }

  // Schedule hour before reminder
  if (hourBeforeTime > now) {
    const delay = hourBeforeTime.getTime() - now.getTime()
    setTimeout(
      async () => {
        await sendHourBeforeReminder(event.id, user.email, event.title, formattedDate, formattedTime, event.location)
      },
      Math.min(delay, 2147483647),
    )
  }

  // Schedule 5 minutes before reminder
  if (fiveMinBeforeTime > now) {
    const delay = fiveMinBeforeTime.getTime() - now.getTime()
    setTimeout(
      async () => {
        await sendFiveMinBeforeReminder(event.id, user.email, event.title, formattedDate, formattedTime, event.location)
      },
      Math.min(delay, 2147483647),
    )
  }
}

// Send day before reminder
async function sendDayBeforeReminder(
  eventId: string,
  email: string,
  title: string,
  date: string,
  time: string,
  location: string,
) {
  const supabase = getServerClient()

  // Check if reminder already sent
  const { data: event } = await supabase.from("events").select("reminder_day_before_sent").eq("id", eventId).single()

  if (event && !event.reminder_day_before_sent) {
    // Send reminder
    const result = await sendEventReminder(email, title, date, time, location, "day_before")

    if (result.success) {
      // Mark reminder as sent
      await supabase.from("events").update({ reminder_day_before_sent: true }).eq("id", eventId)
    }
  }
}

// Send hour before reminder
async function sendHourBeforeReminder(
  eventId: string,
  email: string,
  title: string,
  date: string,
  time: string,
  location: string,
) {
  const supabase = getServerClient()

  // Check if reminder already sent
  const { data: event } = await supabase.from("events").select("reminder_hour_before_sent").eq("id", eventId).single()

  if (event && !event.reminder_hour_before_sent) {
    // Send reminder
    const result = await sendEventReminder(email, title, date, time, location, "hour_before")

    if (result.success) {
      // Mark reminder as sent
      await supabase.from("events").update({ reminder_hour_before_sent: true }).eq("id", eventId)
    }
  }
}

// Send 5 minutes before reminder
async function sendFiveMinBeforeReminder(
  eventId: string,
  email: string,
  title: string,
  date: string,
  time: string,
  location: string,
) {
  const supabase = getServerClient()

  // Check if reminder already sent
  const { data: event } = await supabase
    .from("events")
    .select("reminder_five_min_before_sent")
    .eq("id", eventId)
    .single()

  if (event && !event.reminder_five_min_before_sent) {
    // Send reminder
    const result = await sendEventReminder(email, title, date, time, location, "five_min_before")

    if (result.success) {
      // Mark reminder as sent
      await supabase.from("events").update({ reminder_five_min_before_sent: true }).eq("id", eventId)
    }
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      console.error("Error deleting event:", error)
      return { success: false, message: "Failed to delete event" }
    }

    revalidatePath("/")
    return { success: true, message: "Event deleted successfully" }
  } catch (error) {
    console.error("Error in deleteEvent:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Get all events for a user
export async function getEvents(userEmail: string): Promise<EventType[]> {
  try {
    const supabase = getServerClient()

    // Get user
    const { data: user } = await supabase.from("users").select("*").eq("email", userEmail).single()

    if (!user) {
      return []
    }

    // Get events
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true })

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    // Clean up past events (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pastEvents = events.filter((event) => new Date(event.end_time) < thirtyDaysAgo)

    if (pastEvents.length > 0) {
      const pastEventIds = pastEvents.map((event) => event.id)
      await supabase.from("events").delete().in("id", pastEventIds)
    }

    return events as EventType[]
  } catch (error) {
    console.error("Error in getEvents:", error)
    return []
  }
}

// Get a single event by ID
export async function getEventById(eventId: string): Promise<EventType | null> {
  try {
    const supabase = getServerClient()

    const { data: event, error } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (error) {
      console.error("Error fetching event:", error)
      return null
    }

    return event as EventType
  } catch (error) {
    console.error("Error in getEventById:", error)
    return null
  }
}

// Send reminders for upcoming events
export async function sendEventReminders(): Promise<{ success: boolean; sent: number; errors: number }> {
  try {
    const supabase = getServerClient()
    const now = new Date()
    let sent = 0
    let errors = 0

    // Check for day before reminders
    const dayBeforeTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const { data: dayBeforeEvents, error: dayBeforeError } = await supabase
      .from("events")
      .select("*, users!inner(*)")
      .eq("reminder_day_before_sent", false)
      .gte("start_time", now.toISOString())
      .lte("start_time", dayBeforeTime.toISOString())

    if (dayBeforeError) {
      console.error("Error fetching day before events:", dayBeforeError)
    } else {
      for (const event of dayBeforeEvents || []) {
        try {
          const result = await sendEventReminder(
            event.users.email,
            event.title,
            formatDateForDisplay(event.start_time),
            formatTimeForDisplay(event.start_time),
            event.location || "No location specified",
            "day_before",
          )

          if (result.success) {
            await supabase.from("events").update({ reminder_day_before_sent: true }).eq("id", event.id)
            sent++
          } else {
            errors++
          }
        } catch (error) {
          console.error(`Error sending day before reminder for event ${event.id}:`, error)
          errors++
        }
      }
    }

    // Check for hour before reminders
    const hourBeforeTime = new Date(now.getTime() + 60 * 60 * 1000)
    const { data: hourBeforeEvents, error: hourBeforeError } = await supabase
      .from("events")
      .select("*, users!inner(*)")
      .eq("reminder_hour_before_sent", false)
      .gte("start_time", now.toISOString())
      .lte("start_time", hourBeforeTime.toISOString())

    if (hourBeforeError) {
      console.error("Error fetching hour before events:", hourBeforeError)
    } else {
      for (const event of hourBeforeEvents || []) {
        try {
          const result = await sendEventReminder(
            event.users.email,
            event.title,
            formatDateForDisplay(event.start_time),
            formatTimeForDisplay(event.start_time),
            event.location || "No location specified",
            "hour_before",
          )

          if (result.success) {
            await supabase.from("events").update({ reminder_hour_before_sent: true }).eq("id", event.id)
            sent++
          } else {
            errors++
          }
        } catch (error) {
          console.error(`Error sending hour before reminder for event ${event.id}:`, error)
          errors++
        }
      }
    }

    // Check for 5 minutes before reminders
    const fiveMinBeforeTime = new Date(now.getTime() + 5 * 60 * 1000)
    const { data: fiveMinBeforeEvents, error: fiveMinBeforeError } = await supabase
      .from("events")
      .select("*, users!inner(*)")
      .eq("reminder_five_min_before_sent", false)
      .gte("start_time", now.toISOString())
      .lte("start_time", fiveMinBeforeTime.toISOString())

    if (fiveMinBeforeError) {
      console.error("Error fetching five min before events:", fiveMinBeforeError)
    } else {
      for (const event of fiveMinBeforeEvents || []) {
        try {
          const result = await sendEventReminder(
            event.users.email,
            event.title,
            formatDateForDisplay(event.start_time),
            formatTimeForDisplay(event.start_time),
            event.location || "No location specified",
            "five_min_before",
          )

          if (result.success) {
            await supabase.from("events").update({ reminder_five_min_before_sent: true }).eq("id", event.id)
            sent++
          } else {
            errors++
          }
        } catch (error) {
          console.error(`Error sending five min before reminder for event ${event.id}:`, error)
          errors++
        }
      }
    }

    return { success: true, sent, errors }
  } catch (error) {
    console.error("Error in sendEventReminders:", error)
    return { success: false, sent: 0, errors: 0 }
  }
}

// Clean up past events
export async function cleanupPastEvents(): Promise<{ success: boolean; removed: number }> {
  try {
    const supabase = getServerClient()

    // Get events that ended more than 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: pastEvents, error } = await supabase
      .from("events")
      .select("id")
      .lt("end_time", thirtyDaysAgo.toISOString())

    if (error) {
      console.error("Error fetching past events:", error)
      return { success: false, removed: 0 }
    }

    if (pastEvents.length === 0) {
      return { success: true, removed: 0 }
    }

    // Delete past events
    const pastEventIds = pastEvents.map((event) => event.id)
    const { error: deleteError } = await supabase.from("events").delete().in("id", pastEventIds)

    if (deleteError) {
      console.error("Error deleting past events:", deleteError)
      return { success: false, removed: 0 }
    }

    return { success: true, removed: pastEvents.length }
  } catch (error) {
    console.error("Error in cleanupPastEvents:", error)
    return { success: false, removed: 0 }
  }
}

"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { CalendarSettings, SharedCalendar, User } from "@/types/event"

// Get or create calendar settings for a user
export async function getOrCreateCalendarSettings(
  userId: string,
): Promise<{ settings: CalendarSettings | null; error?: string }> {
  try {
    const supabase = getServerClient()

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from("calendar_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (existingSettings) {
      return { settings: existingSettings as CalendarSettings }
    }

    // Create new settings
    const newSettings = {
      user_id: userId,
      default_calendar_name: "My Calendar",
      default_calendar_color: "bg-blue-500",
      sharing_enabled: true,
      public_link_enabled: false,
      public_link_token: null,
    }

    const { data: createdSettings, error: createError } = await supabase
      .from("calendar_settings")
      .insert([newSettings])
      .select()
      .single()

    if (createError) {
      console.error("Error creating calendar settings:", createError)
      return { settings: null, error: "Failed to create calendar settings" }
    }

    return { settings: createdSettings as CalendarSettings }
  } catch (error) {
    console.error("Error in getOrCreateCalendarSettings:", error)
    return { settings: null, error: "An unexpected error occurred" }
  }
}

// Update calendar settings
export async function updateCalendarSettings(
  userId: string,
  settings: Partial<CalendarSettings>,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    // Update settings
    const { error } = await supabase.from("calendar_settings").update(settings).eq("user_id", userId)

    if (error) {
      console.error("Error updating calendar settings:", error)
      return { success: false, message: "Failed to update calendar settings" }
    }

    revalidatePath("/")
    return { success: true, message: "Calendar settings updated successfully" }
  } catch (error) {
    console.error("Error in updateCalendarSettings:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Generate or update public link token
export async function generatePublicLinkToken(
  userId: string,
  enable: boolean,
): Promise<{ success: boolean; token?: string; message: string }> {
  try {
    const supabase = getServerClient()

    if (!enable) {
      // Disable public link
      await supabase
        .from("calendar_settings")
        .update({ public_link_enabled: false, public_link_token: null })
        .eq("user_id", userId)

      revalidatePath("/")
      return { success: true, message: "Public link disabled" }
    }

    // Generate new token
    const token = uuidv4()

    // Update settings
    const { error } = await supabase
      .from("calendar_settings")
      .update({ public_link_enabled: true, public_link_token: token })
      .eq("user_id", userId)

    if (error) {
      console.error("Error generating public link token:", error)
      return { success: false, message: "Failed to generate public link" }
    }

    revalidatePath("/")
    return { success: true, token, message: "Public link generated successfully" }
  } catch (error) {
    console.error("Error in generatePublicLinkToken:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Share calendar with another user
export async function shareCalendarWithUser(
  ownerId: string,
  recipientEmail: string,
  permission: "view" | "edit" | "admin",
  calendarName?: string,
  calendarColor?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    // Get owner's settings
    const { settings } = await getOrCreateCalendarSettings(ownerId)
    if (!settings) {
      return { success: false, message: "Failed to get calendar settings" }
    }

    // Check if sharing is enabled
    if (!settings.sharing_enabled) {
      return { success: false, message: "Calendar sharing is disabled" }
    }

    // Find recipient user
    const { data: recipientUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", recipientEmail)
      .single()

    let recipientId

    if (userError || !recipientUser) {
      // Create a new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ email: recipientEmail }])
        .select()
        .single()

      if (createError) {
        console.error("Error creating user:", createError)
        return { success: false, message: "Failed to create user for sharing" }
      }

      recipientId = newUser.id
    } else {
      recipientId = recipientUser.id
    }

    // Check if calendar is already shared with this user
    const { data: existingShare } = await supabase
      .from("shared_calendars")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("shared_with_id", recipientId)
      .single()

    if (existingShare) {
      // Update existing share
      const { error: updateError } = await supabase
        .from("shared_calendars")
        .update({
          permission,
          calendar_name: calendarName || settings.default_calendar_name,
          calendar_color: calendarColor || settings.default_calendar_color,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingShare.id)

      if (updateError) {
        console.error("Error updating shared calendar:", updateError)
        return { success: false, message: "Failed to update calendar sharing" }
      }
    } else {
      // Create new share
      const { error: shareError } = await supabase.from("shared_calendars").insert([
        {
          owner_id: ownerId,
          shared_with_id: recipientId,
          permission,
          calendar_name: calendarName || settings.default_calendar_name,
          calendar_color: calendarColor || settings.default_calendar_color,
          is_active: true,
        },
      ])

      if (shareError) {
        console.error("Error sharing calendar:", shareError)
        return { success: false, message: "Failed to share calendar" }
      }
    }

    revalidatePath("/")
    return { success: true, message: `Calendar shared with ${recipientEmail} successfully` }
  } catch (error) {
    console.error("Error in shareCalendarWithUser:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Remove calendar sharing
export async function removeCalendarSharing(shareId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    // Delete the share
    const { error } = await supabase.from("shared_calendars").delete().eq("id", shareId)

    if (error) {
      console.error("Error removing calendar sharing:", error)
      return { success: false, message: "Failed to remove calendar sharing" }
    }

    revalidatePath("/")
    return { success: true, message: "Calendar sharing removed successfully" }
  } catch (error) {
    console.error("Error in removeCalendarSharing:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Update calendar sharing permission
export async function updateCalendarSharingPermission(
  shareId: string,
  permission: "view" | "edit" | "admin",
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    // Update the permission
    const { error } = await supabase.from("shared_calendars").update({ permission }).eq("id", shareId)

    if (error) {
      console.error("Error updating calendar sharing permission:", error)
      return { success: false, message: "Failed to update calendar sharing permission" }
    }

    revalidatePath("/")
    return { success: true, message: "Calendar sharing permission updated successfully" }
  } catch (error) {
    console.error("Error in updateCalendarSharingPermission:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Get calendars shared with me
export async function getCalendarsSharedWithMe(
  userId: string,
): Promise<{ calendars: SharedCalendar[]; error?: string }> {
  try {
    const supabase = getServerClient()

    // Get shared calendars
    const { data, error } = await supabase
      .from("shared_calendars")
      .select("*, users!shared_calendars_owner_id_fkey(email, name)")
      .eq("shared_with_id", userId)
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching shared calendars:", error)
      return { calendars: [], error: "Failed to fetch shared calendars" }
    }

    // Format the data
    const calendars = data.map((calendar) => ({
      ...calendar,
      owner_email: calendar.users.email,
      owner_name: calendar.users.name,
    }))

    return { calendars }
  } catch (error) {
    console.error("Error in getCalendarsSharedWithMe:", error)
    return { calendars: [], error: "An unexpected error occurred" }
  }
}

// Get users I've shared my calendar with
export async function getMyCalendarShares(userId: string): Promise<{ shares: SharedCalendar[]; error?: string }> {
  try {
    const supabase = getServerClient()

    // Get shared calendars
    const { data, error } = await supabase
      .from("shared_calendars")
      .select("*, users!shared_calendars_shared_with_id_fkey(email, name)")
      .eq("owner_id", userId)
      .eq("is_active", true)

    if (error) {
      console.error("Error fetching calendar shares:", error)
      return { shares: [], error: "Failed to fetch calendar shares" }
    }

    // Format the data
    const shares = data.map((share) => ({
      ...share,
      shared_with_email: share.users.email,
      shared_with_name: share.users.name,
    }))

    return { shares }
  } catch (error) {
    console.error("Error in getMyCalendarShares:", error)
    return { shares: [], error: "An unexpected error occurred" }
  }
}

// Get events from shared calendars
export async function getSharedEvents(userId: string): Promise<{ events: any[]; error?: string }> {
  try {
    const supabase = getServerClient()

    // Get shared calendars with view or higher permissions
    const { data: sharedCalendars, error: calendarError } = await supabase
      .from("shared_calendars")
      .select("owner_id, permission, calendar_color")
      .eq("shared_with_id", userId)
      .eq("is_active", true)
      .in("permission", ["view", "edit", "admin"])

    if (calendarError) {
      console.error("Error fetching shared calendars:", calendarError)
      return { events: [], error: "Failed to fetch shared calendars" }
    }

    if (!sharedCalendars || sharedCalendars.length === 0) {
      return { events: [] }
    }

    // Get events from all shared calendars
    const ownerIds = sharedCalendars.map((calendar) => calendar.owner_id)
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*, users!inner(email, name)")
      .in("user_id", ownerIds)

    if (eventsError) {
      console.error("Error fetching shared events:", eventsError)
      return { events: [], error: "Failed to fetch shared events" }
    }

    // Map events to include sharing information
    const mappedEvents = events.map((event) => {
      const sharedCalendar = sharedCalendars.find((calendar) => calendar.owner_id === event.user_id)
      return {
        ...event,
        shared: true,
        shared_by_email: event.users.email,
        shared_by_name: event.users.name || event.users.email.split("@")[0],
        editable: sharedCalendar?.permission === "edit" || sharedCalendar?.permission === "admin",
        // Override color with the shared calendar color if specified
        color: sharedCalendar?.calendar_color || event.color,
      }
    })

    return { events: mappedEvents }
  } catch (error) {
    console.error("Error in getSharedEvents:", error)
    return { events: [], error: "An unexpected error occurred" }
  }
}

// Get public calendar events by token
export async function getPublicCalendarEvents(token: string): Promise<{ events: any[]; user?: User; error?: string }> {
  try {
    const supabase = getServerClient()

    // Find the user with this public token
    const { data: settings, error: settingsError } = await supabase
      .from("calendar_settings")
      .select("user_id, public_link_enabled")
      .eq("public_link_token", token)
      .eq("public_link_enabled", true)
      .single()

    if (settingsError || !settings) {
      return { events: [], error: "Invalid or disabled public calendar link" }
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", settings.user_id)
      .single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return { events: [], error: "Failed to fetch calendar owner" }
    }

    // Get events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", settings.user_id)

    if (eventsError) {
      console.error("Error fetching public events:", eventsError)
      return { events: [], error: "Failed to fetch calendar events" }
    }

    return {
      events,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch (error) {
    console.error("Error in getPublicCalendarEvents:", error)
    return { events: [], error: "An unexpected error occurred" }
  }
}

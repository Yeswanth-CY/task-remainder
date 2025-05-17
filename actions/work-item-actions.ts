"use server"

import { getServerClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export interface WorkItem {
  id: string
  user_id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  related_event_id?: string
  created_at: string
  updated_at: string
}

// Create a new work item
export async function createWorkItem(
  formData: FormData,
): Promise<{ success: boolean; message: string; workItemId?: string }> {
  try {
    const supabase = getServerClient()

    const userId = formData.get("user_id") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const dueDate = formData.get("due_date") as string
    const priority = formData.get("priority") as "low" | "medium" | "high"
    const status = formData.get("status") as "pending" | "in_progress" | "completed"
    const relatedEventId = formData.get("related_event_id") as string

    // Validate required fields
    if (!userId || !title || !dueDate) {
      return { success: false, message: "Missing required fields" }
    }

    // Create work item
    const { data: workItem, error } = await supabase
      .from("work_items")
      .insert([
        {
          user_id: userId,
          title,
          description,
          due_date: dueDate,
          priority: priority || "medium",
          status: status || "pending",
          related_event_id: relatedEventId || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating work item:", error)
      return { success: false, message: "Failed to create work item" }
    }

    revalidatePath("/")
    return { success: true, message: "Work item created successfully", workItemId: workItem.id }
  } catch (error) {
    console.error("Error in createWorkItem:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Update a work item
export async function updateWorkItem(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    const workItemId = formData.get("work_item_id") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const dueDate = formData.get("due_date") as string
    const priority = formData.get("priority") as "low" | "medium" | "high"
    const status = formData.get("status") as "pending" | "in_progress" | "completed"
    const relatedEventId = formData.get("related_event_id") as string

    // Validate required fields
    if (!workItemId || !title || !dueDate) {
      return { success: false, message: "Missing required fields" }
    }

    // Update work item
    const { error } = await supabase
      .from("work_items")
      .update({
        title,
        description,
        due_date: dueDate,
        priority,
        status,
        related_event_id: relatedEventId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workItemId)

    if (error) {
      console.error("Error updating work item:", error)
      return { success: false, message: "Failed to update work item" }
    }

    revalidatePath("/")
    return { success: true, message: "Work item updated successfully" }
  } catch (error) {
    console.error("Error in updateWorkItem:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Delete a work item
export async function deleteWorkItem(workItemId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getServerClient()

    const { error } = await supabase.from("work_items").delete().eq("id", workItemId)

    if (error) {
      console.error("Error deleting work item:", error)
      return { success: false, message: "Failed to delete work item" }
    }

    revalidatePath("/")
    return { success: true, message: "Work item deleted successfully" }
  } catch (error) {
    console.error("Error in deleteWorkItem:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Get work items for a user
export async function getWorkItems(userId: string): Promise<{ workItems: WorkItem[]; error?: string }> {
  try {
    const supabase = getServerClient()

    // Check if the table exists first
    const { error: checkError } = await supabase.from("work_items").select("id").limit(1).maybeSingle()

    // If the table doesn't exist, return an empty array
    if (checkError && checkError.message.includes("does not exist")) {
      return { workItems: [], error: "Work items table does not exist yet. Please set up the database." }
    }

    // Remove the join with events table
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true })

    if (error) {
      console.error("Error fetching work items:", error)
      return { workItems: [], error: "Failed to fetch work items" }
    }

    return { workItems: data as WorkItem[] }
  } catch (error) {
    console.error("Error in getWorkItems:", error)
    return { workItems: [], error: "An unexpected error occurred" }
  }
}

// Get upcoming work items for a user
export async function getUpcomingWorkItems(userId: string): Promise<{ workItems: WorkItem[]; error?: string }> {
  try {
    const supabase = getServerClient()
    const now = new Date()

    // Check if the table exists first
    const { error: checkError } = await supabase.from("work_items").select("id").limit(1).maybeSingle()

    // If the table doesn't exist, return an empty array
    if (checkError && checkError.message.includes("does not exist")) {
      return { workItems: [], error: "Work items table does not exist yet. Please set up the database." }
    }

    // Remove the join with events table
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "completed")
      .gte("due_date", now.toISOString())
      .order("due_date", { ascending: true })
      .limit(5)

    if (error) {
      console.error("Error fetching upcoming work items:", error)
      return { workItems: [], error: "Failed to fetch upcoming work items" }
    }

    return { workItems: data as WorkItem[] }
  } catch (error) {
    console.error("Error in getUpcomingWorkItems:", error)
    return { workItems: [], error: "An unexpected error occurred" }
  }
}

// Get a related event for a work item (separate query)
export async function getRelatedEvent(eventId: string): Promise<{ event: any; error?: string }> {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (error) {
      console.error("Error fetching related event:", error)
      return { event: null, error: "Failed to fetch related event" }
    }

    return { event: data }
  } catch (error) {
    console.error("Error in getRelatedEvent:", error)
    return { event: null, error: "An unexpected error occurred" }
  }
}

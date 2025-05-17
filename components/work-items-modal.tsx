"use client"

import { useState, useEffect } from "react"
import { X, Plus, Calendar, Clock, CheckCircle, Circle, AlertCircle, Edit, Trash2 } from "lucide-react"
import { getUpcomingWorkItems, deleteWorkItem, updateWorkItem, getRelatedEvent } from "@/actions/work-item-actions"
import { getEvents } from "@/actions/event-actions"
import type { WorkItem } from "@/actions/work-item-actions"
import type { EventType } from "@/types/event"
import { formatDateForDisplay, formatTimeForDisplay } from "@/utils/date-utils"

interface WorkItemsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail?: string
}

export default function WorkItemsModal({ isOpen, onClose, userId, userEmail }: WorkItemsModalProps) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [relatedEvents, setRelatedEvents] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState<"all" | "work" | "events">("all")

  useEffect(() => {
    if (isOpen && userId) {
      fetchWorkItems()
      if (userEmail) {
        fetchUpcomingEvents()
      }
    }
  }, [isOpen, userId, userEmail])

  const fetchWorkItems = async () => {
    setIsLoading(true)
    try {
      const { workItems, error } = await getUpcomingWorkItems(userId)
      if (error) {
        setError(error)
      } else {
        setWorkItems(workItems)

        // Fetch related events separately if needed
        const eventIds = workItems
          .filter((item) => item.related_event_id)
          .map((item) => item.related_event_id as string)

        if (eventIds.length > 0) {
          fetchRelatedEvents(eventIds)
        }
      }
    } catch (err) {
      console.error("Error fetching work items:", err)
      setError("Failed to load work items")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUpcomingEvents = async () => {
    if (!userEmail) return

    try {
      const events = await getEvents(userEmail)

      // Filter for upcoming events (next 24 hours)
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const upcoming = events.filter((event) => {
        const eventDate = new Date(event.start_time)
        return eventDate >= now && eventDate <= tomorrow
      })

      // Sort by start time
      upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      setUpcomingEvents(upcoming)
    } catch (err) {
      console.error("Error fetching upcoming events:", err)
    }
  }

  const fetchRelatedEvents = async (eventIds: string[]) => {
    const events: Record<string, any> = {}

    for (const eventId of eventIds) {
      try {
        const { event } = await getRelatedEvent(eventId)
        if (event) {
          events[eventId] = event
        }
      } catch (err) {
        console.error(`Error fetching related event ${eventId}:`, err)
      }
    }

    setRelatedEvents(events)
  }

  const handleStatusChange = async (workItem: WorkItem, newStatus: "pending" | "in_progress" | "completed") => {
    const formData = new FormData()
    formData.append("work_item_id", workItem.id)
    formData.append("title", workItem.title)
    formData.append("description", workItem.description || "")
    formData.append("due_date", workItem.due_date)
    formData.append("priority", workItem.priority)
    formData.append("status", newStatus)
    if (workItem.related_event_id) {
      formData.append("related_event_id", workItem.related_event_id)
    }

    try {
      const result = await updateWorkItem(formData)
      if (result.success) {
        fetchWorkItems()
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Error updating work item:", err)
      setError("Failed to update work item")
    }
  }

  const handleDeleteWorkItem = async (workItemId: string) => {
    try {
      const result = await deleteWorkItem(workItemId)
      if (result.success) {
        fetchWorkItems()
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Error deleting work item:", err)
      setError("Failed to delete work item")
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "low":
        return <AlertCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Circle className="h-4 w-4 text-blue-500" />
      case "pending":
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (!isOpen) return null

  // Filter items based on active tab
  const filteredWorkItems = activeTab === "events" ? [] : workItems
  const filteredEvents = activeTab === "work" ? [] : upcomingEvents

  const hasNoItems = filteredWorkItems.length === 0 && filteredEvents.length === 0
  const hasItems = filteredWorkItems.length > 0 || filteredEvents.length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="text-lg sm:text-xl font-semibold">Scheduled Work Items</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              activeTab === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("work")}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              activeTab === "work" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Work Items
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              activeTab === "events" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Events
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-3 sm:p-4 rounded-md text-sm">{error}</div>
          ) : hasNoItems ? (
            <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
              <p>No upcoming items scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Upcoming Events Section */}
              {filteredEvents.length > 0 && (
                <div className="mb-4">
                  {activeTab === "all" && <h4 className="text-md font-semibold text-gray-700 mb-2">Upcoming Events</h4>}
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className={`p-2 sm:p-4 rounded-lg border ${event.color} text-white`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Calendar className="h-4 w-4 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base truncate">{event.title}</h4>
                              {event.description && (
                                <p className="text-xs sm:text-sm mt-1 line-clamp-2 text-white/80">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{formatDateForDisplay(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>
                                    {formatTimeForDisplay(event.start_time)} - {formatTimeForDisplay(event.end_time)}
                                  </span>
                                </div>
                                {event.location && (
                                  <div className="text-xs sm:text-sm mt-1 sm:mt-0 w-full sm:w-auto">
                                    <span>📍 {event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Items Section */}
              {filteredWorkItems.length > 0 && (
                <div>
                  {activeTab === "all" && filteredEvents.length > 0 && (
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Work Items</h4>
                  )}
                  {filteredWorkItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 sm:p-4 rounded-lg border ${
                        item.status === "completed"
                          ? "bg-gray-50 border-gray-200"
                          : new Date(item.due_date) < new Date()
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-gray-200"
                      } mb-3`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <button
                            onClick={() =>
                              handleStatusChange(
                                item,
                                item.status === "pending"
                                  ? "in_progress"
                                  : item.status === "in_progress"
                                    ? "completed"
                                    : "pending",
                              )
                            }
                            className="mt-1"
                          >
                            {getStatusIcon(item.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.title}</h4>
                            {item.description && (
                              <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{formatDueDate(item.due_date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>
                                  {new Date(item.due_date).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getPriorityIcon(item.priority)}
                                <span className="capitalize">{item.priority} priority</span>
                              </div>
                            </div>

                            {/* Display related event if available */}
                            {item.related_event_id && relatedEvents[item.related_event_id] && (
                              <div className="mt-2 text-xs sm:text-sm">
                                <span className="text-blue-600">Related to event: </span>
                                <span className="font-medium truncate">
                                  {relatedEvents[item.related_event_id].title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between p-3 sm:p-4 border-t gap-2 sm:gap-3">
          <button
            onClick={() => {
              // Navigate to work items page or open create form
              // This could be implemented later
            }}
            className="flex items-center justify-center sm:justify-start gap-2 text-blue-600 hover:text-blue-800 order-2 sm:order-1 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Work Item</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 order-1 sm:order-2 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

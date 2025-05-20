"use client"

import { useState, useEffect } from "react"
import { X, Plus, Calendar, Clock, CheckCircle, Circle, AlertCircle, Edit, Trash2 } from "lucide-react"
import { getUpcomingWorkItems, deleteWorkItem, updateWorkItem, getRelatedEvent } from "@/actions/work-item-actions"
import type { WorkItem } from "@/actions/work-item-actions"

interface WorkItemsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function WorkItemsModal({ isOpen, onClose, userId }: WorkItemsModalProps) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null)
  const [relatedEvents, setRelatedEvents] = useState<Record<string, any>>({})

  useEffect(() => {
    if (isOpen && userId) {
      fetchWorkItems()
    }
  }, [isOpen, userId])

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="text-lg sm:text-xl font-semibold">Scheduled Work Items</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-800 p-3 sm:p-4 rounded-md text-sm">{error}</div>
          ) : workItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
              <p>No upcoming work items scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {workItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 sm:p-4 rounded-lg border ${
                    item.status === "completed"
                      ? "bg-gray-50 border-gray-200"
                      : new Date(item.due_date) < new Date()
                        ? "bg-red-50 border-red-200"
                        : "bg-white border-gray-200"
                  }`}
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
                            <span className="font-medium truncate">{relatedEvents[item.related_event_id].title}</span>
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

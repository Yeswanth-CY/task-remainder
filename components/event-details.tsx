"use client"

import { useState } from "react"
import { Clock, MapPin, Calendar, Users, Trash2, Edit, X } from "lucide-react"
import type { EventType } from "@/types/event"
import { deleteEvent } from "@/actions/event-actions"
import { formatDateForDisplay, formatTimeForDisplay } from "@/utils/date-utils"

interface EventDetailsProps {
  event: EventType
  onClose: () => void
  onEdit: (eventId: string) => void
  onDelete: () => void
}

export default function EventDetails({ event, onClose, onEdit, onDelete }: EventDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteEvent(event.id)
      if (result.success) {
        onDelete()
        onClose()
      } else {
        console.error("Failed to delete event:", result.message)
      }
    } catch (error) {
      console.error("Error deleting event:", error)
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className={`${event.color} p-3 sm:p-6 rounded-lg shadow-xl w-full max-w-md mx-auto`}>
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white pr-2">{event.title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3 text-white">
          <p className="flex items-center text-sm sm:text-base">
            <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">
              {event.is_all_day
                ? "All day"
                : `${formatTimeForDisplay(event.start_time)} - ${formatTimeForDisplay(event.end_time)}`}
            </span>
          </p>

          <p className="flex items-center text-sm sm:text-base">
            <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">
              {formatDateForDisplay(event.start_time)}
              {formatDateForDisplay(event.start_time) !== formatDateForDisplay(event.end_time) &&
                ` - ${formatDateForDisplay(event.end_time)}`}
            </span>
          </p>

          {event.location && (
            <p className="flex items-center text-sm sm:text-base">
              <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </p>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <p className="flex items-start">
              <Users className="mr-2 h-5 w-5 mt-1" />
              <span>
                <strong>Attendees:</strong>
                <br />
                {event.attendees.join(", ")}
              </span>
            </p>
          )}

          {event.organizer && (
            <p>
              <strong>Organizer:</strong> {event.organizer}
            </p>
          )}

          {event.description && (
            <div className="mt-4">
              <strong>Description:</strong>
              <p className="mt-1 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3">
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-xs sm:text-sm">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-700 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-white/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1 sm:py-2 rounded transition-colors w-full sm:w-auto text-xs sm:text-sm"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(event.id)}
              className="flex items-center gap-1 bg-white text-gray-800 px-2 sm:px-3 py-1 sm:py-2 rounded hover:bg-gray-100 transition-colors flex-1 sm:flex-auto justify-center sm:justify-start text-xs sm:text-sm"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={onClose}
              className="bg-white/20 text-white px-2 sm:px-3 py-1 sm:py-2 rounded hover:bg-white/30 transition-colors flex-1 sm:flex-auto text-xs sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

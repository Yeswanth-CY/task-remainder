"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createEvent, updateEvent, getEventById } from "@/actions/event-actions"
import { formatDate, formatTime } from "@/utils/date-utils"
import { X } from "lucide-react"

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  eventId?: string
  userEmail: string
  onSuccess?: () => void
}

const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-cyan-500", label: "Cyan" },
]

export default function EventForm({ isOpen, onClose, eventId, userEmail, onSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: formatDate(new Date()),
    start_time: formatTime(new Date()),
    end_date: formatDate(new Date()),
    end_time: formatTime(new Date(Date.now() + 60 * 60 * 1000)), // 1 hour later
    location: "",
    color: "bg-blue-500",
    is_all_day: false,
    attendees: "",
    organizer: "You",
  })

  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        const event = await getEventById(eventId)
        if (event) {
          const startDate = new Date(event.start_time)
          const endDate = new Date(event.end_time)

          setFormData({
            title: event.title,
            description: event.description || "",
            start_date: formatDate(startDate),
            start_time: formatTime(startDate),
            end_date: formatDate(endDate),
            end_time: formatTime(endDate),
            location: event.location || "",
            color: event.color,
            is_all_day: event.is_all_day,
            attendees: event.attendees.join(", "),
            organizer: event.organizer,
          })
        }
      }

      fetchEvent()
    } else {
      // Reset form for new event
      setFormData({
        title: "",
        description: "",
        start_date: formatDate(new Date()),
        start_time: formatTime(new Date()),
        end_date: formatDate(new Date()),
        end_time: formatTime(new Date(Date.now() + 60 * 60 * 1000)),
        location: "",
        color: "bg-blue-500",
        is_all_day: false,
        attendees: "",
        organizer: "You",
      })
    }
  }, [eventId, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)

      // Add user email
      formData.append("user_email", userEmail)

      let result

      if (eventId) {
        formData.append("event_id", eventId)
        result = await updateEvent(formData)
      } else {
        result = await createEvent(formData)
      }

      if (result.success) {
        setMessage({ text: result.message, type: "success" })
        if (onSuccess) {
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1500)
        }
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setMessage({ text: "An unexpected error occurred", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="text-lg sm:text-xl font-semibold">{eventId ? "Edit Event" : "Create New Event"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                disabled={formData.is_all_day}
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                disabled={formData.is_all_day}
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="is_all_day"
                name="is_all_day"
                checked={formData.is_all_day}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-700">
                All day event
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colorOptions.map((color) => (
                <div
                  key={color.value}
                  className={`w-6 h-6 rounded-full ${color.value} cursor-pointer border-2 ${
                    formData.color === color.value ? "border-gray-800" : "border-transparent"
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                  title={color.label}
                />
              ))}
            </div>
            <select
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {colorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
              Attendees (comma separated)
            </label>
            <input
              type="text"
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              placeholder="John Doe, Jane Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-1">
              Organizer
            </label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : eventId ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

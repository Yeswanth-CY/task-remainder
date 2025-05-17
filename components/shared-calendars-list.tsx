"use client"

import { useState, useEffect } from "react"
import { getCalendarsSharedWithMe } from "@/actions/calendar-sharing-actions"
import { Eye, EyeOff } from "lucide-react"
import type { SharedCalendar } from "@/types/event"

interface SharedCalendarsListProps {
  userId: string
  onToggleCalendar: (calendarId: string, enabled: boolean) => void
  enabledCalendars: Record<string, boolean>
}

export default function SharedCalendarsList({ userId, onToggleCalendar, enabledCalendars }: SharedCalendarsListProps) {
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchSharedCalendars()
    }
  }, [userId])

  const fetchSharedCalendars = async () => {
    setIsLoading(true)
    try {
      const { calendars, error } = await getCalendarsSharedWithMe(userId)
      if (error) {
        setError(error)
      } else {
        setSharedCalendars(calendars)
      }
    } catch (err) {
      console.error("Error fetching shared calendars:", err)
      setError("Failed to load shared calendars")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-white/70 text-sm py-2">Loading shared calendars...</div>
  }

  if (error) {
    return <div className="text-red-300 text-sm py-2">{error}</div>
  }

  if (sharedCalendars.length === 0) {
    return <div className="text-white/70 text-sm py-2">No shared calendars</div>
  }

  return (
    <div className="space-y-2">
      {sharedCalendars.map((calendar) => (
        <div key={calendar.id} className="flex items-center gap-3">
          <button
            onClick={() => onToggleCalendar(calendar.id, !enabledCalendars[calendar.id])}
            className="text-white/70 hover:text-white"
            title={enabledCalendars[calendar.id] ? "Hide calendar" : "Show calendar"}
          >
            {enabledCalendars[calendar.id] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <div className={`w-3 h-3 rounded-sm ${calendar.calendar_color}`}></div>
          <span className="text-white text-sm truncate flex-1">{calendar.calendar_name || "Shared Calendar"}</span>
          <span className="text-white/50 text-xs">{calendar.owner_name || calendar.owner_email?.split("@")[0]}</span>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import type { EventType } from "@/types/event"
import { ChevronDown } from "lucide-react"

interface MonthViewProps {
  date: Date
  events: EventType[]
  onEventClick: (event: EventType) => void
  onDayClick?: (date: Date) => void
}

export default function MonthView({ date, events, onEventClick, onDayClick }: MonthViewProps) {
  const [calendarDays, setCalendarDays] = useState<Array<Date | null>>([])
  const [monthEvents, setMonthEvents] = useState<Record<string, EventType[]>>({})

  useEffect(() => {
    // Generate calendar days for the month view
    const days = generateCalendarDays(date)
    setCalendarDays(days)

    // Group events by day
    const eventsByDay: Record<string, EventType[]> = {}

    events.forEach((event) => {
      const eventStartDate = new Date(event.start_time)
      const eventEndDate = new Date(event.end_time)

      // Handle multi-day events
      let currentDate = new Date(eventStartDate)
      while (currentDate.getTime() <= eventEndDate.getTime() && currentDate.getMonth() === date.getMonth()) {
        const dateKey = formatDateKey(currentDate)

        if (!eventsByDay[dateKey]) {
          eventsByDay[dateKey] = []
        }

        eventsByDay[dateKey].push(event)

        // Move to next day
        currentDate = new Date(currentDate)
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    setMonthEvents(eventsByDay)
  }, [events, date])

  // Generate calendar days for the month view
  const generateCalendarDays = (date: Date): Array<Date | null> => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Create array with empty slots for days from previous month
    const days: Array<Date | null> = Array(firstDayOfWeek).fill(null)

    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    // Fill remaining slots to complete the grid (6 rows x 7 columns)
    const remainingSlots = 42 - days.length
    if (remainingSlots > 0 && remainingSlots < 7) {
      days.push(...Array(remainingSlots).fill(null))
    }

    return days
  }

  // Format date as a key for the events object
  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }

  // Check if a date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false

    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date | null): boolean => {
    if (!date) return false
    return date.getMonth() === date.getMonth()
  }

  // Get events for a specific day
  const getEventsForDay = (day: Date | null): EventType[] => {
    if (!day) return []

    const dateKey = formatDateKey(day)
    return monthEvents[dateKey] || []
  }

  // Limit the number of events shown per day
  const MAX_EVENTS_SHOWN = 3

  return (
    <div className="h-full bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-white/20">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
          <div key={i} className="p-2 text-center text-white/70 text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-40px)]">
        {calendarDays.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const hasMoreEvents = dayEvents.length > MAX_EVENTS_SHOWN

          return (
            <div
              key={i}
              className={`border-b border-r border-white/10 p-0.5 sm:p-1 ${
                day ? "cursor-pointer hover:bg-white/5" : "bg-white/5"
              } ${isToday(day) ? "bg-blue-500/20" : ""} ${!isCurrentMonth(day) ? "opacity-50" : ""}`}
              onClick={() => day && onDayClick && onDayClick(day)}
            >
              {day && (
                <>
                  <div
                    className={`text-right p-0.5 sm:p-1 ${
                      isToday(day)
                        ? "bg-blue-500 text-white w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ml-auto text-xs sm:text-sm"
                        : "text-white/80 text-xs sm:text-sm"
                    }`}
                  >
                    {day.getDate()}
                  </div>

                  <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 max-h-[calc(100%-20px)] overflow-hidden">
                    {dayEvents.slice(0, MAX_EVENTS_SHOWN).map((event, j) => (
                      <div
                        key={`${event.id}-${j}`}
                        className={`${event.color} rounded px-1 py-0.5 text-white text-[8px] sm:text-[10px] truncate shadow-sm cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                      >
                        {event.is_all_day ? "All day: " : ""}
                        {event.title}
                      </div>
                    ))}

                    {hasMoreEvents && (
                      <div
                        className="text-[8px] sm:text-[10px] text-white/80 flex items-center justify-center bg-white/10 rounded px-1 py-0.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Could show a popover with all events
                        }}
                      >
                        <ChevronDown className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        <span>{dayEvents.length - MAX_EVENTS_SHOWN} more</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

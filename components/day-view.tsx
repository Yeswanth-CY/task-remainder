"use client"

import { useState, useEffect } from "react"
import type { EventType } from "@/types/event"
import { formatTimeForDisplay } from "@/utils/date-utils"

interface DayViewProps {
  date: Date
  events: EventType[]
  onEventClick: (event: EventType) => void
}

export default function DayView({ date, events, onEventClick }: DayViewProps) {
  const [dayEvents, setDayEvents] = useState<EventType[]>([])
  const timeSlots = Array.from({ length: 24 }, (_, i) => i) // 0-23 hours

  useEffect(() => {
    // Filter events for the selected day
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })

    setDayEvents(filteredEvents)
  }, [events, date])

  // Calculate event position and height
  const calculateEventStyle = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)

    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60

    // Use a smaller height on mobile
    const hourHeight = window.innerWidth < 640 ? 40 : 60 // 40px per hour on mobile, 60px on desktop

    const top = startHour * hourHeight
    const height = (endHour - startHour) * hourHeight

    return { top: `${top}px`, height: `${height}px` }
  }

  // Group all-day events
  const allDayEvents = dayEvents.filter((event) => event.is_all_day)
  const timedEvents = dayEvents.filter((event) => !event.is_all_day)

  return (
    <div className="flex flex-col h-full bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl overflow-hidden">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-white/20 p-2">
          <div className="text-white text-xs font-medium mb-2">All-day events</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={`${event.color} rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg`}
                onClick={() => onEventClick(event)}
              >
                <div className="font-medium">{event.title}</div>
                {event.location && <div className="opacity-80 text-[10px] mt-1">{event.location}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Current time indicator */}
          <CurrentTimeIndicator />

          {/* Time slots */}
          <div className="flex">
            {/* Time labels */}
            <div className="w-12 sm:w-16 flex-shrink-0 border-r border-white/20">
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className="h-[40px] sm:h-[60px] border-b border-white/10 pr-1 sm:pr-2 text-right text-[10px] sm:text-xs text-white/70 flex items-start justify-end pt-1"
                >
                  {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Events container */}
            <div className="flex-1 relative">
              {/* Hour grid lines */}
              {timeSlots.map((hour) => (
                <div key={hour} className="h-[40px] sm:h-[60px] border-b border-white/10"></div>
              ))}

              {/* Half-hour grid lines */}
              {timeSlots.map((hour) => (
                <div
                  key={`half-${hour}`}
                  className="absolute w-full h-[1px] bg-white/5"
                  style={{ top: `${hour * 60 + 30}px` }}
                ></div>
              ))}

              {/* Events */}
              {timedEvents.map((event) => {
                const eventStyle = calculateEventStyle(event.start_time, event.end_time)
                return (
                  <div
                    key={event.id}
                    className={`absolute ${event.color} rounded-md p-1 sm:p-2 text-white text-[10px] sm:text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg left-1 right-1`}
                    style={eventStyle}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="opacity-80 text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 hidden sm:block">
                      {`${formatTimeForDisplay(event.start_time)} - ${formatTimeForDisplay(event.end_time)}`}
                    </div>
                    {event.location && (
                      <div className="opacity-80 text-[8px] sm:text-[10px] hidden sm:block truncate">
                        {event.location}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to show the current time indicator
function CurrentTimeIndicator() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const hours = now.getHours()
  const minutes = now.getMinutes()
  const top = hours * 60 + minutes

  return (
    <div className="absolute w-full h-[2px] bg-red-500 z-10 flex items-center" style={{ top: `${top}px`, left: 0 }}>
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
      <div className="text-xs text-red-500 ml-2 bg-white/20 px-1 rounded">
        {hours > 12 ? hours - 12 : hours === 0 ? 12 : hours}:{minutes.toString().padStart(2, "0")}{" "}
        {hours >= 12 ? "PM" : "AM"}
      </div>
    </div>
  )
}

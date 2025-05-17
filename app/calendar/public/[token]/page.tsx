"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getPublicCalendarEvents } from "@/actions/calendar-sharing-actions"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import type { EventType } from "@/types/event"
import DayView from "@/components/day-view"
import MonthView from "@/components/month-view"
import {
  getWeekDays,
  getWeekDates,
  getCurrentMonth,
  getCurrentDate,
  calculateEventStyle,
  formatTimeForDisplay,
} from "@/utils/date-utils"

export default function PublicCalendarPage() {
  const params = useParams()
  const token = params.token as string

  const [events, setEvents] = useState<EventType[]>([])
  const [calendarOwner, setCalendarOwner] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)

  // Calendar state
  const [currentView, setCurrentView] = useState("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekDays] = useState(getWeekDays())
  const [weekDates, setWeekDates] = useState(getWeekDates(currentDate))
  const [monthName, setMonthName] = useState(getCurrentMonth(currentDate))
  const [formattedDate, setFormattedDate] = useState(getCurrentDate(currentDate))
  const [timeSlots] = useState(Array.from({ length: 9 }, (_, i) => i + 8)) // 8 AM to 4 PM

  useEffect(() => {
    if (token) {
      fetchPublicCalendar()
    }
  }, [token])

  useEffect(() => {
    // Update calendar dates when current date changes
    setWeekDates(getWeekDates(currentDate))
    setMonthName(getCurrentMonth(currentDate))
    setFormattedDate(getCurrentDate(currentDate))
  }, [currentDate])

  const fetchPublicCalendar = async () => {
    setIsLoading(true)
    try {
      const { events, user, error } = await getPublicCalendarEvents(token)
      if (error) {
        setError(error)
      } else {
        setEvents(events)
        if (user) {
          setCalendarOwner(user)
        }
      }
    } catch (err) {
      console.error("Error fetching public calendar:", err)
      setError("Failed to load calendar")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEventClick = (event: EventType) => {
    setSelectedEvent(event)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (currentView === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (currentView === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setCurrentView("day")
  }

  // Get events for a specific day
  const getEventsForDay = (dayIndex: number) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - date.getDay() + dayIndex)

    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    return events.filter((event) => {
      const eventDate = new Date(event.start_time)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month && eventDate.getDate() === day
    })
  }

  // Render the appropriate calendar view
  const renderCalendarView = () => {
    switch (currentView) {
      case "day":
        return <DayView date={currentDate} events={events} onEventClick={handleEventClick} />
      case "month":
        return (
          <MonthView date={currentDate} events={events} onEventClick={handleEventClick} onDayClick={handleDayClick} />
        )
      case "week":
      default:
        return (
          <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl h-full">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-white/20">
              <div className="p-2 text-center text-white/50 text-xs"></div>
              {weekDays.map((day, i) => {
                const date = new Date(currentDate)
                date.setDate(date.getDate() - date.getDay() + i)
                const isCurrentDay =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={i}
                    className="p-2 text-center border-l border-white/20 cursor-pointer hover:bg-white/5"
                    onClick={() => handleDayClick(date)}
                  >
                    <div className="text-xs text-white/70 font-medium">{day}</div>
                    <div
                      className={`text-lg font-medium mt-1 text-white ${
                        isCurrentDay ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""
                      }`}
                    >
                      {weekDates[i]}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-8">
              {/* Time Labels */}
              <div className="text-white/70">
                {timeSlots.map((time, i) => (
                  <div key={i} className="h-20 border-b border-white/10 pr-2 text-right text-xs">
                    {time > 12 ? `${time - 12} PM` : `${time} AM`}
                  </div>
                ))}
              </div>

              {/* Days Columns */}
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="border-l border-white/20 relative"
                  onClick={() => {
                    const date = new Date(currentDate)
                    date.setDate(date.getDate() - date.getDay() + dayIndex)
                    handleDayClick(date)
                  }}
                >
                  {timeSlots.map((_, timeIndex) => (
                    <div key={timeIndex} className="h-20 border-b border-white/10"></div>
                  ))}

                  {/* Events */}
                  {getEventsForDay(dayIndex).map((event, i) => {
                    const eventStyle = calculateEventStyle(event.start_time, event.end_time)
                    return (
                      <div
                        key={i}
                        className={`absolute ${event.color} rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg`}
                        style={{
                          ...eventStyle,
                          left: "4px",
                          right: "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="opacity-80 text-[10px] mt-1">
                          {`${formatTimeForDisplay(event.start_time)} - ${formatTimeForDisplay(event.end_time)}`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Calendar Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-6 w-6 text-white" />
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {calendarOwner?.name || calendarOwner?.email?.split("@")[0]}'s Calendar
            </h1>
            <p className="text-white/70 text-sm">Public View</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            {calendarOwner?.name?.[0] || calendarOwner?.email?.[0] || "U"}
          </div>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-white bg-blue-500 rounded-md" onClick={goToToday}>
            Today
          </button>
          <div className="flex">
            <button className="p-2 text-white hover:bg-white/10 rounded-l-md" onClick={goToPrevious}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="p-2 text-white hover:bg-white/10 rounded-r-md" onClick={goToNext}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-white">{formattedDate}</h2>
        </div>

        <div className="flex items-center gap-2 rounded-md p-1 bg-white/10">
          <button
            onClick={() => setCurrentView("day")}
            className={`px-3 py-1 rounded ${currentView === "day" ? "bg-white/20" : ""} text-white text-sm`}
          >
            Day
          </button>
          <button
            onClick={() => setCurrentView("week")}
            className={`px-3 py-1 rounded ${currentView === "week" ? "bg-white/20" : ""} text-white text-sm`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView("month")}
            className={`px-3 py-1 rounded ${currentView === "month" ? "bg-white/20" : ""} text-white text-sm`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="p-4 h-[calc(100vh-160px)]">{renderCalendarView()}</div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${selectedEvent.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-white/80 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-white">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedEvent.start_time).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {selectedEvent.is_all_day
                  ? "All day"
                  : `${formatTimeForDisplay(selectedEvent.start_time)} - ${formatTimeForDisplay(
                      selectedEvent.end_time,
                    )}`}
              </p>
              {selectedEvent.location && (
                <p>
                  <strong>Location:</strong> {selectedEvent.location}
                </p>
              )}
              {selectedEvent.organizer && (
                <p>
                  <strong>Organizer:</strong> {selectedEvent.organizer}
                </p>
              )}
              {selectedEvent.description && (
                <div className="mt-4">
                  <strong>Description:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-white/20 text-white px-4 py-2 rounded hover:bg-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

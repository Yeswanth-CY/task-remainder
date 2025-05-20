"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, AlertTriangle, ChevronDown, ChevronUp, BellRing } from "lucide-react"
import { formatTimeForDisplay } from "@/utils/date-utils"
import type { EventType } from "@/types/event"
import type { WorkItem } from "@/actions/work-item-actions"
import { getUpcomingReminders } from "@/actions/reminder-actions"

interface UpcomingRemindersProps {
  userId: string
  onEventClick?: (event: EventType) => void
  onWorkItemClick?: (workItem: WorkItem) => void
}

export default function UpcomingReminders({ userId, onEventClick, onWorkItemClick }: UpcomingRemindersProps) {
  const [reminders, setReminders] = useState<{
    todayEvents: EventType[]
    tomorrowEvents: EventType[]
    todayWorkItems: WorkItem[]
    tomorrowWorkItems: WorkItem[]
  }>({
    todayEvents: [],
    tomorrowEvents: [],
    todayWorkItems: [],
    tomorrowWorkItems: [],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow">("today")

  useEffect(() => {
    if (userId) {
      fetchReminders()
    }
  }, [userId])

  const fetchReminders = async () => {
    setIsLoading(true)
    try {
      const data = await getUpcomingReminders(userId)
      if (data.error) {
        setError(data.error)
      } else {
        setReminders(data)
      }
    } catch (err) {
      console.error("Error fetching reminders:", err)
      setError("Failed to load reminders")
    } finally {
      setIsLoading(false)
    }
  }

  const hasTodayItems = reminders.todayEvents.length > 0 || reminders.todayWorkItems.length > 0
  const hasTomorrowItems = reminders.tomorrowEvents.length > 0 || reminders.tomorrowWorkItems.length > 0
  const hasAnyItems = hasTodayItems || hasTomorrowItems

  const totalTodayItems = reminders.todayEvents.length + reminders.todayWorkItems.length
  const totalTomorrowItems = reminders.tomorrowEvents.length + reminders.tomorrowWorkItems.length

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">High</span>
      case "medium":
        return <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">Medium</span>
      case "low":
        return <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Low</span>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 p-4 shadow-lg animate-pulse">
        <div className="h-6 bg-white/30 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-white/20 rounded mb-2"></div>
        <div className="h-20 bg-white/20 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 p-4 shadow-lg">
        <div className="text-red-400 flex items-center gap-2">
          <AlertTriangle size={18} />
          <span>Error loading reminders</span>
        </div>
      </div>
    )
  }

  if (!hasAnyItems && !isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 p-4 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <BellRing size={18} />
            Upcoming Reminders
          </h2>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/70 hover:text-white">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {isExpanded && (
          <div className="text-white/70 text-sm py-8 text-center">
            <p>No upcoming meetings or work items for today or tomorrow.</p>
            <p className="mt-2">Enjoy your free time!</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-white/20">
        <h2 className="text-white font-medium flex items-center gap-2">
          <BellRing size={18} />
          Upcoming Reminders
        </h2>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/70 hover:text-white">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="flex border-b border-white/20 bg-white/10">
            <button
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium ${
                activeTab === "today" ? "text-white bg-white/20" : "text-white/70 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("today")}
            >
              Today ({totalTodayItems})
            </button>
            <button
              className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium ${
                activeTab === "tomorrow" ? "text-white bg-white/20" : "text-white/70 hover:bg-white/10"
              }`}
              onClick={() => setActiveTab("tomorrow")}
            >
              Tomorrow ({totalTomorrowItems})
            </button>
          </div>

          <div className="max-h-[calc(100vh-300px)] md:max-h-96 overflow-y-auto">
            {activeTab === "today" ? (
              <div>
                {reminders.todayEvents.length > 0 && (
                  <div className="p-3 border-b border-white/10 bg-white/5">
                    <h3 className="text-white/80 text-xs uppercase font-medium mb-2">Meetings</h3>
                    <div className="space-y-2">
                      {reminders.todayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`${event.color} p-2 sm:p-3 rounded-lg cursor-pointer hover:translate-y-[-2px] transition-all duration-200`}
                          onClick={() => onEventClick && onEventClick(event)}
                        >
                          <div className="font-medium text-white text-sm sm:text-base truncate">{event.title}</div>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 text-white/80 text-xs sm:text-sm">
                            <Clock size={12} className="sm:w-4 sm:h-4" />
                            <span className="truncate">
                              {formatTimeForDisplay(event.start_time)} - {formatTimeForDisplay(event.end_time)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="text-white/80 text-xs sm:text-sm mt-1 flex items-start">
                              <Calendar size={12} className="mr-1 sm:mr-2 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reminders.todayWorkItems.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-white/80 text-xs uppercase font-medium mb-2">Work Items</h3>
                    <div className="space-y-2">
                      {reminders.todayWorkItems.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-white/20 p-2 sm:p-3 rounded-lg cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                            item.priority === "high"
                              ? "border-l-4 border-red-500"
                              : item.priority === "medium"
                                ? "border-l-4 border-yellow-500"
                                : "border-l-4 border-green-500"
                          }`}
                          onClick={() => onWorkItemClick && onWorkItemClick(item)}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium text-white text-sm sm:text-base truncate">{item.title}</div>
                            {getPriorityBadge(item.priority)}
                          </div>
                          {item.description && (
                            <div className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{item.description}</div>
                          )}
                          <div className="flex items-center gap-1 sm:gap-2 mt-2 text-white/80 text-xs">
                            <Clock size={12} className="sm:w-4 sm:h-4" />
                            <span>
                              Due at{" "}
                              {new Date(item.due_date).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasTodayItems && (
                  <div className="p-6 text-center text-white/70">
                    <p>No reminders for today.</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {reminders.tomorrowEvents.length > 0 && (
                  <div className="p-3 border-b border-white/10 bg-white/5">
                    <h3 className="text-white/80 text-xs uppercase font-medium mb-2">Meetings</h3>
                    <div className="space-y-2">
                      {reminders.tomorrowEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`${event.color} p-2 sm:p-3 rounded-lg cursor-pointer hover:translate-y-[-2px] transition-all duration-200`}
                          onClick={() => onEventClick && onEventClick(event)}
                        >
                          <div className="font-medium text-white text-sm sm:text-base truncate">{event.title}</div>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 text-white/80 text-xs sm:text-sm">
                            <Clock size={12} className="sm:w-4 sm:h-4" />
                            <span className="truncate">
                              {formatTimeForDisplay(event.start_time)} - {formatTimeForDisplay(event.end_time)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="text-white/80 text-xs sm:text-sm mt-1 flex items-start">
                              <Calendar size={12} className="mr-1 sm:mr-2 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reminders.tomorrowWorkItems.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-white/80 text-xs uppercase font-medium mb-2">Work Items</h3>
                    <div className="space-y-2">
                      {reminders.tomorrowWorkItems.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-white/20 p-2 sm:p-3 rounded-lg cursor-pointer hover:translate-y-[-2px] transition-all duration-200 ${
                            item.priority === "high"
                              ? "border-l-4 border-red-500"
                              : item.priority === "medium"
                                ? "border-l-4 border-yellow-500"
                                : "border-l-4 border-green-500"
                          }`}
                          onClick={() => onWorkItemClick && onWorkItemClick(item)}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium text-white text-sm sm:text-base truncate">{item.title}</div>
                            {getPriorityBadge(item.priority)}
                          </div>
                          {item.description && (
                            <div className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2">{item.description}</div>
                          )}
                          <div className="flex items-center gap-1 sm:gap-2 mt-2 text-white/80 text-xs">
                            <Clock size={12} className="sm:w-4 sm:h-4" />
                            <span>
                              Due at{" "}
                              {new Date(item.due_date).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasTomorrowItems && (
                  <div className="p-6 text-center text-white/70">
                    <p>No reminders for tomorrow.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Menu,
  User,
  Share2,
  Eye,
  EyeOff,
  CheckSquare,
  X,
} from "lucide-react"
import { getEvents } from "@/actions/event-actions"
import { getSharedEvents, getCalendarsSharedWithMe } from "@/actions/calendar-sharing-actions"
import { getUpcomingWorkItems } from "@/actions/work-item-actions"
import type { EventType, SharedCalendar } from "@/types/event"
import type { WorkItem } from "@/actions/work-item-actions"
import EventForm from "@/components/event-form"
import EventDetails from "@/components/event-details"
import UserProfile from "@/components/user-profile"
import CalendarSharingModal from "@/components/calendar-sharing-modal"
import SharedCalendarsList from "@/components/shared-calendars-list"
import WorkItemsModal from "@/components/work-items-modal"
import UpcomingReminders from "@/components/upcoming-reminders"
import DayView from "@/components/day-view"
import MonthView from "@/components/month-view"
import MobileNav from "@/components/mobile-nav"
import { useMobile } from "@/hooks/use-mobile"
import {
  formatTimeForDisplay,
  getWeekDays,
  getWeekDates,
  getCurrentMonth,
  getCurrentDate,
  getMiniCalendarDays,
  isToday,
  calculateEventStyle,
} from "@/utils/date-utils"
import SetupDatabase from "@/components/setup-database"

export default function Home() {
  const isMobile = useMobile()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [showWorkItemsModal, setShowWorkItemsModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null)
  const [events, setEvents] = useState<EventType[]>([])
  const [sharedEvents, setSharedEvents] = useState<EventType[]>([])
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([])
  const [enabledSharedCalendars, setEnabledSharedCalendars] = useState<Record<string, boolean>>({})
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [hasUpcomingWorkItems, setHasUpcomingWorkItems] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([])

  // Calendar state
  const [currentView, setCurrentView] = useState(isMobile ? "day" : "week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [weekDays] = useState(getWeekDays())
  const [weekDates, setWeekDates] = useState(getWeekDates(currentDate))
  const [monthName, setMonthName] = useState(getCurrentMonth(currentDate))
  const [formattedDate, setFormattedDate] = useState(getCurrentDate(currentDate))
  const [miniCalendarDays, setMiniCalendarDays] = useState(
    getMiniCalendarDays(currentDate.getFullYear(), currentDate.getMonth()),
  )
  const [timeSlots] = useState(Array.from({ length: 9 }, (_, i) => i + 8)) // 8 AM to 4 PM

  // My calendars
  const [myCalendars, setMyCalendars] = useState([
    { id: "my-calendar", name: "My Calendar", color: "bg-blue-500", enabled: true },
  ])

  // Update view based on screen size
  useEffect(() => {
    if (isMobile && currentView === "week") {
      setCurrentView("day")
    }
  }, [isMobile, currentView])

  useEffect(() => {
    setIsLoaded(true)

    // Check for stored user info
    const storedEmail = localStorage.getItem("userEmail")
    const storedUserId = localStorage.getItem("userId")

    if (storedEmail && storedUserId) {
      setUserEmail(storedEmail)
      setUserId(storedUserId)
    } else {
      // Show user profile form if no email is stored
      setShowUserProfile(true)
    }
  }, [])

  useEffect(() => {
    // Update calendar dates when current date changes
    setWeekDates(getWeekDates(currentDate))
    setMonthName(getCurrentMonth(currentDate))
    setFormattedDate(getCurrentDate(currentDate))
    setMiniCalendarDays(getMiniCalendarDays(currentDate.getFullYear(), currentDate.getMonth()))
  }, [currentDate])

  useEffect(() => {
    // Fetch events when user email changes
    if (userEmail && userId) {
      fetchEvents()
      fetchSharedEvents()
      fetchSharedCalendars()
      checkWorkItems()
    }
  }, [userEmail, userId, currentDate])

  useEffect(() => {
    // Combine personal and shared events, then filter based on search query
    const allEvents = [...events, ...sharedEvents.filter((event) => enabledSharedCalendars[event.user_id])]

    if (searchQuery.trim() === "") {
      setFilteredEvents(allEvents)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredEvents(
        allEvents.filter(
          (event) =>
            event.title.toLowerCase().includes(query) ||
            (event.description && event.description.toLowerCase().includes(query)) ||
            (event.location && event.location.toLowerCase().includes(query)),
        ),
      )
    }
  }, [searchQuery, events, sharedEvents, enabledSharedCalendars])

  const fetchEvents = async () => {
    if (!userEmail) return

    setIsLoadingEvents(true)
    try {
      const fetchedEvents = await getEvents(userEmail)
      setEvents(fetchedEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const fetchSharedEvents = async () => {
    if (!userId) return

    try {
      const { events: fetchedEvents, error } = await getSharedEvents(userId)
      if (error) {
        console.error("Error fetching shared events:", error)
      } else {
        setSharedEvents(fetchedEvents)
      }
    } catch (error) {
      console.error("Error fetching shared events:", error)
    }
  }

  const fetchSharedCalendars = async () => {
    if (!userId) return

    try {
      const { calendars, error } = await getCalendarsSharedWithMe(userId)
      if (error) {
        console.error("Error fetching shared calendars:", error)
      } else {
        setSharedCalendars(calendars)

        // Initialize enabled state for shared calendars
        const enabledCalendars: Record<string, boolean> = {}
        calendars.forEach((calendar) => {
          enabledCalendars[calendar.id] = true
        })
        setEnabledSharedCalendars(enabledCalendars)
      }
    } catch (error) {
      console.error("Error fetching shared calendars:", error)
    }
  }

  const checkWorkItems = async () => {
    if (!userId) return

    try {
      const { workItems, error } = await getUpcomingWorkItems(userId)
      if (!error && workItems.length > 0) {
        setHasUpcomingWorkItems(true)
      } else {
        setHasUpcomingWorkItems(false)
      }
    } catch (error) {
      console.error("Error checking work items:", error)
      // Don't show any error to the user, just set no upcoming items
      setHasUpcomingWorkItems(false)
    }
  }

  const handleLogin = (email: string, id: string) => {
    setUserEmail(email)
    setUserId(id)
    localStorage.setItem("userEmail", email)
    localStorage.setItem("userId", id)
  }

  const handleLogout = () => {
    setUserEmail(null)
    setUserId(null)
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userId")
    setShowUserProfile(true)
  }

  const handleCreateEvent = () => {
    setSelectedEventId(null)
    setShowEventForm(true)
  }

  const handleEditEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setShowEventForm(true)
  }

  const handleEventClick = (event: EventType) => {
    setSelectedEvent(event)
  }

  const handleWorkItemClick = (workItem: WorkItem) => {
    setSelectedWorkItem(workItem)
    setShowWorkItemsModal(true)
  }

  const handleEventSuccess = () => {
    fetchEvents()
  }

  const handleDeleteSuccess = () => {
    fetchEvents()
  }

  const handleToggleSharedCalendar = (calendarId: string, enabled: boolean) => {
    setEnabledSharedCalendars((prev) => ({
      ...prev,
      [calendarId]: enabled,
    }))
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
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

    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.start_time)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month && eventDate.getDate() === day
    })
  }

  // Render the appropriate calendar view
  const renderCalendarView = () => {
    switch (currentView) {
      case "day":
        return <DayView date={currentDate} events={filteredEvents} onEventClick={handleEventClick} />
      case "month":
        return (
          <MonthView
            date={currentDate}
            events={filteredEvents}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        )
      case "week":
      default:
        return (
          <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl h-full">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-white/20">
              <div className="p-1 sm:p-2 text-center text-white/50 text-[10px] sm:text-xs"></div>
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
                    className="p-1 sm:p-2 text-center border-l border-white/20 cursor-pointer hover:bg-white/5"
                    onClick={() => handleDayClick(date)}
                  >
                    <div className="text-[10px] sm:text-xs text-white/70 font-medium">{day}</div>
                    <div
                      className={`text-sm sm:text-lg font-medium mt-0.5 sm:mt-1 text-white ${
                        isCurrentDay
                          ? "bg-blue-500 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center mx-auto"
                          : ""
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
                  <div
                    key={i}
                    className="h-[30px] sm:h-[40px] md:h-[60px] border-b border-white/10 pr-1 sm:pr-2 text-right text-[8px] sm:text-xs"
                  >
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
                    <div key={timeIndex} className="h-[30px] sm:h-[40px] md:h-[60px] border-b border-white/10"></div>
                  ))}

                  {/* Events */}
                  {getEventsForDay(dayIndex).map((event, i) => {
                    const eventStyle = calculateEventStyle(event.start_time, event.end_time)
                    return (
                      <div
                        key={i}
                        className={`absolute ${event.color} rounded-md p-0.5 sm:p-1 md:p-2 text-white text-[8px] sm:text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg`}
                        style={{
                          ...eventStyle,
                          left: "2px",
                          right: "2px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="font-medium truncate">
                          {event.shared && (
                            <span
                              className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-0.5 sm:mr-1"
                              title="Shared event"
                            />
                          )}
                          {event.title}
                        </div>
                        <div className="opacity-80 text-[6px] sm:text-[8px] md:text-[10px] mt-0.5 hidden sm:block">
                          {`${formatTimeForDisplay(event.start_time)} - ${formatTimeForDisplay(event.end_time)}`}
                        </div>
                        {event.shared && event.shared_by_name && (
                          <div className="opacity-80 text-[6px] sm:text-[8px] md:text-[10px] hidden sm:block">
                            Shared by: {event.shared_by_name}
                          </div>
                        )}
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Beautiful mountain landscape"
        fill
        className="object-cover"
        priority
      />

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-8 py-3 sm:py-6 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          {isMobile ? (
            <MobileNav
              onCreateEvent={handleCreateEvent}
              onOpenProfile={() => setShowUserProfile(true)}
              onOpenWorkItems={() => setShowWorkItemsModal(true)}
              onOpenSharing={() => setShowSharingModal(true)}
              hasUpcomingWorkItems={hasUpcomingWorkItems}
              userInitial={userEmail ? userEmail.charAt(0).toUpperCase() : undefined}
            />
          ) : (
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-white cursor-pointer" onClick={toggleSidebar} />
          )}
          <span className="text-lg sm:text-2xl font-semibold text-white drop-shadow-lg">Calendar</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Mobile search button */}
          <button className="sm:hidden h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Search className="h-4 w-4" />
          </button>

          {!isMobile && (
            <>
              <button
                onClick={() => setShowWorkItemsModal(true)}
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${
                  hasUpcomingWorkItems ? "bg-green-500" : "bg-white/10"
                } flex items-center justify-center text-white shadow-md hover:bg-opacity-90 transition-colors relative`}
                title="Work Items"
              >
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                {hasUpcomingWorkItems && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowSharingModal(true)}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center text-white shadow-md hover:bg-white/20 transition-colors"
                title="Share Calendar"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-md" />
            </>
          )}

          <button
            onClick={() => setShowUserProfile(true)}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md"
            title={userEmail || "User Profile"}
          >
            {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-16 sm:pt-20 flex">
        {/* Sidebar - Hidden on mobile unless toggled */}
        <div
          className={`${
            isMobile
              ? isSidebarOpen
                ? "absolute inset-y-0 left-0 z-30 w-64"
                : "hidden"
              : "w-64 opacity-0 " + (isLoaded ? "animate-fade-in" : "")
          } h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 rounded-tr-3xl flex flex-col justify-between transition-all duration-300`}
          style={{ animationDelay: "0.4s" }}
        >
          {/* Close button for mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex flex-col h-full overflow-y-auto">
            <button
              className="mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full"
              onClick={handleCreateEvent}
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>

            {/* Reminders Section */}
            {userId && (
              <div className="mb-6">
                <UpcomingReminders
                  userId={userId}
                  onEventClick={handleEventClick}
                  onWorkItemClick={handleWorkItemClick}
                />
              </div>
            )}

            {/* Mini Calendar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{monthName}</h3>
                <div className="flex gap-1">
                  <button
                    className="p-1 rounded-full hover:bg-white/20"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setCurrentDate(newDate)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button
                    className="p-1 rounded-full hover:bg-white/20"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setCurrentDate(newDate)
                    }}
                  >
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => {
                  const isCurrentDay = day !== null && isToday(currentDate, day)
                  return (
                    <div
                      key={i}
                      className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${
                        isCurrentDay ? "bg-blue-500 text-white" : "text-white hover:bg-white/20"
                      } ${!day ? "invisible" : "cursor-pointer"}`}
                      onClick={() => {
                        if (day !== null) {
                          const newDate = new Date(currentDate)
                          newDate.setDate(day)
                          setCurrentDate(newDate)
                          if (isMobile) {
                            setIsSidebarOpen(false)
                          }
                        }
                      }}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* My Calendars */}
            <div className="mb-4">
              <h3 className="text-white font-medium mb-3">My calendars</h3>
              <div className="space-y-2">
                {myCalendars.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setMyCalendars((prev) => prev.map((c) => (c.id === cal.id ? { ...c, enabled: !c.enabled } : c)))
                      }}
                      className="text-white/70 hover:text-white"
                      title={cal.enabled ? "Hide calendar" : "Show calendar"}
                    >
                      {cal.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                    <span className="text-white text-sm">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Calendars */}
            {sharedCalendars.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-3">Shared with me</h3>
                <SharedCalendarsList
                  userId={userId || ""}
                  onToggleCalendar={handleToggleSharedCalendar}
                  enabledCalendars={enabledSharedCalendars}
                />
              </div>
            )}
          </div>

          {/* Create event button */}
          <div className="flex gap-2 mt-4">
            <button
              className="flex items-center justify-center gap-2 rounded-full bg-blue-500 p-4 text-white w-14 h-14 self-start"
              onClick={handleCreateEvent}
            >
              <Plus className="h-6 w-6" />
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-full bg-white/10 p-4 text-white w-14 h-14 self-start hover:bg-white/20 transition-colors"
              onClick={() => setShowSharingModal(true)}
              title="Share Calendar"
            >
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex flex-wrap items-center justify-between p-2 sm:p-4 border-b border-white/20">
            <div className="flex items-center gap-1 sm:gap-4 mb-2 sm:mb-0 w-full sm:w-auto">
              <button
                className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-white bg-blue-500 rounded-md"
                onClick={goToToday}
              >
                Today
              </button>
              <div className="flex">
                <button className="p-1 sm:p-2 text-white hover:bg-white/10 rounded-l-md" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button className="p-1 sm:p-2 text-white hover:bg-white/10 rounded-r-md" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
              <h2 className="text-sm sm:text-xl font-semibold text-white truncate">{formattedDate}</h2>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 rounded-md p-1 bg-white/10 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={() => setCurrentView("day")}
                className={`px-2 sm:px-3 py-1 rounded ${
                  currentView === "day" ? "bg-white/20" : ""
                } text-white text-xs sm:text-sm`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-2 sm:px-3 py-1 rounded ${
                  currentView === "week" ? "bg-white/20" : ""
                } text-white text-xs sm:text-sm ${isMobile ? "hidden" : "block"}`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`px-2 sm:px-3 py-1 rounded ${
                  currentView === "month" ? "bg-white/20" : ""
                } text-white text-xs sm:text-sm`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Calendar View Content */}
          <div className="flex-1 overflow-auto p-2 sm:p-4">{renderCalendarView()}</div>

          {/* Mobile Create Event Button */}
          {isMobile && (
            <div className="fixed bottom-6 right-6 z-20">
              <button
                onClick={handleCreateEvent}
                className="h-14 w-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={handleEditEvent}
            onDelete={handleDeleteSuccess}
          />
        )}

        {/* Event Form Modal */}
        {showEventForm && userEmail && (
          <EventForm
            isOpen={showEventForm}
            onClose={() => setShowEventForm(false)}
            eventId={selectedEventId || undefined}
            userEmail={userEmail}
            onSuccess={handleEventSuccess}
          />
        )}

        {/* User Profile Modal */}
        <UserProfile
          isOpen={showUserProfile}
          onClose={() => {
            if (userEmail) {
              setShowUserProfile(false)
            }
          }}
          onLogin={handleLogin}
        />

        {/* Calendar Sharing Modal */}
        {showSharingModal && userId && (
          <CalendarSharingModal isOpen={showSharingModal} onClose={() => setShowSharingModal(false)} userId={userId} />
        )}

        {/* Work Items Modal */}
        {showWorkItemsModal && userId && (
          <WorkItemsModal isOpen={showWorkItemsModal} onClose={() => setShowWorkItemsModal(false)} userId={userId} />
        )}

        {/* Admin Setup - Only visible in development */}
        {process.env.NODE_ENV === "development" && <SetupDatabase />}
      </main>
    </div>
  )
}

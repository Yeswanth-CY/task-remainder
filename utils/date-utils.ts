export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatTime(date: Date): string {
  return date.toTimeString().split(" ")[0].substring(0, 5)
}

export function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`)
}

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatTimeForDisplay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function getWeekDays(): string[] {
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
}

export function getWeekDates(currentDate: Date): number[] {
  const day = currentDate.getDay()
  const diff = currentDate.getDate() - day

  return Array(7)
    .fill(0)
    .map((_, i) => {
      const date = new Date(currentDate)
      date.setDate(diff + i)
      return date.getDate()
    })
}

export function getCurrentMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export function getCurrentDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function getMiniCalendarDays(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfMonth(year, month)

  return Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )
}

export function isToday(date: Date, dayOfMonth: number): boolean {
  const today = new Date()
  return (
    today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === dayOfMonth
  )
}

export function calculateEventStyle(startTime: string, endTime: string) {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60

  // Adjust for our calendar view (8 AM to 5 PM)
  const top = (startHour - 8) * 80 // 80px per hour
  const height = (endHour - startHour) * 80

  return { top: `${top}px`, height: `${height}px` }
}

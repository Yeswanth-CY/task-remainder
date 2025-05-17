import { getServerClient } from "@/lib/supabase"

export async function seedEvents(userId: string) {
  const supabase = getServerClient()

  // Get current date
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  // Sample colors
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]

  // Sample events
  const events = [
    {
      user_id: userId,
      title: "Team Meeting",
      description: "Weekly team sync-up",
      start_time: new Date(year, month, day, 9, 0).toISOString(),
      end_time: new Date(year, month, day, 10, 0).toISOString(),
      location: "Conference Room A",
      color: colors[0],
      is_all_day: false,
      attendees: ["John Doe", "Jane Smith", "Bob Johnson"],
      organizer: "Alice Brown",
      reminder_day_before_sent: false,
      reminder_hour_before_sent: false,
      reminder_five_min_before_sent: false,
    },
    {
      user_id: userId,
      title: "Lunch with Sarah",
      description: "Discuss project timeline",
      start_time: new Date(year, month, day, 12, 30).toISOString(),
      end_time: new Date(year, month, day, 13, 30).toISOString(),
      location: "Cafe Nero",
      color: colors[1],
      is_all_day: false,
      attendees: ["Sarah Lee"],
      organizer: "You",
      reminder_day_before_sent: false,
      reminder_hour_before_sent: false,
      reminder_five_min_before_sent: false,
    },
    {
      user_id: userId,
      title: "Project Review",
      description: "Q2 project progress review",
      start_time: new Date(year, month, day + 2, 14, 0).toISOString(),
      end_time: new Date(year, month, day + 2, 15, 30).toISOString(),
      location: "Meeting Room 3",
      color: colors[2],
      is_all_day: false,
      attendees: ["Team Alpha", "Stakeholders"],
      organizer: "Project Manager",
      reminder_day_before_sent: false,
      reminder_hour_before_sent: false,
      reminder_five_min_before_sent: false,
    },
    {
      user_id: userId,
      title: "Client Call",
      description: "Quarterly review with major client",
      start_time: new Date(year, month, day + 1, 10, 0).toISOString(),
      end_time: new Date(year, month, day + 1, 11, 0).toISOString(),
      location: "Zoom Meeting",
      color: colors[3],
      is_all_day: false,
      attendees: ["Client Team", "Sales Team"],
      organizer: "Account Manager",
      reminder_day_before_sent: false,
      reminder_hour_before_sent: false,
      reminder_five_min_before_sent: false,
    },
    {
      user_id: userId,
      title: "Team Brainstorm",
      description: "Ideation session for new product features",
      start_time: new Date(year, month, day + 3, 13, 0).toISOString(),
      end_time: new Date(year, month, day + 3, 14, 30).toISOString(),
      location: "Creative Space",
      color: colors[4],
      is_all_day: false,
      attendees: ["Product Team", "Design Team"],
      organizer: "Product Owner",
      reminder_day_before_sent: false,
      reminder_hour_before_sent: false,
      reminder_five_min_before_sent: false,
    },
  ]

  // Insert events
  const { error } = await supabase.from("events").insert(events)

  if (error) {
    console.error("Error seeding events:", error)
    return { success: false, error }
  }

  return { success: true, count: events.length }
}

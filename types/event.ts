export interface EventType {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  color: string
  is_all_day: boolean
  attendees: string[]
  organizer: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
  // Shared calendar properties
  shared?: boolean
  shared_by_email?: string
  shared_by_name?: string
  editable?: boolean
}

export interface EventFormData {
  title: string
  description: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  location: string
  color: string
  is_all_day: boolean
  attendees: string
  organizer: string
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface CalendarSettings {
  id: string
  user_id: string
  default_calendar_name: string
  default_calendar_color: string
  sharing_enabled: boolean
  public_link_enabled: boolean
  public_link_token: string | null
  created_at: string
  updated_at: string
}

export interface SharedCalendar {
  id: string
  owner_id: string
  shared_with_id: string
  permission: "view" | "edit" | "admin"
  calendar_name: string
  calendar_color: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  owner_email?: string
  owner_name?: string
  shared_with_email?: string
  shared_with_name?: string
}

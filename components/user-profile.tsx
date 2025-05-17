"use client"

import type React from "react"

import { useState } from "react"
import { getOrCreateUser } from "@/actions/event-actions"
import { X, UserIcon, Bell } from "lucide-react"
import NotificationSettings from "./notification-settings"

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, userId: string) => void
}

export default function UserProfile({ isOpen, onClose, onLogin }: UserProfileProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"profile" | "notifications">("profile")
  const [userId, setUserId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    if (!email) {
      setError("Email is required")
      setIsSubmitting(false)
      return
    }

    try {
      const user = await getOrCreateUser(email, name)
      if (user) {
        setUserId(user.id)
        onLogin(email, user.id)
        setActiveTab("notifications")
      } else {
        setError("Failed to create user profile")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="text-lg sm:text-xl font-semibold">Your Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center px-4 py-2 border-b-2 ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center px-4 py-2 border-b-2 ${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!userId}
            >
              <Bell className="h-4 w-4 mr-2" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">We'll use this email to send you event reminders</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                placeholder="Your Name"
              />
            </div>

            {error && <div className="p-2 sm:p-3 bg-red-100 text-red-800 rounded text-xs sm:text-sm">{error}</div>}

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
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 sm:p-4">
            {userId ? (
              <NotificationSettings userId={userId} />
            ) : (
              <div className="text-center py-6 text-gray-500">
                Please save your profile first to enable notifications.
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

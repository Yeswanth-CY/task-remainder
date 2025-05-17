"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Copy, Check, Share2, Globe, Lock, Users, Trash2 } from "lucide-react"
import {
  shareCalendarWithUser,
  getMyCalendarShares,
  removeCalendarSharing,
  updateCalendarSharingPermission,
  generatePublicLinkToken,
  getOrCreateCalendarSettings,
} from "@/actions/calendar-sharing-actions"
import type { SharedCalendar, CalendarSettings } from "@/types/event"

interface CalendarSharingModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function CalendarSharingModal({ isOpen, onClose, userId }: CalendarSharingModalProps) {
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<"view" | "edit" | "admin">("view")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [shares, setShares] = useState<SharedCalendar[]>([])
  const [isLoadingShares, setIsLoadingShares] = useState(false)
  const [settings, setSettings] = useState<CalendarSettings | null>(null)
  const [publicLink, setPublicLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchShares()
      fetchSettings()
    }
  }, [isOpen, userId])

  const fetchShares = async () => {
    setIsLoadingShares(true)
    try {
      const { shares, error } = await getMyCalendarShares(userId)
      if (error) {
        setMessage({ text: error, type: "error" })
      } else {
        setShares(shares)
      }
    } catch (error) {
      console.error("Error fetching shares:", error)
      setMessage({ text: "Failed to load shared calendars", type: "error" })
    } finally {
      setIsLoadingShares(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const { settings, error } = await getOrCreateCalendarSettings(userId)
      if (error) {
        setMessage({ text: error, type: "error" })
      } else if (settings) {
        setSettings(settings)
        if (settings.public_link_enabled && settings.public_link_token) {
          setPublicLink(`${window.location.origin}/calendar/public/${settings.public_link_token}`)
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setMessage({ text: "Failed to load calendar settings", type: "error" })
    }
  }

  const handleShareCalendar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await shareCalendarWithUser(userId, email, permission)
      if (result.success) {
        setMessage({ text: result.message, type: "success" })
        setEmail("")
        fetchShares()
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      console.error("Error sharing calendar:", error)
      setMessage({ text: "An unexpected error occurred", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      const result = await removeCalendarSharing(shareId)
      if (result.success) {
        setMessage({ text: result.message, type: "success" })
        fetchShares()
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      console.error("Error removing share:", error)
      setMessage({ text: "Failed to remove calendar sharing", type: "error" })
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: "view" | "edit" | "admin") => {
    try {
      const result = await updateCalendarSharingPermission(shareId, newPermission)
      if (result.success) {
        setMessage({ text: result.message, type: "success" })
        fetchShares()
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      console.error("Error updating permission:", error)
      setMessage({ text: "Failed to update permission", type: "error" })
    }
  }

  const handleTogglePublicLink = async () => {
    if (!settings) return

    try {
      setIsSubmitting(true)
      const enable = !settings.public_link_enabled
      const result = await generatePublicLinkToken(userId, enable)

      if (result.success) {
        setMessage({ text: result.message, type: "success" })
        fetchSettings()
      } else {
        setMessage({ text: result.message, type: "error" })
      }
    } catch (error) {
      console.error("Error toggling public link:", error)
      setMessage({ text: "Failed to update public link settings", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center">
            <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Share Your Calendar
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {/* Share with specific people */}
          <div className="mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 flex items-center">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Share with specific people
            </h4>
            <form onSubmit={handleShareCalendar} className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <label htmlFor="permission" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Permission
                  </label>
                  <select
                    id="permission"
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as "view" | "edit" | "admin")}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  >
                    <option value="view">View only</option>
                    <option value="edit">Can edit</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sharing..." : "Share"}
                </button>
              </div>
            </form>
          </div>

          {/* People with access */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3">People with access</h4>
            {isLoadingShares ? (
              <div className="text-center py-4 text-gray-500">Loading shared calendars...</div>
            ) : shares.length === 0 ? (
              <div className="text-center py-4 text-gray-500">You haven't shared your calendar with anyone yet.</div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-md gap-2"
                  >
                    <div>
                      <div className="font-medium">
                        {share.shared_with_name || share.shared_with_email.split("@")[0]}
                      </div>
                      <div className="text-sm text-gray-500">{share.shared_with_email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={share.permission}
                        onChange={(e) => handleUpdatePermission(share.id, e.target.value as "view" | "edit" | "admin")}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="view">View only</option>
                        <option value="edit">Can edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveShare(share.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
                        title="Remove access"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public link */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Get a public link to your calendar
            </h4>
            <div className="p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {settings?.public_link_enabled ? (
                    <Globe className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-500 mr-2" />
                  )}
                  <span className="font-medium">
                    {settings?.public_link_enabled ? "Public link is enabled" : "Public link is disabled"}
                  </span>
                </div>
                <button
                  onClick={handleTogglePublicLink}
                  className={`px-3 py-1 rounded-md text-sm ${
                    settings?.public_link_enabled
                      ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={isSubmitting}
                >
                  {settings?.public_link_enabled ? "Disable" : "Enable"}
                </button>
              </div>
              {settings?.public_link_enabled && settings?.public_link_token && (
                <div className="flex flex-col sm:items-center mt-3">
                  <input
                    type="text"
                    value={publicLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md sm:rounded-r-none rounded-r-md sm:rounded-l-md bg-gray-100 mb-2 sm:mb-0"
                  />
                  <button
                    onClick={copyPublicLink}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md sm:rounded-l-none sm:rounded-r-md border-t border-r border-b sm:border-l-0 border-l border-gray-300 w-full sm:w-auto"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <Copy className="h-5 w-5 mx-auto" />
                    )}
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Anyone with this link can view your calendar without signing in.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              } mb-4`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="flex justify-end p-3 sm:p-4 border-t">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

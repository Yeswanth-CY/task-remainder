"use client"

import { useState } from "react"
import { Menu, X, Calendar, Plus, User, Settings, Share2, CheckSquare } from "lucide-react"

interface MobileNavProps {
  onCreateEvent: () => void
  onOpenProfile: () => void
  onOpenWorkItems: () => void
  onOpenSharing: () => void
  hasUpcomingWorkItems: boolean
  userInitial?: string
}

export default function MobileNav({
  onCreateEvent,
  onOpenProfile,
  onOpenWorkItems,
  onOpenSharing,
  hasUpcomingWorkItems,
  userInitial,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMenu} aria-hidden="true" />}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-gradient-to-br from-blue-900 to-indigo-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-white" />
              <span className="text-xl font-semibold text-white">Calendar</span>
            </div>
            <button onClick={closeMenu} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                onCreateEvent()
                closeMenu()
              }}
              className="flex items-center gap-3 w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>

            <button
              onClick={() => {
                onOpenProfile()
                closeMenu()
              }}
              className="flex items-center gap-3 w-full px-4 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            >
              {userInitial ? (
                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </div>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                onOpenWorkItems()
                closeMenu()
              }}
              className="flex items-center gap-3 w-full px-4 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors relative"
            >
              <CheckSquare className="h-5 w-5" />
              <span>Work Items</span>
              {hasUpcomingWorkItems && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onOpenSharing()
                closeMenu()
              }}
              className="flex items-center gap-3 w-full px-4 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span>Share Calendar</span>
            </button>

            <button
              onClick={closeMenu}
              className="flex items-center gap-3 w-full px-4 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </div>

          <div className="mt-auto pt-4 border-t border-white/20">
            <div className="text-white/50 text-xs">© {new Date().getFullYear()} Calendar App</div>
          </div>
        </div>
      </div>
    </>
  )
}

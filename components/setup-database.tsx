"use client"

import { useState } from "react"

export default function SetupDatabase() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const setupWorkItemsTable = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/setup/work-items")
      const data = await response.json()

      if (data.success) {
        setMessage({ text: "Work items table created successfully!", type: "success" })
      } else {
        setMessage({ text: data.error || "Failed to create work items table", type: "error" })
      }
    } catch (error) {
      console.error("Error setting up work items table:", error)
      setMessage({ text: "An unexpected error occurred", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-8 left-8 z-20">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-medium mb-2">Database Setup</h3>
        <p className="text-sm text-gray-600 mb-4">Initialize database tables required for the application.</p>
        <div className="space-y-2">
          <button
            onClick={setupWorkItemsTable}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Setting up..." : "Setup Work Items Table"}
          </button>
        </div>
        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

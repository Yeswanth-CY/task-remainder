import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { endpoint, userId } = await request.json()

    if (!endpoint || !userId) {
      return NextResponse.json({ success: false, error: "Missing endpoint or userId" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Delete the subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("subscription->endpoint", endpoint)

    if (error) {
      console.error("Error deleting subscription:", error)
      return NextResponse.json({ success: false, error: "Failed to delete subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in unsubscribe endpoint:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}

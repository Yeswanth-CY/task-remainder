import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { subscription, userId } = await request.json()

    if (!subscription || !userId) {
      return NextResponse.json({ success: false, error: "Missing subscription or userId" }, { status: 400 })
    }

    const supabase = getServerClient()

    // Check if table exists, create if not
    const { error: checkError } = await supabase.from("push_subscriptions").select("id").limit(1).maybeSingle()

    if (checkError && checkError.message.includes("does not exist")) {
      // Create the table
      await supabase.rpc("exec", {
        query: `
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subscription JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        `,
      })
    }

    // Check if subscription already exists for this user
    const { data: existingSubscription } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("subscription->endpoint", subscription.endpoint)
      .maybeSingle()

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("push_subscriptions")
        .update({
          subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id)

      if (updateError) {
        console.error("Error updating subscription:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update subscription" }, { status: 500 })
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase.from("push_subscriptions").insert([
        {
          user_id: userId,
          subscription,
        },
      ])

      if (insertError) {
        console.error("Error saving subscription:", insertError)
        return NextResponse.json({ success: false, error: "Failed to save subscription" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in subscribe endpoint:", error)
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 })
  }
}

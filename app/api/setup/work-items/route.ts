import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getServerClient()

    // Create work_items table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS work_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        related_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Add index for better query performance
      CREATE INDEX IF NOT EXISTS idx_work_items_user_id ON work_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_work_items_due_date ON work_items(due_date);
    `

    const { error } = await supabase.rpc("exec", { query: createTableQuery })

    if (error) {
      console.error("Error creating work_items table:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Work items table created successfully" })
  } catch (error) {
    console.error("Error in setup route:", error)
    return NextResponse.json({ success: false, error: "Failed to set up work items table" }, { status: 500 })
  }
}

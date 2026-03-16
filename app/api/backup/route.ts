export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  const { data: skills, error } = await supabaseAdmin
    .from("skills")
    .select("name, content, category")
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ skills })
}

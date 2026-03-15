export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Skill {
  name: string
  description?: string
  content: string
  category?: string
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const skills: Skill[] = body.skills

  if (!Array.isArray(skills) || skills.length === 0) {
    return NextResponse.json({ error: 'skills array required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('skills')
    .upsert(skills, { onConflict: 'name' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: skills.length })
}

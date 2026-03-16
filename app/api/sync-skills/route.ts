export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Skill {
  id?: string
  name: string
  description?: string
  content: string
  category?: string
  path?: string | null
  updated_at?: string
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const skills: Skill[] = body.skills

  if (!Array.isArray(skills) || skills.length === 0) {
    return NextResponse.json({ error: 'skills array required' }, { status: 400 })
  }

  // If a skill has an id, update by id directly (edit flow — no duplicates)
  // If no id but has path, upsert on path
  // Fallback: upsert on name (old behavior)
  const results = await Promise.all(skills.map(async (skill) => {
    if (skill.id) {
      // Direct update by primary key — guaranteed no duplicate
      const { error } = await supabaseAdmin
        .from('skills')
        .update({
          name: skill.name,
          description: skill.description,
          content: skill.content,
          category: skill.category,
          path: skill.path,
          updated_at: skill.updated_at || new Date().toISOString(),
        })
        .eq('id', skill.id)
      return error ? error.message : null
    } else if (skill.path) {
      // Upsert by path
      const { error } = await supabaseAdmin
        .from('skills')
        .upsert({ ...skill, updated_at: skill.updated_at || new Date().toISOString() }, { onConflict: 'path' })
      return error ? error.message : null
    } else {
      // Fallback: upsert by name
      const { error } = await supabaseAdmin
        .from('skills')
        .upsert({ ...skill, updated_at: skill.updated_at || new Date().toISOString() }, { onConflict: 'name' })
      return error ? error.message : null
    }
  }))

  const errors = results.filter(Boolean)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: skills.length })
}

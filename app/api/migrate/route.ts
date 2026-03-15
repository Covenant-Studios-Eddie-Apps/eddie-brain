import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  const { error } = await supabaseAdmin.from('skills').select('id').limit(1)

  if (error && error.code === '42P01') {
    return NextResponse.json({
      needsMigration: true,
      sql: `CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  content text NOT NULL,
  category text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'public read') THEN
    CREATE POLICY "public read" ON skills FOR SELECT USING (true);
  END IF;
END $$;`,
    })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ready: true })
}

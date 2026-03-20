import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, status, role')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    full_name: (profile as { full_name?: string } | null)?.full_name ?? null,
    email: user.email ?? null,
    phone: (profile as { phone?: string } | null)?.phone ?? null,
    status: (profile as { status?: string } | null)?.status ?? null,
  })
}

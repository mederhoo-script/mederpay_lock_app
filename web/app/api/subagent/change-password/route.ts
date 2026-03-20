import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { password, confirm_password } = body as { password?: string; confirm_password?: string }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 422 })
  }

  if (password !== confirm_password) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 422 })
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('Failed to update password:', error)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Password updated successfully' })
}

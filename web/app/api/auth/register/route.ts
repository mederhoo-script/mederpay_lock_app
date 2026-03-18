import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { RegisterAgentSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RegisterAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { full_name, email, phone, password } = parsed.data

  const supabase = createServiceClient()

  // Confirm email is not already registered
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  // Create the Supabase auth user with role metadata
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone, role: 'agent' },
  })

  if (authError || !authData.user) {
    console.error('Auth user creation failed:', authError)
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create user' },
      { status: 500 },
    )
  }

  // Create the profile entry with pending status
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name,
    email,
    phone,
    role: 'agent',
    status: 'pending',
  })

  if (profileError) {
    console.error('Profile creation failed:', profileError)
    // Roll back the auth user so the email can be reused
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  return NextResponse.json({ id: authData.user.id }, { status: 201 })
}

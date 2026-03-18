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

  const { full_name, email, username, phone, password } = parsed.data

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

  // Confirm username is not already taken
  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existingUsername) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  // Create the Supabase auth user with role metadata.
  // This also fires the handle_new_user trigger (migration 002) which creates
  // an initial profiles row. The upsert below then applies the full data.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone, username, role: 'agent' },
  })

  if (authError || !authData.user) {
    console.error('Auth user creation failed:', authError)
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create user' },
      { status: 500 },
    )
  }

  // Upsert the profile so this insert wins whether or not the handle_new_user
  // trigger already created a stub row. username is now persisted here.
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: authData.user.id,
      full_name,
      email,
      username,
      phone,
      role: 'agent',
      status: 'pending',
    },
    { onConflict: 'id' },
  )

  if (profileError) {
    console.error('Profile creation failed:', profileError)
    // Roll back the auth user so the email can be reused
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }

  return NextResponse.json({ id: authData.user.id }, { status: 201 })
}

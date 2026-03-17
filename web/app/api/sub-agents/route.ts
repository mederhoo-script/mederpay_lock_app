import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateSubAgentSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * limit

  const { data: subagents, error, count } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at', { count: 'exact' })
    .eq('role', 'subagent')
    .eq('parent_agent_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch sub-agents:', error)
    return NextResponse.json({ error: 'Failed to fetch sub-agents' }, { status: 500 })
  }

  const subagentIds = (subagents ?? []).map((sa) => (sa as { id: string }).id)
  const phoneSoldCounts: Record<string, number> = {}

  if (subagentIds.length > 0) {
    const { data: sales } = await supabase
      .from('phone_sales')
      .select('sold_by')
      .in('sold_by', subagentIds)

    for (const row of sales ?? []) {
      const r = row as { sold_by: string }
      phoneSoldCounts[r.sold_by] = (phoneSoldCounts[r.sold_by] ?? 0) + 1
    }
  }

  const enriched = (subagents ?? []).map((sa) => {
    const s = sa as {
      id: string
      full_name: string
      email: string
      phone: string | null
      status: string
      created_at: string
    }
    return { ...s, phones_sold: phoneSoldCounts[s.id] ?? 0 }
  })

  return NextResponse.json({ subagents: enriched, count: count ?? 0, page, limit })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: agentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!agentProfile || (agentProfile as { role: string }).role !== 'agent') {
    return NextResponse.json({ error: 'Only agents can create sub-agents' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateSubAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { full_name, email, phone } = parsed.data

  // Check if email already exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
  }

  // Generate a temporary password — agent should share this with the sub-agent
  const tempPassword =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10).toUpperCase() +
    '!1'

  const { data: authData, error: signUpError } =
    await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: 'subagent' },
    })

  if (signUpError || !authData.user) {
    if (signUpError?.message?.toLowerCase().includes('already registered')) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 409 })
    }
    console.error('Failed to create sub-agent auth user:', signUpError)
    return NextResponse.json({ error: 'Failed to create sub-agent account' }, { status: 500 })
  }

  const newUserId = authData.user.id

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: newUserId,
        full_name,
        email,
        phone,
        role: 'subagent',
        status: 'active',
        parent_agent_id: user.id,
      },
      { onConflict: 'id' },
    )

  if (profileError) {
    console.error('Failed to create sub-agent profile:', profileError)
    return NextResponse.json({ error: 'Failed to create sub-agent profile' }, { status: 500 })
  }

  return NextResponse.json(
    { id: newUserId, full_name, email, phone, status: 'active', temp_password: tempPassword },
    { status: 201 },
  )
}

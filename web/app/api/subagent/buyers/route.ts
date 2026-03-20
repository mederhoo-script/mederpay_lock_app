import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { RegisterBuyerSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the sub-agent's profile to verify role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_agent_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'subagent') {
    return NextResponse.json({ error: 'Only sub-agents can access this endpoint' }, { status: 403 })
  }

  if (!profile.parent_agent_id) {
    return NextResponse.json({ error: 'No parent agent assigned' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const offset = (page - 1) * limit
  const forSale = searchParams.get('for_sale') === 'true'

  const db = createServiceClient()

  // Only return buyers created by this subagent (agent_id = user.id)
  let excludedBuyerIds: string[] = []
  if (forSale) {
    const { data: activeSales } = await db
      .from('phone_sales')
      .select('buyer_id, status')
      .not('status', 'in', '("completed","defaulted")')
    excludedBuyerIds = [...new Set((activeSales ?? []).map((s: { buyer_id: string }) => s.buyer_id))]
  }

  let query = db
    .from('buyers')
    .select('id, full_name, phone, email', { count: 'exact' })
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (excludedBuyerIds.length > 0) {
    query = query.not('id', 'in', `(${excludedBuyerIds.map((id) => `"${id}"`).join(',')})`)
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: buyers, error, count } = await query

  if (error) {
    console.error('Failed to fetch buyers for subagent:', error)
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
  }

  return NextResponse.json({ buyers: buyers ?? [], count: count ?? 0, page, limit })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the caller is a subagent
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_agent_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'subagent') {
    return NextResponse.json({ error: 'Only sub-agents can use this endpoint' }, { status: 403 })
  }

  if (!profile.parent_agent_id) {
    return NextResponse.json({ error: 'No parent agent assigned' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RegisterBuyerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { full_name, phone, email, address, bvn, nin } = parsed.data
  const db = createServiceClient()

  // Prevent duplicate phone for this subagent
  const { data: existingPhone } = await db
    .from('buyers')
    .select('id')
    .eq('phone', phone)
    .eq('agent_id', user.id)
    .maybeSingle()

  if (existingPhone) {
    return NextResponse.json(
      { error: 'A buyer with this phone number already exists in your list' },
      { status: 409 },
    )
  }

  // Enforce NIN uniqueness platform-wide
  if (nin) {
    const { data: existingNin } = await db
      .from('buyers')
      .select('id')
      .eq('nin_encrypted', nin)
      .maybeSingle()
    if (existingNin) {
      return NextResponse.json(
        { error: 'A buyer with this NIN already exists on the platform' },
        { status: 409 },
      )
    }
  }

  // Enforce BVN uniqueness platform-wide
  if (bvn) {
    const { data: existingBvn } = await db
      .from('buyers')
      .select('id')
      .eq('bvn_encrypted', bvn)
      .maybeSingle()
    if (existingBvn) {
      return NextResponse.json(
        { error: 'A buyer with this BVN already exists on the platform' },
        { status: 409 },
      )
    }
  }

  const { data: buyer, error: insertError } = await db
    .from('buyers')
    .insert({
      full_name,
      phone,
      email: email || null,
      address,
      bvn_encrypted: bvn || null,
      nin_encrypted: nin || null,
      agent_id: user.id,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to create buyer (subagent):', insertError)
    return NextResponse.json({ error: 'Failed to create buyer' }, { status: 500 })
  }

  return NextResponse.json(buyer, { status: 201 })
}


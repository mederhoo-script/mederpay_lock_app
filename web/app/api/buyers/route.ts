import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RegisterBuyerSchema } from '@/lib/validations'

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
  const search = searchParams.get('search') ?? ''
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit
  const forSale = searchParams.get('for_sale') === 'true'

  // When listing buyers for a new sale, exclude buyers with active (non-completed/non-defaulted) sales
  let excludedBuyerIds: string[] = []
  if (forSale) {
    const { data: activeSales } = await supabase
      .from('phone_sales')
      .select('buyer_id, status')
      .not('status', 'in', '("completed","defaulted")')
    excludedBuyerIds = [...new Set((activeSales ?? []).map((s: { buyer_id: string }) => s.buyer_id))]
  }

  let query = supabase
    .from('buyers')
    .select('id, full_name, phone, email, address, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (excludedBuyerIds.length > 0) {
    query = query.not('id', 'in', `(${excludedBuyerIds.map((id) => `"${id}"`).join(',')})`)
  }

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
    )
  }

  const { data: buyers, error, count } = await query

  if (error) {
    console.error('Failed to fetch buyers:', error)
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
  }

  const buyerIds = (buyers ?? []).map((b) => (b as { id: string }).id)
  const saleCounts: Record<string, { total: number; active: number }> = {}

  if (buyerIds.length > 0) {
    const { data: saleData } = await supabase
      .from('phone_sales')
      .select('buyer_id, status')
      .in('buyer_id', buyerIds)

    for (const row of saleData ?? []) {
      const r = row as { buyer_id: string; status: string }
      if (!saleCounts[r.buyer_id]) saleCounts[r.buyer_id] = { total: 0, active: 0 }
      saleCounts[r.buyer_id].total++
      if (!['completed', 'defaulted'].includes(r.status)) {
        saleCounts[r.buyer_id].active++
      }
    }
  }

  const enriched = (buyers ?? []).map((b) => {
    const buyer = b as {
      id: string
      full_name: string
      phone: string
      email: string | null
      address: string
      created_at: string
    }
    return {
      ...buyer,
      total_purchases: saleCounts[buyer.id]?.total ?? 0,
      active_sales: saleCounts[buyer.id]?.active ?? 0,
    }
  })

  return NextResponse.json({ buyers: enriched, count: count ?? 0, page, limit })
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

  // Prevent duplicate phone per agent
  const { data: existing } = await supabase
    .from('buyers')
    .select('id')
    .eq('phone', phone)
    .eq('agent_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'A buyer with this phone number already exists' },
      { status: 409 },
    )
  }

  const { data: buyer, error: insertError } = await supabase
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
    console.error('Failed to create buyer:', insertError)
    return NextResponse.json({ error: 'Failed to create buyer' }, { status: 500 })
  }

  return NextResponse.json(buyer, { status: 201 })
}

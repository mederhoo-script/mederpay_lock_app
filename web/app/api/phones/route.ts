import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AddPhoneSchema } from '@/lib/validations'

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
  const status = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  let query = supabase
    .from('phones')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: phones, error, count } = await query

  if (error) {
    console.error('Failed to fetch phones:', error)
    return NextResponse.json({ error: 'Failed to fetch phones' }, { status: 500 })
  }

  return NextResponse.json({ phones, total: count ?? 0, page, limit })
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

  const parsed = AddPhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { imei, brand, model, storage, color, cost_price, selling_price, down_payment, payment_weeks } =
    parsed.data

  // Reject duplicate IMEI
  const { data: existing } = await supabase
    .from('phones')
    .select('id')
    .eq('imei', imei)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A phone with this IMEI already exists' }, { status: 409 })
  }

  const { data: phone, error } = await supabase
    .from('phones')
    .insert({
      imei,
      brand,
      model,
      storage: storage ?? null,
      color: color ?? null,
      cost_price,
      selling_price,
      down_payment,
      // weekly_payment is (selling_price - down_payment) / payment_weeks, stored in the same unit
      weekly_payment: Math.ceil((selling_price - down_payment) / payment_weeks),
      payment_weeks,
      agent_id: user.id,
      registered_by: user.id,
      status: 'available',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create phone:', error)
    return NextResponse.json({ error: 'Failed to create phone' }, { status: 500 })
  }

  return NextResponse.json(phone, { status: 201 })
}

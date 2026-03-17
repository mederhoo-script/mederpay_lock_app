import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOwnerMonnifyGateway } from '@/lib/payments/monnify'
import { SellPhoneSchema } from '@/lib/validations'

interface PhoneRow {
  id: string
  imei: string
  brand: string
  model: string
  selling_price: number
  down_payment: number
  weekly_payment: number
  payment_weeks: number
  status: string
  agent_id: string
}

interface BuyerRow {
  id: string
  full_name: string
}

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
    .from('phone_sales')
    .select(
      `*,
       phones (imei, brand, model),
       buyers (full_name, phone),
       payments (amount, status, paid_at)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: sales, error, count } = await query

  if (error) {
    console.error('Failed to fetch sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }

  return NextResponse.json({ sales, total: count ?? 0, page, limit })
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

  const parsed = SellPhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { phone_id, buyer_id } = parsed.data

  // Fetch phone — RLS ensures this agent owns it
  const { data: phoneData, error: phoneError } = await supabase
    .from('phones')
    .select('id, imei, brand, model, selling_price, down_payment, weekly_payment, payment_weeks, status, agent_id')
    .eq('id', phone_id)
    .single()

  if (phoneError || !phoneData) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const phone = phoneData as unknown as PhoneRow

  if (phone.status !== 'available') {
    return NextResponse.json({ error: 'Phone is not available for sale' }, { status: 409 })
  }

  // Fetch buyer — RLS ensures this agent owns the buyer record (bvn/nin are encrypted in DB)
  const { data: buyerData, error: buyerError } = await supabase
    .from('buyers')
    .select('id, full_name')
    .eq('id', buyer_id)
    .single()

  if (buyerError || !buyerData) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  const buyer = buyerData as unknown as BuyerRow

  // Generate a unique reference for the virtual account
  const reference = `SALE_${phone.id}_${Date.now()}`

  const gateway = createOwnerMonnifyGateway()
  let virtualAccount: Awaited<ReturnType<typeof gateway.createVirtualAccount>>

  try {
    virtualAccount = await gateway.createVirtualAccount({
      accountName: buyer.full_name,
      reference,
    })
  } catch (err) {
    console.error('Failed to create virtual account:', err)
    return NextResponse.json({ error: 'Failed to create virtual account' }, { status: 502 })
  }

  // next_due_date = 7 days from today (first weekly payment)
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 7)

  const { data: sale, error: saleError } = await supabase
    .from('phone_sales')
    .insert({
      phone_id: phone.id,
      buyer_id: buyer.id,
      agent_id: user.id,
      sold_by: user.id,
      selling_price: phone.selling_price,
      down_payment: phone.down_payment,
      weekly_payment: phone.weekly_payment,
      total_weeks: phone.payment_weeks,
      outstanding_balance: phone.selling_price - phone.down_payment,
      next_due_date: nextDueDate.toISOString().split('T')[0],
      virtual_account_number: virtualAccount.accountNumber,
      virtual_account_bank: virtualAccount.bankName,
      virtual_account_reference: reference,
      payment_url: null,
      status: 'active',
    })
    .select()
    .single()

  if (saleError) {
    console.error('Failed to create sale:', saleError)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }

  // Mark the phone as sold
  await supabase.from('phones').update({ status: 'sold' }).eq('id', phone.id)

  return NextResponse.json(sale, { status: 201 })
}

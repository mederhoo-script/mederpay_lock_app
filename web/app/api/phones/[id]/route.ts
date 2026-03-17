import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface PhoneRow {
  id: string
  imei: string
  brand: string
  model: string
  storage: string | null
  color: string | null
  status: string
  cost_price: number
  selling_price: number
  down_payment: number
  weekly_payment: number
  payment_weeks: number
  agent_id: string
  created_at: string
}

interface SaleRow {
  id: string
  status: string
  selling_price: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  next_due_date: string | null
  buyer_id: string
  buyers: Array<{
    id: string
    full_name: string
    phone: string
    email: string | null
    address: string
  }> | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: phoneData, error: phoneError } = await supabase
    .from('phones')
    .select('*')
    .eq('id', id)
    .single()

  if (phoneError || !phoneData) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const phone = phoneData as unknown as PhoneRow

  // Fetch the active sale for this phone (if any)
  const { data: saleData } = await supabase
    .from('phone_sales')
    .select(
      'id, status, selling_price, total_paid, outstanding_balance, weeks_paid, next_due_date, buyer_id, buyers(id, full_name, phone, email, address)',
    )
    .eq('phone_id', id)
    .not('status', 'in', '("completed","defaulted")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let sale = null
  if (saleData) {
    const s = saleData as unknown as SaleRow
    const buyer = Array.isArray(s.buyers) ? s.buyers[0] : s.buyers
    sale = {
      id: s.id,
      status: s.status,
      total_amount: s.selling_price,
      total_paid: s.total_paid,
      outstanding_balance: s.outstanding_balance,
      weeks_paid: s.weeks_paid,
      due_date: s.next_due_date,
      buyer: buyer
        ? {
            id: buyer.id,
            full_name: buyer.full_name,
            phone: buyer.phone,
            email: buyer.email,
            address: buyer.address,
          }
        : null,
    }
  }

  return NextResponse.json({ ...phone, sale })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Only available phones can be deleted
  const { data: phone, error: fetchError } = await supabase
    .from('phones')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !phone) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  if ((phone as { status: string }).status !== 'available') {
    return NextResponse.json(
      { error: 'Only available (unsold) phones can be deleted' },
      { status: 409 },
    )
  }

  const { error: deleteError } = await supabase.from('phones').delete().eq('id', id)

  if (deleteError) {
    console.error('Failed to delete phone:', deleteError)
    return NextResponse.json({ error: 'Failed to delete phone' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

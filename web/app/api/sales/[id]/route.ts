import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
  id: string
  status: string
  selling_price: number
  down_payment: number
  weekly_payment: number
  total_weeks: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  next_due_date: string | null
  virtual_account_number: string | null
  virtual_account_bank: string | null
  payment_url: string | null
  created_at: string
  phones: Array<{
    id: string
    imei: string
    brand: string
    model: string
    color: string | null
    storage: string | null
  }> | null
  buyers: Array<{
    id: string
    full_name: string
    phone: string
    email: string | null
    address: string
  }> | null
  payments: Array<{
    id: string
    amount: number
    status: string
    gateway: string
    paid_at: string | null
    created_at: string
  }> | null
}

// ─── Validation ───────────────────────────────────────────────────────────────

const PatchSaleSchema = z.union([
  z.object({
    status: z.enum(['active', 'grace', 'lock', 'completed', 'defaulted']),
  }),
  z.object({
    record_payment: z.literal(true),
    amount: z.number().positive('Amount must be positive'),
  }),
])

// ─── GET ──────────────────────────────────────────────────────────────────────

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

  const { data: saleData, error: saleError } = await supabase
    .from('phone_sales')
    .select(
      `id, status, selling_price, down_payment, weekly_payment, total_weeks,
       total_paid, outstanding_balance, weeks_paid, next_due_date,
       virtual_account_number, virtual_account_bank, payment_url, created_at,
       phones(id, imei, brand, model, color, storage),
       buyers(id, full_name, phone, email, address),
       payments(id, amount, status, gateway, paid_at, created_at)`,
    )
    .eq('id', id)
    .single()

  if (saleError || !saleData) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
  }

  const s = saleData as unknown as SaleRow
  const phone = Array.isArray(s.phones) ? s.phones[0] : s.phones
  const buyer = Array.isArray(s.buyers) ? s.buyers[0] : s.buyers
  const payments = Array.isArray(s.payments) ? s.payments : []

  const response = {
    id: s.id,
    status: s.status,
    total_amount: s.selling_price,
    total_paid: s.total_paid,
    outstanding_balance: s.outstanding_balance,
    weeks_paid: s.weeks_paid,
    payment_weeks: s.total_weeks,
    weekly_payment: s.weekly_payment,
    down_payment: s.down_payment,
    due_date: s.next_due_date,
    virtual_account_number: s.virtual_account_number,
    virtual_account_bank: s.virtual_account_bank,
    payment_url: s.payment_url,
    created_at: s.created_at,
    buyer: buyer ?? null,
    phone: phone ?? null,
    payments: payments.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  }

  return NextResponse.json(response)
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = PatchSaleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Fetch current sale
  const { data: current, error: fetchError } = await supabase
    .from('phone_sales')
    .select('id, status, total_paid, outstanding_balance, weeks_paid, phone_id, weekly_payment')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
  }

  const sale = current as {
    id: string
    status: string
    total_paid: number
    outstanding_balance: number
    weeks_paid: number
    phone_id: string
    weekly_payment: number
  }

  let saleUpdates: Record<string, unknown> = {}
  let newStatus = sale.status

  if ('record_payment' in parsed.data && parsed.data.record_payment) {
    const amount = parsed.data.amount
    const newTotalPaid = sale.total_paid + amount
    const newBalance = Math.max(0, sale.outstanding_balance - amount)
    const newWeeksPaid = sale.weeks_paid + 1
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + 7)

    if (newBalance === 0) {
      newStatus = 'completed'
    }

    saleUpdates = {
      total_paid: newTotalPaid,
      outstanding_balance: newBalance,
      weeks_paid: newWeeksPaid,
      next_due_date: nextDue.toISOString().split('T')[0],
      status: newStatus,
    }
  } else if ('status' in parsed.data) {
    newStatus = parsed.data.status
    saleUpdates = { status: newStatus }
  }

  const { data: updatedSale, error: updateError } = await supabase
    .from('phone_sales')
    .update(saleUpdates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update sale:', updateError)
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }

  // Sync phone status based on sale status
  let phoneStatus: string | null = null
  if (newStatus === 'lock') phoneStatus = 'locked'
  else if (newStatus === 'active' || newStatus === 'grace') phoneStatus = 'sold'
  else if (newStatus === 'completed') phoneStatus = 'returned'

  if (phoneStatus) {
    await supabase.from('phones').update({ status: phoneStatus }).eq('id', sale.phone_id)
  }

  return NextResponse.json(updatedSale)
}

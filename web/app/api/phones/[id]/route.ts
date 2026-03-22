import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── PATCH Validation ─────────────────────────────────────────────────────────

const UpdatePhoneSchema = z.object({
  brand: z.string().min(1, 'Brand is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  storage: z.string().optional(),
  color: z.string().optional(),
  cost_price: z.number().positive('Cost price must be positive').optional(),
  selling_price: z.number().positive('Selling price must be positive').optional(),
  down_payment: z.number().min(0, 'Down payment cannot be negative').optional(),
  payment_weeks: z.number().int().positive('Payment weeks must be a positive integer').optional(),
})

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
    .order('sale_date', { ascending: false })
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

  const parsed = UpdatePhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  // Only available phones can be edited
  const { data: existing, error: fetchError } = await supabase
    .from('phones')
    .select('id, status, selling_price, down_payment, payment_weeks')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const existingPhone = existing as { status: string; selling_price: number; down_payment: number; payment_weeks: number }

  if (existingPhone.status !== 'available') {
    return NextResponse.json(
      { error: 'Only available phones can be edited' },
      { status: 409 },
    )
  }

  // Cross-field validation: the effective down_payment must always be less than selling_price
  const effectiveSellingPrice = parsed.data.selling_price ?? existingPhone.selling_price
  const effectiveDownPayment = parsed.data.down_payment ?? existingPhone.down_payment
  if (effectiveDownPayment >= effectiveSellingPrice) {
    return NextResponse.json(
      { error: 'Down payment must be less than selling price' },
      { status: 422 },
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.brand !== undefined) updates.brand = parsed.data.brand
  if (parsed.data.model !== undefined) updates.model = parsed.data.model
  if (parsed.data.storage !== undefined) updates.storage = parsed.data.storage || null
  if (parsed.data.color !== undefined) updates.color = parsed.data.color || null
  if (parsed.data.cost_price !== undefined) updates.cost_price = parsed.data.cost_price
  if (parsed.data.selling_price !== undefined) updates.selling_price = parsed.data.selling_price
  if (parsed.data.down_payment !== undefined) updates.down_payment = parsed.data.down_payment
  if (parsed.data.payment_weeks !== undefined) updates.payment_weeks = parsed.data.payment_weeks

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('phones')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update phone:', updateError)
    return NextResponse.json({ error: 'Failed to update phone' }, { status: 500 })
  }

  return NextResponse.json(updated)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

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

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuyerRow {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string
  bvn: string | null
  nin: string | null
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
  total_weeks: number
  next_due_date: string | null
  created_at: string
  phones: Array<{ brand: string; model: string; imei: string }> | null
}

// ─── Validation ───────────────────────────────────────────────────────────────

const UpdateBuyerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required').optional(),
})

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

  const { data: buyerData, error: buyerError } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single()

  if (buyerError || !buyerData) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  const buyer = buyerData as unknown as BuyerRow

  const { data: salesData } = await supabase
    .from('phone_sales')
    .select(
      'id, status, selling_price, total_paid, outstanding_balance, weeks_paid, total_weeks, next_due_date, created_at, phones(brand, model, imei)',
    )
    .eq('buyer_id', id)
    .order('created_at', { ascending: false })

  const sales = (salesData ?? []).map((s) => {
    const row = s as unknown as SaleRow
    const phone = Array.isArray(row.phones) ? row.phones[0] : row.phones
    return {
      id: row.id,
      status: row.status,
      selling_price: row.selling_price,
      total_paid: row.total_paid,
      outstanding_balance: row.outstanding_balance,
      weeks_paid: row.weeks_paid,
      total_weeks: row.total_weeks,
      next_due_date: row.next_due_date,
      created_at: row.created_at,
      phone: phone ?? null,
    }
  })

  return NextResponse.json({ ...buyer, sales })
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

  const parsed = UpdateBuyerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const updates: Record<string, string | null> = {}
  if (parsed.data.full_name !== undefined) updates.full_name = parsed.data.full_name
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone
  if (parsed.data.email !== undefined) updates.email = parsed.data.email || null
  if (parsed.data.address !== undefined) updates.address = parsed.data.address

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('buyers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update buyer:', updateError)
    return NextResponse.json({ error: 'Failed to update buyer' }, { status: 500 })
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

  // Check if buyer exists
  const { data: buyer, error: fetchError } = await supabase
    .from('buyers')
    .select('id')
    .eq('id', id)
    .single()

  if (fetchError || !buyer) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  // Block delete if there are active (non-completed/defaulted) sales
  const { data: activeSales } = await supabase
    .from('phone_sales')
    .select('id')
    .eq('buyer_id', id)
    .not('status', 'in', '("completed","defaulted")')
    .limit(1)

  if (activeSales && activeSales.length > 0) {
    return NextResponse.json(
      { error: 'Cannot delete buyer with active sales. Close all sales first.' },
      { status: 409 },
    )
  }

  const { error: deleteError } = await supabase.from('buyers').delete().eq('id', id)

  if (deleteError) {
    console.error('Failed to delete buyer:', deleteError)
    return NextResponse.json({ error: 'Failed to delete buyer' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

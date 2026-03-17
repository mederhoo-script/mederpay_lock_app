import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidDeviceId } from '@/lib/utils'

interface BuyerRow {
  full_name: string
  phone: string | null
}

// profiles.phone is the agent's support phone number
interface AgentProfileRow {
  phone: string | null
}

interface SaleRow {
  status: string
  virtual_account_number: string | null
  outstanding_balance: number
  next_due_date: string
  payment_url: string | null
  buyers: BuyerRow | BuyerRow[] | null
  profiles: AgentProfileRow | AgentProfileRow[] | null
}

/**
 * Maps a phone_sales status to the Android PaymentStatus string.
 * Android's PaymentStatus.fromString handles: ACTIVE, LOCKED, GRACE_PERIOD, OVERDUE.
 */
function toAndroidPaymentStatus(status: string): string {
  switch (status) {
    case 'lock':      return 'LOCKED'
    case 'grace':     return 'GRACE_PERIOD'
    case 'active':    return 'ACTIVE'
    case 'completed': return 'ACTIVE'
    case 'defaulted': return 'OVERDUE'
    default:          return 'ACTIVE'
  }
}

/**
 * Computes days overdue from next_due_date.
 * Returns 0 if the date is in the future or missing.
 */
function computeDaysOverdue(nextDueDate: string | null): number {
  if (!nextDueDate) return 0
  const due = new Date(nextDueDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> },
) {
  const secret = request.headers.get('x-device-secret')
  if (!secret || secret !== process.env.ANDROID_DEVICE_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imei } = await params

  if (!isValidDeviceId(imei)) {
    return NextResponse.json({ error: 'Invalid device identifier format' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: phone, error: phoneError } = await supabase
    .from('phones')
    .select('id')
    .eq('imei', imei)
    .single()

  if (phoneError || !phone) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  // phone_sales stores outstanding_balance, next_due_date, and payment_url directly.
  // profiles.phone is the agent's contact number (used as support_phone).
  const { data: sale, error: saleError } = await supabase
    .from('phone_sales')
    .select(
      `status,
       virtual_account_number,
       outstanding_balance,
       next_due_date,
       payment_url,
       buyers (full_name, phone),
       profiles:agent_id (phone)`,
    )
    .eq('phone_id', (phone as { id: string }).id)
    .not('status', 'eq', 'completed')
    .order('sale_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (saleError) {
    console.error('Sale query error:', saleError)
    return NextResponse.json({ error: 'Failed to fetch device details' }, { status: 500 })
  }

  if (!sale) {
    return NextResponse.json({ error: 'No active sale found for this device' }, { status: 404 })
  }

  const typedSale = sale as unknown as SaleRow
  const buyer = Array.isArray(typedSale.buyers) ? typedSale.buyers[0] : typedSale.buyers
  const agent = Array.isArray(typedSale.profiles) ? typedSale.profiles[0] : typedSale.profiles

  const daysOverdue = computeDaysOverdue(typedSale.next_due_date)
  const paymentStatus = toAndroidPaymentStatus(typedSale.status)

  return NextResponse.json({
    // ── Web-native fields ──────────────────────────────────
    user_name:      buyer?.full_name ?? null,
    account_number: typedSale.virtual_account_number,
    balance:        typedSale.outstanding_balance,
    due_date:       typedSale.next_due_date,
    support_phone:  agent?.phone ?? null,
    payment_url:    typedSale.payment_url,
    status:         typedSale.status,
    // ── Android-friendly computed fields ──────────────────
    is_locked:      typedSale.status === 'lock',
    days_overdue:   daysOverdue,
    payment_status: paymentStatus,
    phone_number:   buyer?.phone ?? null,
  })
}

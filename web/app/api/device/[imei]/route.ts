import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface BuyerRow {
  full_name: string
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> },
) {
  const secret = request.headers.get('x-device-secret')
  if (!secret || secret !== process.env.ANDROID_DEVICE_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imei } = await params

  if (!/^\d{15}$/.test(imei)) {
    return NextResponse.json({ error: 'Invalid IMEI format' }, { status: 400 })
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
       buyers (full_name),
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

  return NextResponse.json({
    user_name: buyer?.full_name ?? null,
    account_number: typedSale.virtual_account_number,
    balance: typedSale.outstanding_balance,
    due_date: typedSale.next_due_date,
    support_phone: agent?.phone ?? null,
    payment_url: typedSale.payment_url,
    status: typedSale.status,
  })
}

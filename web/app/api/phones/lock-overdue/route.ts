import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface OverdueSaleRow {
  id: string
  phone_id: string
  agent_id: string
  next_due_date: string | null
  phones: { id: string; imei: string; status: string } | null
}

export async function POST(request: NextRequest) {
  // Accept CRON_SECRET from either Authorization: Bearer ... or x-cron-secret header
  const authHeader = request.headers.get('authorization')
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.headers.get('x-cron-secret')

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Find all active/grace sales where the next due date has passed
  const { data: overdueSales, error } = await supabase
    .from('phone_sales')
    .select('id, phone_id, agent_id, next_due_date, phones(id, imei, status)')
    .in('status', ['active', 'grace'])
    .lt('next_due_date', today)

  if (error) {
    console.error('lock-overdue: failed to fetch overdue sales', error)
    return NextResponse.json({ error: 'Failed to fetch overdue sales' }, { status: 500 })
  }

  const sales = (overdueSales ?? []) as unknown as OverdueSaleRow[]

  let locked = 0
  let skipped = 0

  for (const sale of sales) {
    const phone = sale.phones
    if (!phone) {
      skipped++
      continue
    }

    // Skip phones already locked or in a terminal state
    if (!['sold', 'unlocked'].includes(phone.status)) {
      skipped++
      continue
    }

    // Lock the phone
    const { error: lockError } = await supabase
      .from('phones')
      .update({ status: 'locked' })
      .eq('id', phone.id)

    if (lockError) {
      console.error(`lock-overdue: failed to lock phone ${phone.id}`, lockError)
      skipped++
      continue
    }

    // Update sale status to 'lock'
    await supabase
      .from('phone_sales')
      .update({ status: 'lock' })
      .eq('id', sale.id)

    // Log the automated lock event
    await supabase.from('phone_logs').insert({
      phone_id: phone.id,
      imei: phone.imei,
      event_type: 'LOCK_ENFORCED',
      details: `Auto-locked by system: payment due ${sale.next_due_date ?? 'unknown'} was not received`,
      timestamp: new Date().toISOString(),
    })

    locked++
  }

  return NextResponse.json({
    success: true,
    locked,
    skipped,
    total: sales.length,
    run_at: new Date().toISOString(),
  })
}

// Also allow GET so Vercel Cron (which uses GET) can trigger this endpoint
export async function GET(request: NextRequest) {
  return POST(request)
}

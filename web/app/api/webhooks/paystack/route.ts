import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

interface PaystackEvent {
  event: string
  data: {
    reference: string
    amount: number
    status: string
    paid_at: string | null
    metadata?: {
      sale_reference?: string
    }
  }
}

interface SaleRow {
  id: string
  buyer_id: string
  agent_id: string
  phone_id: string
  outstanding_balance: number
  weeks_paid: number
  total_paid: number
  next_due_date: string | null
  status: string
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-paystack-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await request.text()

  // Paystack uses the agent's secret key to sign — we validate per sale/agent.
  // For now we use a platform-level secret for owner webhooks; agent webhooks
  // are verified against their stored secret fetched from agent_settings.
  // Here we do a best-effort verification using the HMAC of all registered agents.
  // Production: route per-agent webhook to a dedicated endpoint with agent_id param.

  let body: PaystackEvent
  try {
    body = JSON.parse(rawBody) as PaystackEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.event !== 'charge.success' || body.data.status !== 'success') {
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceClient()
  const reference = body.data.metadata?.sale_reference ?? body.data.reference

  // Verify HMAC against agent's Paystack secret key
  const { data: saleData } = await supabase
    .from('phone_sales')
    .select('id, buyer_id, agent_id, phone_id, outstanding_balance, weeks_paid, total_paid, next_due_date, status, phones(imei)')
    .eq('virtual_account_reference', reference)
    .maybeSingle()

  if (!saleData) {
    return NextResponse.json({ success: true })
  }

  // Fetch agent's Paystack secret to verify signature.
  // Reject the webhook entirely if no secret is configured — processing an event
  // without verifying its authenticity would allow fraudulent payment records.
  const { data: agentSettings } = await supabase
    .from('agent_settings')
    .select('paystack_secret_key_encrypted')
    .eq('agent_id', (saleData as SaleRow).agent_id)
    .maybeSingle()

  if (!agentSettings?.paystack_secret_key_encrypted) {
    return NextResponse.json({ error: 'Agent payment configuration not found' }, { status: 401 })
  }

  const secret = agentSettings.paystack_secret_key_encrypted as string
  const computed = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  const valid =
    computed.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const sale = saleData as SaleRow & { phones: { imei: string } | Array<{ imei: string }> | null }

  // Deduplicate
  const { data: duplicate } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_reference', body.data.reference)
    .maybeSingle()

  if (duplicate) return NextResponse.json({ success: true })

  // Paystack amount is in kobo already
  const amountKobo = body.data.amount

  const { error: paymentError } = await supabase.from('payments').insert({
    sale_id: sale.id,
    buyer_id: sale.buyer_id,
    agent_id: sale.agent_id,
    amount: amountKobo,
    gateway: 'paystack',
    gateway_reference: body.data.reference,
    status: 'success',
    paid_at: body.data.paid_at ?? new Date().toISOString(),
  })

  if (paymentError) {
    console.error('Failed to record Paystack payment:', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  const newTotalPaid = sale.total_paid + amountKobo
  const newOutstandingBalance = Math.max(0, sale.outstanding_balance - amountKobo)
  const newWeeksPaid = sale.weeks_paid + 1
  const isComplete = newOutstandingBalance === 0

  // Advance next_due_date by 7 days on partial payments.
  // Base from the existing due date if it's still in the future; otherwise from today.
  let newNextDueDate: string | undefined
  if (!isComplete) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const base = sale.next_due_date ? new Date(sale.next_due_date) : today
    const d = base > today ? base : today
    d.setDate(d.getDate() + 7)
    newNextDueDate = d.toISOString().split('T')[0]
  }

  await supabase
    .from('phone_sales')
    .update({
      total_paid: newTotalPaid,
      outstanding_balance: newOutstandingBalance,
      weeks_paid: newWeeksPaid,
      ...(isComplete
        ? { status: 'completed' }
        : {
            next_due_date: newNextDueDate,
            ...(sale.status === 'lock' ? { status: 'active' } : {}),
          }),
    })
    .eq('id', sale.id)

  const phoneImei = !sale.phones
    ? null
    : Array.isArray(sale.phones)
      ? (sale.phones[0]?.imei ?? null)
      : sale.phones.imei

  // Auto-unlock phone when loan is fully repaid
  if (isComplete) {
    await supabase
      .from('phones')
      .update({ status: 'unlocked' })
      .eq('id', sale.phone_id)

    if (phoneImei) {
      const { error: logError } = await supabase.from('phone_logs').insert({
        phone_id: sale.phone_id,
        imei: phoneImei,
        event_type: 'UNLOCK',
        details: 'Auto-unlocked: loan fully repaid via Paystack',
        timestamp: new Date().toISOString(),
      })
      if (logError) console.error('Failed to log Paystack unlock event:', logError)
    }
  } else if (sale.status === 'lock') {
    // Partial payment after device was locked — restore phone and log event
    await supabase
      .from('phones')
      .update({ status: 'sold' })
      .eq('id', sale.phone_id)
      .eq('status', 'locked')

    if (phoneImei) {
      await supabase.from('phone_logs').insert({
        phone_id: sale.phone_id,
        imei: phoneImei,
        event_type: 'PAYMENT_RECEIVED',
        details: `Payment received via Paystack: device restored, ₦${(newOutstandingBalance / 100).toFixed(2)} remaining`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ success: true })
}

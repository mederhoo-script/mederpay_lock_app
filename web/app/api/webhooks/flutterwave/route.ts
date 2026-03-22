import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

interface FlutterwaveEvent {
  event: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    amount: number
    currency: string
    status: string
    created_at: string
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

function verifyFlutterwaveSignature(rawBody: string, signature: string, secretHash: string): boolean {
  const computed = crypto.createHmac('sha256', secretHash).update(rawBody).digest('hex')
  if (computed.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('verif-hash')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await request.text()

  let body: FlutterwaveEvent
  try {
    body = JSON.parse(rawBody) as FlutterwaveEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.event !== 'charge.completed' || body.data.status !== 'successful') {
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceClient()
  const reference = body.data.tx_ref

  const { data: saleData } = await supabase
    .from('phone_sales')
    .select('id, buyer_id, agent_id, phone_id, outstanding_balance, weeks_paid, total_paid, next_due_date, status, phones(imei)')
    .eq('virtual_account_reference', reference)
    .maybeSingle()

  if (!saleData) {
    return NextResponse.json({ success: true })
  }

  // Verify HMAC against agent's Flutterwave secret key.
  // Reject the webhook entirely if no secret is configured — processing an event
  // without verifying its authenticity would allow fraudulent payment records.
  const { data: agentSettings } = await supabase
    .from('agent_settings')
    .select('flutterwave_secret_key_encrypted')
    .eq('agent_id', (saleData as SaleRow).agent_id)
    .maybeSingle()

  if (!agentSettings?.flutterwave_secret_key_encrypted) {
    return NextResponse.json({ error: 'Agent payment configuration not found' }, { status: 401 })
  }

  const secret = agentSettings.flutterwave_secret_key_encrypted as string
  const valid = verifyFlutterwaveSignature(rawBody, signature, secret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const sale = saleData as SaleRow & { phones: { imei: string } | Array<{ imei: string }> | null }

  // Deduplicate by Flutterwave reference
  const { data: duplicate } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_reference', body.data.flw_ref)
    .maybeSingle()

  if (duplicate) return NextResponse.json({ success: true })

  // Flutterwave amount is in Naira — convert to kobo
  const amountKobo = Math.round(body.data.amount * 100)

  const { error: paymentError } = await supabase.from('payments').insert({
    sale_id: sale.id,
    buyer_id: sale.buyer_id,
    agent_id: sale.agent_id,
    amount: amountKobo,
    gateway: 'flutterwave',
    gateway_reference: body.data.flw_ref,
    status: 'success',
    paid_at: body.data.created_at,
  })

  if (paymentError) {
    console.error('Failed to record Flutterwave payment:', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  const newTotalPaid = sale.total_paid + amountKobo
  const newOutstandingBalance = Math.max(0, sale.outstanding_balance - amountKobo)
  const newWeeksPaid = sale.weeks_paid + 1
  const isComplete = newOutstandingBalance === 0

  // Advance next_due_date by 7 days on partial payments (same logic as Paystack webhook).
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

  // Auto-unlock phone when loan is fully repaid
  if (isComplete) {
    await supabase
      .from('phones')
      .update({ status: 'unlocked' })
      .eq('id', sale.phone_id)

    const phoneImei = !sale.phones
      ? null
      : Array.isArray(sale.phones)
        ? (sale.phones[0]?.imei ?? null)
        : sale.phones.imei

    if (phoneImei) {
      const { error: logError } = await supabase.from('phone_logs').insert({
        phone_id: sale.phone_id,
        imei: phoneImei,
        event_type: 'UNLOCK',
        details: 'Auto-unlocked: loan fully repaid via Flutterwave',
        timestamp: new Date().toISOString(),
      })
      if (logError) console.error('Failed to log Flutterwave unlock event:', logError)
    }
  } else if (sale.status === 'lock') {
    // Partial payment while device was locked — restore phone to 'sold' and log it
    await supabase
      .from('phones')
      .update({ status: 'sold' })
      .eq('id', sale.phone_id)
      .eq('status', 'locked')

    const phoneImei = !sale.phones
      ? null
      : Array.isArray(sale.phones)
        ? (sale.phones[0]?.imei ?? null)
        : sale.phones.imei

    if (phoneImei) {
      await supabase.from('phone_logs').insert({
        phone_id: sale.phone_id,
        imei: phoneImei,
        event_type: 'PAYMENT_RECEIVED',
        details: `Payment received via Flutterwave: device restored, ₦${(newOutstandingBalance / 100).toFixed(2)} remaining`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ success: true })
}

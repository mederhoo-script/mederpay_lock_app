import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

interface MonnifyEventData {
  transactionReference: string
  paymentReference: string
  paymentStatus: string
  amountPaid: number
  paidOn?: string
  product: {
    reference: string
    type: string
  }
}

interface MonnifyWebhookBody {
  eventType: string
  eventData: MonnifyEventData
}

interface SaleRow {
  id: string
  buyer_id: string
  agent_id: string
  phone_id: string
  outstanding_balance: number
  weekly_payment: number
  weeks_paid: number
  total_paid: number
}

function verifySignature(rawBody: string, signature: string, secretKey: string): boolean {
  const computed = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
  if (computed.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('monnify-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const rawBody = await request.text()
  const secretKey = process.env.MONNIFY_SECRET_KEY ?? ''

  let isValid = false
  try {
    isValid = verifySignature(rawBody, signature, secretKey)
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: MonnifyWebhookBody
  try {
    body = JSON.parse(rawBody) as MonnifyWebhookBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { eventData } = body

  // Only process successful payment events
  if (eventData.paymentStatus !== 'PAID') {
    return NextResponse.json({ success: true })
  }

  const supabase = createServiceClient()
  const saleReference = eventData.product.reference || eventData.paymentReference

  const { data: saleData, error: saleError } = await supabase
    .from('phone_sales')
    .select('id, buyer_id, agent_id, phone_id, outstanding_balance, weekly_payment, weeks_paid, total_paid, phones(imei)')
    .eq('virtual_account_reference', saleReference)
    .maybeSingle()

  if (saleError) {
    console.error('Sale lookup error:', saleError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  if (!saleData) {
    // Unknown reference — acknowledge to stop Monnify retrying
    console.warn('No sale found for reference:', saleReference)
    return NextResponse.json({ success: true })
  }

  const sale = saleData as unknown as SaleRow & { phones: { imei: string } | Array<{ imei: string }> | null }

  // Avoid duplicate payment records for the same gateway reference
  const { data: duplicate } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_reference', eventData.transactionReference)
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json({ success: true })
  }

  // All money values (amountPaid from Monnify is in Naira; DB stores kobo)
  const amountKobo = Math.round(eventData.amountPaid * 100)

  const { error: paymentError } = await supabase.from('payments').insert({
    sale_id: sale.id,
    buyer_id: sale.buyer_id,
    agent_id: sale.agent_id,
    amount: amountKobo,
    gateway: 'monnify',
    gateway_reference: eventData.transactionReference,
    status: 'success',
    paid_at: eventData.paidOn ?? new Date().toISOString(),
  })

  if (paymentError) {
    console.error('Failed to record payment:', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  // Update the sale's running totals and mark completed if fully paid
  const newTotalPaid = sale.total_paid + amountKobo
  const newOutstandingBalance = Math.max(0, sale.outstanding_balance - amountKobo)
  const newWeeksPaid = sale.weeks_paid + 1
  const isComplete = newOutstandingBalance === 0

  await supabase
    .from('phone_sales')
    .update({
      total_paid: newTotalPaid,
      outstanding_balance: newOutstandingBalance,
      weeks_paid: newWeeksPaid,
      ...(isComplete ? { status: 'completed' } : {}),
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
        details: 'Auto-unlocked: loan fully repaid via Monnify',
        timestamp: new Date().toISOString(),
      })
      if (logError) console.error('Failed to log Monnify unlock event:', logError)
    }
  }

  return NextResponse.json({ success: true })
}

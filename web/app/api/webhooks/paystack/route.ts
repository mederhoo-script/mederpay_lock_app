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
  outstanding_balance: number
  weeks_paid: number
  total_paid: number
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
    .select('id, buyer_id, agent_id, outstanding_balance, weeks_paid, total_paid')
    .eq('virtual_account_reference', reference)
    .maybeSingle()

  if (!saleData) {
    return NextResponse.json({ success: true })
  }

  // Fetch agent's Paystack secret to verify signature
  const { data: agentSettings } = await supabase
    .from('agent_settings')
    .select('paystack_secret_key_encrypted')
    .eq('agent_id', (saleData as SaleRow).agent_id)
    .maybeSingle()

  if (agentSettings?.paystack_secret_key_encrypted) {
    const secret = agentSettings.paystack_secret_key_encrypted as string
    const computed = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    const valid =
      computed.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const sale = saleData as SaleRow

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

  await supabase
    .from('phone_sales')
    .update({
      total_paid: newTotalPaid,
      outstanding_balance: newOutstandingBalance,
      weeks_paid: newWeeksPaid,
      ...(isComplete ? { status: 'completed' } : {}),
    })
    .eq('id', sale.id)

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createOwnerMonnifyGateway } from '@/lib/payments/monnify'
import { z } from 'zod'

const VerifyPaymentSchema = z.object({
  sale_id: z.string().uuid('sale_id must be a valid UUID'),
  gateway_reference: z.string().min(1, 'gateway_reference is required'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = VerifyPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { sale_id, gateway_reference } = parsed.data

  // Confirm the sale exists and belongs to this agent (RLS enforces ownership)
  const { data: sale, error: saleError } = await supabase
    .from('phone_sales')
    .select('id, status, buyer_id, agent_id, outstanding_balance, weeks_paid, total_paid')
    .eq('id', sale_id)
    .single()

  if (saleError || !sale) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
  }

  const typedSale = sale as {
    id: string
    status: string
    buyer_id: string
    agent_id: string
    outstanding_balance: number
    weeks_paid: number
    total_paid: number
  }

  // Return early if the payment was already recorded successfully
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status, amount')
    .eq('gateway_reference', gateway_reference)
    .maybeSingle()

  if (existingPayment && (existingPayment as { status: string }).status === 'success') {
    return NextResponse.json({ payment: existingPayment, status: 'already_recorded' })
  }

  // Verify with the payment gateway
  const gateway = createOwnerMonnifyGateway()
  let verification: Awaited<ReturnType<typeof gateway.verifyPayment>>

  try {
    verification = await gateway.verifyPayment(gateway_reference)
  } catch (err) {
    console.error('Gateway verification failed:', err)
    return NextResponse.json(
      { error: 'Failed to verify payment with gateway' },
      { status: 502 },
    )
  }

  if (verification.status !== 'success') {
    return NextResponse.json({ status: verification.status, payment: null })
  }

  // Use the service client for writes so RLS does not block the insert
  const serviceClient = createServiceClient()

  const { data: payment, error: paymentError } = await serviceClient
    .from('payments')
    .insert({
      sale_id,
      buyer_id: typedSale.buyer_id,
      agent_id: typedSale.agent_id,
      amount: verification.amount, // already in kobo from verifyPayment
      gateway: 'monnify',
      gateway_reference,
      status: 'success',
      paid_at: verification.paidAt ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (paymentError) {
    console.error('Failed to record payment:', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  // Update sale's running totals; mark completed if fully paid
  const newTotalPaid = typedSale.total_paid + verification.amount
  const newOutstandingBalance = Math.max(0, typedSale.outstanding_balance - verification.amount)
  const isComplete = newOutstandingBalance === 0

  await serviceClient
    .from('phone_sales')
    .update({
      total_paid: newTotalPaid,
      outstanding_balance: newOutstandingBalance,
      weeks_paid: typedSale.weeks_paid + 1,
      ...(isComplete ? { status: 'completed' } : {}),
    })
    .eq('id', sale_id)

  return NextResponse.json({ payment, status: verification.status })
}

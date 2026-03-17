import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface SaleRow {
  agent_id: string
  selling_price: number
}

interface FeeTierRow {
  min_price: number
  max_price: number | null
  fee_amount: number
}

interface AgentFeeAccumulator {
  phones_sold: number
  total_fee: number
}

function getApplicableFee(sellingPrice: number, tiers: FeeTierRow[]): number {
  const tier = tiers.find(
    (t) => sellingPrice >= t.min_price && (t.max_price === null || sellingPrice <= t.max_price),
  )
  return tier?.fee_amount ?? 0
}

async function handleCalculation(request: NextRequest): Promise<NextResponse> {
  // Accept CRON_SECRET from either Authorization: Bearer ... or x-cron-secret header
  const authHeader = request.headers.get('authorization')
  const token =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : request.headers.get('x-cron-secret')

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Compute ISO dates for the current week (Monday → Sunday)
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday … 6 = Saturday
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const weekStart = monday.toISOString().split('T')[0]!
  const weekEnd = sunday.toISOString().split('T')[0]!

  // Fetch fee tiers ordered from cheapest to most expensive (values in kobo)
  const { data: tierData, error: tierError } = await supabase
    .from('fee_tiers')
    .select('min_price, max_price, fee_amount')
    .order('min_price', { ascending: true })

  if (tierError) {
    console.error('Failed to fetch fee tiers:', tierError)
    return NextResponse.json({ error: 'Failed to fetch fee tiers' }, { status: 500 })
  }

  const feeTiers = (tierData ?? []) as FeeTierRow[]

  // Fetch all active sales that should attract a weekly platform fee
  const { data: salesData, error: salesError } = await supabase
    .from('phone_sales')
    .select('agent_id, selling_price')
    .in('status', ['active', 'grace'])

  if (salesError) {
    console.error('Failed to fetch sales:', salesError)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }

  const sales = (salesData ?? []) as SaleRow[]

  if (sales.length === 0) {
    return NextResponse.json({
      week_start: weekStart,
      week_end: weekEnd,
      fees_calculated: 0,
      total_amount: 0,
      message: 'No active sales found',
    })
  }

  // Aggregate per agent: count phones and sum fees
  const agentMap = new Map<string, AgentFeeAccumulator>()
  for (const sale of sales) {
    const fee = getApplicableFee(sale.selling_price, feeTiers)
    const acc = agentMap.get(sale.agent_id) ?? { phones_sold: 0, total_fee: 0 }
    agentMap.set(sale.agent_id, { phones_sold: acc.phones_sold + 1, total_fee: acc.total_fee + fee })
  }

  // Skip agents that already have a fee record for this week
  const { data: existingData } = await supabase
    .from('weekly_fees')
    .select('agent_id')
    .eq('week_start', weekStart)

  const alreadyBilled = new Set(
    ((existingData ?? []) as { agent_id: string }[]).map((r) => r.agent_id),
  )

  const feesToInsert = Array.from(agentMap.entries())
    .filter(([agentId, acc]) => !alreadyBilled.has(agentId) && acc.total_fee > 0)
    .map(([agentId, acc]) => ({
      agent_id: agentId,
      week_start: weekStart,
      week_end: weekEnd,
      phones_sold: acc.phones_sold,
      total_fee: acc.total_fee,
      status: 'pending',
    }))

  if (feesToInsert.length === 0) {
    return NextResponse.json({
      week_start: weekStart,
      week_end: weekEnd,
      fees_calculated: 0,
      total_amount: 0,
      message: 'All fees for this week already calculated',
    })
  }

  const { data: insertedFees, error: insertError } = await supabase
    .from('weekly_fees')
    .insert(feesToInsert)
    .select()

  if (insertError) {
    console.error('Failed to insert weekly fees:', insertError)
    return NextResponse.json({ error: 'Failed to calculate fees' }, { status: 500 })
  }

  const totalAmount = feesToInsert.reduce((sum, f) => sum + f.total_fee, 0)

  return NextResponse.json({
    week_start: weekStart,
    week_end: weekEnd,
    fees_calculated: insertedFees?.length ?? 0,
    total_amount: totalAmount,
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleCalculation(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleCalculation(request)
}

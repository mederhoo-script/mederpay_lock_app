import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MonnifyGateway } from '@/lib/payments/monnify'
import { PaystackGateway } from '@/lib/payments/paystack'
import { FlutterwaveGateway } from '@/lib/payments/flutterwave'
import type { PaymentGateway } from '@/lib/payments/index'
import { SellPhoneSchema } from '@/lib/validations'

interface PhoneRow {
  id: string
  imei: string
  brand: string
  model: string
  selling_price: number
  down_payment: number
  weekly_payment: number
  payment_weeks: number
  status: string
  agent_id: string
}

interface BuyerRow {
  id: string
  full_name: string
  bvn_encrypted: string | null
  nin_encrypted: string | null
}

type AgentSettingsRow = {
  active_gateway: string | null
  monnify_api_key_encrypted: string | null
  monnify_secret_key_encrypted: string | null
  monnify_contract_code: string | null
  paystack_secret_key_encrypted: string | null
  flutterwave_secret_key_encrypted: string | null
}

function buildGatewayFromSettings(settings: AgentSettingsRow): PaymentGateway | null {
  const gateway = settings.active_gateway
  if (gateway === 'monnify' && settings.monnify_api_key_encrypted && settings.monnify_secret_key_encrypted && settings.monnify_contract_code) {
    return new MonnifyGateway({
      apiKey: settings.monnify_api_key_encrypted,
      secretKey: settings.monnify_secret_key_encrypted,
      contractCode: settings.monnify_contract_code,
      baseUrl: process.env.MONNIFY_BASE_URL || 'https://api.monnify.com',
    })
  }
  if (gateway === 'paystack' && settings.paystack_secret_key_encrypted) {
    return new PaystackGateway(settings.paystack_secret_key_encrypted)
  }
  if (gateway === 'flutterwave' && settings.flutterwave_secret_key_encrypted) {
    return new FlutterwaveGateway(settings.flutterwave_secret_key_encrypted)
  }
  // Fall back to platform Monnify if env vars are set
  if (process.env.MONNIFY_API_KEY && process.env.MONNIFY_SECRET_KEY && process.env.MONNIFY_CONTRACT_CODE) {
    return new MonnifyGateway({
      apiKey: process.env.MONNIFY_API_KEY,
      secretKey: process.env.MONNIFY_SECRET_KEY,
      contractCode: process.env.MONNIFY_CONTRACT_CODE,
      baseUrl: process.env.MONNIFY_BASE_URL || 'https://api.monnify.com',
    })
  }
  return null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const offset = (page - 1) * limit

  let query = supabase
    .from('phone_sales')
    .select(
      `id, status, selling_price, total_weeks, total_paid, outstanding_balance,
       weeks_paid, next_due_date, sale_date,
       phones (id, imei, brand, model),
       buyers (id, full_name, phone)`,
      { count: 'exact' },
    )
    .order('sale_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: salesData, error, count } = await query

  if (error) {
    console.error('Failed to fetch sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }

  type RawSale = {
    id: string
    status: string
    selling_price: number
    total_weeks: number
    total_paid: number
    outstanding_balance: number
    weeks_paid: number
    next_due_date: string | null
    sale_date: string
    phones: { id: string; imei: string; brand: string; model: string } | { id: string; imei: string; brand: string; model: string }[] | null
    buyers: { id: string; full_name: string; phone: string } | { id: string; full_name: string; phone: string }[] | null
  }

  const sales = ((salesData ?? []) as unknown as RawSale[]).map((s) => {
    const phone = Array.isArray(s.phones) ? s.phones[0] : s.phones
    const buyer = Array.isArray(s.buyers) ? s.buyers[0] : s.buyers
    return {
      id: s.id,
      status: s.status,
      total_amount: s.selling_price,
      total_paid: s.total_paid,
      outstanding_balance: s.outstanding_balance,
      weeks_paid: s.weeks_paid,
      payment_weeks: s.total_weeks,
      due_date: s.next_due_date ?? '',
      created_at: s.sale_date,
      buyer: buyer ?? null,
      phone: phone ?? null,
    }
  })

  return NextResponse.json({ sales, count: count ?? 0, page, limit })
}

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

  const parsed = SellPhoneSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { phone_id, buyer_id } = parsed.data

  // Fetch phone — RLS ensures this agent owns it
  const { data: phoneData, error: phoneError } = await supabase
    .from('phones')
    .select('id, imei, brand, model, selling_price, down_payment, weekly_payment, payment_weeks, status, agent_id')
    .eq('id', phone_id)
    .single()

  if (phoneError || !phoneData) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const phone = phoneData as unknown as PhoneRow

  if (phone.status !== 'available') {
    return NextResponse.json({ error: 'Phone is not available for sale' }, { status: 409 })
  }

  // Fetch buyer — RLS ensures this agent owns the buyer record (bvn/nin are encrypted in DB)
  const { data: buyerData, error: buyerError } = await supabase
    .from('buyers')
    .select('id, full_name, bvn_encrypted, nin_encrypted')
    .eq('id', buyer_id)
    .single()

  if (buyerError || !buyerData) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  const buyer = buyerData as unknown as BuyerRow

  // next_due_date = 7 days from today (first weekly payment)
  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 7)

  // Create the sale record FIRST — virtual account creation must never block the sale
  const { data: sale, error: saleError } = await supabase
    .from('phone_sales')
    .insert({
      phone_id: phone.id,
      buyer_id: buyer.id,
      agent_id: user.id,
      sold_by: user.id,
      selling_price: phone.selling_price,
      down_payment: phone.down_payment,
      weekly_payment: phone.weekly_payment,
      total_weeks: phone.payment_weeks,
      outstanding_balance: phone.selling_price - phone.down_payment,
      next_due_date: nextDueDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single()

  if (saleError) {
    console.error('Failed to create sale:', saleError)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }

  // Mark the phone as sold
  await supabase.from('phones').update({ status: 'sold' }).eq('id', phone.id)

  // Try to create a virtual account using the agent's configured gateway
  let virtualAccountData: { account_number: string; account_name: string; bank_name: string; reference: string } | null = null

  try {
    // Fetch agent gateway settings
    const resolvedAgentId = phone.agent_id ?? user.id
    const { data: agentSettings } = await supabase
      .from('agent_settings')
      .select('active_gateway, monnify_api_key_encrypted, monnify_secret_key_encrypted, monnify_contract_code, paystack_secret_key_encrypted, flutterwave_secret_key_encrypted')
      .eq('agent_id', resolvedAgentId)
      .maybeSingle()

    // Fetch agent profile for BVN/NIN fallback
    const { data: agentProfile } = await supabase
      .from('profiles')
      .select('bvn, nin')
      .eq('id', resolvedAgentId)
      .maybeSingle()

    const reference = `SALE-${(sale as { id: string }).id}-${Date.now()}`
    const gatewayClient = agentSettings ? buildGatewayFromSettings(agentSettings as AgentSettingsRow) : null

    if (gatewayClient) {
      const agentBvn = (agentProfile as { bvn?: string | null } | null)?.bvn ?? undefined
      const agentNin = (agentProfile as { nin?: string | null } | null)?.nin ?? undefined
      const vaResult = await gatewayClient.createVirtualAccount({
        accountName: buyer.full_name,
        bvn: buyer.bvn_encrypted ?? agentBvn,
        nin: buyer.nin_encrypted ?? agentNin,
        reference,
        amount: phone.selling_price,
      })

      // Persist VA record and update sale
      await supabase.from('virtual_accounts').insert({
        owner_type: 'buyer',
        owner_id: buyer.id,
        sale_id: (sale as { id: string }).id,
        account_number: vaResult.accountNumber,
        account_name: vaResult.accountName,
        bank_name: vaResult.bankName,
        bank_code: vaResult.bankCode ?? '',
        gateway: agentSettings?.active_gateway ?? 'monnify',
        reference,
        is_active: true,
      })

      await supabase.from('phone_sales').update({
        virtual_account_reference: reference,
        virtual_account_number: vaResult.accountNumber,
        virtual_account_bank: vaResult.bankName,
      }).eq('id', (sale as { id: string }).id)

      virtualAccountData = {
        account_number: vaResult.accountNumber,
        account_name: vaResult.accountName,
        bank_name: vaResult.bankName,
        reference,
      }
    }
  } catch (vaErr) {
    // VA creation failure is non-fatal — sale was already created successfully
    console.error('Virtual account creation failed (non-fatal):', vaErr)
  }

  return NextResponse.json({ sale, virtual_account: virtualAccountData }, { status: 201 })
}

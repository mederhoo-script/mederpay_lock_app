import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SellPhoneSchema } from '@/lib/validations'
import { MonnifyGateway } from '@/lib/payments/monnify'
import { PaystackGateway } from '@/lib/payments/paystack'
import { FlutterwaveGateway } from '@/lib/payments/flutterwave'
import type { PaymentGateway } from '@/lib/payments/index'

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

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the caller is a subagent
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_agent_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'subagent') {
    return NextResponse.json({ error: 'Only sub-agents can use this endpoint' }, { status: 403 })
  }

  if (!profile.parent_agent_id) {
    return NextResponse.json({ error: 'No parent agent assigned' }, { status: 400 })
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
  const db = createServiceClient()

  // Fetch phone — must belong to the parent agent and be available
  const { data: phoneData, error: phoneError } = await db
    .from('phones')
    .select('id, imei, brand, model, selling_price, down_payment, weekly_payment, payment_weeks, status, agent_id')
    .eq('id', phone_id)
    .eq('agent_id', profile.parent_agent_id)
    .single()

  if (phoneError || !phoneData) {
    return NextResponse.json({ error: 'Phone not found or does not belong to your agent' }, { status: 404 })
  }

  const phone = phoneData as unknown as PhoneRow

  if (phone.status !== 'available') {
    return NextResponse.json({ error: 'Phone is not available for sale' }, { status: 409 })
  }

  // Fetch buyer — must belong to this subagent (created by subagent)
  const { data: buyerData, error: buyerError } = await db
    .from('buyers')
    .select('id, full_name, bvn_encrypted, nin_encrypted')
    .eq('id', buyer_id)
    .eq('agent_id', user.id)
    .single()

  if (buyerError || !buyerData) {
    return NextResponse.json({ error: 'Buyer not found or not registered by you' }, { status: 404 })
  }

  const buyer = buyerData as unknown as BuyerRow

  const nextDueDate = new Date()
  nextDueDate.setDate(nextDueDate.getDate() + 7)

  // Create sale — agent_id is the parent agent, sold_by is the subagent
  const { data: sale, error: saleError } = await db
    .from('phone_sales')
    .insert({
      phone_id: phone.id,
      buyer_id: buyer.id,
      agent_id: profile.parent_agent_id,
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
  await db.from('phones').update({ status: 'sold' }).eq('id', phone.id)

  let virtualAccountData: { account_number: string; account_name: string; bank_name: string; reference: string } | null = null

  try {
    const { data: agentSettings } = await db
      .from('agent_settings')
      .select('active_gateway, monnify_api_key_encrypted, monnify_secret_key_encrypted, monnify_contract_code, paystack_secret_key_encrypted, flutterwave_secret_key_encrypted')
      .eq('agent_id', profile.parent_agent_id)
      .maybeSingle()

    // Fetch agent profile for BVN/NIN fallback
    const { data: agentProfile } = await db
      .from('profiles')
      .select('bvn, nin')
      .eq('id', profile.parent_agent_id)
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

      await db.from('virtual_accounts').insert({
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

      await db.from('phone_sales').update({
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
    console.error('Virtual account creation failed (non-fatal):', vaErr)
  }

  return NextResponse.json({ sale, virtual_account: virtualAccountData }, { status: 201 })
}

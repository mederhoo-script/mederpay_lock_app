import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MonnifyGateway } from '@/lib/payments/monnify'
import { PaystackGateway } from '@/lib/payments/paystack'
import { FlutterwaveGateway } from '@/lib/payments/flutterwave'
import type { PaymentGateway } from '@/lib/payments/index'

interface CreateVirtualAccountBody {
  sale_id: string
  buyer_id: string
  agent_id?: string
}

type AgentSettingsRow = {
  active_gateway: string | null
  monnify_api_key_encrypted: string | null
  monnify_secret_key_encrypted: string | null
  monnify_contract_code: string | null
  paystack_secret_key_encrypted: string | null
  flutterwave_secret_key_encrypted: string | null
}

function buildGateway(settings: AgentSettingsRow): PaymentGateway | null {
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
  return null
}

/** Fall back to platform-level Monnify credentials from environment variables. */
function buildPlatformGateway(): PaymentGateway | null {
  const apiKey = process.env.MONNIFY_API_KEY
  const secretKey = process.env.MONNIFY_SECRET_KEY
  const contractCode = process.env.MONNIFY_CONTRACT_CODE
  if (apiKey && secretKey && contractCode) {
    return new MonnifyGateway({
      apiKey,
      secretKey,
      contractCode,
      baseUrl: process.env.MONNIFY_BASE_URL || 'https://api.monnify.com',
    })
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CreateVirtualAccountBody
  try {
    body = (await request.json()) as CreateVirtualAccountBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sale_id, buyer_id } = body

  if (!sale_id || !buyer_id) {
    return NextResponse.json({ error: 'sale_id and buyer_id are required' }, { status: 400 })
  }

  // Fetch the sale to get the agent and selling price
  const { data: sale, error: saleError } = await supabase
    .from('phone_sales')
    .select('id, agent_id, selling_price')
    .eq('id', sale_id)
    .maybeSingle()

  if (saleError || !sale) {
    return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
  }

  // Fetch the agent's active gateway settings
  const { data: agentSettings } = await supabase
    .from('agent_settings')
    .select('active_gateway, monnify_api_key_encrypted, monnify_secret_key_encrypted, monnify_contract_code, paystack_secret_key_encrypted, flutterwave_secret_key_encrypted')
    .eq('agent_id', (sale as { agent_id: string }).agent_id)
    .maybeSingle()

  // Build the gateway client: prefer agent-configured keys, fall back to platform env keys
  const typedSettings = agentSettings as AgentSettingsRow | null
  const gatewayClient = (typedSettings ? buildGateway(typedSettings) : null) ?? buildPlatformGateway()
  const activeGateway = typedSettings?.active_gateway ?? (gatewayClient ? 'monnify' : null)

  if (!gatewayClient && !activeGateway) {
    return NextResponse.json({ error: 'No payment gateway configured for this agent or platform' }, { status: 422 })
  }

  // Fetch the buyer to get their name for the virtual account
  const { data: buyer } = await supabase
    .from('buyers')
    .select('full_name, bvn_encrypted, nin_encrypted')
    .eq('id', buyer_id)
    .maybeSingle()

  if (!buyer) {
    return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
  }

  // Fetch agent profile for BVN/NIN fallback
  const { data: agentProfile } = await supabase
    .from('profiles')
    .select('bvn, nin')
    .eq('id', (sale as { agent_id: string }).agent_id)
    .maybeSingle()

  const reference = `SALE-${sale_id}-${Date.now()}`

  // Check if a VA already exists for this sale
  const { data: existingVA } = await supabase
    .from('virtual_accounts')
    .select('id, account_number, bank_name, reference')
    .eq('sale_id', sale_id)
    .maybeSingle()

  if (existingVA) {
    return NextResponse.json({ virtual_account: existingVA })
  }

  let accountNumber = ''
  let accountName = (buyer as { full_name: string }).full_name
  let bankName = ''
  let bankCode = ''

  if (gatewayClient) {
    try {
      const typedBuyer = buyer as { full_name: string; bvn_encrypted: string | null; nin_encrypted: string | null }
      const agentBvn = (agentProfile as { bvn?: string | null } | null)?.bvn ?? undefined
      const agentNin = (agentProfile as { nin?: string | null } | null)?.nin ?? undefined
      const result = await gatewayClient.createVirtualAccount({
        accountName: typedBuyer.full_name,
        bvn: typedBuyer.bvn_encrypted ?? agentBvn,
        nin: typedBuyer.nin_encrypted ?? agentNin,
        reference,
        amount: (sale as { selling_price: number }).selling_price,
      })
      ;({ accountNumber, accountName, bankName, bankCode } = result)
    } catch (err) {
      console.error('Gateway createVirtualAccount error:', err)
      // Continue with empty fields so the record is still created; ops can retry
    }
  }

  const { data: va, error: vaError } = await supabase
    .from('virtual_accounts')
    .insert({
      owner_type: 'buyer',
      owner_id: buyer_id,
      sale_id,
      account_number: accountNumber,
      account_name: accountName,
      bank_name: bankName,
      bank_code: bankCode,
      gateway: activeGateway ?? 'monnify',
      reference,
      is_active: true,
    })
    .select()
    .single()

  if (vaError) {
    console.error('Failed to create virtual account record:', vaError)
    return NextResponse.json({ error: 'Failed to create virtual account' }, { status: 500 })
  }

  // Update phone_sale with the VA reference and account info so webhooks can match it
  await supabase
    .from('phone_sales')
    .update({
      virtual_account_reference: reference,
      virtual_account_number: accountNumber || null,
      virtual_account_bank: bankName || null,
    })
    .eq('id', sale_id)

  return NextResponse.json({ virtual_account: va }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const saleId = searchParams.get('sale_id')

  const query = supabase
    .from('virtual_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  if (saleId) {
    query.eq('sale_id', saleId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch virtual accounts' }, { status: 500 })
  }

  return NextResponse.json({ virtual_accounts: data })
}

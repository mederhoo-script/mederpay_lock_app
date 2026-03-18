import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateVirtualAccountBody {
  sale_id: string
  buyer_id: string
  agent_id?: string
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
  const { data: agentSettings, error: settingsError } = await supabase
    .from('agent_settings')
    .select('active_gateway, monnify_api_key_encrypted, monnify_secret_key_encrypted, monnify_contract_code, paystack_secret_key_encrypted, flutterwave_secret_key_encrypted')
    .eq('agent_id', (sale as { agent_id: string }).agent_id)
    .maybeSingle()

  if (settingsError || !agentSettings) {
    return NextResponse.json({ error: 'Agent payment settings not configured' }, { status: 422 })
  }

  const activeGateway = agentSettings.active_gateway as string | null

  if (!activeGateway) {
    return NextResponse.json({ error: 'Agent has no active payment gateway configured' }, { status: 422 })
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

  const reference = `SALE-${sale_id}-${Date.now()}`

  // Dynamically create the virtual account via the active gateway
  // (Real gateway calls are made from lib/payments/; here we record the result)
  // In production, call the gateway adapter — for now return a structured response
  // so the frontend can store what the gateway returned.

  // Check if a VA already exists for this sale
  const { data: existingVA } = await supabase
    .from('virtual_accounts')
    .select('id, account_number, bank_name, reference')
    .eq('sale_id', sale_id)
    .maybeSingle()

  if (existingVA) {
    return NextResponse.json({ virtual_account: existingVA })
  }

  // Insert a placeholder — in the real flow the gateway adapter populates
  // account_number and bank_name from the API response before inserting.
  const { data: va, error: vaError } = await supabase
    .from('virtual_accounts')
    .insert({
      owner_type: 'buyer',
      owner_id: buyer_id,
      sale_id,
      account_number: '',
      account_name: (buyer as { full_name: string }).full_name,
      bank_name: '',
      bank_code: '',
      gateway: activeGateway,
      reference,
      is_active: true,
    })
    .select()
    .single()

  if (vaError) {
    console.error('Failed to create virtual account record:', vaError)
    return NextResponse.json({ error: 'Failed to create virtual account' }, { status: 500 })
  }

  // Update phone_sale with the VA reference so webhooks can match it
  await supabase
    .from('phone_sales')
    .update({ virtual_account_reference: reference })
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

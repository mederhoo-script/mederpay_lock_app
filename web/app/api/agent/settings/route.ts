import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgentSettingsSchema } from '@/lib/validations'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, status, role')
    .eq('id', user.id)
    .single()

  const { data: settings } = await supabase
    .from('agent_settings')
    .select(
      'active_gateway, monnify_api_key_encrypted, monnify_secret_key_encrypted, monnify_contract_code, paystack_secret_key_encrypted, flutterwave_secret_key_encrypted, interswitch_client_id_encrypted, interswitch_client_secret_encrypted, payment_url',
    )
    .eq('agent_id', user.id)
    .maybeSingle()

  type SettingsRow = {
    active_gateway: string | null
    monnify_api_key_encrypted: string | null
    monnify_secret_key_encrypted: string | null
    monnify_contract_code: string | null
    paystack_secret_key_encrypted: string | null
    flutterwave_secret_key_encrypted: string | null
    interswitch_client_id_encrypted: string | null
    interswitch_client_secret_encrypted: string | null
    payment_url: string | null
  }
  const s = settings as SettingsRow | null

  return NextResponse.json({
    email: user.email ?? '',
    full_name: (profile as { full_name: string } | null)?.full_name ?? '',
    phone: (profile as { phone: string } | null)?.phone ?? '',
    active_gateway: s?.active_gateway ?? 'monnify',
    monnify_api_key: s?.monnify_api_key_encrypted ?? '',
    monnify_secret_key: s?.monnify_secret_key_encrypted ?? '',
    monnify_contract_code: s?.monnify_contract_code ?? '',
    paystack_secret_key: s?.paystack_secret_key_encrypted ?? '',
    flutterwave_secret_key: s?.flutterwave_secret_key_encrypted ?? '',
    interswitch_client_id: s?.interswitch_client_id_encrypted ?? '',
    interswitch_client_secret: s?.interswitch_client_secret_encrypted ?? '',
    payment_url: s?.payment_url ?? '',
  })
}

export async function PUT(request: NextRequest) {
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

  const parsed = AgentSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const {
    full_name,
    phone,
    active_gateway,
    monnify_api_key,
    monnify_secret_key,
    monnify_contract_code,
    paystack_secret_key,
    flutterwave_secret_key,
    interswitch_client_id,
    interswitch_client_secret,
    payment_url,
  } = parsed.data

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)

  if (profileError) {
    console.error('Failed to update profile:', profileError)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  const { error: settingsError } = await supabase
    .from('agent_settings')
    .upsert(
      {
        agent_id: user.id,
        active_gateway: active_gateway ?? 'monnify',
        monnify_api_key_encrypted: monnify_api_key ?? null,
        monnify_secret_key_encrypted: monnify_secret_key ?? null,
        monnify_contract_code: monnify_contract_code ?? null,
        paystack_secret_key_encrypted: paystack_secret_key ?? null,
        flutterwave_secret_key_encrypted: flutterwave_secret_key ?? null,
        interswitch_client_id_encrypted: interswitch_client_id ?? null,
        interswitch_client_secret_encrypted: interswitch_client_secret ?? null,
        payment_url: payment_url ?? null,
      },
      { onConflict: 'agent_id' },
    )

  if (settingsError) {
    console.error('Failed to update agent settings:', settingsError)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

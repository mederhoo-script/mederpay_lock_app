import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeeTierSchema } from '@/lib/validations'

async function requireSuperadmin(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as { role: string }).role !== 'superadmin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }
  }

  return { error: null, supabase }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { error, supabase } = await requireSuperadmin(request)
  if (error) return error

  const { data: tiers, error: dbError } = await supabase!
    .from('fee_tiers')
    .select('id, label, min_price, max_price, fee_amount')
    .order('min_price', { ascending: true })

  if (dbError) {
    console.error('Failed to fetch fee tiers:', dbError)
    return NextResponse.json({ error: 'Failed to fetch fee tiers' }, { status: 500 })
  }

  return NextResponse.json({ tiers: tiers ?? [] })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { error, supabase } = await requireSuperadmin(request)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = FeeTierSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { data: tier, error: dbError } = await supabase!
    .from('fee_tiers')
    .insert({
      label: parsed.data.label,
      min_price: parsed.data.min_price,
      max_price: parsed.data.max_price ?? null,
      fee_amount: parsed.data.fee_amount,
    })
    .select()
    .single()

  if (dbError) {
    console.error('Failed to create fee tier:', dbError)
    return NextResponse.json({ error: 'Failed to create fee tier' }, { status: 500 })
  }

  return NextResponse.json(tier, { status: 201 })
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { error, supabase } = await requireSuperadmin(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  const { error: dbError } = await supabase!.from('fee_tiers').delete().eq('id', id)

  if (dbError) {
    console.error('Failed to delete fee tier:', dbError)
    return NextResponse.json({ error: 'Failed to delete fee tier' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

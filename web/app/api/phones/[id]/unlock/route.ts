import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data: phone, error: fetchError } = await supabase
    .from('phones')
    .select('id, imei, status')
    .eq('id', id)
    .single()

  if (fetchError || !phone) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const typedPhone = phone as { id: string; imei: string; status: string }

  if (typedPhone.status !== 'locked') {
    return NextResponse.json({ error: 'Phone is not currently locked' }, { status: 409 })
  }

  const serviceClient = createServiceClient()

  const { error: updateError } = await serviceClient
    .from('phones')
    .update({ status: 'sold' })
    .eq('id', id)

  if (updateError) {
    console.error('Failed to unlock phone:', updateError)
    return NextResponse.json({ error: 'Failed to unlock phone' }, { status: 500 })
  }

  // Log the unlock event
  await serviceClient.from('phone_logs').insert({
    phone_id: id,
    imei: typedPhone.imei,
    event_type: 'UNLOCK',
    details: `Manual unlock by agent ${user.id}`,
    timestamp: new Date().toISOString(),
  })

  // Restore the active sale status to 'active'
  await serviceClient
    .from('phone_sales')
    .update({ status: 'active' })
    .eq('phone_id', id)
    .eq('status', 'lock')

  const { data: updated } = await supabase
    .from('phones')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json(updated ?? { id, status: 'sold' })
}

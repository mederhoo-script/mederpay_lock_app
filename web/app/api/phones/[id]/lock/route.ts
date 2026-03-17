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

  // Verify phone belongs to agent (RLS handles this but double-check for clarity)
  const { data: phone, error: fetchError } = await supabase
    .from('phones')
    .select('id, imei, status')
    .eq('id', id)
    .single()

  if (fetchError || !phone) {
    return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
  }

  const typedPhone = phone as { id: string; imei: string; status: string }

  if (!['sold', 'locked'].includes(typedPhone.status)) {
    return NextResponse.json(
      { error: 'Phone must be sold or locked to change lock state' },
      { status: 409 },
    )
  }

  const serviceClient = createServiceClient()

  // Update phone status to 'locked'
  const { error: updateError } = await serviceClient
    .from('phones')
    .update({ status: 'locked' })
    .eq('id', id)

  if (updateError) {
    console.error('Failed to lock phone:', updateError)
    return NextResponse.json({ error: 'Failed to lock phone' }, { status: 500 })
  }

  // Log the lock event
  await serviceClient.from('phone_logs').insert({
    phone_id: id,
    imei: typedPhone.imei,
    event_type: 'LOCK_ENFORCED',
    details: `Manual lock by agent ${user.id}`,
    timestamp: new Date().toISOString(),
  })

  // Update the active sale status to 'lock'
  await serviceClient
    .from('phone_sales')
    .update({ status: 'lock' })
    .eq('phone_id', id)
    .not('status', 'in', '("completed","defaulted")')

  // Return updated phone data
  const { data: updated } = await supabase
    .from('phones')
    .select('*')
    .eq('id', id)
    .single()

  return NextResponse.json(updated ?? { id, status: 'locked' })
}

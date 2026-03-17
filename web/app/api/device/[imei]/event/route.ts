import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_EVENT_TYPES = [
  'DEVICE_REGISTERED',
  'STATUS_CHECK',
  'STATUS_CHANGE',
  'LOCK_ENFORCED',
  'UNLOCK',
  'ROOT_DETECTED',
  'BOOT',
  'SYNC_FAIL',
  'PAYMENT_RECEIVED',
] as const

type AllowedEventType = (typeof ALLOWED_EVENT_TYPES)[number]

interface EventBody {
  event_type: AllowedEventType
  details?: string
  old_status?: string
  new_status?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ imei: string }> },
) {
  const secret = request.headers.get('x-device-secret')
  if (!secret || secret !== process.env.ANDROID_DEVICE_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imei } = await params

  if (!/^\d{15}$/.test(imei)) {
    return NextResponse.json({ error: 'Invalid IMEI format' }, { status: 400 })
  }

  let body: EventBody
  try {
    body = (await request.json()) as EventBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { event_type, details, old_status, new_status } = body

  if (!event_type || !(ALLOWED_EVENT_TYPES as readonly string[]).includes(event_type)) {
    return NextResponse.json(
      { error: `event_type must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}` },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  // Resolve phone_id from IMEI for referential integrity
  const { data: phone } = await supabase
    .from('phones')
    .select('id')
    .eq('imei', imei)
    .maybeSingle()

  const { error } = await supabase.from('phone_logs').insert({
    phone_id: (phone as { id: string } | null)?.id ?? null,
    imei,
    event_type,
    details: details ?? null,
    old_status: old_status ?? null,
    new_status: new_status ?? null,
  })

  if (error) {
    console.error('Failed to insert phone log:', error)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

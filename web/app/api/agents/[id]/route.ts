import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PatchAgentSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending']),
})

async function requireSuperadmin() {
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { error, supabase } = await requireSuperadmin()
  if (error) return error

  const { data: agent, error: dbError } = await supabase!
    .from('profiles')
    .select('id, full_name, email, phone, username, role, status, created_at, updated_at')
    .eq('id', id)
    .eq('role', 'agent')
    .single()

  if (dbError || !agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Fetch sub-agent count
  const { count: subAgentCount } = await supabase!
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('parent_agent_id', id)
    .eq('role', 'subagent')

  // Fetch phone count
  const { count: phoneCount } = await supabase!
    .from('phones')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', id)

  // Fetch sales count and revenue
  const { data: sales } = await supabase!
    .from('phone_sales')
    .select('total_paid')
    .eq('agent_id', id)

  const salesCount = sales?.length ?? 0
  const totalRevenue = (sales ?? []).reduce(
    (sum, s) => sum + ((s as { total_paid: number }).total_paid ?? 0),
    0,
  )

  return NextResponse.json({
    agent,
    stats: {
      sub_agents: subAgentCount ?? 0,
      phones: phoneCount ?? 0,
      sales: salesCount,
      total_revenue: totalRevenue,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { error, supabase } = await requireSuperadmin()
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = PatchAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const { data: updated, error: dbError } = await supabase!
    .from('profiles')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('role', 'agent')
    .select()
    .single()

  if (dbError || !updated) {
    console.error('Failed to update agent status:', dbError)
    return NextResponse.json({ error: 'Agent not found or update failed' }, { status: 404 })
  }

  return NextResponse.json(updated)
}

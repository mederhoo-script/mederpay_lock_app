import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the sub-agent's profile to find parent_agent_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, parent_agent_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'subagent') {
    return NextResponse.json({ error: 'Only sub-agents can access this endpoint' }, { status: 403 })
  }

  if (!profile.parent_agent_id) {
    return NextResponse.json({ error: 'No parent agent assigned' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const offset = (page - 1) * limit
  const forSale = searchParams.get('for_sale') === 'true'

  // Use service client to fetch parent agent's buyers bypassing RLS
  const db = createServiceClient()

  // When listing buyers for a new sale, exclude buyers with active (non-completed/non-defaulted) sales
  let excludedBuyerIds: string[] = []
  if (forSale) {
    const { data: activeSales } = await db
      .from('phone_sales')
      .select('buyer_id, status')
      .not('status', 'in', '("completed","defaulted")')
    excludedBuyerIds = [...new Set((activeSales ?? []).map((s: { buyer_id: string }) => s.buyer_id))]
  }

  let query = db
    .from('buyers')
    .select('id, full_name, phone, email', { count: 'exact' })
    .eq('agent_id', profile.parent_agent_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (excludedBuyerIds.length > 0) {
    query = query.not('id', 'in', `(${excludedBuyerIds.map((id) => `"${id}"`).join(',')})`)
  }

  if (search) {
    // Escape PostgREST ilike special characters so user input is treated as a literal string
    const escaped = search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
    query = query.or(`full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
  }

  const { data: buyers, error, count } = await query

  if (error) {
    console.error('Failed to fetch agent buyers for subagent:', error)
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
  }

  return NextResponse.json({ buyers: buyers ?? [], count: count ?? 0, page, limit })
}

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

  // Use service client to fetch parent agent's buyers bypassing RLS
  const db = createServiceClient()

  let query = db
    .from('buyers')
    .select('id, full_name, phone, email', { count: 'exact' })
    .eq('agent_id', profile.parent_agent_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: buyers, error, count } = await query

  if (error) {
    console.error('Failed to fetch agent buyers for subagent:', error)
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
  }

  return NextResponse.json({ buyers: buyers ?? [], count: count ?? 0, page, limit })
}

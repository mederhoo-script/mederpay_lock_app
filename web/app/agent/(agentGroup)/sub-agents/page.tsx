import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import SubAgentsTable from '../SubAgentsTable'

export const dynamic = 'force-dynamic'

export default async function SubAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subagents } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at')
    .eq('role', 'subagent')
    .eq('parent_agent_id', user.id)
    .order('created_at', { ascending: false })

  // Get phones sold count per subagent
  const subagentIds = (subagents ?? []).map(s => (s as { id: string }).id)
  const soldCounts: Record<string, number> = {}
  if (subagentIds.length > 0) {
    const { data: sales } = await supabase
      .from('phone_sales')
      .select('sold_by')
      .in('sold_by', subagentIds)
    for (const s of sales ?? []) {
      const row = s as { sold_by: string }
      soldCounts[row.sold_by] = (soldCounts[row.sold_by] ?? 0) + 1
    }
  }

  const subagentsWithCounts = (subagents ?? []).map(s => ({
    ...(s as { id: string; full_name: string; email: string | null; phone: string | null; status: string; created_at: string }),
    phones_sold: soldCounts[(s as { id: string }).id] ?? 0,
  }))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Sub-Agents</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{subagentsWithCounts.length} sub-agent{subagentsWithCounts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/agent/sub-agents/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Invite Sub-Agent
        </Link>
      </div>

      <SubAgentsTable subagents={subagentsWithCounts} />
    </div>
  )
}

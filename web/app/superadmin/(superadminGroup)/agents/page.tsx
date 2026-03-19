import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgentsTable from './agents-table'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agents, count } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at', { count: 'exact' })
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  const agentsArr = (agents ?? []) as Array<{ id: string; full_name: string; email: string | null; phone: string | null; status: string; created_at: string }>
  const total = count ?? 0
  const active = agentsArr.filter(a => a.status === 'active').length
  const pending = agentsArr.filter(a => a.status === 'pending').length

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Agents</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage all registered agents</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total },
          { label: 'Active', value: active },
          { label: 'Pending', value: pending },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card p-4 space-y-1">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
          </div>
        ))}
      </div>

      <AgentsTable agents={agentsArr} />
    </div>
  )
}

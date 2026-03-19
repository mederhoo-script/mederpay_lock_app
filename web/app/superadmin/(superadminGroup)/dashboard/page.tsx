import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import { Users, UserCheck, Clock, UserX, Smartphone, DollarSign, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', pending: 'badge-warning', suspended: 'badge-neutral',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function SuperadminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profilesRes, phonesRes, feesRes, recentAgentsRes] = await Promise.all([
    supabase.from('profiles').select('id, status', { count: 'exact' }).eq('role', 'agent'),
    supabase.from('phones').select('id', { count: 'exact' }),
    supabase.from('weekly_fees').select('fee_amount, status'),
    supabase.from('profiles').select('id, full_name, email, status, created_at').eq('role', 'agent').order('created_at', { ascending: false }).limit(10),
  ])

  const profiles = profilesRes.data ?? []
  const totalAgents = profilesRes.count ?? 0
  const activeAgents = profiles.filter(p => (p as { status: string }).status === 'active').length
  const pendingAgents = profiles.filter(p => (p as { status: string }).status === 'pending').length
  const suspendedAgents = profiles.filter(p => (p as { status: string }).status === 'suspended').length
  const totalPhones = phonesRes.count ?? 0

  const fees = feesRes.data ?? []
  const feesCollected = fees.filter((f: { status: string }) => f.status === 'paid').reduce((s: number, f: { fee_amount: number }) => s + f.fee_amount, 0)
  const feesOutstanding = fees.filter((f: { status: string }) => ['pending', 'overdue'].includes(f.status)).reduce((s: number, f: { fee_amount: number }) => s + f.fee_amount, 0)

  const stats = [
    { label: 'Total Agents', value: totalAgents, icon: Users, color: 'hsl(var(--primary))' },
    { label: 'Active', value: activeAgents, icon: UserCheck, color: 'hsl(142 72% 60%)' },
    { label: 'Pending', value: pendingAgents, icon: Clock, color: 'hsl(38 92% 62%)' },
    { label: 'Suspended', value: suspendedAgents, icon: UserX, color: 'hsl(0 78% 68%)' },
    { label: 'Total Phones', value: totalPhones, icon: Smartphone, color: 'hsl(var(--primary))' },
    { label: 'Fees Collected', value: formatNaira(feesCollected), icon: DollarSign, color: 'hsl(142 72% 60%)' },
    { label: 'Outstanding Fees', value: formatNaira(feesOutstanding), icon: AlertCircle, color: 'hsl(38 92% 62%)' },
  ]

  const recentAgents = recentAgentsRes.data ?? []

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Platform Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Real-time stats for MederBuy</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Recent Registrations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {recentAgents.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No agents registered yet.</td></tr>
              ) : (recentAgents as Array<{ id: string; full_name: string; email: string | null; status: string; created_at: string }>).map(agent => (
                <tr key={agent.id}>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{agent.full_name}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{agent.email ?? '—'}</td>
                  <td><StatusBadge status={agent.status} /></td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {format(new Date(agent.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

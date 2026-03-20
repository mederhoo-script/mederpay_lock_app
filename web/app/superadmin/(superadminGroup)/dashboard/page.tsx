import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { Users, Smartphone, ShoppingBag, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperadminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for data queries so RLS does not filter out other users' records
  const db = createServiceClient()

  const [
    { count: totalAgents },
    { count: totalPhones },
    { count: totalSales },
    { data: revenueRows },
    { data: recentAgents },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
    db.from('phones').select('*', { count: 'exact', head: true }),
    db.from('phone_sales').select('*', { count: 'exact', head: true }),
    db.from('phone_sales').select('total_paid'),
    db.from('profiles')
      .select('id, full_name, email, phone, status, created_at')
      .eq('role', 'agent')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = (revenueRows ?? []).reduce((sum, r) => sum + (r.total_paid ?? 0), 0)

  const stats = [
    { label: 'Total Agents', value: totalAgents ?? 0, icon: Users, color: 'var(--accent)', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Total Phones', value: totalPhones ?? 0, icon: Smartphone, color: 'var(--info)', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Sales', value: totalSales ?? 0, icon: ShoppingBag, color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Total Revenue', value: formatNaira(totalRevenue), icon: DollarSign, color: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Superadmin Dashboard</h1>
          <p>Platform-wide overview</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{label}</span>
              <div className="stat-icon" style={{ background: bg }}><Icon size={16} color={color} /></div>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Agents</h2>
          <Link href="/superadmin/agents" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recentAgents && recentAgents.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {recentAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td style={{ fontWeight: 500 }}>{agent.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{agent.email}</td>
                    <td><span className={`badge ${agent.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{agent.status ?? '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{new Date(agent.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><Users size={32} /><p>No agents yet.</p></div>
        )}
      </div>
    </div>
  )
}

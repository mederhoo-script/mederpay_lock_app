import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { Users, Smartphone, ShoppingBag, DollarSign, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' : 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SuperadminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for data queries so RLS does not filter out other users' records
  const db = createServiceClient()

  const [
    { count: totalAgents },
    { count: totalSubAgents },
    { count: totalPhones },
    { count: totalSales },
    { data: revenueRows },
    { data: recentAgents },
    { data: recentSales },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'subagent'),
    db.from('phones').select('*', { count: 'exact', head: true }),
    db.from('phone_sales').select('*', { count: 'exact', head: true }),
    db.from('phone_sales').select('total_paid'),
    db.from('profiles')
      .select('id, full_name, email, phone, status, created_at')
      .eq('role', 'agent')
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('phone_sales')
      .select('id, status, selling_price, total_paid, created_at, buyers(full_name), phones(brand, model)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = (revenueRows ?? []).reduce((sum, r) => sum + (r.total_paid ?? 0), 0)

  const stats = [
    { label: 'Total Agents', value: totalAgents ?? 0, icon: Users, color: 'var(--accent)', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Total Sub-Agents', value: totalSubAgents ?? 0, icon: UserCheck, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    { label: 'Total Phones', value: totalPhones ?? 0, icon: Smartphone, color: 'var(--info)', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Sales', value: totalSales ?? 0, icon: ShoppingBag, color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Total Revenue', value: formatNaira(totalRevenue), icon: DollarSign, color: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
  ]

  return (
    <div>
      {/* Logo branding in content area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', padding: '0.875rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', maxWidth: '260px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MederBuy" style={{ height: '36px', width: 'auto', borderRadius: '8px' }} />
        <div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>MederBuy</p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1, marginTop: '0.2rem' }}>Admin Portal</p>
        </div>
      </div>
      <div className="page-header">
        <div>
          <h1>Superadmin Dashboard</h1>
          <p>Platform-wide overview</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Agents */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Agents</h2>
            <Link href="/superadmin/agents" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {recentAgents && recentAgents.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {recentAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{agent.full_name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{agent.email}</div>
                      </td>
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

        {/* Recent Sales */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Sales</h2>
            <Link href="/superadmin/sales" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {recentSales && recentSales.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Buyer</th><th>Phone</th><th>Status</th><th>Total Paid</th></tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => {
                    const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                    const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                    return (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: 500 }}>{buyer?.full_name ?? '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                        <td><StatusBadge status={sale.status} /></td>
                        <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><ShoppingBag size={32} /><p>No sales yet.</p></div>
          )}
        </div>
      </div>
    </div>
  )
}

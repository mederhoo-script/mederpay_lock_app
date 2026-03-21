import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

function SaleStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SubAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: subAgent } = await db
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
    .single()

  if (!subAgent) notFound()

  const [{ count: salesCount }, { count: activeLoans }, { data: salesRows }, { data: recentSales }] = await Promise.all([
    db.from('phone_sales').select('*', { count: 'exact', head: true }).eq('sold_by', id),
    db.from('phone_sales').select('*', { count: 'exact', head: true }).eq('sold_by', id).eq('status', 'active'),
    db.from('phone_sales').select('total_paid').eq('sold_by', id),
    db.from('phone_sales')
      .select('id, status, selling_price, total_paid, next_due_date, sale_date, buyers(full_name), phones(brand, model)')
      .eq('sold_by', id)
      .order('sale_date', { ascending: false })
      .limit(10),
  ])

  const totalRevenue = (salesRows ?? []).reduce((sum, r) => sum + (r.total_paid ?? 0), 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/sub-agents" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{subAgent.full_name ?? 'Sub-Agent'}</h1>
            <p>Sub-Agent Profile</p>
          </div>
        </div>
        <span className={`badge ${subAgent.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {subAgent.status ?? 'pending'}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Total Sales</span>
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}><ShoppingBag size={16} color="var(--info)" /></div>
          </div>
          <div className="stat-value">{salesCount ?? 0}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Active Loans</span>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}><TrendingUp size={16} color="var(--warning)" /></div>
          </div>
          <div className="stat-value">{activeLoans ?? 0}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Total Collected</span>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}><DollarSign size={16} color="var(--success)" /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{formatNaira(totalRevenue)}</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '560px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile Details</h2>
        <div className="detail-row"><span className="detail-key">Full Name</span><span className="detail-value">{subAgent.full_name ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{subAgent.email ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{subAgent.phone ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Status</span>
          <span className="detail-value">
            <span className={`badge ${subAgent.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {subAgent.status ?? '—'}
            </span>
          </span>
        </div>
        <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-value">{new Date(subAgent.created_at).toLocaleDateString()}</span></div>
      </div>

      {/* Recent Sales */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Sales by {subAgent.full_name ?? 'Sub-Agent'}</h2>
        </div>
        {recentSales && recentSales.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Selling Price</th>
                  <th>Total Paid</th>
                  <th>Next Due</th>
                  <th>Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 500 }}>{(buyer as { full_name?: string } | null)?.full_name ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{phone ? `${(phone as { brand?: string }).brand ?? ''} ${(phone as { model?: string }).model ?? ''}`.trim() : '—'}</td>
                      <td><SaleStatusBadge status={sale.status} /></td>
                      <td>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{sale.next_due_date ? new Date(sale.next_due_date).toLocaleDateString() : '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={32} />
            <p>No sales by this sub-agent yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft, Lock, Unlock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'available' ? 'badge-success' :
    status === 'sold' ? 'badge-info' :
    status === 'locked' ? 'badge-danger' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

function SaleStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function PhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // allow viewing phones owned by subagents
  const { data: subagentProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
  const subagentIds = (subagentProfiles ?? []).map((p) => p.id)
  const ownerIds = [user.id, ...subagentIds]

  const { data: phone } = await supabase
    .from('phones')
    .select('*')
    .eq('id', id)
    .in('agent_id', ownerIds)
    .single()

  if (!phone) notFound()

  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, created_at, buyers(full_name)')
    .eq('phone_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/phones" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{phone.brand} {phone.model}</h1>
            <p>IMEI: {phone.imei}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`/agent/phones/${id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
          {phone.status !== 'locked' ? (
            <form action={`/api/phones/${id}/lock`} method="POST">
              <button type="submit" className="btn btn-danger btn-sm"><Lock size={14} /> Lock</button>
            </form>
          ) : (
            <form action={`/api/phones/${id}/unlock`} method="POST">
              <button type="submit" className="btn btn-success btn-sm"><Unlock size={14} /> Unlock</button>
            </form>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Phone Details</h2>
          <div className="detail-row"><span className="detail-key">Status</span><span className="detail-value"><StatusBadge status={phone.status ?? 'available'} /></span></div>
          <div className="detail-row"><span className="detail-key">Brand</span><span className="detail-value">{phone.brand}</span></div>
          <div className="detail-row"><span className="detail-key">Model</span><span className="detail-value">{phone.model}</span></div>
          <div className="detail-row"><span className="detail-key">Storage</span><span className="detail-value">{phone.storage ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Color</span><span className="detail-value">{phone.color ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">IMEI</span><span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{phone.imei}</span></div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Pricing</h2>
          <div className="detail-row"><span className="detail-key">Cost Price</span><span className="detail-value">{formatNaira(phone.cost_price ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Selling Price</span><span className="detail-value">{formatNaira(phone.selling_price ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Down Payment</span><span className="detail-value">{formatNaira(phone.down_payment ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Payment Weeks</span><span className="detail-value">{phone.payment_weeks ?? '—'}</span></div>
        </div>
      </div>

      {/* Sales History */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Sales History</h2>
        </div>
        {sales && sales.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th>Selling Price</th>
                  <th>Total Paid</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 500 }}>{buyer?.full_name ?? '—'}</td>
                      <td><SaleStatusBadge status={sale.status} /></td>
                      <td>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href={`/agent/sales/${sale.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No sales for this phone yet.</p></div>
        )}
      </div>
    </div>
  )
}

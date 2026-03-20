import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

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

export default async function SubagentBuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: buyer } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .eq('agent_id', user.id)
    .single()

  if (!buyer) notFound()

  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, created_at, phones(brand, model)')
    .eq('buyer_id', id)
    .eq('sold_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/subagent/buyers" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{buyer.full_name}</h1>
            <p>Buyer Profile</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Contact Information</h2>
          <div className="detail-row"><span className="detail-key">Full Name</span><span className="detail-value">{buyer.full_name}</span></div>
          <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{buyer.phone}</span></div>
          <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{buyer.email ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Address</span><span className="detail-value">{buyer.address}</span></div>
          <div className="detail-row"><span className="detail-key">Registered</span><span className="detail-value">{new Date(buyer.created_at).toLocaleDateString()}</span></div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Identity Verification</h2>
          <div className="detail-row">
            <span className="detail-key">BVN</span>
            <span className="detail-value" style={{ fontFamily: 'monospace' }}>
              {buyer.bvn ? `****${buyer.bvn.slice(-4)}` : '—'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">NIN</span>
            <span className="detail-value" style={{ fontFamily: 'monospace' }}>
              {buyer.nin ? `****${buyer.nin.slice(-4)}` : '—'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Total Purchases</span>
            <span className="detail-value">{sales?.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Sales History */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Purchase History</h2>
        </div>
        {sales && sales.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Selling Price</th>
                  <th>Total Paid</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 500 }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                      <td><SaleStatusBadge status={sale.status} /></td>
                      <td>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href={`/subagent/sales/${sale.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No purchases yet.</p></div>
        )}
      </div>
    </div>
  )
}

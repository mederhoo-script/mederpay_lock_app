import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function PhoneStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'available' ? 'badge-success' :
    status === 'sold' ? 'badge-info' :
    status === 'locked' ? 'badge-danger' : 'badge-neutral'
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

export default async function SuperadminPhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const { data: phone } = await db
    .from('phones')
    .select('*, profiles:agent_id(full_name, email)')
    .eq('id', id)
    .single()

  if (!phone) notFound()

  const agent = Array.isArray(phone.profiles) ? phone.profiles[0] : phone.profiles
  const agentInfo = agent as { full_name?: string; email?: string } | null

  const { data: sales } = await db
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, created_at, buyers(full_name)')
    .eq('phone_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/superadmin/phones" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{phone.brand} {phone.model}</h1>
            <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>IMEI: {phone.imei}</p>
          </div>
        </div>
        <PhoneStatusBadge status={phone.status ?? 'available'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Phone Details</h2>
          <div className="detail-row"><span className="detail-key">Brand</span><span className="detail-value">{phone.brand}</span></div>
          <div className="detail-row"><span className="detail-key">Model</span><span className="detail-value">{phone.model}</span></div>
          <div className="detail-row"><span className="detail-key">Storage</span><span className="detail-value">{phone.storage ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Color</span><span className="detail-value">{phone.color ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">IMEI</span><span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{phone.imei}</span></div>
          <div className="detail-row"><span className="detail-key">Status</span><span className="detail-value"><PhoneStatusBadge status={phone.status ?? 'available'} /></span></div>
          <div className="detail-row"><span className="detail-key">Added</span><span className="detail-value">{new Date(phone.created_at).toLocaleDateString()}</span></div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Pricing &amp; Agent</h2>
          <div className="detail-row"><span className="detail-key">Selling Price</span><span className="detail-value">{formatNaira(phone.selling_price ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Down Payment</span><span className="detail-value">{formatNaira(phone.down_payment ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Payment Weeks</span><span className="detail-value">{phone.payment_weeks ?? '—'}</span></div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
            <div className="detail-row"><span className="detail-key">Agent</span><span className="detail-value">{agentInfo?.full_name ?? agentInfo?.email ?? '—'}</span></div>
          </div>
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
                      <td style={{ fontWeight: 500 }}>{(buyer as { full_name?: string } | null)?.full_name ?? '—'}</td>
                      <td><SaleStatusBadge status={sale.status} /></td>
                      <td>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href={`/superadmin/sales/${sale.id}`} className="btn btn-ghost btn-sm">View</Link>
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

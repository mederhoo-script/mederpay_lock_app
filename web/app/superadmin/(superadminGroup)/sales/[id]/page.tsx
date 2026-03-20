import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' :
    status === 'defaulted' ? 'badge-neutral' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SuperadminSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  const { data: sale } = await db
    .from('phone_sales')
    .select(`
      *,
      buyers(id, full_name, phone, email, address),
      phones(id, brand, model, imei, storage, color),
      profiles:agent_id(full_name, email)
    `)
    .eq('id', id)
    .single()

  if (!sale) notFound()

  const { data: payments } = await db
    .from('payments')
    .select('*')
    .eq('sale_id', id)
    .order('created_at', { ascending: false })

  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
  const agentRaw = Array.isArray(sale.profiles) ? sale.profiles[0] : sale.profiles
  const agent = agentRaw as { full_name?: string; email?: string } | null
  const outstanding = (sale.selling_price ?? 0) - (sale.total_paid ?? 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/superadmin/sales" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>Sale Details</h1>
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{sale.id}</p>
          </div>
        </div>
        <StatusBadge status={sale.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Buyer */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Buyer Information</h2>
          <div className="detail-row"><span className="detail-key">Name</span><span className="detail-value">{(buyer as { full_name?: string } | null)?.full_name ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{(buyer as { phone?: string } | null)?.phone ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{(buyer as { email?: string } | null)?.email ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Address</span><span className="detail-value">{(buyer as { address?: string } | null)?.address ?? '—'}</span></div>
        </div>

        {/* Phone */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Phone Information</h2>
          <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{phone ? `${(phone as { brand?: string }).brand ?? ''} ${(phone as { model?: string }).model ?? ''}`.trim() : '—'}</span></div>
          <div className="detail-row"><span className="detail-key">IMEI</span><span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{(phone as { imei?: string } | null)?.imei ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Storage</span><span className="detail-value">{(phone as { storage?: string } | null)?.storage ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Color</span><span className="detail-value">{(phone as { color?: string } | null)?.color ?? '—'}</span></div>
          {(phone as { id?: string } | null)?.id && (
            <div style={{ marginTop: '1rem' }}>
              <Link href={`/superadmin/phones/${(phone as { id: string }).id}`} className="btn btn-ghost btn-sm">View Phone</Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Payment Summary */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Payment Summary</h2>
          <div className="detail-row"><span className="detail-key">Selling Price</span><span className="detail-value">{formatNaira(sale.selling_price ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Total Paid</span><span className="detail-value" style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Outstanding</span><span className="detail-value" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>{formatNaira(outstanding)}</span></div>
          <div className="detail-row"><span className="detail-key">Next Due Date</span><span className="detail-value">{sale.next_due_date ? new Date(sale.next_due_date).toLocaleDateString() : '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Payment Weeks</span><span className="detail-value">{sale.payment_weeks ?? '—'}</span></div>
        </div>

        {/* Agent */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Agent Information</h2>
          <div className="detail-row"><span className="detail-key">Agent</span><span className="detail-value">{agent?.full_name ?? agent?.email ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Sale Date</span><span className="detail-value">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}</span></div>
          {sale.virtual_account_number && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '1rem', paddingTop: '1rem' }}>
                <div className="detail-row"><span className="detail-key">Bank</span><span className="detail-value">{sale.bank_name ?? '—'}</span></div>
                <div className="detail-row"><span className="detail-key">Account</span><span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sale.virtual_account_number}</span></div>
                <div className="detail-row"><span className="detail-key">Account Name</span><span className="detail-value">{sale.account_name ?? '—'}</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Payment History</h2>
        </div>
        {payments && payments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{pmt.gateway_reference ?? '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 500 }}>{formatNaira(pmt.amount ?? 0)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{pmt.gateway ?? '—'}</td>
                    <td>
                      <span className={`badge ${pmt.status === 'successful' ? 'badge-success' : pmt.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {pmt.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {pmt.paid_at ? new Date(pmt.paid_at).toLocaleString() : new Date(pmt.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No payments recorded yet.</p></div>
        )}
      </div>
    </div>
  )
}

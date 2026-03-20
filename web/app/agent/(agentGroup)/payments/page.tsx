import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // get agent's sale ids
  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id')
    .eq('agent_id', user.id)

  const saleIds = (sales ?? []).map((s) => s.id)

  const { data: payments } = saleIds.length > 0
    ? await supabase
        .from('payments')
        .select('*, phone_sales(buyers(full_name))')
        .in('sale_id', saleIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const totalRevenue = (payments ?? [])
    .filter((p) => p.status === 'successful')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>All payment transactions</p>
        </div>
      </div>

      {/* Total Revenue Stat */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ maxWidth: '260px' }}>
          <span className="stat-label">Total Revenue</span>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatNaira(totalRevenue)}</div>
          <span className="stat-sub">{payments?.filter((p) => p.status === 'successful').length ?? 0} successful payments</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {payments && payments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Paid At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pmt) => {
                  const sale = Array.isArray(pmt.phone_sales) ? pmt.phone_sales[0] : pmt.phone_sales
                  const buyer = Array.isArray(sale?.buyers) ? sale?.buyers[0] : sale?.buyers
                  return (
                    <tr key={pmt.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{pmt.gateway_reference ?? '—'}</td>
                      <td style={{ fontWeight: 500 }}>{buyer?.full_name ?? '—'}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 500 }}>{formatNaira(pmt.amount ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{pmt.gateway ?? '—'}</td>
                      <td>
                        <span className={`badge ${pmt.status === 'successful' ? 'badge-success' : pmt.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                          {pmt.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {pmt.paid_at ? new Date(pmt.paid_at).toLocaleString() : '—'}
                      </td>
                      <td>
                        {pmt.sale_id && (
                          <Link href={`/agent/sales/${pmt.sale_id}`} className="btn btn-ghost btn-sm">View Sale</Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <CreditCard size={32} />
            <p>No payments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

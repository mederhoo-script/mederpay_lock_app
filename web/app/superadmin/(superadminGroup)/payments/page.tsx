import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperadminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, gateway_reference, amount, gateway, status, paid_at, created_at,
      phone_sales(
        agent_id,
        buyers(full_name),
        profiles:agent_id(full_name, email)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Payments</h1>
          <p>Platform-wide payment transactions</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {payments && payments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Agent</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pmt) => {
                  const sale = Array.isArray(pmt.phone_sales) ? pmt.phone_sales[0] : pmt.phone_sales
                  const buyer = sale ? (Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers) : null
                  const agent = sale ? (Array.isArray(sale.profiles) ? sale.profiles[0] : sale.profiles) : null
                  return (
                    <tr key={pmt.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{pmt.gateway_reference ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{(agent as { full_name?: string; email?: string } | null)?.full_name ?? (agent as { full_name?: string; email?: string } | null)?.email ?? '—'}</td>
                      <td style={{ fontWeight: 500 }}>{(buyer as { full_name?: string } | null)?.full_name ?? '—'}</td>
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

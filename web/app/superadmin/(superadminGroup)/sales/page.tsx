import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperadminSalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: sales } = await db
    .from('phone_sales')
    .select(`
      id, status, selling_price, total_paid, outstanding_balance,
      weeks_paid, total_weeks, sale_date, next_due_date,
      phones (brand, model, imei),
      buyers (full_name, phone),
      profiles:agent_id (full_name, email)
    `)
    .order('sale_date', { ascending: false })
    .limit(500)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Sales</h1>
          <p>Platform-wide phone sales and installment plans</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {sales && sales.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>Agent</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                  const agentRaw = Array.isArray(sale.profiles) ? sale.profiles[0] : sale.profiles
                  const agent = agentRaw as { full_name?: string; email?: string } | null
                  return (
                    <tr key={sale.id}>
                      <td style={{ fontWeight: 500 }}>
                        {(buyer as { full_name?: string } | null)?.full_name ?? '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {phone ? `${(phone as { brand?: string }).brand ?? ''} ${(phone as { model?: string }).model ?? ''}`.trim() : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {agent?.full_name ?? agent?.email ?? '—'}
                      </td>
                      <td style={{ fontWeight: 500 }}>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: sale.outstanding_balance > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {formatNaira(sale.outstanding_balance ?? 0)}
                      </td>
                      <td>
                        <span className={`badge ${
                          sale.status === 'completed' ? 'badge-success' :
                          sale.status === 'active' ? 'badge-accent' :
                          sale.status === 'defaulted' ? 'badge-danger' : 'badge-neutral'
                        }`}>
                          {sale.status ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={32} />
            <p>No sales recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

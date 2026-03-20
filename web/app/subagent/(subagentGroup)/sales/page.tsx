import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ShoppingBag, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' : 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SubagentSalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, created_at, buyers(full_name, phone), phones(brand, model)')
    .eq('sold_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Sales</h1>
          <p>Sales you have processed</p>
        </div>
        <Link href="/subagent/sales/new" className="btn btn-primary btn-sm">
          <Plus size={15} />
          New Sale
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {sales && sales.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Buyer</th><th>Phone</th><th>Status</th><th>Selling Price</th><th>Total Paid</th><th>Date</th></tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                  return (
                    <tr key={sale.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{buyer?.full_name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{buyer?.phone ?? ''}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                      <td><StatusBadge status={sale.status} /></td>
                      <td>{formatNaira(sale.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(sale.created_at).toLocaleDateString()}
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
            <p>No sales yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

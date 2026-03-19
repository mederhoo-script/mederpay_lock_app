import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', grace: 'badge-warning', lock: 'badge-error',
    completed: 'bg-purple-900/30 text-purple-400 border border-purple-900/40',
    defaulted: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sales, count } = await supabase
    .from('phone_sales')
    .select(
      'id, status, selling_price, total_paid, outstanding_balance, next_due_date, sale_date, buyers(full_name), phones(brand, model, imei)',
      { count: 'exact' }
    )
    .eq('agent_id', user.id)
    .order('sale_date', { ascending: false })
    .range(offset, offset + limit - 1)

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Sales</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{total} total sale{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/agent/sales/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Sale
        </Link>
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Phone</th>
                <th>IMEI</th>
                <th>Sale Date</th>
                <th>Selling Price</th>
                <th>Total Paid</th>
                <th>Outstanding</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(sales ?? []).length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales yet.</td></tr>
              ) : (sales ?? []).map((sale) => {
                const s = sale as {
                  id: string; status: string; selling_price: number; total_paid: number
                  outstanding_balance: number; next_due_date: string | null; sale_date: string
                  buyers: { full_name: string } | { full_name: string }[] | null
                  phones: { brand: string; model: string; imei: string } | { brand: string; model: string; imei: string }[] | null
                }
                const buyer = Array.isArray(s.buyers) ? s.buyers[0] : s.buyers
                const phone = Array.isArray(s.phones) ? s.phones[0] : s.phones
                return (
                  <tr key={s.id}>
                    <td style={{ color: 'hsl(var(--foreground))' }}>{buyer?.full_name ?? '—'}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{phone?.imei ?? '—'}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.sale_date ? format(new Date(s.sale_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(s.selling_price)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(142 72% 60%)' }}>{formatNaira(s.total_paid)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(38 92% 62%)' }}>{formatNaira(s.outstanding_balance)}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {s.next_due_date ? format(new Date(s.next_due_date), 'MMM d') : '—'}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <Link href={`/agent/sales/${s.id}`} className="btn btn-ghost text-xs px-2 py-1">
                        <Eye className="w-3 h-3" /> View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && <Link href={`/agent/sales?page=${page - 1}`} className="btn btn-ghost text-sm">← Prev</Link>}
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/agent/sales?page=${page + 1}`} className="btn btn-ghost text-sm">Next →</Link>}
        </div>
      )}
    </div>
  )
}

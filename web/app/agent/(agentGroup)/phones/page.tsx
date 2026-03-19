import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: 'badge-info',
    sold: 'badge-neutral',
    lock: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function PhonesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; status?: string }>
}) {
  const { search = '', page: pageStr = '1', status } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('phones')
    .select('*', { count: 'exact' })
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`imei.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)

  const { data: phones, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Phones</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{total} phone{total !== 1 ? 's' : ''} in inventory</p>
        </div>
        <Link href="/agent/phones/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Phone
        </Link>
      </div>

      {/* Search & Filter */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search IMEI, brand, model…"
            className="input-field pl-9"
          />
        </div>
        <select name="status" defaultValue={status ?? ''} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="lock">Locked</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        <Link href="/agent/phones" className="btn btn-ghost">Clear</Link>
      </form>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>IMEI</th>
                <th>Brand / Model</th>
                <th>Storage</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Down Payment</th>
                <th>Weekly</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(phones ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No phones found.
                  </td>
                </tr>
              ) : (phones ?? []).map((phone) => {
                const p = phone as {
                  id: string; imei: string; brand: string; model: string; storage: string | null
                  cost_price: number; selling_price: number; down_payment: number; weekly_payment: number; status: string
                }
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{p.imei}</td>
                    <td style={{ color: 'hsl(var(--foreground))' }}>{p.brand} {p.model}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{p.storage ?? '—'}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatNaira(p.cost_price)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(p.selling_price)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatNaira(p.down_payment)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{formatNaira(p.weekly_payment)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/agent/phones/${p.id}`} className="btn btn-ghost text-xs px-2 py-1">View</Link>
                        {p.status === 'available' && (
                          <Link href={`/agent/phones/${p.id}/edit`} className="btn btn-ghost text-xs px-2 py-1">Edit</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/agent/phones?page=${page - 1}&search=${search}&status=${status ?? ''}`} className="btn btn-ghost text-sm">
              ← Prev
            </Link>
          )}
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/agent/phones?page=${page + 1}&search=${search}&status=${status ?? ''}`} className="btn btn-ghost text-sm">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

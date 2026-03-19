import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { search = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10))
  const limit = 20
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('buyers')
    .select('id, full_name, phone, email, bvn_encrypted, nin_encrypted, created_at', { count: 'exact' })
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: buyers, count } = await query

  const buyerIds = (buyers ?? []).map(b => (b as { id: string }).id)
  const saleCounts: Record<string, number> = {}
  if (buyerIds.length > 0) {
    const { data: sales } = await supabase.from('phone_sales').select('buyer_id').in('buyer_id', buyerIds)
    for (const s of sales ?? []) {
      const row = s as { buyer_id: string }
      saleCounts[row.buyer_id] = (saleCounts[row.buyer_id] ?? 0) + 1
    }
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Buyers</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{total} registered buyer{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/agent/buyers/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Register Buyer
        </Link>
      </div>

      <form method="GET" className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input name="search" defaultValue={search} placeholder="Search by name, phone, email…" className="input-field pl-9" />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        {search && <Link href="/agent/buyers" className="btn btn-ghost">Clear</Link>}
      </form>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>BVN</th>
                <th>NIN</th>
                <th>Sales</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(buyers ?? []).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No buyers found.</td></tr>
              ) : (buyers ?? []).map(buyer => {
                const b = buyer as { id: string; full_name: string; phone: string; email: string | null; bvn_encrypted: string | null; nin_encrypted: string | null; created_at: string }
                return (
                  <tr key={b.id}>
                    <td style={{ color: 'hsl(var(--foreground))' }}>{b.full_name}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{b.phone}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{b.email ?? '—'}</td>
                    <td>{b.bvn_encrypted ? <CheckCircle className="w-4 h-4" style={{ color: 'hsl(142 72% 60%)' }} /> : <XCircle className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />}</td>
                    <td>{b.nin_encrypted ? <CheckCircle className="w-4 h-4" style={{ color: 'hsl(142 72% 60%)' }} /> : <XCircle className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />}</td>
                    <td style={{ color: 'hsl(var(--foreground))' }}>{saleCounts[b.id] ?? 0}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{format(new Date(b.created_at), 'MMM d, yyyy')}</td>
                    <td>
                      <Link href={`/agent/buyers/${b.id}`} className="btn btn-ghost text-xs px-2 py-1">View</Link>
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
          {page > 1 && <Link href={`/agent/buyers?page=${page - 1}&search=${search}`} className="btn btn-ghost text-sm">← Prev</Link>}
          <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/agent/buyers?page=${page + 1}&search=${search}`} className="btn btn-ghost text-sm">Next →</Link>}
        </div>
      )}
    </div>
  )
}

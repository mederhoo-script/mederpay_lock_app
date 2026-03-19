import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { Smartphone, ShoppingBag, TrendingUp, Lock, DollarSign, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success',
    available: 'badge-info',
    grace: 'badge-warning',
    pending: 'badge-warning',
    lock: 'badge-error',
    locked: 'badge-error',
    completed: 'bg-purple-900/30 text-purple-400 border border-purple-900/40',
    suspended: 'badge-neutral',
    sold: 'badge-neutral',
    defaulted: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function AgentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [phonesRes, salesRes, lockedRes] = await Promise.all([
    supabase.from('phones').select('id, status', { count: 'exact' }).eq('agent_id', user.id),
    supabase
      .from('phone_sales')
      .select('id, status, outstanding_balance, next_due_date, buyers(full_name), phones(brand, model)', { count: 'exact' })
      .eq('agent_id', user.id)
      .order('sale_date', { ascending: false })
      .limit(5),
    supabase
      .from('phones')
      .select('id, imei, brand, model, phone_sales(buyer_id, buyers(full_name), sale_date)', { count: 'exact' })
      .eq('agent_id', user.id)
      .eq('status', 'lock')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const phones = phonesRes.data ?? []
  const allSalesRes = await supabase
    .from('phone_sales')
    .select('id, status, outstanding_balance')
    .eq('agent_id', user.id)

  const allSales = allSalesRes.data ?? []

  const totalPhones = phones.length
  const phonesSold = phones.filter(p => (p as { status: string }).status === 'sold' || (p as { status: string }).status === 'lock').length
  const activeLoans = allSales.filter(s => ['active', 'grace', 'lock'].includes((s as { status: string }).status)).length
  const phonesLocked = phones.filter(p => (p as { status: string }).status === 'lock').length
  const outstandingBalance = allSales.reduce((sum, s) => {
    const sale = s as { status: string; outstanding_balance: number }
    if (['active', 'grace', 'lock'].includes(sale.status)) return sum + (sale.outstanding_balance ?? 0)
    return sum
  }, 0)

  const recentSales = salesRes.data ?? []
  const lockedPhones = lockedRes.data ?? []

  const stats = [
    { label: 'Total Phones', value: totalPhones, icon: Smartphone, color: 'hsl(var(--primary))' },
    { label: 'Phones Sold', value: phonesSold, icon: ShoppingBag, color: 'hsl(142 72% 60%)' },
    { label: 'Active Loans', value: activeLoans, icon: TrendingUp, color: 'hsl(38 92% 62%)' },
    { label: 'Phones Locked', value: phonesLocked, icon: Lock, color: 'hsl(0 78% 68%)' },
    { label: 'Outstanding', value: formatNaira(outstandingBalance), icon: DollarSign, color: 'hsl(var(--primary))' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Overview of your phone financing activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="gold-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Recent Sales</h2>
          <Link href="/agent/sales" className="text-xs" style={{ color: 'hsl(var(--primary))' }}>View all →</Link>
        </div>
        {recentSales.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>Next Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(recentSales as Array<{
                  id: string
                  status: string
                  outstanding_balance: number
                  next_due_date: string | null
                  buyers: { full_name: string } | { full_name: string }[] | null
                  phones: { brand: string; model: string } | { brand: string; model: string }[] | null
                }>).map(sale => {
                  const buyer = Array.isArray(sale.buyers) ? sale.buyers[0] : sale.buyers
                  const phone = Array.isArray(sale.phones) ? sale.phones[0] : sale.phones
                  return (
                    <tr key={sale.id}>
                      <td style={{ color: 'hsl(var(--foreground))' }}>{buyer?.full_name ?? '—'}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                      <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {sale.next_due_date ? format(new Date(sale.next_due_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td><StatusBadge status={sale.status} /></td>
                      <td>
                        <Link href={`/agent/sales/${sale.id}`} className="btn btn-ghost text-xs px-2 py-1">
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Locked Phones */}
      <div className="gold-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Lock className="w-4 h-4" style={{ color: 'hsl(0 78% 68%)' }} />
            Locked Phones
          </h2>
          <Link href="/agent/phones?status=lock" className="text-xs" style={{ color: 'hsl(var(--primary))' }}>View all →</Link>
        </div>
        {lockedPhones.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'hsl(var(--muted-foreground))' }}>No locked phones.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IMEI</th>
                  <th>Model</th>
                  <th>Buyer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(lockedPhones as any[]).map((phone: {
                  id: string
                  imei: string
                  brand: string
                  model: string
                  phone_sales: Array<{ buyer_id: string; buyers: { full_name: string }[] | { full_name: string } | null; sale_date: string | null }> | null
                }) => {
                  const sale = phone.phone_sales?.[0]
                  const buyerRaw = sale?.buyers
                  const buyerName = Array.isArray(buyerRaw)
                    ? buyerRaw[0]?.full_name
                    : (buyerRaw as { full_name: string } | null)?.full_name
                  return (
                    <tr key={phone.id}>
                      <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{phone.imei}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{phone.brand} {phone.model}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{buyerName ?? '—'}</td>
                      <td>
                        <Link href={`/agent/phones/${phone.id}`} className="btn btn-ghost text-xs px-2 py-1">
                          <Eye className="w-3 h-3" /> View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

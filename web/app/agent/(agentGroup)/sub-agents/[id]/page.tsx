import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, User, Phone, Mail, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Sub-Agent Detail | MederBuy' }

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-900/30 text-emerald-400',
  pending:   'bg-yellow-900/30 text-yellow-400',
  suspended: 'bg-red-900/30 text-red-400',
}

const SALE_STATUS_COLORS: Record<string, string> = {
  active:    'bg-blue-900/30 text-blue-400',
  grace:     'bg-yellow-900/30 text-yellow-400',
  lock:      'bg-red-900/30 text-red-400',
  completed: 'bg-emerald-900/30 text-emerald-400',
  defaulted: 'bg-red-900/40 text-red-300',
}

interface SaleRow {
  id: string
  status: string
  selling_price: number
  outstanding_balance: number
  next_due_date: string | null
  buyers: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null
  phones: { brand: string; model: string } | { brand: string; model: string }[] | null
}

function getBuyerName(s: SaleRow): string {
  if (!s.buyers) return '—'
  return Array.isArray(s.buyers) ? (s.buyers[0]?.full_name ?? '—') : s.buyers.full_name
}

function getPhoneLabel(s: SaleRow): string {
  if (!s.phones) return '—'
  const p = Array.isArray(s.phones) ? s.phones[0] : s.phones
  return p ? `${p.brand} ${p.model}` : '—'
}

export default async function SubAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch sub-agent profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, role, created_at, parent_agent_id')
    .eq('id', id)
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
    .maybeSingle()

  if (!profile) notFound()

  // Fetch their sales
  const { data: sales } = await supabase
    .from('phone_sales')
    .select(
      'id, status, selling_price, outstanding_balance, next_due_date, buyers(full_name, phone), phones(brand, model)',
    )
    .eq('sold_by', profile.id)
    .order('sale_date', { ascending: false })
    .limit(50)

  const totalSales   = sales?.length ?? 0
  const activeSales  = sales?.filter((s) => !['completed', 'defaulted'].includes((s as unknown as SaleRow).status)).length ?? 0
  const totalRevenue = sales?.reduce((sum, s) => sum + ((s as unknown as SaleRow).selling_price), 0) ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/agent/sub-agents" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
          <p className="text-sm text-white/50">Sub-Agent Detail</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="gold-panel p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2563EB]/20 flex items-center justify-center">
            <User className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs text-white/40">Full Name</p>
            <p className="text-sm font-medium text-white">{profile.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs text-white/40">Email</p>
            <p className="text-sm font-medium text-white">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
            <Phone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Phone</p>
            <p className="text-sm font-medium text-white">{profile.phone ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sales', value: totalSales, color: 'text-[#2563EB]' },
          { label: 'Active Loans', value: activeSales, color: 'text-[#F59E0B]' },
          { label: 'Total Revenue', value: formatNaira(totalRevenue), color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card p-4">
            <p className="text-xs text-white/40">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sales table */}
      <div className="gold-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="font-semibold text-white">Recent Sales</h2>
        </div>
        {!sales?.length ? (
          <p className="text-sm text-white/40 py-4 text-center">No sales yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Phone</th>
                  <th>Selling Price</th>
                  <th>Outstanding</th>
                  <th>Next Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(sales as unknown as SaleRow[]).map((sale) => (
                  <tr key={sale.id}>
                    <td className="text-white">{getBuyerName(sale)}</td>
                    <td className="text-white/70">{getPhoneLabel(sale)}</td>
                    <td className="text-white font-mono">{formatNaira(sale.selling_price)}</td>
                    <td className="text-white font-mono">{formatNaira(sale.outstanding_balance)}</td>
                    <td className="text-white/60 text-xs">
                      {sale.next_due_date
                        ? formatDistanceToNow(new Date(sale.next_due_date), { addSuffix: true })
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${SALE_STATUS_COLORS[sale.status] ?? 'badge-neutral'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

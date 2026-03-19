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
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/agent/sub-agents"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sub-Agents
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{(profile as { full_name: string }).full_name}</h1>
          <p className="text-sm text-white/50 mt-1">
            Joined{' '}
            {formatDistanceToNow(new Date((profile as { created_at: string }).created_at), { addSuffix: true })}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize self-start ${
            STATUS_STYLES[(profile as { status: string }).status] ?? 'bg-white/10 text-white/60'
          }`}
        >
          {(profile as { status: string }).status}
        </span>
      </div>

      {/* Contact Info */}
      <div className="gold-panel p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#2563EB]" />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-white/30 shrink-0" />
            <div>
              <p className="text-xs text-white/40">Email</p>
              <p className="text-sm text-white">{(profile as { email: string }).email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-white/30 shrink-0" />
            <div>
              <p className="text-xs text-white/40">Phone</p>
              <p className="text-sm text-white">{(profile as { phone?: string }).phone ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gold-panel p-5">
          <p className="text-sm text-white/50">Total Sales</p>
          <p className="text-2xl font-bold text-white mt-1">{totalSales}</p>
        </div>
        <div className="gold-panel p-5">
          <p className="text-sm text-white/50">Active Loans</p>
          <p className="text-2xl font-bold text-[#2563EB] mt-1">{activeSales}</p>
        </div>
        <div className="gold-panel p-5">
          <p className="text-sm text-white/50">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatNaira(totalRevenue)}</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
          <h2 className="font-semibold text-white">Sales by this Sub-Agent</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">Buyer</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Price</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Outstanding</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Next Due</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sales && sales.length > 0 ? (
              (sales as unknown as SaleRow[]).map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white">{getBuyerName(s)}</td>
                  <td className="px-4 py-3 text-white/70">{getPhoneLabel(s)}</td>
                  <td className="px-4 py-3 text-white">{formatNaira(s.selling_price)}</td>
                  <td className="px-4 py-3 text-white/70">{formatNaira(s.outstanding_balance)}</td>
                  <td className="px-4 py-3 text-white/50">{s.next_due_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        SALE_STATUS_COLORS[s.status] ?? 'bg-white/10 text-white/60'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                  This sub-agent has not recorded any sales yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

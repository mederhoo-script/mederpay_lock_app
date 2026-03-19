import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'All Payments | MederBuy Admin' }

interface PaymentRow {
  id: string
  amount: number
  gateway: string
  status: string
  paid_at: string | null
  buyers: Array<{ full_name: string }> | { full_name: string } | null
  profiles: Array<{ full_name: string }> | { full_name: string } | null
}

function getBuyerName(p: PaymentRow): string {
  if (!p.buyers) return '—'
  if (Array.isArray(p.buyers)) return p.buyers[0]?.full_name ?? '—'
  return p.buyers.full_name
}

function getAgentName(p: PaymentRow): string {
  if (!p.profiles) return '—'
  if (Array.isArray(p.profiles)) return p.profiles[0]?.full_name ?? '—'
  return p.profiles.full_name
}

export default async function SuperadminPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, gateway, status, paid_at, buyers(full_name), profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const totalCollected =
    (payments as unknown as PaymentRow[] | null)
      ?.filter((p) => p.status === 'success')
      .reduce((s, p) => s + p.amount, 0) ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Payments</h1>
        <p className="text-sm text-white/50 mt-1">Every payment transaction across the platform</p>
      </div>

      <div className="gold-panel p-5 inline-block">
        <p className="text-sm text-white/50">Total Collected (platform-wide)</p>
        <p className="text-3xl font-bold text-emerald-400 mt-1">{formatNaira(totalCollected)}</p>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">Buyer</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Agent</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Gateway</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Status</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments && payments.length > 0 ? (
              (payments as unknown as PaymentRow[]).map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/80">{getBuyerName(p)}</td>
                  <td className="px-4 py-3 text-white/60">{getAgentName(p)}</td>
                  <td className="px-4 py-3 font-semibold text-white">{formatNaira(p.amount)}</td>
                  <td className="px-4 py-3 text-white/50 capitalize">{p.gateway}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'success'
                          ? 'bg-green-900/30 text-green-400'
                          : p.status === 'failed'
                            ? 'bg-red-900/30 text-red-400'
                            : 'bg-yellow-900/30 text-yellow-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {p.paid_at
                      ? formatDistanceToNow(new Date(p.paid_at), { addSuffix: true })
                      : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                  No payments recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sub-Agent Dashboard | MederBuy' }

export default async function SubagentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: mySales },
    { count: activeSales },
    { count: lockedSales },
  ] = await Promise.all([
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id)
      .eq('status', 'active'),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id)
      .eq('status', 'lock'),
  ])

  const stats = [
    { label: 'Total Sales by Me', value: mySales ?? 0, color: 'text-[#0070F3]' },
    { label: 'Active Loans', value: activeSales ?? 0, color: 'text-emerald-400' },
    { label: 'Locked Phones', value: lockedSales ?? 0, color: 'text-red-400' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Sub-Agent Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Your sales activity overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm text-white/50">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-3">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/subagent/sales"
            className="px-4 py-2 rounded-lg bg-[#0070F3]/15 text-[#0070F3] text-sm font-medium hover:bg-[#0070F3]/25 transition-colors"
          >
            View My Sales →
          </a>
          <a
            href="/subagent/logs"
            className="px-4 py-2 rounded-lg bg-white/10 text-white/60 text-sm font-medium hover:bg-white/20 hover:text-white transition-colors"
          >
            Device Logs →
          </a>
        </div>
      </div>
    </div>
  )
}

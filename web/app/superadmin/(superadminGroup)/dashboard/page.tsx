import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Superadmin Dashboard | MederBuy' }

export default async function SuperadminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: activeAgents },
    { count: pendingAgents },
    { count: totalPhones },
    { count: totalSales },
    { data: recentFees },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'agent')
      .eq('status', 'active'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'agent')
      .eq('status', 'pending'),
    supabase.from('phones').select('*', { count: 'exact', head: true }),
    supabase.from('phone_sales').select('*', { count: 'exact', head: true }),
    supabase
      .from('weekly_fees')
      .select('total_fee, status')
      .in('status', ['pending', 'overdue']),
  ])

  const outstandingFees =
    recentFees?.reduce((s, f) => s + (f.total_fee as number), 0) ?? 0

  const stats = [
    { label: 'Active Agents', value: activeAgents ?? 0, color: 'text-[#0070F3]' },
    { label: 'Pending Approval', value: pendingAgents ?? 0, color: 'text-yellow-400' },
    { label: 'Total Phones', value: totalPhones ?? 0, color: 'text-white' },
    { label: 'Total Sales', value: totalSales ?? 0, color: 'text-emerald-400' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Superadmin Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Platform-wide overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

      {/* Outstanding fees banner */}
      {outstandingFees > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-400">Outstanding Platform Fees</p>
            <p className="text-2xl font-bold text-white mt-1">{formatNaira(outstandingFees)}</p>
          </div>
          <Link
            href="/superadmin/fee-tiers"
            className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
          >
            View Fees →
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Manage Agents', href: '/superadmin/agents' },
            { label: 'View All Phones', href: '/superadmin/phones' },
            { label: 'Fee Tiers', href: '/superadmin/fee-tiers' },
            { label: 'All Payments', href: '/superadmin/payments' },
            { label: 'Settings', href: '/superadmin/settings' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {item.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

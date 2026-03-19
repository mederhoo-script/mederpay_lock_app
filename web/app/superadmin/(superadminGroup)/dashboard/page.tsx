import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  Clock,
  Smartphone,
  ShoppingBag,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

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
    {
      label: 'Active Agents',
      value: activeAgents ?? 0,
      Icon: Users,
      iconColor: 'text-[#2563EB]',
      iconBg: 'bg-[#2563EB]/12',
    },
    {
      label: 'Pending Approval',
      value: pendingAgents ?? 0,
      Icon: Clock,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/12',
    },
    {
      label: 'Total Phones',
      value: totalPhones ?? 0,
      Icon: Smartphone,
      iconColor: 'text-white/80',
      iconBg: 'bg-white/8',
    },
    {
      label: 'Total Sales',
      value: totalSales ?? 0,
      Icon: ShoppingBag,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/12',
    },
  ]

  const quickLinks = [
    { label: 'Manage Agents', href: '/superadmin/agents' },
    { label: 'View All Phones', href: '/superadmin/phones' },
    { label: 'Fee Tiers', href: '/superadmin/fee-tiers' },
    { label: 'All Payments', href: '/superadmin/payments' },
    { label: 'Settings', href: '/superadmin/settings' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Superadmin Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Platform-wide overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`stat-card p-5 animate-fade-in-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/45">{s.label}</p>
                <p className="text-3xl font-black mt-2.5 tabular-nums text-white">{s.value}</p>
              </div>
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}>
                <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Outstanding fees banner */}
      {outstandingFees > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/[0.06] p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15 mt-0.5">
              <AlertTriangle className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-400">Outstanding Platform Fees</p>
              <p className="text-2xl font-bold text-white mt-1">{formatNaira(outstandingFees)}</p>
            </div>
          </div>
          <Link
            href="/superadmin/fee-tiers"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-500/15 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/25 transition-colors"
          >
            View Fees <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white/40 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0D1432] px-4 py-3.5 text-sm font-medium text-white/70 hover:bg-[#0D1432]/80 hover:border-[#F59E0B]/30 hover:text-white transition-colors group"
            >
              <span>{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-white/25 group-hover:text-white/60 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

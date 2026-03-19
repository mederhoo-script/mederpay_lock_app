import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import {
  Smartphone,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard | MederBuy Agent' }

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

type ActivityStatus = 'success' | 'pending' | 'overdue'

interface ActivityItem {
  id: string
  label: string
  time: string
  status: ActivityStatus
}

const statusConfig: Record<ActivityStatus, { icon: React.ElementType; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  pending: { icon: Clock,        color: 'text-[#F5A623]'  },
  overdue: { icon: AlertCircle,  color: 'text-red-400'    },
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AgentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── parallel queries ───────────────────────────────────────────────────────
  const now   = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const today = now.toISOString().split('T')[0]

  // Build last-8-weeks buckets for the revenue trend chart
  const weekBuckets: { label: string; start: string; end: string }[] = []
  for (let i = 7; i >= 0; i--) {
    const weekEnd   = new Date(now)
    weekEnd.setDate(now.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    weekBuckets.push({
      label:
        weekStart.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      start: weekStart.toISOString().split('T')[0],
      end:   weekEnd.toISOString().split('T')[0] + 'T23:59:59',
    })
  }
  const trendStart = weekBuckets[0].start

  const [
    { count: totalPhones },
    { count: activeBuyers },
    { data: thisMonthPayments },
    { count: overdueCount },
    { data: recentSales },
    { data: recentPayments },
    { data: trendPayments },
  ] = await Promise.all([
    supabase
      .from('phones')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', user.id),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', user.id)
      .in('status', ['active', 'grace', 'lock']),
    supabase
      .from('payments')
      .select('amount')
      .eq('agent_id', user.id)
      .eq('status', 'success')
      .gte('paid_at', monthStart),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', user.id)
      .in('status', ['active', 'grace'])
      .lt('next_due_date', today),
    supabase
      .from('phone_sales')
      .select('id, status, created_at, buyers(full_name), phones(brand, model)')
      .eq('agent_id', user.id)
      .order('sale_date', { ascending: false })
      .limit(5),
    supabase
      .from('payments')
      .select('id, amount, status, paid_at, buyers(full_name)')
      .eq('agent_id', user.id)
      .order('paid_at', { ascending: false })
      .limit(5),
    supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('agent_id', user.id)
      .eq('status', 'success')
      .gte('paid_at', trendStart),
  ])

  // Aggregate payments into weekly buckets
  const weeklyTotals: number[] = weekBuckets.map(({ start, end }) => {
    return (trendPayments ?? [])
      .filter((p) => {
        const paidAt = (p as { paid_at: string | null }).paid_at
        if (!paidAt) return false
        return paidAt >= start && paidAt <= end
      })
      .reduce((s, p) => s + ((p as { amount: number }).amount), 0)
  })
  const maxWeekly = Math.max(...weeklyTotals, 1) // avoid division by 0

  const totalCollected =
    (thisMonthPayments ?? []).reduce((sum, p) => sum + ((p as { amount: number }).amount), 0)

  const stats = [
    {
      label: 'Total Phones',
      value: String(totalPhones ?? 0),
      sub:   'In inventory',
      iconColor: 'text-[#2563EB]',
      iconBg:    'bg-[#2563EB]/15',
      Icon: Smartphone,
    },
    {
      label: 'Active Buyers',
      value: String(activeBuyers ?? 0),
      sub:   'On repayment plan',
      iconColor: 'text-[#F59E0B]',
      iconBg:    'bg-[#F59E0B]/15',
      Icon: Users,
    },
    {
      label: 'Total Collected',
      value: formatNaira(totalCollected),
      sub:   'This month',
      iconColor: 'text-emerald-400',
      iconBg:    'bg-emerald-400/15',
      Icon: CreditCard,
    },
    {
      label: 'Overdue Payments',
      value: String(overdueCount ?? 0),
      sub:   'Require follow-up',
      iconColor: 'text-red-400',
      iconBg:    'bg-red-400/15',
      Icon: AlertCircle,
    },
  ]

  // Build recent-activity feed
  type RawSale    = { id: string; status: string; created_at: string; buyers: { full_name: string } | { full_name: string }[] | null; phones: { brand: string; model: string } | { brand: string; model: string }[] | null }
  type RawPayment = { id: string; amount: number; status: string; paid_at: string | null; buyers: { full_name: string } | { full_name: string }[] | null }

  const activity: ActivityItem[] = [
    ...((recentPayments ?? []) as unknown as RawPayment[]).map((p) => {
      const buyerName = !p.buyers ? '—' : Array.isArray(p.buyers) ? p.buyers[0]?.full_name ?? '—' : p.buyers.full_name
      return {
        id:     p.id,
        label:  `Payment received from ${buyerName} — ${formatNaira(p.amount)}`,
        time:   relativeTime(p.paid_at ?? new Date().toISOString()),
        status: p.status === 'success' ? 'success' : 'pending',
      } as ActivityItem
    }),
    ...((recentSales ?? []) as unknown as RawSale[]).map((s) => {
      const buyerName = !s.buyers ? '—' : Array.isArray(s.buyers) ? s.buyers[0]?.full_name ?? '—' : s.buyers.full_name
      const phoneLabel = !s.phones ? '—' : Array.isArray(s.phones) ? `${s.phones[0]?.brand ?? ''} ${s.phones[0]?.model ?? ''}` : `${s.phones.brand} ${s.phones.model}`
      return {
        id:     s.id + '-sale',
        label:  `New sale: ${phoneLabel} to ${buyerName}`,
        time:   relativeTime(s.created_at),
        status: s.status === 'lock' ? 'overdue' : 'success',
      } as ActivityItem
    }),
  ]
    .sort((a, b) => 0) // already ordered by recency from DB
    .slice(0, 7)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Overview of your phone financing operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`stat-card p-5 flex flex-col gap-4 animate-fade-in-up`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/45">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Revenue trend bar chart */}
        <div className="lg:col-span-3 gold-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Revenue Trend</h2>
              <p className="text-xs text-white/40 mt-0.5">Weekly collections — last 8 weeks</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#F59E0B]/15 px-2.5 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#F59E0B]">Live</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40 px-1">
            {weeklyTotals.map((total, i) => {
              const heightPct = Math.round((total / maxWeekly) * 100)
              return (
                <div key={weekBuckets[i].label} className="flex-1 flex flex-col items-center justify-end gap-1.5 group relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-white/80 bg-[#0D1432] border border-white/15 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
                    {formatNaira(total)}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-[#1D4ED8]/50 to-[#F59E0B]/70 hover:from-[#1D4ED8]/70 hover:to-[#F59E0B] transition-colors min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  />
                  <span className="text-[9px] text-white/30 truncate w-full text-center">
                    {weekBuckets[i].label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 gold-panel p-6">
          <h2 className="font-semibold text-white mb-5">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white/20" />
              </div>
              <p className="text-sm text-white/30">No activity yet</p>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {activity.map((item) => {
                const { icon: StatusIcon, color } = statusConfig[item.status]
                return (
                  <li key={item.id} className="flex items-start gap-3 rounded-lg p-2 -mx-2 transition hover:bg-white/[0.03]">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 leading-snug">{item.label}</p>
                      <p className="text-xs text-white/35 mt-0.5">{item.time}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Phone',    href: '/agent/phones/new',  Icon: Smartphone,  color: 'text-[#F59E0B]',   bg: 'bg-[#F59E0B]/10',   hoverBg: 'hover:bg-[#F59E0B]/18', border: 'border-[#F59E0B]/20' },
            { label: 'New Sale',     href: '/agent/sales/new',   Icon: TrendingUp,  color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10', hoverBg: 'hover:bg-[#2563EB]/18', border: 'border-[#2563EB]/20' },
            { label: 'Add Buyer',    href: '/agent/buyers/new',  Icon: Users,       color: 'text-[#F59E0B]',   bg: 'bg-[#F59E0B]/10',   hoverBg: 'hover:bg-[#F59E0B]/18', border: 'border-[#F59E0B]/20' },
            { label: 'Payments',     href: '/agent/payments',    Icon: CreditCard,  color: 'text-[#2563EB]',  bg: 'bg-[#2563EB]/10',  hoverBg: 'hover:bg-[#2563EB]/18', border: 'border-[#2563EB]/20' },
          ].map(({ label, href, Icon, color, bg, hoverBg, border }) => (
            <a
              key={label}
              href={href}
              className={`flex flex-col items-center gap-3 rounded-xl border ${border} p-5 ${hoverBg} transition-colors`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-semibold text-white/70">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

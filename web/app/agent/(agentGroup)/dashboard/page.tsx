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

  const [
    { count: totalPhones },
    { count: activeBuyers },
    { data: thisMonthPayments },
    { count: overdueCount },
    { data: recentSales },
    { data: recentPayments },
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
  ])

  const totalCollected =
    (thisMonthPayments ?? []).reduce((sum, p) => sum + ((p as { amount: number }).amount), 0)

  const stats = [
    {
      label: 'Total Phones',
      value: String(totalPhones ?? 0),
      sub:   'In inventory',
      iconColor: 'text-[#0070F3]',
      iconBg:    'bg-[#0070F3]/15',
      Icon: Smartphone,
    },
    {
      label: 'Active Buyers',
      value: String(activeBuyers ?? 0),
      sub:   'On repayment plan',
      iconColor: 'text-[#F5A623]',
      iconBg:    'bg-[#F5A623]/15',
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
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Overview of your phone financing operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue trend placeholder */}
        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Revenue Trend</h2>
              <p className="text-xs text-white/40 mt-0.5">Weekly collections</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#0070F3]" />
          </div>
          <div className="h-40 flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
            <p className="text-sm text-white/30">Chart coming soon</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-white mb-5">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No activity yet</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((item) => {
                const { icon: StatusIcon, color } = statusConfig[item.status]
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
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
            { label: 'Add Phone',    href: '/agent/phones/new',  Icon: Smartphone,  color: 'text-[#0070F3]',   bg: 'bg-[#0070F3]/10 hover:bg-[#0070F3]/20'    },
            { label: 'New Sale',     href: '/agent/sales/new',   Icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-400/10 hover:bg-emerald-400/20' },
            { label: 'Add Buyer',    href: '/agent/buyers/new',  Icon: Users,       color: 'text-[#F5A623]',   bg: 'bg-[#F5A623]/10 hover:bg-[#F5A623]/20'    },
            { label: 'Payments',     href: '/agent/payments',    Icon: CreditCard,  color: 'text-purple-400',  bg: 'bg-purple-400/10 hover:bg-purple-400/20'   },
          ].map(({ label, href, Icon, color, bg }) => (
            <a
              key={label}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-xl border border-white/10 p-4 ${bg} transition-colors`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs font-medium text-white/70">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

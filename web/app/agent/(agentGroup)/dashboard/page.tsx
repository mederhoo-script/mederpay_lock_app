import {
  Smartphone,
  Users,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

interface StatCard {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

const STATS: StatCard[] = [
  {
    label: 'Total Phones',
    value: '—',
    sub: 'In inventory',
    icon: Smartphone,
    iconColor: 'text-[#0070F3]',
    iconBg: 'bg-[#0070F3]/15',
  },
  {
    label: 'Active Buyers',
    value: '—',
    sub: 'On repayment plan',
    icon: Users,
    iconColor: 'text-[#F5A623]',
    iconBg: 'bg-[#F5A623]/15',
  },
  {
    label: 'Total Collected',
    value: '—',
    sub: 'This month',
    icon: CreditCard,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/15',
  },
  {
    label: 'Overdue Payments',
    value: '—',
    sub: 'Require follow-up',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/15',
  },
]

interface ActivityItem {
  id: number
  label: string
  time: string
  status: 'success' | 'pending' | 'overdue'
}

const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 1, label: 'Payment received from Emeka Obi — ₦15,000', time: '2h ago', status: 'success' },
  { id: 2, label: 'New sale: iPhone 14 to Fatima Bello', time: '5h ago', status: 'success' },
  { id: 3, label: 'Payment overdue — Chukwu Eze (Week 4)', time: '1d ago', status: 'overdue' },
  { id: 4, label: 'Weekly payment due — Aisha Musa', time: '2d ago', status: 'pending' },
  { id: 5, label: 'Payment received from Kunle Adeyemi — ₦20,000', time: '3d ago', status: 'success' },
]

const statusConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  pending: { icon: Clock, color: 'text-[#F5A623]' },
  overdue: { icon: AlertCircle, color: 'text-red-400' },
} as const

export default function AgentDashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Overview of your phone financing operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">{stat.label}</span>
                <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          )
        })}
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
          <ul className="space-y-4">
            {RECENT_ACTIVITY.map((item) => {
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
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Phone', href: '/agent/phones/new', icon: Smartphone, color: 'text-[#0070F3]', bg: 'bg-[#0070F3]/10 hover:bg-[#0070F3]/20' },
            { label: 'New Sale', href: '/agent/sales/new', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10 hover:bg-emerald-400/20' },
            { label: 'Add Buyer', href: '/agent/buyers/new', icon: Users, color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10 hover:bg-[#F5A623]/20' },
            { label: 'Record Payment', href: '/agent/payments/new', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-400/10 hover:bg-purple-400/20' },
          ].map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl border border-white/10 p-4 ${action.bg} transition-colors`}
              >
                <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-xs font-medium text-white/70">{action.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

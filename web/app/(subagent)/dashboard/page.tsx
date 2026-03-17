import {
  Smartphone,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
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
    label: 'Assigned Phones',
    value: '—',
    sub: 'In your inventory',
    icon: Smartphone,
    iconColor: 'text-[#0070F3]',
    iconBg: 'bg-[#0070F3]/15',
  },
  {
    label: 'Your Buyers',
    value: '—',
    sub: 'Active repayments',
    icon: Users,
    iconColor: 'text-[#F5A623]',
    iconBg: 'bg-[#F5A623]/15',
  },
  {
    label: 'Collected This Month',
    value: '—',
    sub: 'Total payments',
    icon: CreditCard,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/15',
  },
  {
    label: 'Overdue',
    value: '—',
    sub: 'Need follow-up',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/15',
  },
]

interface PaymentRow {
  id: number
  buyer: string
  phone: string
  amount: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
}

const UPCOMING_PAYMENTS: PaymentRow[] = [
  { id: 1, buyer: 'Emeka Obi', phone: 'Samsung A54', amount: '₦12,500', dueDate: 'Today', status: 'pending' },
  { id: 2, buyer: 'Fatima Bello', phone: 'Tecno Camon 20', amount: '₦8,000', dueDate: 'Tomorrow', status: 'pending' },
  { id: 3, buyer: 'Ayo Adewale', phone: 'iPhone 13', amount: '₦25,000', dueDate: '3 days ago', status: 'overdue' },
  { id: 4, buyer: 'Grace Okafor', phone: 'Infinix Note 30', amount: '₦9,500', dueDate: 'In 2 days', status: 'pending' },
  { id: 5, buyer: 'Sule Musa', phone: 'Xiaomi Redmi 12', amount: '₦7,000', dueDate: 'Yesterday', status: 'paid' },
]

const statusStyles: Record<PaymentRow['status'], { badge: string; icon: React.ElementType }> = {
  paid: { badge: 'bg-emerald-400/15 text-emerald-400', icon: CheckCircle2 },
  pending: { badge: 'bg-[#F5A623]/15 text-[#F5A623]', icon: Clock },
  overdue: { badge: 'bg-red-400/15 text-red-400', icon: AlertCircle },
}

export default function SubagentDashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Your assigned phones and payment collection summary
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

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Collection trend */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Collection Trend</h2>
              <p className="text-xs text-white/40 mt-0.5">Weekly payments received</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#F5A623]" />
          </div>
          <div className="h-40 flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
            <p className="text-sm text-white/30">Chart coming soon</p>
          </div>
        </div>

        {/* Upcoming / overdue payments */}
        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Upcoming Payments</h2>
            <a
              href="/subagent/payments"
              className="text-xs text-[#0070F3] hover:text-[#0070F3]/80 transition-colors"
            >
              View all →
            </a>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Buyer</th>
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Amount</th>
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Due</th>
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {UPCOMING_PAYMENTS.map((row) => {
                  const { badge, icon: StatusIcon } = statusStyles[row.status]
                  return (
                    <tr key={row.id}>
                      <td className="px-2 py-3">
                        <p className="text-white/90 font-medium">{row.buyer}</p>
                        <p className="text-xs text-white/35">{row.phone}</p>
                      </td>
                      <td className="px-2 py-3 text-white/70 font-medium">{row.amount}</td>
                      <td className="px-2 py-3 text-white/50 text-xs">{row.dueDate}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                          <StatusIcon className="w-3 h-3" />
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

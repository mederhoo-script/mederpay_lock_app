import {
  Users,
  Smartphone,
  CreditCard,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
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
    label: 'Total Agents',
    value: '—',
    sub: 'Registered agents',
    icon: Users,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/15',
  },
  {
    label: 'Active Agents',
    value: '—',
    sub: 'Approved & operating',
    icon: UserCheck,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/15',
  },
  {
    label: 'Total Phones',
    value: '—',
    sub: 'Across all agents',
    icon: Smartphone,
    iconColor: 'text-[#0070F3]',
    iconBg: 'bg-[#0070F3]/15',
  },
  {
    label: 'Total Revenue',
    value: '—',
    sub: 'Platform-wide',
    icon: CreditCard,
    iconColor: 'text-[#F5A623]',
    iconBg: 'bg-[#F5A623]/15',
  },
]

interface AgentRow {
  id: number
  name: string
  email: string
  phones: number
  status: 'active' | 'pending' | 'suspended'
}

const RECENT_AGENTS: AgentRow[] = [
  { id: 1, name: 'Chidi Nwosu', email: 'chidi@example.com', phones: 12, status: 'active' },
  { id: 2, name: 'Blessing Eze', email: 'blessing@example.com', phones: 5, status: 'pending' },
  { id: 3, name: 'Musa Aliyu', email: 'musa@example.com', phones: 9, status: 'active' },
  { id: 4, name: 'Ngozi Obi', email: 'ngozi@example.com', phones: 0, status: 'suspended' },
  { id: 5, name: 'Tunde Balogun', email: 'tunde@example.com', phones: 3, status: 'pending' },
]

const statusBadge: Record<AgentRow['status'], string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  pending: 'bg-[#F5A623]/15 text-[#F5A623]',
  suspended: 'bg-red-400/15 text-red-400',
}

const statusIcon: Record<AgentRow['status'], React.ElementType> = {
  active: CheckCircle2,
  pending: Clock,
  suspended: UserX,
}

export default function SuperadminDashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Superadmin Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Platform-wide overview and agent management
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

      {/* Charts + Agent list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue chart placeholder */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Platform Revenue</h2>
              <p className="text-xs text-white/40 mt-0.5">Monthly trend</p>
            </div>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="h-40 flex items-center justify-center rounded-lg bg-white/5 border border-dashed border-white/10">
            <p className="text-sm text-white/30">Chart coming soon</p>
          </div>
        </div>

        {/* Recent Agents */}
        <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Agents</h2>
            <a
              href="/superadmin/agents"
              className="text-xs text-[#0070F3] hover:text-[#0070F3]/80 transition-colors"
            >
              View all →
            </a>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Agent</th>
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Phones</th>
                  <th className="px-2 pb-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RECENT_AGENTS.map((agent) => {
                  const StatusIcon = statusIcon[agent.status]
                  return (
                    <tr key={agent.id}>
                      <td className="px-2 py-3">
                        <p className="text-white/90 font-medium">{agent.name}</p>
                        <p className="text-xs text-white/35">{agent.email}</p>
                      </td>
                      <td className="px-2 py-3 text-white/60">{agent.phones}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[agent.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
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

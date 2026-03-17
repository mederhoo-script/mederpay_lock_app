'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'pending' | 'active' | 'suspended'

interface Agent {
  id: string
  full_name: string
  email: string
  phone?: string
  status: AgentStatus
  phones_count: number
  buyers_count: number
  created_at: string
}

interface AgentsResponse {
  agents: Agent[]
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const STATUS_TABS: { label: string; value: AgentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
]

const STATUS_STYLES: Record<AgentStatus, string> = {
  pending:   'bg-[#F5A623]/15 text-[#F5A623]',
  active:    'bg-emerald-400/15 text-emerald-400',
  suspended: 'bg-red-400/15 text-red-400',
}

const STATUS_ICONS: Record<AgentStatus, React.ElementType> = {
  pending:   Clock,
  active:    CheckCircle2,
  suspended: XCircle,
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAgentsPage() {
  const [agents, setAgents]   = useState<Agent[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [activeTab, setActiveTab] = useState<AgentStatus | 'all'>('all')
  const [actionAgent, setActionAgent] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (activeTab !== 'all') params.set('status', activeTab)

      const res = await fetch(`/api/admin/agents?${params}`)
      if (!res.ok) throw new Error('Failed to load agents')
      const data: AgentsResponse = await res.json()
      setAgents(data.agents ?? [])
      setTotal(data.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  async function updateStatus(agentId: string, newStatus: AgentStatus) {
    setActionAgent(agentId)
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error(`Failed to ${newStatus} agent`)
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionAgent(null)
    }
  }

  async function deleteAgent(agentId: string) {
    if (!confirm('Delete this agent? All their data will be permanently removed.')) return
    setActionAgent(agentId)
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete agent')
      setAgents((prev) => prev.filter((a) => a.id !== agentId))
      setTotal((prev) => prev - 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionAgent(null)
    }
  }

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.phone?.includes(q) ?? false)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-white/50 mt-1">
            {total} registered agent{total !== 1 ? 's' : ''} on the platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-purple-600 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchAgents}
          className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-white/60">{error}</p>
            <button onClick={fetchAgents} className="text-xs text-purple-400 hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50">No agents found</p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-purple-400 hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Agent', 'Phone', 'Status', 'Phones', 'Buyers', 'Joined', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((agent) => {
                  const StatusIcon = STATUS_ICONS[agent.status]
                  const isPending  = agent.status === 'pending'
                  const isActive   = agent.status === 'active'
                  const busy       = actionAgent === agent.id

                  return (
                    <tr key={agent.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{agent.full_name}</p>
                          <p className="text-xs text-white/40">{agent.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60">{agent.phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[agent.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{agent.phones_count}</td>
                      <td className="px-4 py-3 text-white/70">{agent.buyers_count}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{formatDate(agent.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Approve (pending) */}
                          {isPending && (
                            <button
                              onClick={() => updateStatus(agent.id, 'active')}
                              disabled={busy}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          {/* Suspend (active) */}
                          {isActive && (
                            <button
                              onClick={() => updateStatus(agent.id, 'suspended')}
                              disabled={busy}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#F5A623]/15 text-[#F5A623] hover:bg-[#F5A623]/25 transition-colors disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}

                          {/* Reinstate (suspended) */}
                          {agent.status === 'suspended' && (
                            <button
                              onClick={() => updateStatus(agent.id, 'active')}
                              disabled={busy}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 transition-colors disabled:opacity-50"
                            >
                              Reinstate
                            </button>
                          )}

                          {/* View */}
                          <a
                            href={`/agents/${agent.id}`}
                            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                            title="View details"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => deleteAgent(agent.id)}
                            disabled={busy}
                            className="p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            title="Delete agent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

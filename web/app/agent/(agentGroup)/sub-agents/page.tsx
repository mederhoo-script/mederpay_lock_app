'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  UserPlus,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Users,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SubAgentStatus = 'pending' | 'active' | 'suspended'

interface SubAgent {
  id: string
  full_name: string
  email: string
  phone?: string
  status: SubAgentStatus
  phones_sold: number
  created_at: string
}

interface SubAgentsResponse {
  subagents: SubAgent[]
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

const STATUS_STYLES: Record<SubAgentStatus, string> = {
  pending:   'bg-[#F5A623]/15 text-[#F5A623]',
  active:    'bg-emerald-400/15 text-emerald-400',
  suspended: 'bg-red-400/15 text-red-400',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubAgentsPage() {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [search, setSearch]       = useState('')

  const fetchSubAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sub-agents?limit=100')
      if (!res.ok) throw new Error('Failed to load sub-agents')
      const data: SubAgentsResponse = await res.json()
      setSubAgents(data.subagents ?? [])
      setTotal(data.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubAgents() }, [fetchSubAgents])

  const filtered = subAgents.filter((sa) => {
    const q = search.toLowerCase()
    return (
      sa.full_name.toLowerCase().includes(q) ||
      sa.email.toLowerCase().includes(q) ||
      (sa.phone?.includes(q) ?? false)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sub-Agents</h1>
          <p className="text-sm text-white/50 mt-1">
            {total} sub-agent{total !== 1 ? 's' : ''} under your account
          </p>
        </div>
        <a
          href="/agent/sub-agents/new"
          className="inline-flex items-center gap-2 bg-[#0070F3] hover:bg-[#0070F3]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Sub-Agent
        </a>
      </div>

      {/* Note */}
      <div className="rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-4 py-3 flex items-start gap-3">
        <Users className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
        <p className="text-sm text-[#F5A623]/80">
          Sub-agents operate under your account and can add buyers and record payments on your behalf.
          They see only the buyers and phones assigned to them.
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
          />
        </div>
        <button
          onClick={fetchSubAgents}
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
            <button onClick={fetchSubAgents} className="text-xs text-[#0070F3] hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50">
              {search ? 'No matching sub-agents found' : 'You have no sub-agents yet'}
            </p>
            {search ? (
              <button onClick={() => setSearch('')} className="text-xs text-[#0070F3] hover:underline">
                Clear search
              </button>
            ) : (
              <a href="/agent/sub-agents/new" className="text-xs text-[#0070F3] hover:underline">
                Add your first sub-agent
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Name', 'Email', 'Phone', 'Status', 'Phones Sold', 'Joined', ''].map((h) => (
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
                {filtered.map((sa) => (
                  <tr key={sa.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{sa.full_name}</td>
                    <td className="px-4 py-3 text-white/60">{sa.email}</td>
                    <td className="px-4 py-3 text-white/60">{sa.phone ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sa.status]}`}>
                        {sa.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{sa.phones_sold}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{formatDate(sa.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/agent/sub-agents/${sa.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#0070F3] hover:text-[#0070F3]/80 transition-colors"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

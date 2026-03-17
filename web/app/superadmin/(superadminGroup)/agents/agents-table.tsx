'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

interface Agent {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: string
  created_at: string
}

interface AgentsTableProps {
  agents: Agent[]
}

function AgentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-900/30 text-green-400',
    pending: 'bg-yellow-900/30 text-yellow-400',
    suspended: 'bg-red-900/30 text-red-400',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        map[status] ?? 'bg-white/10 text-white/60'
      }`}
    >
      {status}
    </span>
  )
}

function AgentActions({ agent }: { agent: Agent }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const update = async (newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', agent.id)
    if (error) {
      toast.error('Failed to update agent status')
      return
    }
    toast.success(`Agent ${newStatus === 'active' ? 'approved' : newStatus === 'suspended' ? 'suspended' : 'reactivated'}`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-2">
      {agent.status === 'pending' && (
        <button
          onClick={() => update('active')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve
        </button>
      )}
      {agent.status === 'active' && (
        <button
          onClick={() => update('suspended')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Suspend
        </button>
      )}
      {agent.status === 'suspended' && (
        <button
          onClick={() => update('active')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reactivate
        </button>
      )}
    </div>
  )
}

export function AgentsTable({ agents }: AgentsTableProps) {
  const [filter, setFilter] = useState<string>('all')

  const filtered =
    filter === 'all' ? agents : agents.filter((a) => a.status === filter)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2">
        {['all', 'pending', 'active', 'suspended'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              filter === f
                ? 'bg-[#0070F3]/20 text-[#0070F3]'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">Name</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Email</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Status</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length > 0 ? (
              filtered.map((agent) => (
                <tr key={agent.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{agent.full_name}</td>
                  <td className="px-4 py-3 text-white/60">{agent.email}</td>
                  <td className="px-4 py-3 text-white/60">{agent.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <AgentStatusBadge status={agent.status} />
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {formatDistanceToNow(new Date(agent.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <AgentActions agent={agent} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                  No agents match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

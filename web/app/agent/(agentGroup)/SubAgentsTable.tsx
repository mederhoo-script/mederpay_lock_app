'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, Ban, Trash2 } from 'lucide-react'

interface SubAgent {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  status: string
  created_at: string
  phones_sold: number
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', pending: 'badge-warning', suspended: 'badge-neutral',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default function SubAgentsTable({ subagents: initial }: { subagents: SubAgent[] }) {
  const [subagents, setSubagents] = useState(initial)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessing(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) { toast.error(error.message); return }
      setSubagents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
      toast.success(`Sub-agent ${newStatus === 'active' ? 'approved' : 'suspended'}.`)
    } catch {
      toast.error('Action failed.')
    } finally {
      setProcessing(null)
    }
  }

  const deleteSubAgent = async (id: string) => {
    setProcessing(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) { toast.error(error.message); return }
      setSubagents(prev => prev.filter(s => s.id !== id))
      toast.success('Sub-agent removed.')
    } catch {
      toast.error('Delete failed.')
    } finally {
      setProcessing(null)
      setConfirmDelete(null)
    }
  }

  if (subagents.length === 0) {
    return (
      <div className="gold-panel p-8 text-center">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No sub-agents yet. Invite one to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Phones Sold</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subagents.map(agent => (
                <tr key={agent.id}>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{agent.full_name}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{agent.email ?? '—'}</td>
                  <td style={{ color: 'hsl(var(--muted-foreground))' }}>{agent.phone ?? '—'}</td>
                  <td><StatusBadge status={agent.status} /></td>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{agent.phones_sold}</td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {format(new Date(agent.created_at), 'MMM d, yyyy')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {agent.status !== 'active' && (
                        <button
                          onClick={() => updateStatus(agent.id, 'active')}
                          disabled={processing === agent.id}
                          className="btn btn-ghost text-xs px-2 py-1"
                          title="Approve"
                        >
                          <CheckCircle className="w-3 h-3" style={{ color: 'hsl(142 72% 60%)' }} />
                        </button>
                      )}
                      {agent.status !== 'suspended' && (
                        <button
                          onClick={() => updateStatus(agent.id, 'suspended')}
                          disabled={processing === agent.id}
                          className="btn btn-ghost text-xs px-2 py-1"
                          title="Suspend"
                        >
                          <Ban className="w-3 h-3" style={{ color: 'hsl(38 92% 62%)' }} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(agent.id)}
                        disabled={processing === agent.id}
                        className="btn btn-ghost text-xs px-2 py-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: 'hsl(0 78% 68%)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="gold-panel p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Confirm Delete</h3>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Are you sure you want to remove this sub-agent? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button
                onClick={() => deleteSubAgent(confirmDelete)}
                disabled={processing === confirmDelete}
                className="btn btn-destructive flex-1"
              >
                {processing === confirmDelete ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

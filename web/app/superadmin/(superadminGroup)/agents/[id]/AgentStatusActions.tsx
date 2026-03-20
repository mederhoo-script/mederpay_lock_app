'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Props {
  agentId: string
  currentStatus: string
}

export default function AgentStatusActions({ agentId, currentStatus }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const setStatus = async (status: 'active' | 'suspended' | 'pending') => {
    if (!confirm(`Set agent status to "${status}"?`)) return
    setLoading(true)
    const res = await fetch(`/api/agents/${agentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setLoading(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Failed to update status.', 'Update failed')
      return
    }
    toast.success(`Agent status set to "${status}".`, 'Status updated')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      {currentStatus !== 'active' && (
        <button
          onClick={() => setStatus('active')}
          disabled={loading}
          className="btn btn-primary btn-sm"
          style={{ gap: '0.375rem' }}
        >
          <CheckCircle size={14} />
          Activate
        </button>
      )}
      {currentStatus !== 'suspended' && (
        <button
          onClick={() => setStatus('suspended')}
          disabled={loading}
          className="btn btn-danger btn-sm"
          style={{ gap: '0.375rem' }}
        >
          <XCircle size={14} />
          Suspend
        </button>
      )}
      {currentStatus !== 'pending' && (
        <button
          onClick={() => setStatus('pending')}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ gap: '0.375rem' }}
        >
          <Clock size={14} />
          Set Pending
        </button>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { CreditCard } from 'lucide-react'

interface GenerateVirtualAccountButtonProps {
  saleId: string
  buyerId: string
}

export default function GenerateVirtualAccountButton({
  saleId,
  buyerId,
}: GenerateVirtualAccountButtonProps) {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/virtual-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: saleId, buyer_id: buyerId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to generate virtual account.', 'Error')
        return
      }
      toast.success('Virtual account generated successfully.', 'Done')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.', 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="btn btn-secondary btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem' }}
    >
      {loading ? (
        <><span className="spinner" style={{ width: '14px', height: '14px' }} /> Generating…</>
      ) : (
        <><CreditCard size={15} /> Generate Virtual Account</>
      )}
    </button>
  )
}

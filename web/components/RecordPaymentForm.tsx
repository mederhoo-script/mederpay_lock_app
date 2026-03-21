'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { DollarSign } from 'lucide-react'

interface RecordPaymentFormProps {
  saleId: string
  weeklyPayment: number
  outstanding: number
  saleStatus: string
}

export default function RecordPaymentForm({
  saleId,
  weeklyPayment,
  outstanding,
  saleStatus,
}: RecordPaymentFormProps) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(weeklyPayment.toString())
  const [submitting, setSubmitting] = useState(false)

  if (saleStatus === 'completed' || saleStatus === 'defaulted') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid payment amount.', 'Invalid amount')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_payment: true, amount: parsed }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? 'Failed to record payment.', 'Error')
        return
      }
      toast.success(`Payment of ₦${parsed.toLocaleString()} recorded.`, 'Payment recorded')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
        >
          <DollarSign size={15} /> Record Payment
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Outstanding: <strong style={{ color: 'var(--warning)' }}>₦{outstanding.toLocaleString()}</strong>
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label" htmlFor="pay-amount">Amount (₦)</label>
            <input
              id="pay-amount"
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={outstanding}
              step="0.01"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? <><span className="spinner" /> Saving…</> : 'Confirm Payment'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setOpen(false); setAmount(weeklyPayment.toString()) }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

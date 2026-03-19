'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, AlertCircle, DollarSign, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleStatus = 'active' | 'grace' | 'lock' | 'completed' | 'defaulted'

interface Sale {
  id: string
  status: SaleStatus
  total_amount: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  payment_weeks: number
  weekly_payment: number
  due_date: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const STATUS_STYLES: Record<SaleStatus, string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  grace: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  lock: 'bg-red-400/15 text-red-400',
  completed: 'bg-[#2563EB]/15 text-[#2563EB]',
  defaulted: 'bg-red-900/30 text-red-300',
}

const STATUS_OPTIONS: { label: string; value: SaleStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Grace Period', value: 'grace' },
  { label: 'Locked', value: 'lock' },
  { label: 'Completed', value: 'completed' },
  { label: 'Defaulted', value: 'defaulted' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="h-56 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditSalePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Status form
  const [pendingStatus, setPendingStatus] = useState<SaleStatus>('active')
  const [submittingStatus, setSubmittingStatus] = useState(false)

  useEffect(() => {
    async function fetchSale() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/sales/${params.id}`)
        if (!res.ok) throw new Error(res.status === 404 ? 'Sale not found' : 'Failed to load sale')
        const data: Sale = await res.json()
        setSale(data)
        setPaymentAmount(String(data.weekly_payment))
        setPendingStatus(data.status)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchSale()
  }, [params.id])

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    setSubmittingPayment(true)
    try {
      const res = await fetch(`/api/sales/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_payment: true, amount }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error ?? 'Failed to record payment')
      }
      const updated = await res.json()
      // Refresh sale summary
      setSale((prev) =>
        prev
          ? {
              ...prev,
              total_paid: updated.total_paid ?? prev.total_paid,
              outstanding_balance: updated.outstanding_balance ?? prev.outstanding_balance,
              weeks_paid: updated.weeks_paid ?? prev.weeks_paid,
              status: updated.status ?? prev.status,
            }
          : prev,
      )
      if (updated.status) setPendingStatus(updated.status)
      toast.success('Payment recorded successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  async function handleChangeStatus(e: React.FormEvent) {
    e.preventDefault()
    if (pendingStatus === sale?.status) {
      toast.error('Please select a different status')
      return
    }
    setSubmittingStatus(true)
    try {
      const res = await fetch(`/api/sales/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatus }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error ?? 'Failed to update status')
      }
      setSale((prev) => (prev ? { ...prev, status: pendingStatus } : prev))
      toast.success(`Status updated to ${pendingStatus}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSubmittingStatus(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.push(`/agent/sales/${params.id}`)}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sale
      </button>

      {loading ? (
        <PageSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={() => router.push('/agent/sales')}
            className="text-xs text-[#2563EB] hover:underline"
          >
            Back to sales
          </button>
        </div>
      ) : sale ? (
        <>
          {/* Current status header */}
          <div className="gold-panel p-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Manage Sale</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sale.status]}`}>
                {sale.status}
              </span>
            </div>
            <p className="text-xs font-mono text-white/40 mt-1">{sale.id}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Record payment */}
              <div className="gold-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="font-semibold text-white">Record Manual Payment</h2>
                </div>

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/50">Payment Amount (₦)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      min={1}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/50"
                    />
                    <p className="text-xs text-white/30">
                      Weekly payment: {formatCurrency(sale.weekly_payment)}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="w-full px-4 py-2.5 rounded-lg bg-emerald-400/15 text-emerald-400 text-sm font-medium hover:bg-emerald-400/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPayment ? 'Recording…' : 'Record Payment'}
                  </button>
                </form>
              </div>

              {/* Change status */}
              <div className="gold-panel p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <h2 className="font-semibold text-white">Change Sale Status</h2>
                </div>

                <form onSubmit={handleChangeStatus} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/50">New Status</label>
                    <select
                      value={pendingStatus}
                      onChange={(e) => setPendingStatus(e.target.value as SaleStatus)}
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#2563EB]/50"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#0D0D1A]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 text-xs text-white/50 space-y-1">
                    <p><span className="text-emerald-400">Active</span> — phone is unlocked, payments ongoing</p>
                    <p><span className="text-[#F59E0B]">Grace</span> — payment overdue, grace period active</p>
                    <p><span className="text-red-400">Lock</span> — phone is remotely locked</p>
                    <p><span className="text-[#2563EB]">Completed</span> — all payments received, phone returned</p>
                    <p><span className="text-red-300">Defaulted</span> — buyer has defaulted on payments</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingStatus || pendingStatus === sale.status}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#2563EB]/15 text-[#2563EB] text-sm font-medium hover:bg-[#2563EB]/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingStatus ? 'Updating…' : 'Save Status'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: summary sidebar */}
            <div className="gold-panel p-6 space-y-4 h-fit">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <h2 className="font-semibold text-white">Summary</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Total Amount</p>
                  <p className="text-base font-bold text-white">{formatCurrency(sale.total_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-400/70 mb-0.5">Total Paid</p>
                  <p className="text-base font-bold text-emerald-400">{formatCurrency(sale.total_paid)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#F59E0B]/70 mb-0.5">Outstanding</p>
                  <p className="text-base font-bold text-[#F59E0B]">{formatCurrency(sale.outstanding_balance)}</p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">Progress</span>
                    <span className="text-xs text-white/60">
                      {sale.weeks_paid}/{sale.payment_weeks}w
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2563EB] transition-all"
                      style={{
                        width: `${sale.payment_weeks > 0 ? Math.min(100, (sale.weeks_paid / sale.payment_weeks) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <a
                href={`/agent/sales/${sale.id}`}
                className="block w-full text-center px-4 py-2 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors mt-2"
              >
                View Full Sale →
              </a>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

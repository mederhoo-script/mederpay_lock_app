'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Smartphone,
  User,
  CreditCard,
  Building2,
  AlertCircle,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleStatus = 'active' | 'grace' | 'lock' | 'completed' | 'defaulted'

interface Payment {
  id: string
  amount: number
  status: string
  gateway: string
  paid_at: string | null
  created_at: string
}

interface Sale {
  id: string
  status: SaleStatus
  total_amount: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  payment_weeks: number
  weekly_payment: number
  down_payment: number
  due_date: string | null
  virtual_account_number: string | null
  virtual_account_bank: string | null
  payment_url: string | null
  created_at: string
  buyer: {
    id: string
    full_name: string
    phone: string
    email: string | null
    address: string
  } | null
  phone: {
    id: string
    imei: string
    brand: string
    model: string
    color: string | null
    storage: string | null
  } | null
  payments: Payment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const STATUS_STYLES: Record<SaleStatus, string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  grace: 'bg-[#F5A623]/15 text-[#F5A623]',
  lock: 'bg-red-400/15 text-red-400',
  completed: 'bg-[#0070F3]/15 text-[#0070F3]',
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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 rounded-xl bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
      </div>
      <div className="h-56 rounded-xl bg-white/5 animate-pulse" />
    </div>
  )
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm text-white font-medium text-right">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Record payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  // Change status state
  const [pendingStatus, setPendingStatus] = useState<SaleStatus | ''>('')
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

  async function handleRecordPayment() {
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
      toast.success('Payment recorded successfully')
      setShowPaymentForm(false)
      // Reload sale data
      const updated = await fetch(`/api/sales/${params.id}`)
      if (updated.ok) {
        const data: Sale = await updated.json()
        setSale(data)
        setPendingStatus(data.status)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  async function handleChangeStatus() {
    if (!pendingStatus || pendingStatus === sale?.status) {
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
      toast.success(`Status updated to ${pendingStatus}`)
      setSale((prev) => (prev ? { ...prev, status: pendingStatus as SaleStatus } : prev))
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
        onClick={() => router.push('/agent/sales')}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sales
      </button>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={() => router.push('/agent/sales')}
            className="text-xs text-[#0070F3] hover:underline"
          >
            Back to list
          </button>
        </div>
      ) : sale ? (
        <>
          {/* Status header */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-white">Sale</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sale.status]}`}>
                    {sale.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-white/40">{sale.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/agent/sales/${sale.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Manage Sale
                </a>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Started</p>
                <p className="text-sm text-white font-medium">{formatDate(sale.created_at)}</p>
              </div>
              {sale.due_date && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Next Due</p>
                  <p className="text-sm text-white font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    {formatDate(sale.due_date)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 mb-1">Weekly</p>
                <p className="text-sm text-white font-medium">{formatCurrency(sale.weekly_payment)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Duration</p>
                <p className="text-sm text-white font-medium">{sale.payment_weeks} weeks</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phone card */}
            {sale.phone && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0070F3]/15 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-[#0070F3]" />
                    </div>
                    <h2 className="font-semibold text-white">Phone</h2>
                  </div>
                  <a
                    href={`/agent/phones/${sale.phone.id}`}
                    className="text-xs text-[#0070F3] hover:underline"
                  >
                    View →
                  </a>
                </div>
                <DetailRow label="Model" value={`${sale.phone.brand} ${sale.phone.model}`} />
                <DetailRow label="IMEI" value={<span className="font-mono">{sale.phone.imei}</span>} />
                {sale.phone.color && <DetailRow label="Color" value={sale.phone.color} />}
                {sale.phone.storage && <DetailRow label="Storage" value={sale.phone.storage} />}
              </div>
            )}

            {/* Buyer card */}
            {sale.buyer && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F5A623]/15 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <h2 className="font-semibold text-white">Buyer</h2>
                  </div>
                  <a
                    href={`/agent/buyers/${sale.buyer.id}`}
                    className="text-xs text-[#0070F3] hover:underline"
                  >
                    View →
                  </a>
                </div>
                <DetailRow label="Name" value={sale.buyer.full_name} />
                <DetailRow label="Phone" value={sale.buyer.phone} />
                {sale.buyer.email && <DetailRow label="Email" value={sale.buyer.email} />}
                <DetailRow label="Address" value={sale.buyer.address} />
              </div>
            )}
          </div>

          {/* Payment summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="font-semibold text-white">Payment Summary</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40 mb-1">Total Amount</p>
                <p className="text-base font-bold text-white">{formatCurrency(sale.total_amount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
                <p className="text-xs text-emerald-400/70 mb-1">Total Paid</p>
                <p className="text-base font-bold text-emerald-400">{formatCurrency(sale.total_paid)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#F5A623]/5 border border-[#F5A623]/10">
                <p className="text-xs text-[#F5A623]/70 mb-1">Outstanding</p>
                <p className="text-base font-bold text-[#F5A623]">{formatCurrency(sale.outstanding_balance)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/40 mb-1">Down Payment</p>
                <p className="text-base font-bold text-white">{formatCurrency(sale.down_payment)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">Repayment Progress</span>
                <span className="text-xs text-white/70">
                  {sale.weeks_paid} / {sale.payment_weeks} weeks
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0070F3] transition-all"
                  style={{
                    width: `${sale.payment_weeks > 0 ? Math.min(100, (sale.weeks_paid / sale.payment_weeks) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowPaymentForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-400/15 text-emerald-400 text-sm font-medium hover:bg-emerald-400/25 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Record Payment
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={pendingStatus}
                  onChange={(e) => setPendingStatus(e.target.value as SaleStatus)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#0070F3]/50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0D0D1A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleChangeStatus}
                  disabled={submittingStatus || pendingStatus === sale.status}
                  className="px-4 py-2 rounded-lg bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  {submittingStatus ? 'Saving…' : 'Change Status'}
                </button>
              </div>
            </div>

            {/* Payment form */}
            {showPaymentForm && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Record Manual Payment</p>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/50">Amount (NGN)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#0070F3]/50"
                    placeholder="Enter amount"
                  />
                </div>
                <button
                  onClick={handleRecordPayment}
                  disabled={submittingPayment}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-400/15 text-emerald-400 text-sm font-medium hover:bg-emerald-400/25 transition-colors disabled:opacity-50"
                >
                  {submittingPayment ? 'Recording…' : 'Confirm Payment'}
                </button>
              </div>
            )}
          </div>

          {/* Virtual account */}
          {(sale.virtual_account_number || sale.payment_url) && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0070F3]/15 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#0070F3]" />
                </div>
                <h2 className="font-semibold text-white">Virtual Account</h2>
              </div>
              {sale.virtual_account_number && (
                <DetailRow label="Account Number" value={
                  <span className="font-mono text-lg tracking-widest">{sale.virtual_account_number}</span>
                } />
              )}
              {sale.virtual_account_bank && (
                <DetailRow label="Bank" value={sale.virtual_account_bank} />
              )}
              {sale.payment_url && (
                <DetailRow label="Payment Link" value={
                  <a
                    href={sale.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0070F3] hover:underline break-all"
                  >
                    {sale.payment_url}
                  </a>
                } />
              )}
            </div>
          )}

          {/* Payments history */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5A623]/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#F5A623]" />
                </div>
                <h2 className="font-semibold text-white">Payment History</h2>
              </div>
              <span className="text-xs text-white/40">{sale.payments.length} payment{sale.payments.length !== 1 ? 's' : ''}</span>
            </div>

            {sale.payments.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCard className="w-7 h-7 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/40">No payments recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Date</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-white/40">Amount</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Gateway</th>
                      <th className="text-left py-2 text-xs font-medium text-white/40">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 pr-4 text-white/60 whitespace-nowrap">
                          {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                        </td>
                        <td className="py-3 pr-4 text-right text-white font-medium">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 pr-4 text-white/60 capitalize">
                          {payment.gateway ?? '—'}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            payment.status === 'success'
                              ? 'bg-emerald-400/15 text-emerald-400'
                              : payment.status === 'pending'
                              ? 'bg-[#F5A623]/15 text-[#F5A623]'
                              : 'bg-red-400/15 text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

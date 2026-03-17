'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Smartphone,
  Edit2,
  Trash2,
  Lock,
  LockOpen,
  User,
  Calendar,
  CreditCard,
  AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PhoneStatus = 'available' | 'sold' | 'locked' | 'returned'
type SaleStatus  = 'active' | 'grace' | 'lock' | 'completed' | 'defaulted'

interface Phone {
  id: string
  imei: string
  brand: string
  model: string
  storage?: string
  color?: string
  status: PhoneStatus
  cost_price: number
  selling_price: number
  down_payment: number
  payment_weeks: number
  created_at: string
  sale?: {
    id: string
    status: SaleStatus
    total_amount: number
    total_paid: number
    outstanding_balance: number
    weeks_paid: number
    due_date: string
    buyer: {
      id: string
      full_name: string
      phone: string
      email?: string
      address: string
    }
  }
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

const PHONE_STATUS_STYLES: Record<PhoneStatus, string> = {
  available: 'bg-emerald-400/15 text-emerald-400',
  sold:      'bg-[#0070F3]/15 text-[#0070F3]',
  locked:    'bg-red-400/15 text-red-400',
  returned:  'bg-[#F5A623]/15 text-[#F5A623]',
}

const SALE_STATUS_STYLES: Record<SaleStatus, string> = {
  active:    'bg-emerald-400/15 text-emerald-400',
  grace:     'bg-[#F5A623]/15 text-[#F5A623]',
  lock:      'bg-red-400/15 text-red-400',
  completed: 'bg-[#0070F3]/15 text-[#0070F3]',
  defaulted: 'bg-red-900/30 text-red-300',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
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

export default function PhoneDetailPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const [phone, setPhone]   = useState<Phone | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  useEffect(() => {
    async function fetchPhone() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/phones/${params.id}`)
        if (!res.ok) throw new Error(res.status === 404 ? 'Phone not found' : 'Failed to load phone')
        const data: Phone = await res.json()
        setPhone(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchPhone()
  }, [params.id])

  async function handleLockToggle() {
    if (!phone?.sale) return
    setActionPending(true)
    try {
      const action = phone.status === 'locked' ? 'unlock' : 'lock'
      const res = await fetch(`/api/phones/${phone.id}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to ${action} phone`)
      const updated: Phone = await res.json()
      setPhone(updated)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionPending(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this phone? This cannot be undone.')) return
    setActionPending(true)
    try {
      const res = await fetch(`/api/phones/${phone?.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete phone')
      router.push('/phones')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
      setActionPending(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Phones
      </button>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-white/60">{error}</p>
          <button onClick={() => router.push('/phones')} className="text-xs text-[#0070F3] hover:underline">
            Back to list
          </button>
        </div>
      ) : phone ? (
        <>
          {/* Header card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0070F3]/15 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-[#0070F3]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {phone.brand} {phone.model}
                  </h1>
                  <p className="text-sm font-mono text-white/50 mt-0.5">{phone.imei}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${PHONE_STATUS_STYLES[phone.status]}`}>
                  {phone.status}
                </span>

                {/* Lock / Unlock (only for sold phones) */}
                {phone.sale && (
                  <button
                    onClick={handleLockToggle}
                    disabled={actionPending}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      phone.status === 'locked'
                        ? 'bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25'
                        : 'bg-red-400/15 text-red-400 hover:bg-red-400/25'
                    }`}
                  >
                    {phone.status === 'locked' ? (
                      <><LockOpen className="w-3.5 h-3.5" /> Unlock</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> Lock</>
                    )}
                  </button>
                )}

                <a
                  href={`/phones/${phone.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </a>

                {!phone.sale && (
                  <button
                    onClick={handleDelete}
                    disabled={actionPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Phone details */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <DetailRow label="IMEI" value={<span className="font-mono">{phone.imei}</span>} />
              <DetailRow label="Brand" value={phone.brand} />
              <DetailRow label="Model" value={phone.model} />
              <DetailRow label="Storage" value={phone.storage ?? '—'} />
              <DetailRow label="Color" value={phone.color ?? '—'} />
              <DetailRow label="Cost Price" value={formatCurrency(phone.cost_price)} />
              <DetailRow label="Selling Price" value={formatCurrency(phone.selling_price)} />
              <DetailRow label="Down Payment" value={formatCurrency(phone.down_payment)} />
              <DetailRow label="Payment Duration" value={`${phone.payment_weeks} weeks`} />
              <DetailRow label="Added" value={formatDate(phone.created_at)} />
            </div>
          </div>

          {/* Sale info */}
          {phone.sale ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Sale Information</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SALE_STATUS_STYLES[phone.sale.status]}`}>
                  {phone.sale.status}
                </span>
              </div>

              {/* Buyer */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
                <div className="w-9 h-9 rounded-lg bg-[#F5A623]/15 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{phone.sale.buyer.full_name}</p>
                  <p className="text-xs text-white/50">{phone.sale.buyer.phone}</p>
                  {phone.sale.buyer.email && (
                    <p className="text-xs text-white/50">{phone.sale.buyer.email}</p>
                  )}
                  <p className="text-xs text-white/40 mt-1">{phone.sale.buyer.address}</p>
                </div>
                <a
                  href={`/buyers/${phone.sale.buyer.id}`}
                  className="ml-auto text-xs text-[#0070F3] hover:underline whitespace-nowrap"
                >
                  View buyer
                </a>
              </div>

              {/* Payment progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50">Repayment Progress</span>
                  <span className="text-xs text-white/70">
                    {phone.sale.weeks_paid} / {phone.payment_weeks} weeks
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0070F3] transition-all"
                    style={{ width: `${Math.min(100, (phone.sale.weeks_paid / phone.payment_weeks) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sale details */}
              <div>
                <DetailRow label="Total Amount" value={formatCurrency(phone.sale.total_amount)} />
                <DetailRow
                  label="Total Paid"
                  value={<span className="text-emerald-400">{formatCurrency(phone.sale.total_paid)}</span>}
                />
                <DetailRow
                  label="Outstanding Balance"
                  value={<span className="text-[#F5A623]">{formatCurrency(phone.sale.outstanding_balance)}</span>}
                />
                <DetailRow
                  label="Next Due Date"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      {formatDate(phone.sale.due_date)}
                    </span>
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`/sales/${phone.sale.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0070F3]/15 text-[#0070F3] text-sm font-medium hover:bg-[#0070F3]/25 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> View Sale
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm text-white/40">This phone has not been sold yet.</p>
              <a
                href={`/sales/new?phone=${phone.id}`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0070F3] text-white text-sm font-medium rounded-lg hover:bg-[#0070F3]/90 transition-colors"
              >
                Sell this Phone
              </a>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

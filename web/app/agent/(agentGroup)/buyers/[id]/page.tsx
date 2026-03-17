'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleStatus = 'active' | 'grace' | 'lock' | 'completed' | 'defaulted'

interface SaleSummary {
  id: string
  status: SaleStatus
  selling_price: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  total_weeks: number
  next_due_date: string | null
  created_at: string
  phone: {
    brand: string
    model: string
    imei: string
  } | null
}

interface Buyer {
  id: string
  full_name: string
  phone: string
  email: string | null
  address: string
  bvn: string | null
  nin: string | null
  created_at: string
  sales: SaleSummary[]
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

const SALE_STATUS_STYLES: Record<SaleStatus, string> = {
  active: 'bg-emerald-400/15 text-emerald-400',
  grace: 'bg-[#F5A623]/15 text-[#F5A623]',
  lock: 'bg-red-400/15 text-red-400',
  completed: 'bg-[#0070F3]/15 text-[#0070F3]',
  defaulted: 'bg-red-900/30 text-red-300',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
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

export default function BuyerDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)

  // Edit form state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchBuyer() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/buyers/${params.id}`)
        if (!res.ok) throw new Error(res.status === 404 ? 'Buyer not found' : 'Failed to load buyer')
        const data: Buyer = await res.json()
        setBuyer(data)
        setForm({
          full_name: data.full_name,
          phone: data.phone,
          email: data.email ?? '',
          address: data.address,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchBuyer()
  }, [params.id])

  const hasActiveSales = (buyer?.sales ?? []).some(
    (s) => !['completed', 'defaulted'].includes(s.status),
  )

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/buyers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error ?? 'Failed to update buyer')
      }
      const updated = await res.json()
      setBuyer((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditing(false)
      toast.success('Buyer updated successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this buyer? This cannot be undone.')) return
    setActionPending(true)
    try {
      const res = await fetch(`/api/buyers/${params.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error ?? 'Failed to delete buyer')
      }
      toast.success('Buyer deleted')
      router.push('/agent/buyers')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
      setActionPending(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push('/agent/buyers')}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Buyers
      </button>

      {loading ? (
        <DetailSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={() => router.push('/agent/buyers')}
            className="text-xs text-[#0070F3] hover:underline"
          >
            Back to list
          </button>
        </div>
      ) : buyer ? (
        <>
          {/* Header card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F5A623]/15 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-[#F5A623]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{buyer.full_name}</h1>
                  <p className="text-sm text-white/50 mt-0.5">{buyer.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditing((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>

                {!hasActiveSales && (
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

            {/* Inline edit form */}
            {editing ? (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <h2 className="text-sm font-semibold text-white">Edit Buyer</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50">Full Name</label>
                    <input
                      value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50">Email (optional)</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50">Address</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0070F3] text-white text-sm font-medium hover:bg-[#0070F3]/90 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setForm({
                        full_name: buyer.full_name,
                        phone: buyer.phone,
                        email: buyer.email ?? '',
                        address: buyer.address,
                      })
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-white/10">
                <DetailRow
                  label="Phone"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-white/40" />
                      {buyer.phone}
                    </span>
                  }
                />
                {buyer.email && (
                  <DetailRow
                    label="Email"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-white/40" />
                        {buyer.email}
                      </span>
                    }
                  />
                )}
                <DetailRow
                  label="Address"
                  value={
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-white/40" />
                      {buyer.address}
                    </span>
                  }
                />
                <DetailRow
                  label="Customer Since"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-white/40" />
                      {formatDate(buyer.created_at)}
                    </span>
                  }
                />
              </div>
            )}
          </div>

          {/* Sales history */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Sales History</h2>
              <span className="text-xs text-white/40">{buyer.sales.length} sale{buyer.sales.length !== 1 ? 's' : ''}</span>
            </div>

            {buyer.sales.length === 0 ? (
              <div className="py-10 text-center">
                <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">No sales recorded for this buyer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Phone</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Status</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-white/40">Amount</th>
                      <th className="text-right py-2 pr-4 text-xs font-medium text-white/40">Balance</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Progress</th>
                      <th className="text-left py-2 pr-4 text-xs font-medium text-white/40">Due Date</th>
                      <th className="py-2 text-xs font-medium text-white/40" />
                    </tr>
                  </thead>
                  <tbody>
                    {buyer.sales.map((sale) => {
                      const progress = sale.total_weeks > 0
                        ? Math.min(100, (sale.weeks_paid / sale.total_weeks) * 100)
                        : 0
                      return (
                        <tr key={sale.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="text-white font-medium">
                              {sale.phone ? `${sale.phone.brand} ${sale.phone.model}` : '—'}
                            </p>
                            {sale.phone && (
                              <p className="text-xs font-mono text-white/40">{sale.phone.imei}</p>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${SALE_STATUS_STYLES[sale.status]}`}>
                              {sale.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right text-white">
                            {formatCurrency(sale.selling_price)}
                          </td>
                          <td className="py-3 pr-4 text-right text-[#F5A623]">
                            {formatCurrency(sale.outstanding_balance)}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#0070F3] transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/40 whitespace-nowrap">
                                {sale.weeks_paid}/{sale.total_weeks}w
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-white/60 whitespace-nowrap">
                            {sale.next_due_date ? formatDate(sale.next_due_date) : '—'}
                          </td>
                          <td className="py-3">
                            <a
                              href={`/agent/sales/${sale.id}`}
                              className="text-xs text-[#0070F3] hover:underline whitespace-nowrap"
                            >
                              View →
                            </a>
                          </td>
                        </tr>
                      )
                    })}
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

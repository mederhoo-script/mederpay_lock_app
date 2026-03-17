'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Smartphone, AlertCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Phone {
  id: string
  imei: string
  brand: string
  model: string
  storage: string | null
  color: string | null
  status: string
  cost_price: number
  selling_price: number
  down_payment: number
  payment_weeks: number
}

interface FormValues {
  brand: string
  model: string
  storage: string
  color: string
  cost_price: string
  selling_price: string
  down_payment: string
  payment_weeks: string
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditPhonePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [phone, setPhone] = useState<Phone | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormValues>({
    brand: '',
    model: '',
    storage: '',
    color: '',
    cost_price: '',
    selling_price: '',
    down_payment: '',
    payment_weeks: '',
  })

  useEffect(() => {
    async function fetchPhone() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/phones/${params.id}`)
        if (!res.ok) throw new Error(res.status === 404 ? 'Phone not found' : 'Failed to load phone')
        const data: Phone = await res.json()
        setPhone(data)
        setForm({
          brand: data.brand,
          model: data.model,
          storage: data.storage ?? '',
          color: data.color ?? '',
          cost_price: String(data.cost_price),
          selling_price: String(data.selling_price),
          down_payment: String(data.down_payment),
          payment_weeks: String(data.payment_weeks),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchPhone()
  }, [params.id])

  function setField(field: keyof FormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Basic validation
    if (!form.brand.trim() || !form.model.trim()) {
      toast.error('Brand and model are required')
      return
    }
    const costPrice = parseFloat(form.cost_price)
    const sellingPrice = parseFloat(form.selling_price)
    const downPayment = parseFloat(form.down_payment)
    const paymentWeeks = parseInt(form.payment_weeks, 10)

    if (isNaN(costPrice) || costPrice <= 0) {
      toast.error('Cost price must be a positive number')
      return
    }
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      toast.error('Selling price must be a positive number')
      return
    }
    if (isNaN(downPayment) || downPayment < 0) {
      toast.error('Down payment cannot be negative')
      return
    }
    if (isNaN(paymentWeeks) || paymentWeeks <= 0) {
      toast.error('Payment weeks must be a positive integer')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/phones/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: form.brand.trim(),
          model: form.model.trim(),
          storage: form.storage.trim() || undefined,
          color: form.color.trim() || undefined,
          cost_price: costPrice,
          selling_price: sellingPrice,
          down_payment: downPayment,
          payment_weeks: paymentWeeks,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as { error?: string }).error ?? 'Failed to update phone')
      }

      toast.success('Phone updated successfully')
      router.push(`/agent/phones/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push(`/agent/phones/${params.id}`)}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Phone
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0070F3]/15 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-[#0070F3]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Edit Phone</h1>
          <p className="text-sm text-white/50">Update phone details</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <FormSkeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-white/60">{error}</p>
          <button
            onClick={() => router.push('/agent/phones')}
            className="text-xs text-[#0070F3] hover:underline"
          >
            Back to phones
          </button>
        </div>
      ) : phone ? (
        <>
          {/* Warning for non-available phones */}
          {phone.status !== 'available' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20">
              <AlertTriangle className="w-5 h-5 text-[#F5A623] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#F5A623]">Phone is not available</p>
                <p className="text-xs text-[#F5A623]/70 mt-0.5">
                  This phone has status <span className="font-semibold capitalize">{phone.status}</span>.
                  Only available phones can be edited.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Brand <span className="text-red-400">*</span></label>
                  <input
                    value={form.brand}
                    onChange={(e) => setField('brand', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="e.g. Samsung"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Model <span className="text-red-400">*</span></label>
                  <input
                    value={form.model}
                    onChange={(e) => setField('model', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="e.g. Galaxy A54"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Storage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Storage</label>
                  <input
                    value={form.storage}
                    onChange={(e) => setField('storage', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="e.g. 128GB"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Color</label>
                  <input
                    value={form.color}
                    onChange={(e) => setField('color', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="e.g. Midnight Black"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Cost price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Cost Price (₦) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={form.cost_price}
                    onChange={(e) => setField('cost_price', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Selling price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Selling Price (₦) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={form.selling_price}
                    onChange={(e) => setField('selling_price', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Down payment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Down Payment (₦) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={form.down_payment}
                    onChange={(e) => setField('down_payment', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="0"
                    min={0}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Payment weeks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">Payment Duration (weeks) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={form.payment_weeks}
                    onChange={(e) => setField('payment_weeks', e.target.value)}
                    disabled={phone.status !== 'available'}
                    placeholder="e.g. 12"
                    min={1}
                    step={1}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#0070F3]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* IMEI (read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">IMEI (cannot be changed)</label>
                <input
                  value={phone.imei}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-lg bg-white/3 border border-white/5 text-sm font-mono text-white/40 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <button
                  type="submit"
                  disabled={submitting || phone.status !== 'available'}
                  className="px-6 py-2.5 rounded-lg bg-[#0070F3] text-white text-sm font-medium hover:bg-[#0070F3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/agent/phones/${params.id}`)}
                  className="px-6 py-2.5 rounded-lg bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  )
}

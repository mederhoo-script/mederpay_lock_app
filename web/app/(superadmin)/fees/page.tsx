'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { FeeTierSchema, type FeeTierInput } from '@/lib/validations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeTier {
  id: string
  label: string
  min_price: number
  max_price: number | null
  fee_amount: number
  created_at: string
}

interface FeeTiersResponse {
  tiers: FeeTier[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ─── Tier Form Modal ──────────────────────────────────────────────────────────

interface TierModalProps {
  initial?: FeeTier
  onClose: () => void
  onSave: (tier: FeeTier) => void
}

function TierModal({ initial, onClose, onSave }: TierModalProps) {
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeTierInput>({
    resolver: zodResolver(FeeTierSchema),
    defaultValues: initial
      ? {
          label:     initial.label,
          min_price: initial.min_price,
          max_price: initial.max_price ?? undefined,
          fee_amount: initial.fee_amount,
        }
      : undefined,
  })

  async function onSubmit(values: FeeTierInput) {
    setSaving(true)
    try {
      const url    = initial ? `/api/admin/fees/${initial.id}` : '/api/admin/fees'
      const method = initial ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed to save fee tier')
      const saved: FeeTier = await res.json()
      toast.success(initial ? 'Fee tier updated' : 'Fee tier created')
      onSave(saved)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">
            {initial ? 'Edit Fee Tier' : 'Add Fee Tier'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm text-white/60">Label</label>
            <input
              {...register('label')}
              type="text"
              placeholder="e.g. Budget, Mid-range, Premium"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {errors.label && <p className="text-xs text-red-400">{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm text-white/60">Min Price (₦)</label>
              <input
                {...register('min_price', { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {errors.min_price && <p className="text-xs text-red-400">{errors.min_price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm text-white/60">Max Price (₦)</label>
              <input
                {...register('max_price', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)) })}
                type="number"
                min={0}
                placeholder="No limit"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-white/60">Fee Amount (₦)</label>
            <input
              {...register('fee_amount', { valueAsNumber: true })}
              type="number"
              min={0}
              step={0.01}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {errors.fee_amount && <p className="text-xs text-red-400">{errors.fee_amount.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeeTiersPage() {
  const [tiers, setTiers]     = useState<FeeTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [modal, setModal]     = useState<{ open: boolean; tier?: FeeTier }>({ open: false })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTiers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/fees')
      if (!res.ok) throw new Error('Failed to load fee tiers')
      const data: FeeTiersResponse = await res.json()
      setTiers(data.tiers ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTiers() }, [fetchTiers])

  function handleSaved(saved: FeeTier) {
    setTiers((prev) => {
      const exists = prev.find((t) => t.id === saved.id)
      return exists
        ? prev.map((t) => (t.id === saved.id ? saved : t))
        : [saved, ...prev]
    })
    setModal({ open: false })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this fee tier? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/fees/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete tier')
      setTiers((prev) => prev.filter((t) => t.id !== id))
      toast.success('Fee tier deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {modal.open && (
        <TierModal
          initial={modal.tier}
          onClose={() => setModal({ open: false })}
          onSave={handleSaved}
        />
      )}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Fee Tiers</h1>
            <p className="text-sm text-white/50 mt-1">
              Platform fees charged per phone sale, based on selling price
            </p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        </div>

        {/* Info note */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <p className="text-sm text-purple-300/80">
            Fee tiers define how much the platform charges agents per sale. Tiers are matched by the
            phone&apos;s selling price — the first matching range wins. Overlapping ranges should be avoided.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-white/60">{error}</p>
              <button onClick={fetchTiers} className="text-xs text-purple-400 hover:underline">
                Try again
              </button>
            </div>
          ) : tiers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <DollarSign className="w-10 h-10 text-white/20" />
              <p className="text-sm text-white/50">No fee tiers configured yet</p>
              <button
                onClick={() => setModal({ open: true })}
                className="text-xs text-purple-400 hover:underline"
              >
                Add your first tier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Label', 'Min Price', 'Max Price', 'Fee Amount', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300">
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/80">{formatCurrency(tier.min_price)}</td>
                      <td className="px-4 py-3 text-white/80">
                        {tier.max_price != null ? formatCurrency(tier.max_price) : (
                          <span className="text-white/40 italic">No limit</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{formatCurrency(tier.fee_amount)}</span>
                        {tier.max_price && (
                          <span className="text-xs text-white/40 ml-2">
                            ({((tier.fee_amount / ((tier.min_price + tier.max_price) / 2)) * 100).toFixed(1)}% avg)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal({ open: true, tier })}
                            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tier.id)}
                            disabled={deletingId === tier.id}
                            className="p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

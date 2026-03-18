'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Smartphone } from 'lucide-react'
import { AddPhoneSchema, type AddPhoneInput } from '@/lib/validations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-white/30">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]'

function NumberField({
  label,
  hint,
  error,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  label: string
  hint?: string
  error?: string
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        type="number"
        step="1"
        min="0"
        {...props}
        className={INPUT_CLASS}
      />
    </Field>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPhonePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddPhoneInput>({
    resolver: zodResolver(AddPhoneSchema),
    defaultValues: {
      payment_weeks: 12,
      down_payment: 0,
    },
  })

  const sellingPrice = watch('selling_price') ?? 0
  const downPayment  = watch('down_payment') ?? 0
  const weeks        = watch('payment_weeks') ?? 12
  const weeklyPayment = weeks > 0 ? Math.ceil((sellingPrice - downPayment) / weeks) : 0

  async function onSubmit(values: AddPhoneInput) {
    setSaving(true)
    try {
      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add phone')
        return
      }

      toast.success('Phone added to inventory')
      router.push('/agent/phones')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Phones
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Add Phone to Inventory</h1>
        <p className="text-sm text-white/50 mt-1">Register a new device for BNPL sale</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Device Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#0070F3]" />
            Device Information
          </h2>

          <Field label="IMEI Number *" hint="15-digit IMEI from the box or dial *#06#" error={errors.imei?.message}>
            <input
              {...register('imei')}
              type="text"
              maxLength={15}
              placeholder="e.g. 357298060033426"
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand *" error={errors.brand?.message}>
              <input
                {...register('brand')}
                type="text"
                placeholder="e.g. Samsung"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Model *" error={errors.model?.message}>
              <input
                {...register('model')}
                type="text"
                placeholder="e.g. Galaxy A54"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Storage" error={errors.storage?.message}>
              <input
                {...register('storage')}
                type="text"
                placeholder="e.g. 128GB"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Color" error={errors.color?.message}>
              <input
                {...register('color')}
                type="text"
                placeholder="e.g. Graphite"
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="font-semibold text-white">Pricing & Payment Plan</h2>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              {...register('cost_price', { valueAsNumber: true })}
              label="Cost Price (₦) *"
              placeholder="0"
              error={errors.cost_price?.message}
            />
            <NumberField
              {...register('selling_price', { valueAsNumber: true })}
              label="Selling Price (₦) *"
              placeholder="0"
              error={errors.selling_price?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              {...register('down_payment', { valueAsNumber: true })}
              label="Down Payment (₦)"
              placeholder="0"
              error={errors.down_payment?.message}
            />
            <NumberField
              {...register('payment_weeks', { valueAsNumber: true })}
              label="Payment Weeks *"
              placeholder="12"
              min="1"
              max="104"
              error={errors.payment_weeks?.message}
            />
          </div>

          {/* Computed weekly */}
          {sellingPrice > 0 && (
            <div className="rounded-lg bg-[#0070F3]/10 border border-[#0070F3]/20 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Computed weekly payment</span>
              <span className="text-sm font-bold text-[#0070F3]">
                ₦{weeklyPayment.toLocaleString('en-NG')}/week × {weeks} weeks
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0070F3] hover:bg-[#0070F3]/90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <Smartphone className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add Phone'}
          </button>
        </div>
      </form>
    </div>
  )
}

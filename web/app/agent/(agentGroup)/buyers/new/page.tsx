'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react'
import { RegisterBuyerSchema, type RegisterBuyerInput } from '@/lib/validations'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function MaskedInput({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className="w-full pr-10 pl-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </Field>
  )
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewBuyerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterBuyerInput>({
    resolver: zodResolver(RegisterBuyerSchema),
  })

  async function onSubmit(values: RegisterBuyerInput) {
    setSaving(true)
    try {
      const res = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add buyer')
        return
      }

      toast.success('Buyer added successfully')
      router.push('/agent/buyers')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Buyers
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Buyer</h1>
        <p className="text-sm text-white/50 mt-1">Register a buyer to record a phone sale</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#0070F3]" />
            Personal Information
          </h2>

          <Field label="Full Name *" error={errors.full_name?.message}>
            <input
              {...register('full_name')}
              type="text"
              placeholder="e.g. Aminu Musa"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Phone Number *" error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="tel"
              placeholder="e.g. 08012345678"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Email Address" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="buyer@email.com (optional)"
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Home Address *" error={errors.address?.message}>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Full home address"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3] resize-none"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white">Identity Verification</h2>
            <p className="text-xs text-white/40 mt-1">Optional but recommended. Encrypted at rest.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MaskedInput
              {...register('bvn')}
              label="BVN (11 digits)"
              placeholder="Enter BVN"
              maxLength={11}
              error={errors.bvn?.message}
            />
            <MaskedInput
              {...register('nin')}
              label="NIN (11 digits)"
              placeholder="Enter NIN"
              maxLength={11}
              error={errors.nin?.message}
            />
          </div>
        </div>

        {/* Hidden phone_id — not required when adding a buyer standalone */}
        <input type="hidden" {...register('phone_id')} value="" />

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
            <UserPlus className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add Buyer'}
          </button>
        </div>
      </form>
    </div>
  )
}

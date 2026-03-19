'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, UserPlus, Copy, CheckCheck } from 'lucide-react'
import { CreateSubAgentSchema, type CreateSubAgentInput } from '@/lib/validations'

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
  'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]'

// ─── Success card ─────────────────────────────────────────────────────────────

function SuccessCard({
  fullName,
  email,
  tempPassword,
  onDone,
}: {
  fullName: string
  email: string
  tempPassword: string
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyPassword() {
    navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-400/15 flex items-center justify-center">
            <CheckCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Sub-agent created!</p>
            <p className="text-sm text-white/50">{fullName} can now log in with the credentials below.</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/50">Email</span>
            <span className="text-sm text-white font-mono">{email}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-white/50">Temp Password</span>
            <div className="flex items-center gap-2">
              <code className="text-sm text-[#F59E0B] font-mono bg-[#F59E0B]/10 px-2 py-1 rounded">
                {tempPassword}
              </code>
              <button
                onClick={copyPassword}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#F59E0B]/70 pt-1 border-t border-white/10">
          Share these credentials with the sub-agent. They should change their password on first login.
        </p>
      </div>

      <button
        onClick={onDone}
        className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Back to Sub-Agents
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewSubAgentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<{
    fullName: string
    email: string
    tempPassword: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSubAgentInput>({
    resolver: zodResolver(CreateSubAgentSchema),
  })

  async function onSubmit(values: CreateSubAgentInput) {
    setSaving(true)
    try {
      const res = await fetch('/api/sub-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create sub-agent')
        return
      }

      setCreated({
        fullName: values.full_name,
        email: values.email,
        tempPassword: data.temp_password,
      })
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <div className="p-6 lg:p-8">
        <SuccessCard
          fullName={created.fullName}
          email={created.email}
          tempPassword={created.tempPassword}
          onDone={() => router.push('/agent/sub-agents')}
        />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sub-Agents
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Add Sub-Agent</h1>
        <p className="text-sm text-white/50 mt-1">
          Sub-agents can add buyers and record sales on your behalf.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="gold-panel p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#2563EB]" />
            Sub-Agent Details
          </h2>

          <Field label="Full Name *" error={errors.full_name?.message}>
            <input
              {...register('full_name')}
              type="text"
              placeholder="e.g. Fatima Aliyu"
              className={INPUT_CLASS}
            />
          </Field>

          <Field
            label="Email Address *"
            hint="The sub-agent will log in with this email."
            error={errors.email?.message}
          >
            <input
              {...register('email')}
              type="email"
              placeholder="subagent@email.com"
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            {saving ? 'Creating…' : 'Create Sub-Agent'}
          </button>
        </div>
      </form>
    </div>
  )
}

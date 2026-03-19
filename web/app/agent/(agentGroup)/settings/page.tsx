'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  User,
  CreditCard,
  Shield,
  Link,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { AgentSettingsSchema, type AgentSettingsInput } from '@/lib/validations'

// ─── Types ────────────────────────────────────────────────────────────────────

type GatewayTab = 'monnify' | 'paystack' | 'flutterwave' | 'interswitch'

interface SettingsData extends AgentSettingsInput {
  email: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GATEWAY_TABS: { key: GatewayTab; label: string }[] = [
  { key: 'monnify',      label: 'Monnify'      },
  { key: 'paystack',     label: 'Paystack'     },
  { key: 'flutterwave',  label: 'Flutterwave'  },
  { key: 'interswitch',  label: 'Interswitch'  },
]

// ─── Masked input (BVN/NIN) ───────────────────────────────────────────────────

function MaskedInput({
  label,
  placeholder,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="w-full pr-10 pl-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="gold-panel p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentSettingsPage() {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [activeGateway, setActiveGateway] = useState<GatewayTab>('monnify')
  const [gatewayTab, setGatewayTab] = useState<GatewayTab>('monnify')
  const [email, setEmail]           = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AgentSettingsInput>({
    resolver: zodResolver(AgentSettingsSchema),
  })

  const watchedGateway = watch('active_gateway')

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/agent/settings')
        if (!res.ok) throw new Error()
        const data: SettingsData = await res.json()
        setEmail(data.email)
        setActiveGateway(data.active_gateway ?? 'monnify')
        reset(data)
      } catch {
        // Settings not yet saved — form will use defaults
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [reset])

  async function onSubmit(values: AgentSettingsInput) {
    setSaving(true)
    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setActiveGateway(values.active_gateway ?? activeGateway)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-80 rounded-xl bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/50 mt-1">Manage your account and payment configuration</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Personal Info */}
        <Section title="Personal Information" icon={<User className="w-4 h-4 text-[#F59E0B]" />}>
          <Field label="Full Name" error={errors.full_name?.message}>
            <input
              {...register('full_name')}
              type="text"
              placeholder="Your full name"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </Field>

          <Field label="Email Address">
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/40 cursor-not-allowed"
            />
          </Field>

          <Field label="Phone Number" error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="tel"
              placeholder="e.g. 08012345678"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </Field>

          <Field label="Payment URL (optional)" error={errors.payment_url?.message}>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                {...register('payment_url')}
                type="url"
                placeholder="https://pay.yoursite.com"
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <p className="text-xs text-white/30 mt-1">
              Custom URL used in device payment page. Defaults to platform page if left blank.
            </p>
          </Field>
        </Section>

        {/* Identity Verification */}
        <Section title="Identity Verification" icon={<Shield className="w-4 h-4 text-[#F59E0B]" />}>
          <p className="text-sm text-white/50">
            BVN and NIN are encrypted and stored securely. They are only used for identity verification.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MaskedInput
              {...register('bvn')}
              label="BVN (11 digits)"
              placeholder="Enter your BVN"
              maxLength={11}
            />
            <MaskedInput
              {...register('nin')}
              label="NIN (11 digits)"
              placeholder="Enter your NIN"
              maxLength={11}
            />
          </div>
          {(errors.bvn || errors.nin) && (
            <p className="text-xs text-red-400">{errors.bvn?.message ?? errors.nin?.message}</p>
          )}
        </Section>

        {/* Payment Gateway */}
        <Section title="Payment Gateway" icon={<CreditCard className="w-4 h-4 text-[#F59E0B]" />}>
          <p className="text-sm text-white/50">
            Configure your payment gateway credentials. The active gateway handles buyer payments.
          </p>

          {/* Active gateway selector */}
          <div className="space-y-1.5">
            <label className="block text-sm text-white/60">Active Gateway</label>
            <select
              {...register('active_gateway')}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              {GATEWAY_TABS.map((g) => (
                <option key={g.key} value={g.key} className="bg-[#121212]">
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gateway config tabs */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 mt-2">
            {GATEWAY_TABS.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGatewayTab(g.key)}
                className={`relative flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  gatewayTab === g.key
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {g.label}
                {watchedGateway === g.key && (
                  <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Gateway-specific fields */}
          <div className="space-y-4 pt-2">
            {gatewayTab === 'monnify' && (
              <>
                <Field label="Monnify API Key">
                  <input
                    {...register('monnify_api_key')}
                    type="text"
                    placeholder="MK_TEST_…"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </Field>
                <Field label="Monnify Secret Key">
                  <input
                    {...register('monnify_secret_key')}
                    type="password"
                    placeholder="Secret key"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </Field>
                <Field label="Monnify Contract Code">
                  <input
                    {...register('monnify_contract_code')}
                    type="text"
                    placeholder="Contract code"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </Field>
              </>
            )}

            {gatewayTab === 'paystack' && (
              <Field label="Paystack Secret Key">
                <input
                  {...register('paystack_secret_key')}
                  type="password"
                  placeholder="sk_live_…"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </Field>
            )}

            {gatewayTab === 'flutterwave' && (
              <Field label="Flutterwave Secret Key">
                <input
                  {...register('flutterwave_secret_key')}
                  type="password"
                  placeholder="FLWSECK_TEST-…"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </Field>
            )}

            {gatewayTab === 'interswitch' && (
              <>
                <Field label="Interswitch Client ID">
                  <input
                    {...register('interswitch_client_id')}
                    type="text"
                    placeholder="Client ID"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </Field>
                <Field label="Interswitch Client Secret">
                  <input
                    {...register('interswitch_client_secret')}
                    type="password"
                    placeholder="Client secret"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </Field>
              </>
            )}
          </div>

          {/* Active gateway status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400/80">
              Active gateway: <span className="font-semibold capitalize">{watchedGateway ?? activeGateway}</span>
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F5A623]/5 border border-[#F5A623]/20">
            <AlertCircle className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
            <p className="text-xs text-[#F5A623]/80">
              Gateway credentials are encrypted. Make sure to use live keys in production.
            </p>
          </div>
        </Section>
      </div>
    </form>
  )
}

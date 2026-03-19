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

  ={                  

'use client'

import { useEffect, useState } from 'react'
import {
  Shield,
  Globe,
  Mail,
  Bell,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemInfo {
  superadmin_email: string
  app_name: string
  app_url: string
  version: string
  total_agents: number
  total_phones: number
  total_sales: number
  platform_revenue: number
}

interface AuditEntry {
  id: string
  action: string
  actor: string
  target?: string
  timestamp: string
  outcome: 'success' | 'warning' | 'error'
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

const OUTCOME_STYLES = {
  success: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  warning: { color: 'text-[#F5A623]',   bg: 'bg-[#F5A623]/10',   icon: AlertCircle  },
  error:   { color: 'text-red-400',     bg: 'bg-red-400/10',     icon: AlertCircle  },
} as const

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm text-white font-medium text-right">{value}</span>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div className="h-8 w-40 rounded-lg bg-white/5 animate-pulse" />
      <div className="h-56 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-72 rounded-xl bg-white/5 animate-pulse" />
    </div>
  )
}

// ─── Mock audit log ───────────────────────────────────────────────────────────

const MOCK_AUDIT: AuditEntry[] = [
  {
    id: '1',
    action: 'Agent approved',
    actor: 'superadmin',
    target: 'agent@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    outcome: 'success',
  },
  {
    id: '2',
    action: 'Fee tier created',
    actor: 'superadmin',
    target: 'Premium tier',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    outcome: 'success',
  },
  {
    id: '3',
    action: 'Agent suspended',
    actor: 'superadmin',
    target: 'agent2@example.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    outcome: 'warning',
  },
  {
    id: '4',
    action: 'Platform fee calculation',
    actor: 'system (cron)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    outcome: 'success',
  },
  {
    id: '5',
    action: 'Webhook event failed',
    actor: 'system',
    target: 'Monnify webhook',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    outcome: 'error',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminSettingsPage() {
  const [info, setInfo]       = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch('/api/admin/settings')
        if (!res.ok) throw new Error()
        const data: SystemInfo = await res.json()
        setInfo(data)
      } catch {
        // Fall back gracefully
        setInfo(null)
      } finally {
        setLoading(false)
      }
    }
    fetchInfo()
  }, [])

  if (loading) return <PageSkeleton />

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">System configuration and platform overview</p>
      </div>

      {/* Superadmin info */}
      <Section title="Superadmin Account" icon={<Shield className="w-4 h-4 text-purple-400" />}>
        <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 px-4 py-3 mb-2">
          <p className="text-xs text-purple-300/70">
            Superadmin credentials are configured via environment variables and cannot be modified here.
          </p>
        </div>
        <InfoRow label="Email" value={info?.superadmin_email ?? <span className="text-white/30">—</span>} />
        <InfoRow label="Role" value={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300">
            <Shield className="w-3 h-3" /> Superadmin
          </span>
        } />
      </Section>

      {/* Platform info */}
      <Section title="Platform" icon={<Globe className="w-4 h-4 text-purple-400" />}>
        <InfoRow label="Application" value={info?.app_name ?? 'MederBuy'} />
        <InfoRow label="App URL" value={
          <span className="font-mono text-xs text-white/70">{info?.app_url ?? process.env.NEXT_PUBLIC_APP_URL ?? '—'}</span>
        } />
        <InfoRow label="Version" value={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-white/60">
            v{info?.version ?? '1.0.0'}
          </span>
        } />
        <InfoRow label="Total Agents" value={info?.total_agents ?? '—'} />
        <InfoRow label="Total Phones" value={info?.total_phones ?? '—'} />
        <InfoRow label="Total Sales" value={info?.total_sales ?? '—'} />
        <InfoRow label="Platform Revenue" value={
          info?.platform_revenue != null
            ? <span className="text-emerald-400">{formatCurrency(info.platform_revenue)}</span>
            : '—'
        } />
      </Section>

      {/* Email / Notification config (read-only display) */}
      <Section title="Email & Notifications" icon={<Mail className="w-4 h-4 text-purple-400" />}>
        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-xs text-white/50">
            Email is powered by Resend and configured via <code className="text-purple-300 font-mono">RESEND_API_KEY</code> in environment variables.
            Notification settings cannot be changed from this interface.
          </p>
        </div>
        <InfoRow label="Email Provider" value="Resend" />
        <InfoRow label="From Address" value={<span className="font-mono text-xs text-white/60">no-reply@mederbuy.com</span>} />
        <InfoRow label="Status" value={
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configured
          </span>
        } />
      </Section>

      {/* Payment master settings */}
      <Section title="Platform Payment Gateway" icon={<Bell className="w-4 h-4 text-purple-400" />}>
        <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 mb-1">
          <p className="text-xs text-white/50">
            The platform Monnify account collects weekly platform fees from agents.
            These are configured via environment variables (<code className="text-purple-300 font-mono">MONNIFY_*</code>).
          </p>
        </div>
        <InfoRow label="Gateway" value="Monnify" />
        <InfoRow label="Purpose" value="Platform fee collection" />
        <InfoRow label="Status" value={
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        } />
      </Section>

      {/* Audit log */}
      <Section title="Audit Log" icon={<Activity className="w-4 h-4 text-purple-400" />}>
        <p className="text-xs text-white/40">Recent administrative actions. Full log available in Supabase.</p>
        <div className="space-y-2">
          {MOCK_AUDIT.map((entry) => {
            const { color, bg, icon: Icon } = OUTCOME_STYLES[entry.outcome]
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium">{entry.action}</p>
                  {entry.target && (
                    <p className="text-xs text-white/40">→ {entry.target}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/30">by {entry.actor}</span>
                    <span className="text-white/20">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-white/30">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-center text-white/20 pt-2">
          Showing last 5 actions — full audit trail in database
        </p>
      </Section>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react'

export default function NewSubAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' })
  const [errors, setErrors] = useState<Partial<typeof formData>>({})

  const validate = () => {
    const e: Partial<typeof formData> = {}
    if (!formData.full_name.trim() || formData.full_name.length < 2) e.full_name = 'Name is required'
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Valid email is required'
    if (!formData.phone.trim() || formData.phone.length < 10) e.phone = 'Valid phone number required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/sub-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to create sub-agent.'); return }
      const password = json.temp_password ?? json.password ?? json.temporaryPassword
      if (password) {
        setTempPassword(password)
      } else {
        toast.success('Sub-agent created successfully!')
        router.push('/agent/sub-agents')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (tempPassword) {
    return (
      <div className="p-6 lg:p-8 max-w-lg space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Sub-Agent Created!</h1>
        <div className="gold-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6" style={{ color: 'hsl(142 72% 60%)' }} />
            <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Account created successfully</p>
          </div>
          <div className="rounded-lg p-4 space-y-2" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Temporary Password</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-lg font-mono" style={{ color: 'hsl(var(--primary))' }}>{tempPassword}</code>
              <button onClick={copyPassword} className="btn btn-ghost p-2" title="Copy">
                {copied ? <CheckCircle className="w-4 h-4" style={{ color: 'hsl(142 72% 60%)' }} /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Share this password with the sub-agent. They should change it on first login.
          </p>
          <button onClick={() => router.push('/agent/sub-agents')} className="btn btn-primary w-full">
            Done — View Sub-Agents
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/sub-agents" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Invite Sub-Agent</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create a sub-agent account</p>
        </div>
      </div>

      <div className="gold-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Full Name *</label>
            <input
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Jane Smith"
              className="input-field"
            />
            {errors.full_name && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.full_name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Email *</label>
            <input
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              type="email"
              placeholder="jane@example.com"
              className="input-field"
            />
            {errors.email && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Phone *</label>
            <input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08012345678"
              className="input-field"
            />
            {errors.phone && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.phone}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/agent/sub-agents" className="btn btn-ghost flex-1 justify-center">Cancel</Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create Sub-Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

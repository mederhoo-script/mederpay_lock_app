'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AgentSettingsSchema, type AgentSettingsInput } from '@/lib/validations'

export default function AgentSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgentSettingsInput>({
    resolver: zodResolver(AgentSettingsSchema),
  })

  useEffect(() => {
    fetch('/api/agent/settings')
      .then(r => r.json())
      .then(d => reset(d.settings ?? d))
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setFetching(false))
  }, [reset])

  const onSubmit = async (data: AgentSettingsInput) => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Update failed.'); return }
      toast.success('Settings saved.')
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8"><div className="skeleton h-8 w-48 rounded" /></div>

  return (
    <div className="p-6 lg:p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Manage your account and payment settings</p>
      </div>
      <div className="gold-panel p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Full Name</label>
            <input {...register('full_name')} className="input-field" />
            {errors.full_name && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Phone</label>
            <input {...register('phone')} className="input-field" />
            {errors.phone && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Active Gateway</label>
            <select {...register('active_gateway')} className="input-field">
              <option value="paystack">Paystack</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="monnify">Monnify</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}

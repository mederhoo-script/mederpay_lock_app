'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AgentSettingsSchema, type AgentSettingsInput } from '@/lib/validations'
import { useToast } from '@/components/Toast'

const GATEWAYS = [
  { value: 'monnify', label: 'Monnify' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'flutterwave', label: 'Flutterwave' },
  { value: 'interswitch', label: 'Interswitch' },
]

export default function AgentSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gateway, setGateway] = useState('')
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AgentSettingsInput>({ resolver: zodResolver(AgentSettingsSchema) })

  const watchedGateway = watch('active_gateway')

  useEffect(() => {
    fetch('/api/agent/settings')
      .then((r) => r.json())
      .then((data) => {
        reset(data)
        setGateway(data.active_gateway ?? '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [reset])

  useEffect(() => {
    if (watchedGateway) setGateway(watchedGateway)
  }, [watchedGateway])

  const onSubmit = async (data: AgentSettingsInput) => {
    setSaving(true)
    const res = await fetch('/api/agent/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Failed to save settings.', 'Save failed')
      return
    }
    toast.success('Settings saved successfully!', 'Settings saved')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile and payment gateway</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
        {/* Profile Section */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input type="text" className="input" {...register('full_name')} />
                {errors.full_name && <span className="field-error">{errors.full_name.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input type="tel" className="input" {...register('phone')} />
                {errors.phone && <span className="field-error">{errors.phone.message}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">BVN (optional)</label>
                <input type="text" className="input" maxLength={11} {...register('bvn')} />
                {errors.bvn && <span className="field-error">{errors.bvn.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">NIN (optional)</label>
                <input type="text" className="input" maxLength={11} {...register('nin')} />
                {errors.nin && <span className="field-error">{errors.nin.message}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway Section */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Payment Gateway</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Active Gateway</label>
              <select className="select" {...register('active_gateway')}>
                <option value="">Select a gateway…</option>
                {GATEWAYS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {gateway === 'monnify' && (
              <>
                <div className="form-group">
                  <label className="label">Monnify API Key</label>
                  <input type="text" className="input" {...register('monnify_api_key')} />
                </div>
                <div className="form-group">
                  <label className="label">Monnify Secret Key</label>
                  <input type="password" className="input" autoComplete="off" {...register('monnify_secret_key')} />
                </div>
                <div className="form-group">
                  <label className="label">Monnify Contract Code</label>
                  <input type="text" className="input" {...register('monnify_contract_code')} />
                </div>
              </>
            )}

            {gateway === 'paystack' && (
              <div className="form-group">
                <label className="label">Paystack Secret Key</label>
                <input type="password" className="input" autoComplete="off" {...register('paystack_secret_key')} />
              </div>
            )}

            {gateway === 'flutterwave' && (
              <div className="form-group">
                <label className="label">Flutterwave Secret Key</label>
                <input type="password" className="input" autoComplete="off" {...register('flutterwave_secret_key')} />
              </div>
            )}

            {gateway === 'interswitch' && (
              <>
                <div className="form-group">
                  <label className="label">Interswitch Client ID</label>
                  <input type="text" className="input" {...register('interswitch_client_id')} />
                </div>
                <div className="form-group">
                  <label className="label">Interswitch Client Secret</label>
                  <input type="password" className="input" autoComplete="off" {...register('interswitch_client_secret')} />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="label">Payment URL (optional)</label>
              <input type="url" className="input" placeholder="https://" {...register('payment_url')} />
              {errors.payment_url && <span className="field-error">{errors.payment_url.message}</span>}
            </div>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FeeTierSchema, type FeeTierInput } from '@/lib/validations'
import { formatNaira, nairaToKobo, koboToNaira } from '@/lib/utils'
import { Plus, Trash2, Layers } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface FeeTier {
  id: string
  label: string
  min_price: number
  max_price: number | null
  fee_amount: number
}

export default function FeeTiersPage() {
  const [tiers, setTiers] = useState<FeeTier[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FeeTierInput>({
    resolver: zodResolver(FeeTierSchema),
  })

  const fetchTiers = async () => {
    const res = await fetch('/api/fees/tiers')
    const data = await res.json()
    setTiers(data.tiers ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTiers() }, [])

  const onSubmit = async (data: FeeTierInput) => {
    const payload = {
      label: data.label,
      min_price: nairaToKobo(data.min_price),
      max_price: data.max_price != null ? nairaToKobo(data.max_price) : null,
      fee_amount: nairaToKobo(data.fee_amount),
    }
    const res = await fetch('/api/fees/tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Failed to create tier.', 'Error')
      return
    }
    toast.success('Fee tier created!', 'Tier added')
    reset()
    fetchTiers()
  }

  const deleteTier = async (id: string) => {
    if (!confirm('Delete this fee tier?')) return
    setDeleting(id)
    const res = await fetch(`/api/fees/tiers?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) {
      toast.error('Failed to delete tier.', 'Error')
    } else {
      toast.success('Fee tier deleted.', 'Tier removed')
    }
    fetchTiers()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fee Tiers</h1>
          <p>Configure platform fee tiers by phone price range</p>
        </div>
      </div>

      {/* Add Tier Form */}
      <div className="card" style={{ maxWidth: '600px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Add New Tier</h2>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Label</label>
            <input type="text" className="input" placeholder="e.g. Budget phones" {...register('label')} />
            {errors.label && <span className="field-error">{errors.label.message}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Min Price (₦)</label>
              <input type="number" className="input" placeholder="0" min={0} step={0.01} {...register('min_price', { valueAsNumber: true })} />
              {errors.min_price && <span className="field-error">{errors.min_price.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Max Price (₦, optional)</label>
              <input type="number" className="input" placeholder="∞" min={0} step={0.01} {...register('max_price', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)) })} />
            </div>
            <div className="form-group">
              <label className="label">Fee Amount (₦)</label>
              <input type="number" className="input" placeholder="500" min={0} step={0.01} {...register('fee_amount', { valueAsNumber: true })} />
              {errors.fee_amount && <span className="field-error">{errors.fee_amount.message}</span>}
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Adding…</> : <><Plus size={15} /> Add Tier</>}
            </button>
          </div>
        </form>
      </div>

      {/* Tiers Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Current Fee Tiers</h2>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : tiers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Min Price</th>
                  <th>Max Price</th>
                  <th>Fee Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id}>
                    <td style={{ fontWeight: 500 }}>{tier.label}</td>
                    <td>{formatNaira(tier.min_price)}</td>
                    <td>{tier.max_price != null ? formatNaira(tier.max_price) : <span style={{ color: 'var(--text-secondary)' }}>No limit</span>}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 500 }}>{formatNaira(tier.fee_amount)}</td>
                    <td>
                      <button
                        onClick={() => deleteTier(tier.id)}
                        disabled={deleting === tier.id}
                        className="btn btn-danger btn-sm"
                      >
                        {deleting === tier.id ? <span className="spinner" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Layers size={32} />
            <p>No fee tiers configured yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

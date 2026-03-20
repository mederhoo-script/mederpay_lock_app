'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AddPhoneSchema, type AddPhoneInput } from '@/lib/validations'
import { nairaToKobo } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export default function NewPhonePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddPhoneInput>({
    resolver: zodResolver(AddPhoneSchema),
    defaultValues: { payment_weeks: 12, down_payment: 0 },
  })

  const onSubmit = async (data: AddPhoneInput) => {
    setServerError('')
    const payload = {
      ...data,
      cost_price: nairaToKobo(data.cost_price),
      selling_price: nairaToKobo(data.selling_price),
      down_payment: nairaToKobo(data.down_payment),
    }
    const res = await fetch('/api/phones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setServerError(json.error ?? 'Failed to add phone.')
      return
    }
    router.push('/agent/phones')
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/phones" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>Add New Phone</h1>
            <p>Register a phone to your inventory</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{serverError}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="label">IMEI (15 digits)</label>
            <input type="text" className="input" placeholder="123456789012345" maxLength={15} {...register('imei')} />
            {errors.imei && <span className="field-error">{errors.imei.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Brand</label>
              <input type="text" className="input" placeholder="Samsung" {...register('brand')} />
              {errors.brand && <span className="field-error">{errors.brand.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Model</label>
              <input type="text" className="input" placeholder="Galaxy A54" {...register('model')} />
              {errors.model && <span className="field-error">{errors.model.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Storage (optional)</label>
              <input type="text" className="input" placeholder="128GB" {...register('storage')} />
            </div>
            <div className="form-group">
              <label className="label">Color (optional)</label>
              <input type="text" className="input" placeholder="Black" {...register('color')} />
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Cost Price (₦)</label>
              <input type="number" className="input" placeholder="80000" min={0} step={0.01} {...register('cost_price', { valueAsNumber: true })} />
              {errors.cost_price && <span className="field-error">{errors.cost_price.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Selling Price (₦)</label>
              <input type="number" className="input" placeholder="120000" min={0} step={0.01} {...register('selling_price', { valueAsNumber: true })} />
              {errors.selling_price && <span className="field-error">{errors.selling_price.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Down Payment (₦)</label>
              <input type="number" className="input" placeholder="20000" min={0} step={0.01} {...register('down_payment', { valueAsNumber: true })} />
              {errors.down_payment && <span className="field-error">{errors.down_payment.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Payment Weeks</label>
              <input type="number" className="input" placeholder="12" min={1} {...register('payment_weeks', { valueAsNumber: true })} />
              {errors.payment_weeks && <span className="field-error">{errors.payment_weeks.message}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Adding…</> : 'Add Phone'}
            </button>
            <Link href="/agent/phones" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

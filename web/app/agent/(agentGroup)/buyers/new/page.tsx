'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterBuyerSchema, type RegisterBuyerInput } from '@/lib/validations'
import { ArrowLeft } from 'lucide-react'

export default function NewBuyerPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterBuyerInput>({ resolver: zodResolver(RegisterBuyerSchema) })

  const onSubmit = async (data: RegisterBuyerInput) => {
    setServerError('')
    const payload = {
      ...data,
      email: data.email || undefined,
      bvn: data.bvn || undefined,
      nin: data.nin || undefined,
      phone_id: data.phone_id || undefined,
    }
    const res = await fetch('/api/buyers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setServerError(json.error ?? 'Failed to register buyer.')
      return
    }
    router.push('/agent/buyers')
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/buyers" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>Register Buyer</h1>
            <p>Add a new buyer to your list</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '560px' }}>
        {serverError && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{serverError}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="John Doe" {...register('full_name')} />
              {errors.full_name && <span className="field-error">{errors.full_name.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="08012345678" {...register('phone')} />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Email (optional)</label>
              <input type="email" className="input" placeholder="buyer@example.com" {...register('email')} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Address</label>
            <input type="text" className="input" placeholder="123 Main Street, Lagos" {...register('address')} />
            {errors.address && <span className="field-error">{errors.address.message}</span>}
          </div>

          <div className="divider" />
          <p className="section-title">Identity Verification (optional)</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">BVN (11 digits)</label>
              <input type="text" className="input" placeholder="12345678901" maxLength={11} {...register('bvn')} />
              {errors.bvn && <span className="field-error">{errors.bvn.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">NIN (11 digits)</label>
              <input type="text" className="input" placeholder="12345678901" maxLength={11} {...register('nin')} />
              {errors.nin && <span className="field-error">{errors.nin.message}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Registering…</> : 'Register Buyer'}
            </button>
            <Link href="/agent/buyers" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

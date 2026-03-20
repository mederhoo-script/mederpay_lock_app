'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { ArrowLeft } from 'lucide-react'
import { use } from 'react'
import { useToast } from '@/components/Toast'

interface EditFormData {
  brand: string
  model: string
  storage: string
  color: string
}

interface PhoneData {
  brand: string
  model: string
  storage: string | null
  color: string | null
}

export default function EditPhonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>()

  useEffect(() => {
    fetch(`/api/phones/${id}`)
      .then((r) => r.json())
      .then((data: { phone?: PhoneData }) => {
        if (data.phone) {
          reset({
            brand: data.phone.brand ?? '',
            model: data.phone.model ?? '',
            storage: data.phone.storage ?? '',
            color: data.phone.color ?? '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, reset])

  const onSubmit = async (data: EditFormData) => {
    const res = await fetch(`/api/phones/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Failed to update phone.', 'Update failed')
      return
    }
    toast.success('Phone updated successfully!', 'Phone updated')
    router.push(`/agent/phones/${id}`)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href={`/agent/phones/${id}`} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>Edit Phone</h1>
            <p>Update phone details</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '480px' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Brand</label>
              <input type="text" className="input" placeholder="Samsung" {...register('brand', { required: 'Brand is required' })} />
              {errors.brand && <span className="field-error">{errors.brand.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Model</label>
              <input type="text" className="input" placeholder="Galaxy A54" {...register('model', { required: 'Model is required' })} />
              {errors.model && <span className="field-error">{errors.model.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Storage</label>
              <input type="text" className="input" placeholder="128GB" {...register('storage')} />
            </div>
            <div className="form-group">
              <label className="label">Color</label>
              <input type="text" className="input" placeholder="Black" {...register('color')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Saving…</> : 'Save Changes'}
            </button>
            <Link href={`/agent/phones/${id}`} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

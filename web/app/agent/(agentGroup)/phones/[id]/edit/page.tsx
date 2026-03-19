'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface PhoneFormValues {
  imei: string
  brand: string
  model: string
  storage: string
  color: string
  cost_price_naira: number
  selling_price_naira: number
  down_payment_naira: number
  payment_weeks: number
}

const WEEK_OPTIONS = [4, 8, 12, 16, 24, 52]

export default function EditPhonePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PhoneFormValues>()

  const sellingPrice = watch('selling_price_naira') || 0
  const downPayment = watch('down_payment_naira') || 0
  const paymentWeeks = watch('payment_weeks') || 12
  const weeklyPayment = paymentWeeks > 0 ? ((sellingPrice - downPayment) / paymentWeeks) : 0

  useEffect(() => {
    fetch(`/api/phones/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        const p = data.phone ?? data
        setStatus(p.status)
        reset({
          imei: p.imei,
          brand: p.brand,
          model: p.model,
          storage: p.storage ?? '',
          color: p.color ?? '',
          cost_price_naira: p.cost_price / 100,
          selling_price_naira: p.selling_price / 100,
          down_payment_naira: p.down_payment / 100,
          payment_weeks: p.payment_weeks,
        })
      })
      .catch(() => setError('Failed to load phone data.'))
      .finally(() => setFetching(false))
  }, [id, reset])

  const onSubmit = async (data: PhoneFormValues) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/phones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: data.imei,
          brand: data.brand,
          model: data.model,
          storage: data.storage || null,
          color: data.color || null,
          cost_price: Math.round(data.cost_price_naira * 100),
          selling_price: Math.round(data.selling_price_naira * 100),
          down_payment: Math.round(data.down_payment_naira * 100),
          payment_weeks: Number(data.payment_weeks),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Update failed.'); return }
      toast.success('Phone updated successfully!')
      router.push(`/agent/phones/${id}`)
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg">
        <div className="alert-banner flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <Link href="/agent/phones" className="btn btn-ghost mt-4">← Back to Phones</Link>
      </div>
    )
  }

  if (status && status !== 'available') {
    return (
      <div className="p-8 max-w-lg space-y-4">
        <div className="alert-banner flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>This phone cannot be edited because its status is <strong>{status}</strong>. Only available phones can be edited.</span>
        </div>
        <Link href={`/agent/phones/${id}`} className="btn btn-ghost">← Back to Phone</Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/agent/phones/${id}`} className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Edit Phone</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Update phone details</p>
        </div>
      </div>

      <div className="gold-panel p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>IMEI *</label>
              <input {...register('imei', { required: 'IMEI is required' })} className="input-field font-mono" />
              {errors.imei && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.imei.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Brand *</label>
              <input {...register('brand', { required: 'Required' })} className="input-field" />
              {errors.brand && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Model *</label>
              <input {...register('model', { required: 'Required' })} className="input-field" />
              {errors.model && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.model.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Storage</label>
              <input {...register('storage')} className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Color</label>
              <input {...register('color')} className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Cost Price (₦) *</label>
              <input {...register('cost_price_naira', { required: 'Required', valueAsNumber: true })} type="number" step="0.01" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Selling Price (₦) *</label>
              <input {...register('selling_price_naira', { required: 'Required', valueAsNumber: true })} type="number" step="0.01" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Down Payment (₦) *</label>
              <input {...register('down_payment_naira', { required: 'Required', valueAsNumber: true })} type="number" step="0.01" className="input-field" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Payment Weeks *</label>
              <select {...register('payment_weeks', { required: 'Required', valueAsNumber: true })} className="input-field">
                {WEEK_OPTIONS.map(w => <option key={w} value={w}>{w} weeks</option>)}
              </select>
            </div>
          </div>

          {sellingPrice > 0 && (
            <div className="rounded-lg p-4" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Weekly Payment: <strong style={{ color: 'hsl(var(--foreground))' }}>₦{weeklyPayment.toFixed(2)}</strong></p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href={`/agent/phones/${id}`} className="btn btn-ghost flex-1 justify-center">Cancel</Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

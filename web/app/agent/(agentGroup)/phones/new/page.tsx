'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Info } from 'lucide-react'

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

export default function NewPhonePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    defaultValues: { payment_weeks: 12 },
  })

  const sellingPrice = watch('selling_price_naira') || 0
  const downPayment = watch('down_payment_naira') || 0
  const paymentWeeks = watch('payment_weeks') || 12
  const weeklyPayment = paymentWeeks > 0 ? ((sellingPrice - downPayment) / paymentWeeks) : 0

  const onSubmit = async (data: PhoneFormValues) => {
    setLoading(true)
    try {
      const payload = {
        imei: data.imei,
        brand: data.brand,
        model: data.model,
        storage: data.storage || undefined,
        color: data.color || undefined,
        cost_price: Math.round(data.cost_price_naira * 100),
        selling_price: Math.round(data.selling_price_naira * 100),
        down_payment: Math.round(data.down_payment_naira * 100),
        payment_weeks: Number(data.payment_weeks),
      }

      const res = await fetch('/api/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to add phone.')
        return
      }
      toast.success('Phone added successfully!')
      router.push('/agent/phones')
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/phones" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Add Phone</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Register a new phone in inventory</p>
        </div>
      </div>

      <div className="alert-banner flex items-start gap-2 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Down payment is a separate upfront fee — it does not reduce the selling price.</span>
      </div>

      <div className="gold-panel p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* IMEI */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>IMEI <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('imei', { required: 'IMEI is required', pattern: { value: /^\d{15}$/, message: 'IMEI must be exactly 15 digits' } })} placeholder="Enter 15-digit IMEI" className="input-field font-mono" maxLength={15} />
              {errors.imei && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.imei.message}</p>}
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Brand <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('brand', { required: 'Brand is required' })} placeholder="e.g. Samsung" className="input-field" />
              {errors.brand && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.brand.message}</p>}
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Model <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('model', { required: 'Model is required' })} placeholder="e.g. Galaxy A54" className="input-field" />
              {errors.model && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.model.message}</p>}
            </div>

            {/* Storage */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Storage</label>
              <input {...register('storage')} placeholder="e.g. 128GB" className="input-field" />
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Color</label>
              <input {...register('color')} placeholder="e.g. Midnight Black" className="input-field" />
            </div>

            {/* Cost Price */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Cost Price (₦) <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('cost_price_naira', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Must be positive' } })} type="number" step="0.01" placeholder="e.g. 150000" className="input-field" />
              {errors.cost_price_naira && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.cost_price_naira.message}</p>}
            </div>

            {/* Selling Price */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Selling Price (₦) <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('selling_price_naira', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Must be positive' } })} type="number" step="0.01" placeholder="e.g. 200000" className="input-field" />
              {errors.selling_price_naira && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.selling_price_naira.message}</p>}
            </div>

            {/* Down Payment */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Down Payment (₦) <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <input {...register('down_payment_naira', { required: 'Required', valueAsNumber: true, min: { value: 0, message: 'Cannot be negative' } })} type="number" step="0.01" placeholder="e.g. 30000" className="input-field" />
              {errors.down_payment_naira && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.down_payment_naira.message}</p>}
            </div>

            {/* Payment Weeks */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Payment Weeks <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
              <select {...register('payment_weeks', { required: 'Required', valueAsNumber: true })} className="input-field">
                {WEEK_OPTIONS.map(w => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
              {errors.payment_weeks && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.payment_weeks.message}</p>}
            </div>
          </div>

          {/* Weekly Payment Preview */}
          {sellingPrice > 0 && paymentWeeks > 0 && (
            <div className="rounded-lg p-4" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Calculated Weekly Payment</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'hsl(var(--primary))' }}>
                ₦{weeklyPayment > 0 ? weeklyPayment.toFixed(2) : '0.00'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                = (₦{sellingPrice} - ₦{downPayment}) ÷ {paymentWeeks} weeks
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/agent/phones" className="btn btn-ghost flex-1 justify-center">Cancel</Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? 'Adding…' : 'Add Phone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

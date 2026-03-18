'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { SellPhoneSchema, type SellPhoneInput } from '@/lib/validations'

interface PhoneOption {
  id: string
  brand: string
  model: string
  storage?: string
  selling_price: number
  down_payment: number
  payment_weeks: number
}

interface BuyerOption {
  id: string
  full_name: string
  phone: string
  active_sales: number
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-white/60">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-white/30">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const SELECT_CLASS =
  'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0070F3]'

// Inner component that uses useSearchParams — must be wrapped in Suspense
function NewSaleForm() {
  const router           = useRouter()
  const searchParams     = useSearchParams()
  const preselectedPhone = searchParams.get('phone') ?? ''

  const [saving, setSaving]                 = useState(false)
  const [phones, setPhones]                 = useState<PhoneOption[]>([])
  const [buyers, setBuyers]                 = useState<BuyerOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [selectedPhone, setSelectedPhone]   = useState<PhoneOption | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SellPhoneInput>({
    resolver: zodResolver(SellPhoneSchema),
    defaultValues: { phone_id: preselectedPhone, buyer_id: '' },
  })

  const watchedPhoneId = watch('phone_id')

  useEffect(() => {
    async function load() {
      setLoadingOptions(true)
      try {
        const [phonesRes, buyersRes] = await Promise.all([
          fetch('/api/phones?status=available&limit=100'),
          fetch('/api/buyers?limit=100'),
        ])
        if (phonesRes.ok) setPhones((await phonesRes.json()).phones ?? [])
        if (buyersRes.ok) setBuyers((await buyersRes.json()).buyers ?? [])
      } finally {
        setLoadingOptions(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    setSelectedPhone(phones.find((ph) => ph.id === watchedPhoneId) ?? null)
  }, [watchedPhoneId, phones])

  async function onSubmit(values: SellPhoneInput) {
    setSaving(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to record sale'); return }
      toast.success('Sale recorded and virtual account created')
      router.push('/agent/sales')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#0070F3]" />
          Sale Details
        </h2>

        <Field label="Select Phone *" error={errors.phone_id?.message}>
          <select {...register('phone_id')} className={SELECT_CLASS}>
            <option value="" className="bg-[#121212]">— Choose an available phone —</option>
            {phones.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#121212]">
                {p.brand} {p.model}{p.storage ? ` ${p.storage}` : ''} — {formatNaira(p.selling_price)}
              </option>
            ))}
          </select>
          {phones.length === 0 && (
            <p className="text-xs text-[#F5A623]/70 mt-1">
              No available phones.{' '}
              <a href="/agent/phones/new" className="underline hover:text-[#F5A623]">Add a phone first.</a>
            </p>
          )}
        </Field>

        {selectedPhone && (
          <div className="rounded-lg border border-[#0070F3]/20 bg-[#0070F3]/5 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Selling price</span>
              <span className="text-white font-semibold">{formatNaira(selectedPhone.selling_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Down payment</span>
              <span className="text-white">{formatNaira(selectedPhone.down_payment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Weekly payment</span>
              <span className="text-white">
                {formatNaira(Math.ceil((selectedPhone.selling_price - selectedPhone.down_payment) / selectedPhone.payment_weeks))}
                {' '}× {selectedPhone.payment_weeks} weeks
              </span>
            </div>
          </div>
        )}

        <Field label="Select Buyer *" error={errors.buyer_id?.message}>
          <select {...register('buyer_id')} className={SELECT_CLASS}>
            <option value="" className="bg-[#121212]">— Choose a buyer —</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#121212]">
                {b.full_name} — {b.phone}
                {b.active_sales > 0 ? ` (${b.active_sales} active loan${b.active_sales > 1 ? 's' : ''})` : ''}
              </option>
            ))}
          </select>
          {buyers.length === 0 && (
            <p className="text-xs text-[#F5A623]/70 mt-1">
              No buyers yet.{' '}
              <a href="/agent/buyers/new" className="underline hover:text-[#F5A623]">Add a buyer first.</a>
            </p>
          )}
        </Field>
      </div>

      <div className="rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-4 py-3 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
        <p className="text-xs text-[#F5A623]/80">
          A virtual account will be created for the buyer using your configured payment gateway.
          The phone will be marked as sold and the buyer can start making weekly payments.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || phones.length === 0 || buyers.length === 0}
          className="inline-flex items-center gap-2 bg-[#0070F3] hover:bg-[#0070F3]/90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <ShoppingBag className="w-4 h-4" />
          {saving ? 'Recording…' : 'Record Sale'}
        </button>
      </div>
    </form>
  )
}

export default function NewSalePage() {
  const router = useRouter()

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sales
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Record New Sale</h1>
        <p className="text-sm text-white/50 mt-1">
          Assign a phone to a buyer — a virtual account will be created automatically.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          </div>
        }
      >
        <NewSaleForm />
      </Suspense>
    </div>
  )
}

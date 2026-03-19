'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { formatNaira } from '@/lib/utils'

interface Phone { id: string; brand: string; model: string; imei: string; selling_price: number; down_payment: number; weekly_payment: number; payment_weeks: number }

interface BuyerFormData {
  full_name: string; phone: string; email: string; address: string; bvn: string; nin: string
}

export default function NewBuyerPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [phones, setPhones] = useState<Phone[]>([])
  const [buyer, setBuyer] = useState<BuyerFormData>({ full_name: '', phone: '', email: '', address: '', bvn: '', nin: '' })
  const [phoneId, setPhoneId] = useState('')
  const [buyerErrors, setBuyerErrors] = useState<Partial<BuyerFormData>>({})

  const selectedPhone = phones.find(p => p.id === phoneId)

  useEffect(() => {
    fetch('/api/phones?status=available&limit=100')
      .then(r => r.json())
      .then(d => setPhones(d.phones ?? []))
      .catch(() => toast.error('Failed to load phones.'))
  }, [])

  const validateStep1 = () => {
    const errs: Partial<BuyerFormData> = {}
    if (!buyer.full_name.trim() || buyer.full_name.length < 2) errs.full_name = 'Full name is required'
    if (!buyer.phone.trim() || buyer.phone.length < 10) errs.phone = 'Valid phone number required'
    if (!buyer.address.trim() || buyer.address.length < 5) errs.address = 'Address is required'
    setBuyerErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNextStep1 = () => {
    if (validateStep1()) setStep(2)
  }

  const handleNextStep2 = () => {
    if (!phoneId) { toast.error('Please select a phone.'); return }
    setStep(3)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create buyer
      const buyerRes = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buyer, phone_id: phoneId }),
      })
      const buyerData = await buyerRes.json()
      if (!buyerRes.ok) { toast.error(buyerData.error ?? 'Failed to register buyer.'); return }

      const newBuyerId = buyerData.buyer?.id ?? buyerData.id
      if (!newBuyerId) { toast.error('Buyer ID missing in response.'); return }

      // Create sale
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: newBuyerId, phone_id: phoneId }),
      })
      const saleData = await saleRes.json()
      if (!saleRes.ok) { toast.error(saleData.error ?? 'Failed to create sale.'); return }

      toast.success('Phone sold successfully. Virtual account created.')
      router.push('/agent/sales')
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Buyer Info', 'Select Phone', 'Confirm & Sell']

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/buyers" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Register Buyer & Sell Phone</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>3-step process to onboard a buyer and create a sale</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? 'bg-green-600 text-white' : step === i + 1 ? 'text-white' : 'text-muted'}`}
                style={{ background: step > i + 1 ? undefined : step === i + 1 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))' }}>
                {i + 1}
              </div>
              <span className="text-xs hidden sm:inline" style={{ color: step === i + 1 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />}
          </div>
        ))}
      </div>

      <div className="gold-panel p-6">
        {/* Step 1: Buyer Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Step 1: Buyer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Full Name *</label>
                <input value={buyer.full_name} onChange={e => setBuyer({ ...buyer, full_name: e.target.value })} placeholder="John Doe" className="input-field" />
                {buyerErrors.full_name && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{buyerErrors.full_name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Phone *</label>
                <input value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} placeholder="08012345678" className="input-field" />
                {buyerErrors.phone && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{buyerErrors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Email (optional)</label>
                <input value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} type="email" placeholder="email@example.com" className="input-field" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Address *</label>
                <input value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })} placeholder="123 Main Street, Lagos" className="input-field" />
                {buyerErrors.address && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{buyerErrors.address}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>BVN (optional)</label>
                <input value={buyer.bvn} onChange={e => setBuyer({ ...buyer, bvn: e.target.value })} placeholder="11 digits" maxLength={11} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>NIN (optional)</label>
                <input value={buyer.nin} onChange={e => setBuyer({ ...buyer, nin: e.target.value })} placeholder="11 digits" maxLength={11} className="input-field" />
              </div>
            </div>
            <button type="button" onClick={handleNextStep1} className="btn btn-primary w-full">
              Next: Select Phone →
            </button>
          </div>
        )}

        {/* Step 2: Select Phone */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Step 2: Select Phone</h2>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Available Phone *</label>
              <select value={phoneId} onChange={e => setPhoneId(e.target.value)} className="input-field">
                <option value="">— Choose a phone —</option>
                {phones.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model} — {formatNaira(p.selling_price)} / Weekly: {formatNaira(p.weekly_payment)}
                  </option>
                ))}
              </select>
            </div>
            {selectedPhone && (
              <div className="rounded-lg p-4 space-y-2" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{selectedPhone.brand} {selectedPhone.model}</p>
                <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>IMEI: {selectedPhone.imei}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Selling Price</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(selectedPhone.selling_price)}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Down Payment</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(selectedPhone.down_payment)}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Weekly Payment</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(selectedPhone.weekly_payment)}</span>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Payment Weeks</span>
                  <span style={{ color: 'hsl(var(--foreground))' }}>{selectedPhone.payment_weeks} weeks</span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost flex-1">← Back</button>
              <button type="button" onClick={handleNextStep2} className="btn btn-primary flex-1">Next: Confirm →</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedPhone && (
          <div className="space-y-5">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Step 3: Confirm & Sell</h2>
            <div className="space-y-4">
              <div className="rounded-lg p-4 space-y-2" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Buyer</p>
                <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{buyer.full_name}</p>
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{buyer.phone} {buyer.email ? `• ${buyer.email}` : ''}</p>
              </div>
              <div className="rounded-lg p-4 space-y-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>Sale Terms</p>
                {[
                  ['Device', `${selectedPhone.brand} ${selectedPhone.model}`],
                  ['Selling Price', formatNaira(selectedPhone.selling_price)],
                  ['Down Payment', formatNaira(selectedPhone.down_payment)],
                  ['Weekly Payment', formatNaira(selectedPhone.weekly_payment)],
                  ['Payment Duration', `${selectedPhone.payment_weeks} weeks`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                    <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn btn-ghost flex-1">← Back</button>
              <button type="button" onClick={handleSubmit} className="btn btn-primary flex-1" disabled={loading}>
                {loading ? 'Processing…' : 'Confirm & Sell'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

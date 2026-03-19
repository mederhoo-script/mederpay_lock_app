'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { formatNaira } from '@/lib/utils'

interface Phone {
  id: string
  brand: string
  model: string
  imei: string
  selling_price: number
  down_payment: number
  payment_weeks: number
}

interface BuyerFormData {
  full_name: string
  phone: string
  email: string
  address: string
  bvn: string
  nin: string
}

export default function SubagentSalesPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [phones, setPhones] = useState<Phone[]>([])
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null)
  const [buyerData, setBuyerData] = useState<BuyerFormData>({
    full_name: '', phone: '', email: '', address: '', bvn: '', nin: '',
  })

  useEffect(() => {
    fetch('/api/phones?available=true')
      .then((r) => r.json())
      .then((data) => setPhones(Array.isArray(data) ? data : data.phones ?? []))
      .catch(() => toast.error('Failed to load phones'))
  }, [])

  async function handleSubmit() {
    if (!selectedPhone) return
    setLoading(true)
    try {
      // Create buyer first
      const buyerRes = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyerData),
      })
      if (!buyerRes.ok) {
        const err = await buyerRes.json()
        throw new Error(err.error ?? 'Failed to create buyer')
      }
      const buyer = await buyerRes.json()

      // Create sale
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: buyer.id, phone_id: selectedPhone.id }),
      })
      if (!saleRes.ok) {
        const err = await saleRes.json()
        throw new Error(err.error ?? 'Failed to create sale')
      }

      toast.success('Phone sold successfully. Virtual account created.')
      router.push('/subagent/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete sale')
    } finally {
      setLoading(false)
    }
  }

  const weeklyPayment = selectedPhone
    ? Math.floor(selectedPhone.selling_price / selectedPhone.payment_weeks)
    : 0

  return (
    <div className="p-6 lg:p-8 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/subagent/dashboard')} className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Sell a Phone</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s <= step ? 'bg-blue-500' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Step 1 — Buyer Info */}
      {step === 1 && (
        <div className="gold-panel p-6 space-y-4">
          <h2 className="font-semibold">Buyer Information</h2>
          {[
            { label: 'Full Name *', key: 'full_name', placeholder: 'John Doe' },
            { label: 'Phone *', key: 'phone', placeholder: '+234 800 000 0000' },
            { label: 'Email', key: 'email', placeholder: 'john@example.com' },
            { label: 'Address *', key: 'address', placeholder: '10 Lagos Street, Abuja' },
            { label: 'BVN (optional)', key: 'bvn', placeholder: '12345678901' },
            { label: 'NIN (optional)', key: 'nin', placeholder: '12345678901' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input
                className="input-field"
                placeholder={placeholder}
                value={buyerData[key as keyof BuyerFormData]}
                onChange={(e) =>
                  setBuyerData((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!buyerData.full_name || !buyerData.phone || !buyerData.address) {
                  toast.error('Please fill required fields')
                  return
                }
                setStep(2)
              }}
              className="btn btn-primary gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Select Phone */}
      {step === 2 && (
        <div className="gold-panel p-6 space-y-4">
          <h2 className="font-semibold">Select Phone</h2>
          {phones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available phones</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {phones.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPhone?.id === p.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="phone"
                    checked={selectedPhone?.id === p.id}
                    onChange={() => setSelectedPhone(p)}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {p.brand} {p.model}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{p.imei}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatNaira(p.selling_price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNaira(Math.floor(p.selling_price / p.payment_weeks))}/wk
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn btn-ghost">Back</button>
            <button
              onClick={() => {
                if (!selectedPhone) {
                  toast.error('Please select a phone')
                  return
                }
                setStep(3)
              }}
              className="btn btn-primary gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && selectedPhone && (
        <div className="gold-panel p-6 space-y-4">
          <h2 className="font-semibold">Confirm Sale Terms</h2>
          <div className="space-y-3">
            <Row label="Buyer" value={buyerData.full_name} />
            <Row label="Phone" value={`${selectedPhone.brand} ${selectedPhone.model}`} />
            <Row label="IMEI" value={selectedPhone.imei} mono />
            <div className="border-t border-white/10 pt-3 space-y-2">
              <Row label="Selling Price" value={formatNaira(selectedPhone.selling_price)} />
              <Row
                label="Down Payment (upfront, separate)"
                value={formatNaira(selectedPhone.down_payment)}
              />
              <Row
                label={`Weekly Payment (${selectedPhone.payment_weeks} weeks)`}
                value={`${formatNaira(weeklyPayment)} / week`}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            A virtual account will be generated for this buyer to receive payments.
          </p>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn btn-ghost">Back</button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Selling…
                </>
              ) : (
                'Confirm & Sell'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

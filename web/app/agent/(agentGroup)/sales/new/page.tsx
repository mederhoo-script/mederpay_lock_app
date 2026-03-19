'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { formatNaira } from '@/lib/utils'

interface Buyer { id: string; full_name: string; phone: string; email: string | null }
interface Phone { id: string; brand: string; model: string; imei: string; selling_price: number; down_payment: number; weekly_payment: number; payment_weeks: number }

export default function NewSalePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [phones, setPhones] = useState<Phone[]>([])
  const [buyerId, setBuyerId] = useState('')
  const [phoneId, setPhoneId] = useState('')

  const selectedPhone = phones.find(p => p.id === phoneId)

  useEffect(() => {
    Promise.all([
      fetch('/api/buyers?limit=100').then(r => r.json()),
      fetch('/api/phones?status=available&limit=100').then(r => r.json()),
    ]).then(([buyersData, phonesData]) => {
      setBuyers(buyersData.buyers ?? [])
      setPhones(phonesData.phones ?? [])
    }).catch(() => toast.error('Failed to load data.'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyerId || !phoneId) {
      toast.error('Please select both a buyer and a phone.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: buyerId, phone_id: phoneId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to create sale.'); return }
      toast.success('Sale created! Virtual account has been generated.')
      router.push('/agent/sales')
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agent/sales" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>New Sale</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Create a new phone financing sale</p>
        </div>
      </div>

      <div className="gold-panel p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Select Buyer *</label>
            <select value={buyerId} onChange={e => setBuyerId(e.target.value)} className="input-field" required>
              <option value="">— Choose a buyer —</option>
              {buyers.map(b => (
                <option key={b.id} value={b.id}>{b.full_name} ({b.phone})</option>
              ))}
            </select>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Buyer not listed?{' '}
              <Link href="/agent/buyers/new" style={{ color: 'hsl(var(--primary))' }}>Register a buyer</Link>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Select Phone *</label>
            <select value={phoneId} onChange={e => setPhoneId(e.target.value)} className="input-field" required>
              <option value="">— Choose an available phone —</option>
              {phones.map(p => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.model} — {formatNaira(p.selling_price)} / Weekly: {formatNaira(p.weekly_payment)}
                </option>
              ))}
            </select>
          </div>

          {selectedPhone && (
            <div className="rounded-lg p-5 space-y-3" style={{ background: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Sale Summary</h3>
              {[
                ['Device', `${selectedPhone.brand} ${selectedPhone.model}`],
                ['IMEI', selectedPhone.imei],
                ['Selling Price', formatNaira(selectedPhone.selling_price)],
                ['Down Payment', formatNaira(selectedPhone.down_payment)],
                ['Weekly Payment', formatNaira(selectedPhone.weekly_payment)],
                ['Payment Weeks', `${selectedPhone.payment_weeks} weeks`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                  <span className={label === 'IMEI' ? 'font-mono text-xs' : ''} style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/agent/sales" className="btn btn-ghost flex-1 justify-center">Cancel</Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading || !buyerId || !phoneId}>
              {loading ? 'Creating…' : 'Create Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

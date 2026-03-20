'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatNaira } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Phone {
  id: string
  brand: string
  model: string
  selling_price: number
  imei: string
}

interface Buyer {
  id: string
  full_name: string
  phone: string
}

interface VirtualAccount {
  account_number?: string
  bank_name?: string
  account_name?: string
}

export default function NewSalePage() {
  const router = useRouter()
  const toast = useToast()
  const [phones, setPhones] = useState<Phone[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [selectedPhone, setSelectedPhone] = useState('')
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [loading, setLoading] = useState(false)
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null)
  const [saleId, setSaleId] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/phones?status=available').then((r) => r.json()),
      fetch('/api/buyers?for_sale=true').then((r) => r.json()),
    ]).then(([phoneData, buyerData]) => {
      setPhones(phoneData.phones ?? phoneData ?? [])
      setBuyers(buyerData.buyers ?? buyerData ?? [])
    }).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPhone || !selectedBuyer) { toast.error('Please select both a buyer and a phone.', 'Missing selection'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_id: selectedBuyer, phone_id: selectedPhone }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to create sale.', 'Error'); return }
      toast.success('Sale created successfully!', 'Sale created')
      setSaleId(json.sale?.id ?? json.id ?? '')
      setVirtualAccount(json.virtual_account ?? json.sale?.virtual_account ?? null)
    } catch {
      toast.error('Something went wrong.', 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (saleId) {
    return (
      <div>
        <div className="page-header">
          <h1>Sale Created!</h1>
        </div>
        <div className="card" style={{ maxWidth: '500px' }}>
          {virtualAccount ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>Virtual Account Details</h3>
              <div className="detail-row"><span className="detail-key">Bank</span><span className="detail-value">{virtualAccount.bank_name ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-key">Account Number</span><span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{virtualAccount.account_number ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-key">Account Name</span><span className="detail-value">{virtualAccount.account_name ?? '—'}</span></div>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              No payment gateway configured. Go to{' '}
              <Link href="/agent/settings" style={{ color: 'var(--accent)' }}>Settings</Link>{' '}
              to set up a gateway so virtual accounts can be created automatically.
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href={`/agent/sales/${saleId}`} className="btn btn-primary">View Sale</Link>
            <Link href="/agent/sales" className="btn btn-secondary">All Sales</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/sales" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>New Sale</h1>
            <p>Create a new phone sale / installment plan</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="buyer-select">Buyer</label>
            <select id="buyer-select" className="select" value={selectedBuyer} onChange={(e) => setSelectedBuyer(e.target.value)} required>
              <option value="">Select a buyer…</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.full_name} — {b.phone}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="phone-select">Phone (Available)</label>
            <select id="phone-select" className="select" value={selectedPhone} onChange={(e) => setSelectedPhone(e.target.value)} required>
              <option value="">Select a phone…</option>
              {phones.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} {p.model} — {formatNaira(p.selling_price)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating Sale…</> : 'Create Sale'}
            </button>
            <Link href="/agent/sales" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Buyer not in the list?{' '}
            <Link href="/agent/buyers/new" style={{ color: 'var(--accent)' }}>Register a new buyer</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

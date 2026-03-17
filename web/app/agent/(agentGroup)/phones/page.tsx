'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Smartphone,
  Plus,
  Search,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PhoneStatus = 'available' | 'sold' | 'locked' | 'returned'

interface Phone {
  id: string
  imei: string
  brand: string
  model: string
  storage?: string
  color?: string
  status: PhoneStatus
  cost_price: number
  selling_price: number
  down_payment: number
  payment_weeks: number
  created_at: string
}

interface PhonesResponse {
  phones: Phone[]
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

const STATUS_TABS: { label: string; value: PhoneStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Sold', value: 'sold' },
  { label: 'Locked', value: 'locked' },
  { label: 'Returned', value: 'returned' },
]

const STATUS_STYLES: Record<PhoneStatus, string> = {
  available: 'bg-emerald-400/15 text-emerald-400',
  sold:      'bg-[#0070F3]/15 text-[#0070F3]',
  locked:    'bg-red-400/15 text-red-400',
  returned:  'bg-[#F5A623]/15 text-[#F5A623]',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhonesPage() {
  const [phones, setPhones]     = useState<Phone[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [activeTab, setActiveTab] = useState<PhoneStatus | 'all'>('all')

  const fetchPhones = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (activeTab !== 'all') params.set('status', activeTab)

      const res = await fetch(`/api/phones?${params}`)
      if (!res.ok) throw new Error('Failed to load phones')
      const data: PhonesResponse = await res.json()
      setPhones(data.phones ?? [])
      setTotal(data.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchPhones() }, [fetchPhones])

  const filtered = phones.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.imei.includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Phones</h1>
          <p className="text-sm text-white/50 mt-1">
            {total} phone{total !== 1 ? 's' : ''} in inventory
          </p>
        </div>
        <a
          href="/phones/new"
          className="inline-flex items-center gap-2 bg-[#0070F3] hover:bg-[#0070F3]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Phone
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search IMEI, brand, model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-[#0070F3] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchPhones}
          className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-white/60">{error}</p>
            <button
              onClick={fetchPhones}
              className="text-xs text-[#0070F3] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Smartphone className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50">No phones found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-[#0070F3] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['IMEI', 'Brand / Model', 'Storage', 'Status', 'Cost Price', 'Selling Price', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((phone) => (
                  <tr key={phone.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-white/80 text-xs">{phone.imei}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {phone.brand} {phone.model}
                    </td>
                    <td className="px-4 py-3 text-white/50">{phone.storage ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[phone.status]}`}>
                        {phone.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{formatCurrency(phone.cost_price)}</td>
                    <td className="px-4 py-3 text-white font-medium">{formatCurrency(phone.selling_price)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/phones/${phone.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#0070F3] hover:text-[#0070F3]/80 transition-colors"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

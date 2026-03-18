'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Phone,
  MapPin,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Buyer {
  id: string
  full_name: string
  phone: string
  email?: string
  address: string
  total_purchases: number
  active_sales: number
  created_at: string
}

interface BuyersResponse {
  buyers: Buyer[]
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyersPage() {
  const [buyers, setBuyers]   = useState<Buyer[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const fetchBuyers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/buyers?limit=100')
      if (!res.ok) throw new Error('Failed to load buyers')
      const data: BuyersResponse = await res.json()
      setBuyers(data.buyers ?? [])
      setTotal(data.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBuyers() }, [fetchBuyers])

  const filtered = buyers.filter((b) => {
    const q = search.toLowerCase()
    return (
      b.full_name.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      (b.email?.toLowerCase().includes(q) ?? false) ||
      b.address.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Buyers</h1>
          <p className="text-sm text-white/50 mt-1">
            {total} registered buyer{total !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/agent/buyers/new"
          className="inline-flex items-center gap-2 bg-[#0070F3] hover:bg-[#0070F3]/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Buyer
        </a>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#0070F3]"
          />
        </div>
        <button
          onClick={fetchBuyers}
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
            <button onClick={fetchBuyers} className="text-xs text-[#0070F3] hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50">No buyers found</p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#0070F3] hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Name', 'Phone', 'Address', 'Active Sales', 'Total Purchases', 'Joined', ''].map((h) => (
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
                {filtered.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{buyer.full_name}</p>
                        {buyer.email && (
                          <p className="text-xs text-white/40">{buyer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-white/70">
                        <Phone className="w-3 h-3 text-white/30" />
                        {buyer.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-white/50 text-xs max-w-[180px] truncate">
                        <MapPin className="w-3 h-3 text-white/30 shrink-0" />
                        {buyer.address}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        buyer.active_sales > 0
                          ? 'bg-[#0070F3]/15 text-[#0070F3]'
                          : 'bg-white/5 text-white/40'
                      }`}>
                        {buyer.active_sales} active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {formatCurrency(buyer.total_purchases)}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {formatDate(buyer.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/agent/buyers/${buyer.id}`}
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

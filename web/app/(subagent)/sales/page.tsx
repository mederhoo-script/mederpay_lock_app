'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  Info,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SaleStatus = 'active' | 'grace' | 'lock' | 'completed' | 'defaulted'

interface Sale {
  id: string
  status: SaleStatus
  total_amount: number
  total_paid: number
  outstanding_balance: number
  weeks_paid: number
  payment_weeks: number
  due_date: string
  created_at: string
  buyer: {
    id: string
    full_name: string
    phone: string
  }
  phone: {
    id: string
    imei: string
    brand: string
    model: string
  }
}

interface SalesResponse {
  sales: Sale[]
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

function isOverdue(due: string): boolean {
  return new Date(due).getTime() < Date.now()
}

function isDueSoon(due: string): boolean {
  const diff = new Date(due).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}

const STATUS_TABS: { label: string; value: SaleStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Grace', value: 'grace' },
  { label: 'Locked', value: 'lock' },
  { label: 'Completed', value: 'completed' },
  { label: 'Defaulted', value: 'defaulted' },
]

const STATUS_STYLES: Record<SaleStatus, string> = {
  active:    'bg-emerald-400/15 text-emerald-400',
  grace:     'bg-[#F5A623]/15 text-[#F5A623]',
  lock:      'bg-red-400/15 text-red-400',
  completed: 'bg-[#0070F3]/15 text-[#0070F3]',
  defaulted: 'bg-red-900/30 text-red-300',
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

export default function SubAgentSalesPage() {
  const [sales, setSales]     = useState<Sale[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [activeTab, setActiveTab] = useState<SaleStatus | 'all'>('all')

  const fetchSales = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (activeTab !== 'all') params.set('status', activeTab)

      // Subagent sales endpoint — RLS ensures only allowed records are returned
      const res = await fetch(`/api/sales?${params}`)
      if (!res.ok) throw new Error('Failed to load sales')
      const data: SalesResponse = await res.json()
      setSales(data.sales ?? [])
      setTotal(data.count ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchSales() }, [fetchSales])

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.buyer.full_name.toLowerCase().includes(q) ||
      s.buyer.phone.includes(q) ||
      s.phone.imei.includes(q) ||
      `${s.phone.brand} ${s.phone.model}`.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales</h1>
          <p className="text-sm text-white/50 mt-1">
            {total} sale{total !== 1 ? 's' : ''} assigned to your account
          </p>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5 px-4 py-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
        <p className="text-sm text-[#F5A623]/80">
          You are viewing sales assigned to your account in read-only mode. Contact your agent to
          make changes or record payments.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search buyer, IMEI, phone model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
          />
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-[#F5A623] text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchSales}
          className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      {!loading && !error && sales.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Collected',
              value: formatCurrency(sales.reduce((sum, s) => sum + s.total_paid, 0)),
              color: 'text-emerald-400',
              bg: 'bg-emerald-400/10',
            },
            {
              label: 'Outstanding',
              value: formatCurrency(sales.reduce((sum, s) => sum + s.outstanding_balance, 0)),
              color: 'text-[#F5A623]',
              bg: 'bg-[#F5A623]/10',
            },
            {
              label: 'Active Sales',
              value: sales.filter((s) => s.status === 'active').length,
              color: 'text-[#0070F3]',
              bg: 'bg-[#0070F3]/10',
            },
            {
              label: 'Overdue',
              value: sales.filter((s) => isOverdue(s.due_date) && s.status !== 'completed').length,
              color: 'text-red-400',
              bg: 'bg-red-400/10',
            },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border border-white/10 ${card.bg} p-4`}>
              <p className="text-xs text-white/50">{card.label}</p>
              <p className={`text-lg font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

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
            <button onClick={fetchSales} className="text-xs text-[#F5A623] hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CreditCard className="w-10 h-10 text-white/20" />
            <p className="text-sm text-white/50">
              {search ? 'No matching sales found' : 'No sales assigned yet'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="text-xs text-[#F5A623] hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Buyer', 'Phone', 'Status', 'Total Amount', 'Balance', 'Progress', 'Due Date'].map((h) => (
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
                {filtered.map((sale) => {
                  const overdue  = isOverdue(sale.due_date) && sale.status !== 'completed'
                  const dueSoon  = isDueSoon(sale.due_date)
                  const progress = Math.min(100, (sale.weeks_paid / sale.payment_weeks) * 100)

                  return (
                    <tr key={sale.id} className={`transition-colors ${overdue ? 'bg-red-400/5' : 'hover:bg-white/5'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{sale.buyer.full_name}</p>
                          <p className="text-xs text-white/40">{sale.buyer.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white/80">{sale.phone.brand} {sale.phone.model}</p>
                          <p className="text-xs font-mono text-white/40">{sale.phone.imei}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[sale.status]}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{formatCurrency(sale.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={sale.outstanding_balance > 0 ? 'text-[#F5A623]' : 'text-emerald-400'}>
                          {formatCurrency(sale.outstanding_balance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#F5A623]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/40 tabular-nums">
                            {sale.weeks_paid}/{sale.payment_weeks}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${
                          overdue ? 'text-red-400' : dueSoon ? 'text-[#F5A623]' : 'text-white/50'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(sale.due_date)}
                          {overdue && <span className="text-red-400 font-medium ml-1">Overdue</span>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

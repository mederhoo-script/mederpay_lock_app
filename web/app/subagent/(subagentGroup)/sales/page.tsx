import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Sales | MederBuy Sub-Agent' }

interface SaleRow {
  id: string
  status: string
  selling_price: number
  outstanding_balance: number
  next_due_date: string | null
  buyers: Array<{ full_name: string; phone: string }> | { full_name: string; phone: string } | null
  phones: Array<{ brand: string; model: string; imei: string }> | { brand: string; model: string; imei: string } | null
}

function getBuyerName(sale: SaleRow): string {
  if (!sale.buyers) return '—'
  if (Array.isArray(sale.buyers)) return sale.buyers[0]?.full_name ?? '—'
  return sale.buyers.full_name
}

function getBuyerPhone(sale: SaleRow): string {
  if (!sale.buyers) return ''
  if (Array.isArray(sale.buyers)) return sale.buyers[0]?.phone ?? ''
  return sale.buyers.phone
}

function getPhoneLabel(sale: SaleRow): string {
  if (!sale.phones) return '—'
  if (Array.isArray(sale.phones)) {
    const p = sale.phones[0]
    return p ? `${p.brand} ${p.model}` : '—'
  }
  return `${sale.phones.brand} ${sale.phones.model}`
}

function getPhoneImei(sale: SaleRow): string {
  if (!sale.phones) return ''
  if (Array.isArray(sale.phones)) return sale.phones[0]?.imei ?? ''
  return sale.phones.imei
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-900/30 text-blue-400',
  grace: 'bg-yellow-900/30 text-yellow-400',
  lock: 'bg-red-900/30 text-red-400',
  completed: 'bg-emerald-900/30 text-emerald-400',
  defaulted: 'bg-red-900/40 text-red-300',
}

export default async function SubagentSalesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, outstanding_balance, next_due_date, buyers(full_name, phone), phones(brand, model, imei)')
    .eq('sold_by', user.id)
    .order('sale_date', { ascending: false })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Sales</h1>
        <p className="text-sm text-white/50 mt-1">
          Phone sales you have processed
        </p>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">Buyer</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Price</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Outstanding</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Next Due</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sales && sales.length > 0 ? (
              (sales as unknown as SaleRow[]).map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white">{getBuyerName(sale)}</p>
                    <p className="text-xs text-white/40">{getBuyerPhone(sale)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/80">{getPhoneLabel(sale)}</p>
                    <p className="text-xs text-white/40 font-mono">{getPhoneImei(sale)}</p>
                  </td>
                  <td className="px-4 py-3 text-white">{formatNaira(sale.selling_price)}</td>
                  <td className="px-4 py-3 text-white/70">
                    {formatNaira(sale.outstanding_balance)}
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {sale.next_due_date ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[sale.status] ?? 'bg-white/10 text-white/60'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                  <p>You have not processed any sales yet.</p>
                  <p className="text-xs mt-2">
                    Contact your agent to be assigned phones to sell.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

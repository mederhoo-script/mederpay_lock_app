import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', grace: 'badge-warning', lock: 'badge-error',
    completed: 'bg-purple-900/30 text-purple-400 border border-purple-900/40',
    defaulted: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: buyer } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .eq('agent_id', user.id)
    .maybeSingle()

  if (!buyer) notFound()
  const b = buyer as {
    id: string; full_name: string; phone: string; email: string | null; address: string | null
    bvn_encrypted: string | null; nin_encrypted: string | null; created_at: string
  }

  const { data: sales } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, outstanding_balance, next_due_date, sale_date, phones(brand, model)')
    .eq('buyer_id', id)
    .order('sale_date', { ascending: false })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/agent/buyers" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{b.full_name}</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Buyer Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Personal Information</h2>
          {[
            ['Full Name', b.full_name],
            ['Phone', b.phone],
            ['Email', b.email ?? '—'],
            ['Address', b.address ?? '—'],
            ['Registered', format(new Date(b.created_at), 'MMMM d, yyyy')],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm">
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>BVN</span>
            <span>{b.bvn_encrypted ? <CheckCircle className="w-4 h-4 inline" style={{ color: 'hsl(142 72% 60%)' }} /> : <XCircle className="w-4 h-4 inline" style={{ color: 'hsl(var(--muted-foreground))' }} />}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>NIN</span>
            <span>{b.nin_encrypted ? <CheckCircle className="w-4 h-4 inline" style={{ color: 'hsl(142 72% 60%)' }} /> : <XCircle className="w-4 h-4 inline" style={{ color: 'hsl(var(--muted-foreground))' }} />}</span>
          </div>
        </div>

        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Loan Summary</h2>
          {(() => {
            const s = sales ?? []
            const active = s.filter((x: { status: string }) => ['active', 'grace', 'lock'].includes(x.status)).length
            const totalOwed = s.reduce((sum: number, x: { outstanding_balance: number }) => sum + (x.outstanding_balance ?? 0), 0)
            const totalPaid = s.reduce((sum: number, x: { total_paid: number }) => sum + (x.total_paid ?? 0), 0)
            return [
              ['Total Sales', s.length],
              ['Active Loans', active],
              ['Total Paid', formatNaira(totalPaid)],
              ['Outstanding Balance', formatNaira(totalOwed)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              </div>
            ))
          })()}
        </div>
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Sales History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Sale Date</th>
                <th>Selling Price</th>
                <th>Total Paid</th>
                <th>Outstanding</th>
                <th>Next Due</th>
                <th>Status</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {(sales ?? []).length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No sales yet.</td></tr>
              ) : (sales ?? []).map(sale => {
                const s = sale as {
                  id: string; status: string; selling_price: number; total_paid: number
                  outstanding_balance: number; next_due_date: string | null; sale_date: string
                  phones: { brand: string; model: string } | { brand: string; model: string }[] | null
                }
                const phone = Array.isArray(s.phones) ? s.phones[0] : s.phones
                return (
                  <tr key={s.id}>
                    <td style={{ color: 'hsl(var(--foreground))' }}>{phone ? `${phone.brand} ${phone.model}` : '—'}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.sale_date ? format(new Date(s.sale_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(s.selling_price)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(142 72% 60%)' }}>{formatNaira(s.total_paid)}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(38 92% 62%)' }}>{formatNaira(s.outstanding_balance)}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {s.next_due_date ? format(new Date(s.next_due_date), 'MMM d') : '—'}
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td><Link href={`/agent/sales/${s.id}`} className="btn btn-ghost text-xs px-2 py-1">View</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

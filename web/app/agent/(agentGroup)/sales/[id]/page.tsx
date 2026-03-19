import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', grace: 'badge-warning', lock: 'badge-error',
    completed: 'bg-purple-900/30 text-purple-400 border border-purple-900/40',
    defaulted: 'badge-error', pending: 'badge-warning',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sale } = await supabase
    .from('phone_sales')
    .select('*, buyers(*), phones(*)')
    .eq('id', id)
    .eq('agent_id', user.id)
    .maybeSingle()

  if (!sale) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', id)
    .order('created_at', { ascending: false })

  const s = sale as {
    id: string; status: string; selling_price: number; down_payment: number; weekly_payment: number
    total_weeks: number; total_paid: number; outstanding_balance: number; weeks_paid: number
    next_due_date: string | null; sale_date: string; virtual_account_number: string | null
    virtual_account_bank: string | null; virtual_account_reference: string | null; payment_url: string | null
    buyers: { id: string; full_name: string; phone: string; email: string | null; address: string | null } | null
    phones: { id: string; imei: string; brand: string; model: string; storage: string | null } | null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/agent/sales" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>
              {s.buyers?.full_name ?? 'Unknown Buyer'} — {s.phones ? `${s.phones.brand} ${s.phones.model}` : 'Unknown Phone'}
            </h1>
            <StatusBadge status={s.status} />
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Sale on {s.sale_date ? format(new Date(s.sale_date), 'MMMM d, yyyy') : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Selling Price', value: formatNaira(s.selling_price), color: 'hsl(var(--foreground))' },
          { label: 'Total Paid', value: formatNaira(s.total_paid), color: 'hsl(142 72% 60%)' },
          { label: 'Outstanding', value: formatNaira(s.outstanding_balance), color: 'hsl(38 92% 62%)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card p-4 space-y-1">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buyer Info */}
        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Buyer Information</h2>
          {[
            ['Name', s.buyers?.full_name ?? '—'],
            ['Phone', s.buyers?.phone ?? '—'],
            ['Email', s.buyers?.email ?? '—'],
            ['Address', s.buyers?.address ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            </div>
          ))}
          {s.buyers && (
            <Link href={`/agent/buyers/${s.buyers.id}`} className="btn btn-ghost text-xs mt-2">View Buyer Profile →</Link>
          )}
        </div>

        {/* Payment Terms */}
        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Payment Terms</h2>
          {[
            ['Down Payment', formatNaira(s.down_payment)],
            ['Weekly Payment', formatNaira(s.weekly_payment)],
            ['Total Weeks', `${s.total_weeks}`],
            ['Weeks Paid', `${s.weeks_paid} / ${s.total_weeks}`],
            ['Next Due Date', s.next_due_date ? format(new Date(s.next_due_date), 'MMM d, yyyy') : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Phone Details */}
        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Device</h2>
          {[
            ['Brand / Model', s.phones ? `${s.phones.brand} ${s.phones.model}` : '—'],
            ['IMEI', s.phones?.imei ?? '—'],
            ['Storage', s.phones?.storage ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
              <span className={label === 'IMEI' ? 'font-mono text-xs' : ''} style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            </div>
          ))}
          {s.phones && (
            <Link href={`/agent/phones/${s.phones.id}`} className="btn btn-ghost text-xs mt-2">View Phone →</Link>
          )}
        </div>

        {/* Virtual Account */}
        {s.virtual_account_number && (
          <div className="gold-panel p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Building2 className="w-4 h-4" /> Virtual Account
            </h2>
            {[
              ['Bank', s.virtual_account_bank ?? '—'],
              ['Account No.', s.virtual_account_number],
              ['Reference', s.virtual_account_reference ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                <span className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              </div>
            ))}
            {s.payment_url && (
              <a href={s.payment_url} target="_blank" rel="noreferrer" className="btn btn-primary text-xs mt-2">
                Open Payment Link →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="gold-panel overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Payment History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(payments ?? []).length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No payments yet.</td></tr>
              ) : (payments ?? []).map((pay) => {
                const p = pay as { id: string; amount: number; status: string; gateway: string | null; paid_at: string | null; created_at: string }
                return (
                  <tr key={p.id}>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{format(new Date(p.paid_at ?? p.created_at), 'MMM d, yyyy HH:mm')}</td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(p.amount)}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{p.gateway ?? '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
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

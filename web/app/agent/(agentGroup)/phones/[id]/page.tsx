import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'badge-success', available: 'badge-info', grace: 'badge-warning',
    lock: 'badge-error', completed: 'bg-purple-900/30 text-purple-400 border border-purple-900/40',
    suspended: 'badge-neutral', sold: 'badge-neutral', defaulted: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function PhoneDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: phone } = await supabase
    .from('phones')
    .select('*')
    .eq('id', id)
    .eq('agent_id', user.id)
    .maybeSingle()

  if (!phone) notFound()
  const p = phone as {
    id: string; imei: string; brand: string; model: string; storage: string | null; color: string | null
    cost_price: number; selling_price: number; down_payment: number; weekly_payment: number
    payment_weeks: number; status: string; created_at: string
  }

  const { data: sale } = await supabase
    .from('phone_sales')
    .select('*, buyers(full_name, phone, email, address)')
    .eq('phone_id', id)
    .maybeSingle()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', (sale as { id?: string } | null)?.id ?? '')
    .order('created_at', { ascending: false })

  const { data: logs } = await supabase
    .from('phone_logs')
    .select('*')
    .eq('phone_id', id)
    .order('created_at', { ascending: false })

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'payments', label: 'Payment History' },
    { key: 'logs', label: 'Device Logs' },
  ]

  const s = sale as {
    id: string; status: string; selling_price: number; down_payment: number; weekly_payment: number
    total_weeks: number; total_paid: number; outstanding_balance: number; weeks_paid: number
    next_due_date: string | null; virtual_account_number: string | null; virtual_account_bank: string | null
    sale_date: string; buyers: { full_name: string; phone: string; email: string | null; address: string | null } | null
  } | null

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/agent/phones" className="btn btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>{p.brand} {p.model}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>IMEI: {p.imei}</p>
        </div>
        {p.status === 'available' && (
          <Link href={`/agent/phones/${id}/edit`} className="btn btn-ghost">Edit</Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`/agent/phones/${id}?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-current'
                : 'border-transparent'
            }`}
            style={{ color: tab === t.key ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone Details */}
          <div className="gold-panel p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Phone Details</h2>
            {[
              ['Brand', p.brand], ['Model', p.model], ['Storage', p.storage ?? '—'], ['Color', p.color ?? '—'],
              ['Cost Price', formatNaira(p.cost_price)], ['Selling Price', formatNaira(p.selling_price)],
              ['Down Payment', formatNaira(p.down_payment)], ['Weekly Payment', formatNaira(p.weekly_payment)],
              ['Payment Weeks', `${p.payment_weeks} weeks`],
              ['Added', format(new Date(p.created_at), 'MMM d, yyyy')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Sale Info */}
          {s ? (
            <div className="gold-panel p-6 space-y-4">
              <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Sale Terms</h2>
              <div className="space-y-3">
                {[
                  ['Buyer', s.buyers?.full_name ?? '—'],
                  ['Phone', s.buyers?.phone ?? '—'],
                  ['Address', s.buyers?.address ?? '—'],
                  ['Sale Date', s.sale_date ? format(new Date(s.sale_date), 'MMM d, yyyy') : '—'],
                  ['Status', null],
                  ['Total Paid', formatNaira(s.total_paid)],
                  ['Outstanding', formatNaira(s.outstanding_balance)],
                  ['Weeks Paid', `${s.weeks_paid} / ${s.total_weeks}`],
                  ['Next Due Date', s.next_due_date ? format(new Date(s.next_due_date), 'MMM d, yyyy') : '—'],
                  ['Virtual Account', s.virtual_account_number ? `${s.virtual_account_bank} — ${s.virtual_account_number}` : 'Not generated'],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
                    {label === 'Status' ? <StatusBadge status={s.status} /> : <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="gold-panel p-6 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>No sale associated with this phone.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className="gold-panel overflow-hidden">
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
                  const p2 = pay as { id: string; amount: number; status: string; gateway: string | null; paid_at: string | null; created_at: string }
                  return (
                    <tr key={p2.id}>
                      <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {format(new Date(p2.paid_at ?? p2.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(p2.amount)}</td>
                      <td style={{ color: 'hsl(var(--muted-foreground))' }}>{p2.gateway ?? '—'}</td>
                      <td><StatusBadge status={p2.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="gold-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No logs yet.</td></tr>
                ) : (logs ?? []).map((log) => {
                  const l = log as { id: string; event_type: string; details: string | null; created_at: string }
                  return (
                    <tr key={l.id}>
                      <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{format(new Date(l.created_at), 'MMM d, yyyy HH:mm')}</td>
                      <td><span className="badge badge-info">{l.event_type}</span></td>
                      <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{l.details ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

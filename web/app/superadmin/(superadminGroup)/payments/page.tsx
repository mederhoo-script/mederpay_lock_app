import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-error',
  }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function SuperadminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fees } = await supabase
    .from('weekly_fees')
    .select('*, profiles(full_name, email)')
    .order('week_start', { ascending: false })
    .limit(100)

  const feesArr = (fees ?? []) as Array<{
    id: string; week_start: string; week_end: string; phones_sold: number; fee_amount: number
    status: string; paid_at: string | null
    profiles: { full_name: string; email: string | null } | null
  }>

  const totalCollected = feesArr.filter(f => f.status === 'paid').reduce((s, f) => s + f.fee_amount, 0)
  const totalOutstanding = feesArr.filter(f => f.status !== 'paid').reduce((s, f) => s + f.fee_amount, 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Payments</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>All agent weekly fee records</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card p-4 space-y-1">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Collected</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(142 72% 60%)' }}>{formatNaira(totalCollected)}</p>
        </div>
        <div className="stat-card p-4 space-y-1">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Outstanding</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(38 92% 62%)' }}>{formatNaira(totalOutstanding)}</p>
        </div>
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Week Start</th>
                <th>Week End</th>
                <th>Phones Sold</th>
                <th>Fee Amount</th>
                <th>Status</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {feesArr.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No fee records yet.</td></tr>
              ) : feesArr.map(fee => (
                <tr key={fee.id}>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{fee.profiles?.full_name ?? '—'}</td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {format(new Date(fee.week_start), 'MMM d, yyyy')}
                  </td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {format(new Date(fee.week_end), 'MMM d, yyyy')}
                  </td>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{fee.phones_sold}</td>
                  <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(fee.fee_amount)}</td>
                  <td><StatusBadge status={fee.status} /></td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {fee.paid_at ? format(new Date(fee.paid_at), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

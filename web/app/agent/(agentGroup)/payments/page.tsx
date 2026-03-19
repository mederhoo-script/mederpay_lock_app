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

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fees } = await supabase
    .from('weekly_fees')
    .select('*')
    .eq('agent_id', user.id)
    .order('week_start', { ascending: false })

  const feesArr = (fees ?? []) as Array<{
    id: string; week_start: string; week_end: string; phones_sold: number; fee_amount: number
    status: string; paid_at: string | null; virtual_account_number: string | null; virtual_account_bank: string | null
  }>

  const totalPaid = feesArr.filter(f => f.status === 'paid').reduce((s, f) => s + f.fee_amount, 0)
  const totalOutstanding = feesArr.filter(f => f.status !== 'paid').reduce((s, f) => s + f.fee_amount, 0)

  // Current week
  const now = new Date()
  const currentFee = feesArr.find(f => {
    const start = new Date(f.week_start)
    const end = new Date(f.week_end)
    return now >= start && now <= end
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Weekly Fees</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Platform fees based on phones sold</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card p-4 space-y-1">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Fees Paid</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(142 72% 60%)' }}>{formatNaira(totalPaid)}</p>
        </div>
        <div className="stat-card p-4 space-y-1">
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Outstanding Fees</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(38 92% 62%)' }}>{formatNaira(totalOutstanding)}</p>
        </div>
      </div>

      {/* Current Week */}
      {currentFee && (
        <div className="gold-panel p-6 space-y-3">
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Current Week</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Week', `${format(new Date(currentFee.week_start), 'MMM d')} – ${format(new Date(currentFee.week_end), 'MMM d')}`],
              ['Phones Sold', currentFee.phones_sold],
              ['Fee Amount', formatNaira(currentFee.fee_amount)],
            ].map(([label, value]) => (
              <div key={label as string} className="space-y-1">
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</p>
                <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{value}</p>
              </div>
            ))}
            <div className="space-y-1">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</p>
              <StatusBadge status={currentFee.status} />
            </div>
          </div>
          {currentFee.status !== 'paid' && currentFee.virtual_account_number && (
            <div className="rounded-lg p-3 space-y-1" style={{ background: 'hsl(var(--secondary))' }}>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Pay to:</p>
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                {currentFee.virtual_account_bank} — {currentFee.virtual_account_number}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fee History */}
      <div className="gold-panel overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Fee History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Phones Sold</th>
                <th>Fee Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Virtual Account</th>
              </tr>
            </thead>
            <tbody>
              {feesArr.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No fees yet.</td></tr>
              ) : feesArr.map(fee => (
                <tr key={fee.id}>
                  <td className="text-xs" style={{ color: 'hsl(var(--foreground))' }}>
                    {format(new Date(fee.week_start), 'MMM d')} – {format(new Date(fee.week_end), 'MMM d, yyyy')}
                  </td>
                  <td style={{ color: 'hsl(var(--foreground))' }}>{fee.phones_sold}</td>
                  <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{formatNaira(fee.fee_amount)}</td>
                  <td><StatusBadge status={fee.status} /></td>
                  <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {fee.paid_at ? format(new Date(fee.paid_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {fee.virtual_account_bank ? `${fee.virtual_account_bank} ${fee.virtual_account_number ?? ''}` : '—'}
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

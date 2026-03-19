import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { available: 'badge-info', sold: 'badge-neutral', lock: 'badge-error' }
  return <span className={`badge ${colors[status] ?? 'badge-neutral'}`}>{status}</span>
}

export default async function SuperadminPhonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: phones } = await supabase
    .from('phones')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>All Phones</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Every phone across the platform</p>
      </div>
      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>IMEI</th><th>Brand/Model</th><th>Status</th><th>Agent</th><th>Cost</th><th>Selling</th><th>Added</th></tr>
            </thead>
            <tbody>
              {(phones ?? []).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No phones yet.</td></tr>
              ) : (phones ?? []).map(p => {
                const ph = p as { id: string; imei: string; brand: string; model: string; status: string; cost_price: number; selling_price: number; created_at: string; profiles: { full_name: string } | null }
                return (
                  <tr key={ph.id}>
                    <td className="font-mono text-xs">{ph.imei}</td>
                    <td>{ph.brand} {ph.model}</td>
                    <td><StatusBadge status={ph.status} /></td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{ph.profiles?.full_name ?? '—'}</td>
                    <td className="font-mono text-xs">{formatNaira(ph.cost_price)}</td>
                    <td className="font-mono text-xs">{formatNaira(ph.selling_price)}</td>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{format(new Date(ph.created_at), 'MMM d, yyyy')}</td>
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

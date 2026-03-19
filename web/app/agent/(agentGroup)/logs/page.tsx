import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('phone_logs')
    .select('*, phones(imei, brand, model, agent_id)')
    .order('created_at', { ascending: false })
    .limit(50)

  const agentLogs = (logs ?? []).filter(l => {
    const phone = l.phones as { agent_id: string } | null
    return phone?.agent_id === user.id
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Device Logs</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Recent activity across your devices</p>
      </div>

      <div className="gold-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IMEI</th>
                <th>Device</th>
                <th>Event</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {agentLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>No logs found.</td></tr>
              ) : agentLogs.map(log => {
                const l = log as {
                  id: string; event_type: string; details: string | null; created_at: string
                  phones: { imei: string; brand: string; model: string } | null
                }
                return (
                  <tr key={l.id}>
                    <td className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {format(new Date(l.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="font-mono text-xs" style={{ color: 'hsl(var(--foreground))' }}>{l.phones?.imei ?? '—'}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {l.phones ? `${l.phones.brand} ${l.phones.model}` : '—'}
                    </td>
                    <td><span className="badge badge-info">{l.event_type}</span></td>
                    <td className="text-xs max-w-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {l.details ?? '—'}
                    </td>
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

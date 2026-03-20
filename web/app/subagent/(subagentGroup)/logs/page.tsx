import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function EventBadge({ type }: { type: string }) {
  const cls =
    type === 'locked' ? 'badge-danger' :
    type === 'unlocked' ? 'badge-success' :
    type === 'payment' ? 'badge-info' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{type}</span>
}

export default async function SubagentLogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get phones from sales sold by this subagent
  const { data: sales } = await supabase
    .from('phone_sales')
    .select('phone_id, phones(id, imei)')
    .eq('sold_by', user.id)

  const phoneIds: string[] = []
  const imeiMap: Record<string, string> = {}
  ;(sales ?? []).forEach((s) => {
    if (s.phone_id) {
      phoneIds.push(s.phone_id)
      const ph = Array.isArray(s.phones) ? s.phones[0] : s.phones
      if (ph) imeiMap[s.phone_id] = ph.imei
    }
  })

  const { data: logs } = phoneIds.length > 0
    ? await supabase
        .from('phone_logs')
        .select('*')
        .in('phone_id', phoneIds)
        .order('created_at', { ascending: false })
        .limit(200)
    : { data: [] }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Phone Logs</h1>
          <p>Activity for phones you&apos;ve sold</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {logs && logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>IMEI</th><th>Event</th><th>Details</th><th>Old Status</th><th>New Status</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{imeiMap[log.phone_id] ?? (log.phone_id?.slice(0, 8) ?? '') + '…'}</td>
                    <td><EventBadge type={log.event_type ?? 'unknown'} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.details ?? '—'}</td>
                    <td>{log.old_status ? <span className="badge badge-neutral">{log.old_status}</span> : '—'}</td>
                    <td>{log.new_status ? <span className="badge badge-info">{log.new_status}</span> : '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><ScrollText size={32} /><p>No logs yet.</p></div>
        )}
      </div>
    </div>
  )
}

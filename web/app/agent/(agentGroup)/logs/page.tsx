import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function EventBadge({ type }: { type: string }) {
  const cls =
    type === 'locked' ? 'badge-danger' :
    type === 'unlocked' ? 'badge-success' :
    type === 'payment' ? 'badge-info' :
    type === 'registered' ? 'badge-accent' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{type}</span>
}

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // get agent's and subagents' phone ids for log visibility
  const { data: subagentProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
  const subagentIds = (subagentProfiles ?? []).map((p) => p.id)
  const ownerIds = [user.id, ...subagentIds]

  // get agent's phone ids first
  const { data: phones } = await supabase
    .from('phones')
    .select('id, imei')
    .in('agent_id', ownerIds)

  const phoneIds = (phones ?? []).map((p) => p.id)
  const imeiMap: Record<string, string> = {}
  ;(phones ?? []).forEach((p) => { imeiMap[p.id] = p.imei })

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
          <p>Activity log for your phones</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {logs && logs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IMEI</th>
                  <th>Event</th>
                  <th>Details</th>
                  <th>Old Status</th>
                  <th>New Status</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {imeiMap[log.phone_id] ?? log.phone_id?.slice(0, 8) + '…'}
                    </td>
                    <td><EventBadge type={log.event_type ?? 'unknown'} /></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details ?? '—'}
                    </td>
                    <td>
                      {log.old_status ? <span className="badge badge-neutral">{log.old_status}</span> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td>
                      {log.new_status ? <span className="badge badge-info">{log.new_status}</span> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      {log.phone_id && (
                        <Link href={`/agent/phones/${log.phone_id}`} className="btn btn-ghost btn-sm">View Phone</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ScrollText size={32} />
            <p>No activity logs yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

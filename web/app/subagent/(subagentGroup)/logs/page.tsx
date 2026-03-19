import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Device Logs | MederBuy' }

const EVENT_COLORS: Record<string, string> = {
  DEVICE_REGISTERED: 'badge-info',
  STATUS_CHECK: 'badge-neutral',
  STATUS_CHANGE: 'badge-warning',
  LOCK_ENFORCED: 'badge-error',
  UNLOCK: 'badge-success',
  ROOT_DETECTED: 'badge-error',
  BOOT: 'badge-neutral',
  SYNC_FAIL: 'badge-warning',
  PAYMENT_RECEIVED: 'badge-success',
}

export default async function SubagentLogsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only show logs for phones sold by this sub-agent
  const { data: salesByMe } = await supabase
    .from('phone_sales')
    .select('phone_id')
    .eq('sold_by', user.id)

  const phoneIds = (salesByMe ?? []).map((s) => s.phone_id).filter(Boolean)

  const { data: logs } = phoneIds.length
    ? await supabase
        .from('phone_logs')
        .select('id, created_at, event_type, details, phone_id, phones(imei, brand, model)')
        .in('phone_id', phoneIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Device Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Activity for phones you sold</p>
      </div>

      <div className="gold-panel overflow-hidden">
        {!logs?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No logs found for your sales</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>IMEI</th>
                  <th>Event</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const phoneRaw = log.phones as any
                  const phone = Array.isArray(phoneRaw) ? phoneRaw[0] : phoneRaw
                  return (
                    <tr key={log.id}>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="font-mono text-xs">{phone?.imei ?? '—'}</td>
                      <td>
                        <span className={`badge ${EVENT_COLORS[log.event_type] ?? 'badge-neutral'}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground max-w-xs truncate">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

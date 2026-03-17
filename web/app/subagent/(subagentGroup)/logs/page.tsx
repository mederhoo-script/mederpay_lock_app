import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Device Logs | MederBuy Sub-Agent' }

const EVENT_COLORS: Record<string, string> = {
  LOCK_ENFORCED: 'bg-red-900/30 text-red-400',
  UNLOCK: 'bg-green-900/30 text-green-400',
  ROOT_DETECTED: 'bg-orange-900/30 text-orange-400',
  PAYMENT_RECEIVED: 'bg-blue-900/30 text-blue-400',
  BOOT: 'bg-white/10 text-white/60',
  SYNC_FAIL: 'bg-yellow-900/30 text-yellow-400',
  STATUS_CHANGE: 'bg-purple-900/30 text-purple-400',
  DEVICE_REGISTERED: 'bg-emerald-900/30 text-emerald-400',
  STATUS_CHECK: 'bg-white/10 text-white/60',
}

export default async function SubagentLogsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find sales sold by this subagent to get phone IDs
  const { data: sales } = await supabase
    .from('phone_sales')
    .select('phone_id')
    .eq('sold_by', user.id)

  const phoneIds = (sales ?? []).map((s) => s.phone_id as string).filter(Boolean)

  const { data: logs } =
    phoneIds.length > 0
      ? await supabase
          .from('phone_logs')
          .select('*')
          .in('phone_id', phoneIds)
          .order('timestamp', { ascending: false })
          .limit(200)
      : { data: [] }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Device Logs</h1>
        <p className="text-sm text-white/50 mt-1">
          Events for phones you have sold
        </p>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">IMEI</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Event</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Details</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id as string} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-white/70 text-xs">
                    {log.imei as string}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        EVENT_COLORS[log.event_type as string] ?? 'bg-white/10 text-white/60'
                      }`}
                    >
                      {log.event_type as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50 max-w-xs truncate">
                    {(log.details as string | null) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-white/40 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp as string), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-white/30">
                  No device events for your phones yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

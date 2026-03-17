import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'

export const metadata = { title: 'All Phones | MederBuy Admin' }

interface PhoneRow {
  id: string
  imei: string
  brand: string
  model: string
  status: string
  selling_price: number
  profiles: Array<{ full_name: string }> | { full_name: string } | null
}

function getAgentName(phone: PhoneRow): string {
  if (!phone.profiles) return '—'
  if (Array.isArray(phone.profiles)) return phone.profiles[0]?.full_name ?? '—'
  return phone.profiles.full_name
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-900/30 text-emerald-400',
  sold: 'bg-blue-900/30 text-blue-400',
  locked: 'bg-red-900/30 text-red-400',
  unlocked: 'bg-green-900/30 text-green-400',
  returned: 'bg-white/10 text-white/50',
}

export default async function SuperadminPhonesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: phones } = await supabase
    .from('phones')
    .select('id, imei, brand, model, status, selling_price, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Phones</h1>
        <p className="text-sm text-white/50 mt-1">
          Full phone inventory across all agents
        </p>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white/50">IMEI</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Agent</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Price</th>
              <th className="px-4 py-3 text-left font-medium text-white/50">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {phones && phones.length > 0 ? (
              (phones as unknown as PhoneRow[]).map((phone) => (
                <tr key={phone.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-white/70 text-xs">{phone.imei}</td>
                  <td className="px-4 py-3 text-white">
                    {phone.brand} {phone.model}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {getAgentName(phone)}
                  </td>
                  <td className="px-4 py-3 text-white">{formatNaira(phone.selling_price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[phone.status] ?? 'bg-white/10 text-white/60'
                      }`}
                    >
                      {phone.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-white/30">
                  No phones registered on the platform yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNaira } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function SuperadminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tiers } = await supabase.from('fee_tiers').select('*').order('min_price')

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Platform configuration</p>
      </div>
      <div className="gold-panel p-6 space-y-3">
        <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Platform</h2>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Platform Name</span>
          <span style={{ color: 'hsl(var(--foreground))' }}>MederBuy</span>
        </div>
      </div>
      <div className="gold-panel overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Fee Tiers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Label</th><th>Min Price</th><th>Max Price</th><th>Weekly Fee</th></tr></thead>
            <tbody>
              {(tiers ?? []).map(t => {
                const tier = t as { id: string; label: string; min_price: number; max_price: number | null; fee_amount: number }
                return (
                  <tr key={tier.id}>
                    <td>{tier.label}</td>
                    <td className="font-mono text-xs">{formatNaira(tier.min_price)}</td>
                    <td className="font-mono text-xs">{tier.max_price != null ? formatNaira(tier.max_price) : 'No limit'}</td>
                    <td className="font-mono text-xs">{formatNaira(tier.fee_amount)}</td>
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

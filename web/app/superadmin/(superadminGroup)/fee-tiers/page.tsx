import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeeTiersTable } from './fee-tiers-table'
import { formatNaira } from '@/lib/utils'

export const metadata = { title: 'Fee Tiers | MederBuy Admin' }

export default async function SuperadminFeeTiersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: feeTiers }, { data: weeklyFees }] = await Promise.all([
    supabase.from('fee_tiers').select('*').order('min_price', { ascending: true }),
    supabase.from('weekly_fees').select('total_fee, status'),
  ])

  const outstanding =
    weeklyFees?.filter((f) => f.status !== 'paid').reduce((s, f) => s + (f.total_fee as number), 0) ?? 0
  const collected =
    weeklyFees?.filter((f) => f.status === 'paid').reduce((s, f) => s + (f.total_fee as number), 0) ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Fee Tiers</h1>
        <p className="text-sm text-white/50 mt-1">
          Configure platform fees charged per phone sold. Applied every Sunday based on selling price.
        </p>
      </div>

      {/* Fee summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/50">Outstanding Fees</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{formatNaira(outstanding)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/50">Fees Collected</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatNaira(collected)}</p>
        </div>
      </div>

      {/* Editable tiers table */}
      <FeeTiersTable tiers={feeTiers ?? []} />

      <p className="text-xs text-white/30">
        Note: Min/Max price ranges are stored in kobo (×100). Edit labels and fee amounts here.
        Contact your database administrator to change price range boundaries.
      </p>
    </div>
  )
}

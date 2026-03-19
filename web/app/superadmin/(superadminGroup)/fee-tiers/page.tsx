import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeeTiersTable from './fee-tiers-table'

export const dynamic = 'force-dynamic'

export default async function FeeTiersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tiers } = await supabase
    .from('fee_tiers')
    .select('*')
    .order('min_price', { ascending: true })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Fee Tiers</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Configure weekly fee tiers based on selling price</p>
      </div>
      <FeeTiersTable
        tiers={(tiers ?? []) as Array<{ id: string; label: string; min_price: number; max_price: number | null; fee_amount: number; created_at: string }>}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sub-Agent Dashboard | MederBuy' }

export default async function SubagentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: mySales },
    { count: activeSales },
    { count: lockedSales },
  ] = await Promise.all([
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id)
      .eq('status', 'active'),
    supabase
      .from('phone_sales')
      .select('*', { count: 'exact', head: true })
      .eq('sold_by', user.id)
      .eq('status', 'lock'),
  ])

  const stats = [
    { label: 'Total Sales by Me', value: mySales ?? 0, color: 'text-[#2563EB]' },
    { label: 'Active Loans', value: activeSales ?? 0, color: 'text-[#F59E0B]' },
    { label: 'Locked Phones', value: lockedSales ?? 0, color: 'text-red-400' },
  ]

  

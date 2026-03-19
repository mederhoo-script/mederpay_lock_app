import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatNaira } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, User, Phone, Mail, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Sub-Agent Detail | MederBuy' }

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-900/30 text-emerald-400',
  pending:   'bg-yellow-900/30 text-yellow-400',
  suspended: 'bg-red-900/30 text-red-400',
}

const SALE_STATUS_COLORS: Record<string, string> = {
  active:    'bg-blue-900/30 text-blue-400',
  grace:     'bg-yellow-900/30 text-yellow-400',
  lock:      'bg-red-900/30 text-red-400',
  completed: 'bg-emerald-900/30 text-emerald-400',
  defaulted: 'bg-red-900/40 text-red-300',
}

interface SaleRow {
  id: string
  status: string
  selling_price: number
  outstanding_balance: number
  next_due_date: string | null
  buyers: { full_name: string; phone: string } | { full_name: string; phone: string }[] | null
  phones: { brand: string; model: string } | { brand: string; model: string }[] | null
}

function getBuyerName(s: SaleRow): string {
  if (!s.buyers) return '—'
  return Array.isArray(s.buyers) ? (s.buyers[0]?.full_name ?? '—') : s.buyers.full_name
}

function getPhoneLabel(s: SaleRow): string {
  if (!s.phones) return '—'
  const p = Array.isArray(s.phones) ? s.phones[0] : s.phones
  return p ? `${p.brand} ${p.model}` : '—'
}

export default async function SubAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch sub-agent profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, role, created_at, parent_agent_id')
    .eq('id', id)
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
    .maybeSingle()

  if (!profile) notFound()

  // Fetch their sales
  const { data: sales } = await supabase
    .from('phone_sales')
    .select(
      'id, status, selling_price, outstanding_balance, next_due_date, buyers(full_name, phone), phones(brand, model)',
    )
    .eq('sold_by', profile.id)
    .order('sale_date', { ascending: false })
    .limit(50)

  const totalSales   = sales?.length ?? 0
  const activeSales  = sales?.filter((s) => !['completed', 'defaulted'].includes((s as unknown as SaleRow).status)).length ?? 0
  const totalRevenue = sales?.reduce((sum, s) => sum + ((s as unknown as SaleRow).selling_price), 0) ?? 0

  
      

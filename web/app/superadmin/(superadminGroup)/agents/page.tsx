import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentsTable } from './agents-table'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Agents | MederBuy Admin' }

export default async function SuperadminAgentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at')
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Management</h1>
        <p className="text-sm text-white/50 mt-1">
          Approve, suspend or manage all agents on the platform
        </p>
      </div>
      <AgentsTable agents={agents ?? []} />
    </div>
  )
}

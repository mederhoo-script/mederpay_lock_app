import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgentSidebar from './Sidebar'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'superadmin') redirect('/superadmin/dashboard')
  if (profile.status === 'suspended') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      <AgentSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden h-14" />
        {children}
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgentSidebar from './Sidebar'
import SuperadminSidebar from '@/app/superadmin/(superadminGroup)/Sidebar'

export const dynamic = 'force-dynamic'

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Superadmin may browse agent pages — allow through (no redirect)
  if (profile.status === 'suspended') redirect('/login?error=inactive')
  if (profile.role !== 'agent' && profile.role !== 'subagent' && profile.role !== 'superadmin') redirect('/login')

  const sidebar =
    profile.role === 'superadmin'
      ? <SuperadminSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />
      : <AgentSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {sidebar}
      <main className="dashboard-layout-main" style={{
        flex: 1,
        minWidth: 0,
        padding: '1.5rem',
        overflowY: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}

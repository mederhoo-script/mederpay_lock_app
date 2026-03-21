import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubagentSidebar from './Sidebar'
import AgentSidebar from '@/app/agent/(agentGroup)/Sidebar'
import SuperadminSidebar from '@/app/superadmin/(superadminGroup)/Sidebar'

export const dynamic = 'force-dynamic'

export default async function SubagentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // Suspended check only for actual subagents
  if (profile.role === 'subagent' && profile.status === 'suspended') redirect('/login?error=inactive')
  // Only subagents, agents, and superadmin may access these pages
  if (profile.role !== 'subagent' && profile.role !== 'agent' && profile.role !== 'superadmin') redirect('/login')

  const sidebar =
    profile.role === 'superadmin'
      ? <SuperadminSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />
      : profile.role === 'agent'
        ? <AgentSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />
        : <SubagentSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {sidebar}
      <main className="dashboard-layout-main" style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflowY: 'auto' }}>
        {/* Centered logo bar — visible on all subagent pages */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MederBuy" style={{ height: '36px', width: 'auto', borderRadius: '8px' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>MederBuy</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1, marginTop: '0.2rem' }}>Sub-Agent Portal</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

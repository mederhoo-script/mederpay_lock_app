import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperadminSidebar from './Sidebar'

export const dynamic = 'force-dynamic'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'superadmin') redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SuperadminSidebar user={{ name: profile.full_name ?? '', email: user.email ?? '' }} />
      <main className="dashboard-layout-main" style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflowY: 'auto' }}>
        {/* Centered logo bar — visible on all superadmin pages */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MederBuy" style={{ height: '36px', width: 'auto', borderRadius: '8px' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>MederBuy</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--accent)', lineHeight: 1, marginTop: '0.2rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Portal</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

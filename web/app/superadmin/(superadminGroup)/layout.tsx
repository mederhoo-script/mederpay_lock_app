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
      <main style={{ flex: 1, minWidth: 0, padding: '1.5rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}

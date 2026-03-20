import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

export default async function SuperadminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Superadmin profile and platform preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '480px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile</h2>
          <div className="detail-row"><span className="detail-key">Full Name</span><span className="detail-value">{profile?.full_name ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{user.email}</span></div>
          <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{profile?.phone ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Role</span>
            <span className="detail-value"><span className="badge badge-accent">superadmin</span></span>
          </div>
          <div className="detail-row"><span className="detail-key">Member Since</span>
            <span className="detail-value">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>

        <div className="card" style={{ maxWidth: '480px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Appearance</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Choose the colour theme for the entire dashboard.
          </p>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

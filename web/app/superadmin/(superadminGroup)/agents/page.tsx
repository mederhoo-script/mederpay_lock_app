import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperadminAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at')
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Agents</h1>
          <p>All registered agents on the platform</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {agents && agents.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td style={{ fontWeight: 500 }}>{agent.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{agent.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{agent.phone ?? '—'}</td>
                    <td>
                      <span className={`badge ${agent.status === 'active' ? 'badge-success' : agent.status === 'suspended' ? 'badge-danger' : 'badge-neutral'}`}>
                        {agent.status ?? 'pending'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {new Date(agent.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/superadmin/agents/${agent.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={32} />
            <p>No agents registered yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

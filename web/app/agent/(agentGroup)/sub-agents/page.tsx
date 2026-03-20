import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SubAgentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: subAgents } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, status, created_at')
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sub-Agents</h1>
          <p>Manage your sub-agents</p>
        </div>
        <Link href="/agent/sub-agents/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Sub-Agent
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {subAgents && subAgents.length > 0 ? (
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
                {subAgents.map((sa) => (
                  <tr key={sa.id}>
                    <td style={{ fontWeight: 500 }}>{sa.full_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{sa.email}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{sa.phone ?? '—'}</td>
                    <td>
                      <span className={`badge ${sa.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {sa.status ?? 'pending'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {new Date(sa.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/agent/sub-agents/${sa.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <UserCheck size={32} />
            <p>No sub-agents yet. <Link href="/agent/sub-agents/new" style={{ color: 'var(--accent)' }}>Add a sub-agent</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}

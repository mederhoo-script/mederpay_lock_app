import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SubAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: subAgent } = await db
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('parent_agent_id', user.id)
    .eq('role', 'subagent')
    .single()

  if (!subAgent) notFound()

  const { count: salesCount } = await db
    .from('phone_sales')
    .select('*', { count: 'exact', head: true })
    .eq('sold_by', id)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/sub-agents" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{subAgent.full_name ?? 'Sub-Agent'}</h1>
            <p>Sub-Agent Profile</p>
          </div>
        </div>
        <span className={`badge ${subAgent.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {subAgent.status ?? 'pending'}
        </span>
      </div>

      <div className="card" style={{ maxWidth: '560px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile Details</h2>
        <div className="detail-row"><span className="detail-key">Full Name</span><span className="detail-value">{subAgent.full_name ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{subAgent.email ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-value">{subAgent.phone ?? '—'}</span></div>
        <div className="detail-row"><span className="detail-key">Status</span>
          <span className="detail-value">
            <span className={`badge ${subAgent.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {subAgent.status ?? '—'}
            </span>
          </span>
        </div>
        <div className="detail-row"><span className="detail-key">Total Sales</span><span className="detail-value">{salesCount ?? 0}</span></div>
        <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-value">{new Date(subAgent.created_at).toLocaleDateString()}</span></div>
      </div>
    </div>
  )
}

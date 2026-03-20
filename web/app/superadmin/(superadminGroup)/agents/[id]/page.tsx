import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, User, Phone, Mail, Calendar, BarChart2, Users, Smartphone, ShoppingCart } from 'lucide-react'
import AgentStatusActions from './AgentStatusActions'

export const dynamic = 'force-dynamic'

export default async function SuperadminAgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as { role: string }).role !== 'superadmin') redirect('/login')

  // Fetch agent profile
  const { data: agent } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, username, status, created_at')
    .eq('id', id)
    .eq('role', 'agent')
    .single()

  if (!agent) notFound()

  const a = agent as {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    username: string | null
    status: string
    created_at: string
  }

  // Fetch stats in parallel
  const [subAgentRes, phoneRes, salesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('parent_agent_id', id)
      .eq('role', 'subagent'),
    supabase
      .from('phones')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id),
    supabase
      .from('phone_sales')
      .select('total_paid')
      .eq('agent_id', id),
  ])

  const subAgentCount = subAgentRes.count ?? 0
  const phoneCount = phoneRes.count ?? 0
  const salesList = (salesRes.data ?? []) as { total_paid: number }[]
  const salesCount = salesList.length
  const totalRevenue = salesList.reduce((sum, s) => sum + (s.total_paid ?? 0), 0)

  const statusColor =
    a.status === 'active' ? 'badge-success' :
    a.status === 'suspended' ? 'badge-danger' : 'badge-neutral'

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/superadmin/agents" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem', gap: '0.375rem' }}>
            <ArrowLeft size={16} />
            Back
          </Link>
          <h1>{a.full_name ?? a.email}</h1>
          <p>Agent profile and account management</p>
        </div>
        <AgentStatusActions agentId={id} currentStatus={a.status} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{subAgentCount}</div>
          <div className="stat-label">Sub-Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Smartphone size={20} /></div>
          <div className="stat-value">{phoneCount}</div>
          <div className="stat-label">Phones</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShoppingCart size={20} /></div>
          <div className="stat-value">{salesCount}</div>
          <div className="stat-label">Sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BarChart2 size={20} /></div>
          <div className="stat-value">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(totalRevenue / 100)}</div>
          <div className="stat-label">Total Collected</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ maxWidth: '640px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Profile Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</div>
              <div style={{ fontWeight: 500 }}>{a.full_name ?? '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Mail size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</div>
              <div>{a.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Phone size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone</div>
              <div>{a.phone ?? '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Joined</div>
              <div>{new Date(a.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '16px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</div>
              <span className={`badge ${statusColor}`}>{a.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BuyersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: buyers } = await supabase
    .from('buyers')
    .select('id, full_name, phone, email, address, created_at')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Buyers</h1>
          <p>Manage your registered buyers</p>
        </div>
        <Link href="/agent/buyers/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Buyer
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {buyers && buyers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td style={{ fontWeight: 500 }}>{buyer.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{buyer.phone}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{buyer.email ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyer.address}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {new Date(buyer.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/agent/buyers/${buyer.id}`} className="btn btn-ghost btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={32} />
            <p>No buyers yet. <Link href="/agent/buyers/new" style={{ color: 'var(--accent)' }}>Register a buyer</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}

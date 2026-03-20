import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { Smartphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'available' ? 'badge-success' :
    status === 'sold' ? 'badge-info' :
    status === 'locked' ? 'badge-danger' : 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SuperadminPhonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client so RLS doesn't restrict phones to the requesting user
  const db = createServiceClient()
  const { data: phones } = await db
    .from('phones')
    .select('id, imei, brand, model, status, selling_price, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>All Phones</h1>
          <p>All phones across all agents</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {phones && phones.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IMEI</th>
                  <th>Brand / Model</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Selling Price</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((phone) => {
                  const profile = Array.isArray(phone.profiles) ? phone.profiles[0] : phone.profiles
                  return (
                    <tr key={phone.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{phone.imei}</td>
                      <td style={{ fontWeight: 500 }}>{phone.brand} {phone.model}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{profile?.full_name ?? profile?.email ?? '—'}</td>
                      <td><StatusBadge status={phone.status ?? 'available'} /></td>
                      <td>{formatNaira(phone.selling_price ?? 0)}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {new Date(phone.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link href={`/superadmin/phones/${phone.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Smartphone size={32} />
            <p>No phones registered yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { Plus, Smartphone } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'available' ? 'badge-success' :
    status === 'sold' ? 'badge-info' :
    status === 'locked' ? 'badge-danger' :
    status === 'unlocked' ? 'badge-success' :
    'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function PhonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: phones } = await supabase
    .from('phones')
    .select('*')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Phones</h1>
          <p>Manage your phone inventory</p>
        </div>
        <Link href="/agent/phones/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Phone
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {phones && phones.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IMEI</th>
                  <th>Brand / Model</th>
                  <th>Color</th>
                  <th>Storage</th>
                  <th>Selling Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {phones.map((phone) => (
                  <tr key={phone.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {phone.imei}
                    </td>
                    <td style={{ fontWeight: 500 }}>{phone.brand} {phone.model}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{phone.color ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{phone.storage ?? '—'}</td>
                    <td>{formatNaira(phone.selling_price ?? 0)}</td>
                    <td><StatusBadge status={phone.status ?? 'available'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/agent/phones/${phone.id}`} className="btn btn-ghost btn-sm">View</Link>
                        <Link href={`/agent/phones/${phone.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Smartphone size={32} />
            <p>No phones yet. <Link href="/agent/phones/new" style={{ color: 'var(--accent)' }}>Add your first phone</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}

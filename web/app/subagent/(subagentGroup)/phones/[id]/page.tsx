import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { formatNaira } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function PhoneStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'available' ? 'badge-success' :
    status === 'sold' ? 'badge-info' :
    status === 'locked' ? 'badge-danger' : 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

function SaleStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active' ? 'badge-success' :
    status === 'grace' ? 'badge-warning' :
    status === 'locked' || status === 'lock' ? 'badge-danger' :
    status === 'completed' ? 'badge-info' : 'badge-neutral'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default async function SubagentPhoneDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()

  // Verify the subagent sold this phone (has a sale with sold_by = user.id for this phone)
  const { data: sale } = await supabase
    .from('phone_sales')
    .select('id, status, selling_price, total_paid, next_due_date, sale_date')
    .eq('phone_id', id)
    .eq('sold_by', user.id)
    .maybeSingle()

  if (!sale) notFound()

  // Fetch the full phone details via service client (bypasses RLS)
  const { data: phone } = await db
    .from('phones')
    .select('*')
    .eq('id', id)
    .single()

  if (!phone) notFound()

  const outstanding = (sale.selling_price ?? 0) - (sale.total_paid ?? 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/subagent/sales" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>{phone.brand} {phone.model}</h1>
            <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>IMEI: {phone.imei}</p>
          </div>
        </div>
        <PhoneStatusBadge status={phone.status ?? 'available'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Phone Details</h2>
          <div className="detail-row"><span className="detail-key">Brand</span><span className="detail-value">{phone.brand}</span></div>
          <div className="detail-row"><span className="detail-key">Model</span><span className="detail-value">{phone.model}</span></div>
          <div className="detail-row"><span className="detail-key">Storage</span><span className="detail-value">{phone.storage ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Color</span><span className="detail-value">{phone.color ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-key">IMEI</span><span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{phone.imei}</span></div>
          <div className="detail-row"><span className="detail-key">Status</span><span className="detail-value"><PhoneStatusBadge status={phone.status ?? 'available'} /></span></div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Sale Summary</h2>
          <div className="detail-row"><span className="detail-key">Sale Status</span><span className="detail-value"><SaleStatusBadge status={sale.status} /></span></div>
          <div className="detail-row"><span className="detail-key">Selling Price</span><span className="detail-value">{formatNaira(sale.selling_price ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Down Payment</span><span className="detail-value">{formatNaira(phone.down_payment ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Total Paid</span><span className="detail-value" style={{ color: 'var(--success)' }}>{formatNaira(sale.total_paid ?? 0)}</span></div>
          <div className="detail-row"><span className="detail-key">Outstanding</span><span className="detail-value" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>{formatNaira(outstanding)}</span></div>
          <div className="detail-row"><span className="detail-key">Next Due Date</span><span className="detail-value">{sale.next_due_date ? new Date(sale.next_due_date).toLocaleDateString() : '—'}</span></div>
          <div className="detail-row"><span className="detail-key">Sale Date</span><span className="detail-value">{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : '—'}</span></div>
          <div style={{ marginTop: '1rem' }}>
            <Link href={`/subagent/sales/${sale.id}`} className="btn btn-ghost btn-sm">View Full Sale</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

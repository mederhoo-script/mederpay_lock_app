'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

interface Buyer {
  id: string
  full_name: string
  phone: string
  email: string | null
}

export default function SubagentBuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subagent/buyers')
      .then((r) => r.json())
      .then((data) => setBuyers(data.buyers ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Buyers</h1>
          <p>Buyers you have registered</p>
        </div>
        <Link href="/subagent/buyers/new" className="btn btn-primary btn-sm">
          <Plus size={15} /> Register Buyer
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {buyers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td style={{ fontWeight: 500 }}>{buyer.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{buyer.phone}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{buyer.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={32} />
            <p>
              No buyers yet.{' '}
              <Link href="/subagent/buyers/new" style={{ color: 'var(--accent)' }}>Register a buyer</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

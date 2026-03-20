import Link from 'next/link'
import { Smartphone, TrendingUp, Lock, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="MederBuy logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>MederBuy</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '999px', padding: '0.25rem 0.875rem', marginBottom: '1.5rem',
          fontSize: '0.8125rem', color: '#818cf8', fontWeight: 500,
        }}>
          <Smartphone size={12} /> Phone Finance Platform
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '1.25rem', maxWidth: '700px' }}>
          Sell Phones on Installments.{' '}
          <span style={{ color: 'var(--accent)' }}>Get Paid Automatically.</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          MederBuy helps agents manage phone inventory, create installment payment plans, and automatically lock devices when payments are missed.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="btn btn-primary btn-lg">Start for Free</Link>
          <Link href="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem', marginTop: '5rem', width: '100%', maxWidth: '900px',
        }}>
          {[
            { icon: Smartphone, title: 'Inventory Management', desc: 'Track every phone by IMEI with full sale history.', color: 'var(--info)' },
            { icon: TrendingUp, title: 'Installment Plans', desc: 'Flexible weekly payment plans with automatic tracking.', color: 'var(--success)' },
            { icon: Lock, title: 'Remote Locking', desc: 'Lock devices automatically when payments are overdue.', color: 'var(--warning)' },
            { icon: Users, title: 'Sub-Agent Network', desc: 'Expand your reach with a managed sub-agent team.', color: 'var(--accent)' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card" style={{ textAlign: 'left' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Icon size={16} color={color} />
              </div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{title}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        © {new Date().getFullYear()} MederBuy. All rights reserved.
      </footer>
    </div>
  )
}

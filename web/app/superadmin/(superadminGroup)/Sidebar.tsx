'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Smartphone, CreditCard, Layers, Settings, LogOut, Menu, X, ChevronRight, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: { name: string; email: string }
}

const navItems = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
  { label: 'Agents', href: '/superadmin/agents', icon: Users },
  { label: 'Phones', href: '/superadmin/phones', icon: Smartphone },
  { label: 'Sales', href: '/superadmin/sales', icon: ShoppingBag },
  { label: 'Payments', href: '/superadmin/payments', icon: CreditCard },
  { label: 'Fee Tiers', href: '/superadmin/fee-tiers', icon: Layers },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings },
]

export default function SuperadminSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.25rem 0.5rem', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MederBuy logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>MederBuy</span>
            <div style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin</div>
          </div>
        </Link>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <span className="section-title" style={{ paddingLeft: '0.5rem', marginBottom: '0.5rem' }}>Navigation</span>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`sidebar-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
              <Icon size={16} /><span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Admin'}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
        </div>
        <button onClick={signOut} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />}
      <aside className="desktop-sidebar" style={{ width: '240px', flexShrink: 0, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' }}>
        {sidebarContent}
      </aside>
      {open && (
        <aside style={{ position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', zIndex: 50, overflow: 'hidden' }}>
          <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} aria-label="Close"><X size={20} /></button>
          {sidebarContent}
        </aside>
      )}
      {!open && (
        <button onClick={() => setOpen(true)} className="mobile-menu-btn" style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 50, padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }} aria-label="Open menu">
          <Menu size={20} />
        </button>
      )}
    </>
  )
}

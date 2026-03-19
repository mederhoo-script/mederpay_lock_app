'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  Smartphone,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/agents', label: 'Agents', icon: Users },
  { href: '/superadmin/fee-tiers', label: 'Fee Tiers', icon: Layers },
  { href: '/superadmin/payments', label: 'Payments', icon: CreditCard },
  { href: '/superadmin/phones', label: 'Phones', icon: Smartphone },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
]

interface Props {
  user: { name: string; email: string }
}

export default function SuperadminSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary))' }}>
            <Smartphone className="w-4 h-4" style={{ color: 'hsl(var(--primary-foreground))' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'hsl(var(--foreground))' }}>MederBuy</p>
            <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>Super Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{user.name || 'Admin'}</p>
          <p className="text-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{user.email}</p>
        </div>
        <button onClick={handleSignOut} className="btn btn-ghost w-full justify-start gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 btn btn-ghost p-2"
        onClick={() => setOpen(v => !v)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'hsl(var(--card))', borderRight: '1px solid hsl(var(--border))' }}
      >
        <SidebarContent />
      </aside>

      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{ background: 'hsl(var(--card))', borderRight: '1px solid hsl(var(--border))' }}
      >
        <SidebarContent />
      </aside>
    </>
  )
}

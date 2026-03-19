'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Smartphone,
  CreditCard,
  Layers,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/app/components/ThemeToggle'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
  { label: 'Agents', href: '/superadmin/agents', icon: Users },
  { label: 'Phones', href: '/superadmin/phones', icon: Smartphone },
  { label: 'Payments', href: '/superadmin/payments', icon: CreditCard },
  { label: 'Fee Tiers', href: '/superadmin/fee-tiers', icon: Layers },
  { label: 'Settings', href: '/superadmin/settings', icon: Settings },
]

function SidebarContent({
  pathname,
  onSignOut,
  onClose,
}: {
  pathname: string
  onSignOut: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.35)]">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white text-sm tracking-tight leading-none">MederBuy</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35 mt-0.5">Superadmin</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/35 hover:text-white/75 transition-colors lg:hidden rounded-lg p-1 hover:bg-white/8"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F59E0B]/12 text-[#F59E0B] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#F59E0B]' : 'text-white/40 group-hover:text-white/70'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-[#F59E0B]" />}
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/45 hover:bg-white/[0.05] hover:text-white/80 transition-all group"
        >
          <LogOut className="w-4 h-4 shrink-0 text-white/30 group-hover:text-white/60 transition-colors" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to sign out. Please try again.')
      return
    }
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-white/8 bg-[#080E20] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onSignOut={handleSignOut}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="flex items-center gap-4 border-b border-white/8 bg-[#080E20]/90 backdrop-blur-sm px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/50 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/8"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">MederBuy — Superadmin</span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

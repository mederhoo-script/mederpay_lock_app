'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  UserCircle2,
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
  { label: 'Dashboard', href: '/subagent/dashboard', icon: LayoutDashboard },
  { label: 'Sales', href: '/subagent/sales', icon: ShoppingBag },
  { label: 'Logs', href: '/subagent/logs', icon: FileText },
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
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center shadow-[0_2px_10px_rgba(37,99,235,0.35)]">
            <UserCircle2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">MederBuy</p>
            <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">Sub-Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors lg:hidden"
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
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#F59E0B]/12 text-[#F59E0B] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
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
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SubagentLayout({ children }: { children: React.ReactNode }) {
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
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-white/10 bg-[#080E20] transition-transform duration-200 lg:static lg:translate-x-0 ${
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
        <header className="flex items-center gap-4 border-b border-white/10 bg-[#080E20]/90 backdrop-blur-sm px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white text-sm">MederBuy — Sub-Agent</span>
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

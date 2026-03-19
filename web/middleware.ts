import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/auth']

// Role → home dashboard mapping
const ROLE_HOME: Record<string, string> = {
  superadmin: '/superadmin/dashboard',
  agent: '/agent/dashboard',
  subagent: '/subagent/dashboard',
}

// Minimum role required per route prefix
// Lower index = less privileged; roles inherit access upward
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: '/superadmin', roles: ['superadmin'] },
  { prefix: '/agent',      roles: ['superadmin', 'agent'] },
  { prefix: '/subagent',   roles: ['superadmin', 'agent', 'subagent'] },
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user, supabase } = await updateSession(request)

  // ── 1. Public paths: pass through ────────────────────────────────────────
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isPublic) {
    // If already authenticated and visiting public auth page, redirect to dashboard
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/' || pathname === '/forgot-password')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role as string | undefined
      const home = role ? (ROLE_HOME[role] ?? '/login') : '/login'
      return NextResponse.redirect(new URL(home, request.url))
    }
    return supabaseResponse
  }

  // ── 2. Protected route: must be authenticated ─────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 3. Role-based access control ─────────────────────────────────────────
  const matched = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix))
  if (matched) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined
    if (!role || !matched.roles.includes(role)) {
      // Redirect to their own dashboard
      const home = role ? (ROLE_HOME[role] ?? '/login') : '/login'
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

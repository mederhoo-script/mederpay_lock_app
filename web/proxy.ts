import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public paths — no auth required
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/auth']

// Role → home dashboard mapping
const ROLE_HOME: Record<string, string> = {
  superadmin: '/superadmin/dashboard',
  agent: '/agent/dashboard',
  subagent: '/subagent/dashboard',
}

// Route prefix → allowed roles (superadmin can go anywhere; agent can go to subagent)
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: '/superadmin', roles: ['superadmin'] },
  { prefix: '/agent',      roles: ['superadmin', 'agent'] },
  { prefix: '/subagent',   roles: ['superadmin', 'agent', 'subagent'] },
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── 0. API routes — pass through; each route handles its own auth ─────────
  // The proxy must NOT redirect API calls to /login: a 307 redirect on a POST
  // causes fetch to re-POST to the login page, which returns 405 and makes
  // the client-side error handler show "Registration failed. Please try again."
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // ── 1. Public / landing paths ────────────────────────────────────────────
  const isPublic = pathname === '/' ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (isPublic) {
    // Authenticated users on login/register/root → send to their dashboard,
    // but only when there is a real destination AND the account is active.
    // Skipping the redirect for missing-profile or inactive users prevents
    // the ERR_TOO_MANY_REDIRECTS loop where the RBAC block immediately
    // bounces them back to /login.
    if (user && (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()
      const role = profile?.role as string | undefined
      // Only redirect when the role maps to a known dashboard.
      if (role && role in ROLE_HOME) {
        // For agent/subagent roles, treat any non-active status as inactive
        // (superadmin has no status restriction).
        const isInactive = (role === 'agent' || role === 'subagent') && profile?.status !== 'active'
        if (!isInactive) {
          return NextResponse.redirect(new URL(ROLE_HOME[role], request.url))
        }
      }
    }
    return supabaseResponse
  }

  // ── 2. All other routes require authentication ────────────────────────────
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
      .select('role, status')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined

    if (!role || !matched.roles.includes(role)) {
      const home = role ? (ROLE_HOME[role] ?? '/login') : '/login'
      return NextResponse.redirect(new URL(home, request.url))
    }

    // Inactive agents / subagents are blocked
    if ((role === 'agent' || role === 'subagent') && profile?.status !== 'active') {
      return NextResponse.redirect(new URL('/login?error=inactive', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

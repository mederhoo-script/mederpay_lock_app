import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Password-recovery flow — redirect to the reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          switch (profile.role) {
            case 'superadmin':
              return NextResponse.redirect(`${origin}/superadmin/dashboard`)
            case 'agent':
              return NextResponse.redirect(`${origin}/agent/dashboard`)
            case 'subagent':
              return NextResponse.redirect(`${origin}/subagent/dashboard`)
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}

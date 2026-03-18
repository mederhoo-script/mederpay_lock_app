'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Lock, Mail, Smartphone, Shield, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { LoginSchema, type LoginInput } from '@/lib/validations'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const errorParam = searchParams.get('error')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Authentication failed. Please try again.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      toast.error('Profile not found. Please contact support.')
      return
    }

    switch (profile.role) {
      case 'superadmin':
        router.push('/superadmin/dashboard')
        break
      case 'agent':
        router.push('/agent/dashboard')
        break
      case 'subagent':
        router.push('/subagent/dashboard')
        break
      default:
        toast.error('Unknown user role')
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060B18] lg:flex">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#2563EB]/15 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#D97706]/10 blur-3xl" />
      </div>

      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-5/12 flex-col justify-between bg-gradient-to-br from-[#0D1A40] via-[#0D1432] to-[#0A0F20] p-10 xl:p-14">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#2563EB]/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[#D97706]/12 blur-3xl" />
          {/* Diagonal grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* Gold top border */}
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-transparent" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] shadow-[0_4px_16px_rgba(37,99,235,0.5)]">
            <Smartphone className="h-5 w-5 text-white" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F59E0B] text-[7px] font-black text-black">★</span>
          </div>
          <span className="text-xl font-black tracking-tight">
            <span className="text-white">Meder</span>
            <span className="text-[#F59E0B]">Buy</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative my-auto py-10">
          <h2 className="text-3xl font-black leading-tight text-white xl:text-4xl">
            Control Your Phone Finance Business From{' '}
            <span className="bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">
              One Dashboard
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">
            Join thousands of agents who automate collections, protect inventory, and scale with confidence using MederBuy.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-4">
            {[
              { icon: Shield, label: 'IMEI-based device lock control' },
              { icon: TrendingUp, label: 'Real-time payment reconciliation' },
              { icon: Users, label: 'Sub-agent & commission management' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F59E0B]/25 bg-[#D97706]/10">
                  <Icon className="h-4 w-4 text-[#FCD34D]" />
                </div>
                <span className="text-sm font-medium text-white/75">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl border border-[#F59E0B]/15 bg-[#D97706]/5 p-5">
          <div className="mb-3 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm italic leading-relaxed text-white/70">
            &ldquo;MederBuy cut my overdue accounts by 60% in the first month. The automatic lock feature is a game-changer.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-[11px] font-black text-black">
              AO
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Adebayo Okafor</p>
              <p className="text-xs text-white/45">Senior Agent, Lagos</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form Panel ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        {/* Mobile brand */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-4 relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.45)]">
            <Smartphone className="h-7 w-7 text-white" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] text-[8px] font-black text-black">★</span>
          </div>
          <h1 className="text-2xl font-black">
            <span className="text-white">Meder</span>
            <span className="text-[#F59E0B]">Buy</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/50">Sign in to your account</p>
        </div>

        <div className="w-full max-w-md animate-fade-in-up">
          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-white/50">Sign in to your MederBuy account</p>
          </div>

          {/* Error banner */}
          {errorParam && (
            <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/8 p-4 text-sm text-red-400">
              {errorParam === 'inactive'
                ? 'Your account is inactive. Please contact support.'
                : 'An error occurred. Please try again.'}
            </div>
          )}

          {/* Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0D1432]/60 p-7 backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.4)]">

            {/* Gold top accent */}
            <div className="mb-6 -mx-7 -mt-7 h-0.5 rounded-t-2xl bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-transparent" />

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0D1432] px-3 text-xs text-white/30">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/65">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                        : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-white/65">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#FCD34D] transition hover:text-[#F59E0B]">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                      errors.password
                        ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                        : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] py-3 text-sm font-bold text-black shadow-[0_4px_20px_rgba(217,119,6,0.4)] transition hover:brightness-110 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:ring-offset-2 focus:ring-offset-[#0D1432] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-[#93C5FD] transition hover:text-[#60A5FA]">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060B18]" />}>
      <LoginForm />
    </Suspense>
  )
}

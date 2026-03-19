'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, Smartphone, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-[linear-gradient(160deg,#0A1628_0%,#060B18_50%,#0A0D1A_100%)] flex flex-col items-center justify-center px-4 py-10">

      {/* Card */}
      <div className="w-full max-w-[440px] bg-[#0D1432] border border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)] animate-fade-in-up">

        {/* Gold accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D]" />

        <div className="px-8 py-9">

          {/* Logo + brand */}
          <div className="text-center mb-7">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_20px_rgba(37,99,235,0.45)]">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[22px] font-black tracking-tight leading-none mb-1">
              <span className="text-white">Meder</span>
              <span className="text-[#F59E0B]">Buy</span>
            </h1>
            <p className="text-sm text-white/45">Sign in to your account</p>
          </div>

          {/* Error banner */}
          {errorParam && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-400">
                {errorParam === 'inactive'
                  ? 'Your account is inactive. Please contact support.'
                  : 'An error occurred. Please try again.'}
              </p>
            </div>
          )}

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-white/[0.04] border border-white/[0.12] rounded-xl px-5 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.07] hover:border-white/20 transition-all mb-5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-white/30">or sign in with email</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-semibold text-white/65">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={`w-full bg-white/[0.05] border rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]/60 ${
                    errors.email ? 'border-red-500/60' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-white/65">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[#FCD34D] hover:text-[#F59E0B] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full bg-white/[0.05] border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]/60 ${
                    errors.password ? 'border-red-500/60' : 'border-white/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-bold text-[15px] rounded-xl py-3.5 mt-2 shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>

          </form>

          {/* Register link */}
          <p className="text-center text-[13px] text-white/40 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-[#93C5FD] hover:text-blue-300 transition-colors">
              Create one
            </Link>
          </p>

        </div>
      </div>

      {/* Copyright */}
      <p className="mt-7 text-xs text-white/20">
        &copy; 2026 MederBuy. All rights reserved.
      </p>

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

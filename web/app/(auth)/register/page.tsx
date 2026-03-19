'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  Phone,
  Smartphone,
  User,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold text-white/65">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Input class helper ───────────────────────────────────────────────────────

const inputCls = (hasError: boolean) =>
  `w-full bg-white/[0.05] border rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]/60 ${
    hasError ? 'border-red-500/60' : 'border-white/10'
  }`

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAgentInput>({
    resolver: zodResolver(RegisterAgentSchema),
  })

  const onSubmit = async (data: RegisterAgentInput) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error((body as { error?: string }).error ?? 'Registration failed. Please try again.')
        return
      }

      toast.success('Account created! Please sign in to continue.')
      router.push('/login')
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#0A1628_0%,#060B18_50%,#0A0D1A_100%)] flex flex-col items-center justify-start px-4 py-10">

      {/* Card */}
      <div className="w-full max-w-[520px] bg-[#0D1432] border border-white/[0.09] rounded-2xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.55)] animate-fade-in-up">

        {/* Gold accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#FCD34D]" />

        <div className="px-8 py-9">

          {/* Logo + brand */}
          <div className="text-center mb-7">
            <div
              className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_20px_rgba(37,99,235,0.45)]"
            >
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[22px] font-black tracking-tight leading-none mb-1">
              <span className="text-white">Meder</span>
              <span className="text-[#F59E0B]">Buy</span>
            </h1>
            <p className="text-sm text-white/45">Create your agent account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Full Name */}
            <Field label="Full Name" error={errors.full_name?.message}>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  {...register('full_name')}
                  className={inputCls(!!errors.full_name)}
                />
              </div>
            </Field>

            {/* Username */}
            <Field label="Username" error={errors.username?.message}>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="john_doe"
                  {...register('username')}
                  className={inputCls(!!errors.username)}
                />
              </div>
            </Field>

            {/* Email */}
            <Field label="Email Address" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={inputCls(!!errors.email)}
                />
              </div>
            </Field>

            {/* Phone */}
            <Field label="Phone Number" error={errors.phone?.message}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="08012345678"
                  {...register('phone')}
                  className={inputCls(!!errors.phone)}
                />
              </div>
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className={`${inputCls(!!errors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirm_password?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-white/30" />
                <input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...register('confirm_password')}
                  className={`${inputCls(!!errors.confirm_password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 bg-emerald-400/[0.07] border border-emerald-400/20 rounded-xl px-3.5 py-3">
              <CheckCircle className="w-[15px] h-[15px] text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-white/50">
                Your account will be active immediately after registration. You can sign in right away.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#D97706] to-[#F59E0B] hover:brightness-110 text-black font-bold text-[15px] rounded-xl py-3.5 shadow-[0_4px_20px_rgba(217,119,6,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Agent Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Login link */}
          <p className="text-center text-[13px] text-white/40 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#93C5FD] hover:text-blue-300 transition-colors">
              Sign in
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

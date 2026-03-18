'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AtSign,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  Phone,
  Smartphone,
  User,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'

const PERKS = [
  'Automated payment reconciliation',
  'IMEI device lock & unlock control',
  'Sub-agent & commission management',
  'Real-time overdue tracking dashboard',
]

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
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          username: data.username,
          phone: data.phone,
          role: 'agent',
        },
      },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Your account is pending approval.')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#060B18] lg:flex">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-1/3 h-[28rem] w-[28rem] rounded-full bg-[#2563EB]/12 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#D97706]/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-[#1D4ED8]/10 blur-3xl" />
      </div>

      {/* ── Left info panel (desktop) ─────────────────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:w-[42%] xl:w-5/12 flex-col justify-between bg-gradient-to-b from-[#030917] via-[#060B18] to-[#0A0F20] p-10 xl:p-14">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-[#2563EB]/10 blur-3xl" />
          <div className="absolute -bottom-10 left-0 h-64 w-64 rounded-full bg-[#D97706]/8 blur-3xl" />
          {/* Subtle diagonal line pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.1) 0px, rgba(255,255,255,.1) 1px, transparent 1px, transparent 10px)',
            }}
          />
        </div>

        {/* Right border accent */}
        <div className="absolute bottom-0 right-0 top-0 w-px bg-gradient-to-b from-transparent via-[#F59E0B]/20 to-transparent" />

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

        {/* Content block */}
        <div className="relative my-auto py-10">
          <h2 className="text-3xl font-black leading-tight text-white xl:text-[2.5rem]">
            The Complete Platform for{' '}
            <span className="bg-gradient-to-r from-[#F59E0B] to-[#FCD34D] bg-clip-text text-transparent">
              Phone Financing
            </span>{' '}
            Teams
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/55">
            Join thousands of agents automating collections, controlling devices, and scaling their business with MederBuy.
          </p>

          {/* Perks */}
          <ul className="mt-8 space-y-3.5">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D97706]/15 border border-[#F59E0B]/25">
                  <CheckCircle className="h-3.5 w-3.5 text-[#FCD34D]" />
                </div>
                <span className="text-sm text-white/70">{perk}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: '₦2B+', label: 'Processed' },
              { value: '5k+', label: 'Active Devices' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                <p className="text-2xl font-black text-[#F59E0B]">{s.value}</p>
                <p className="mt-1 text-xs text-white/45">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative text-xs text-white/30">
          &copy; 2026 MederBuy. Your account is reviewed before activation.
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg animate-fade-in-up">

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
            <p className="mt-1.5 text-sm text-white/50">Create your agent account</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="mt-1.5 text-sm text-white/50">Fill in your details below to get started</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0D1432]/60 p-7 backdrop-blur-sm shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:p-8">
            {/* Gold accent top */}
            <div className="mb-6 -mx-7 -mt-7 sm:-mx-8 sm:-mt-8 h-0.5 rounded-t-2xl bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-transparent" />

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Two-column row: Full name + Username */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="block text-sm font-medium text-white/65">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      id="full_name"
                      type="text"
                      autoComplete="name"
                      {...register('full_name')}
                      placeholder="John Doe"
                      className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                        errors.full_name
                          ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                          : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                      }`}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-xs text-red-400">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-sm font-medium text-white/65">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      {...register('username')}
                      placeholder="john_doe"
                      className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                        errors.username
                          ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                          : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-400">{errors.username.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/65">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                        : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-sm font-medium text-white/65">Phone number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone')}
                    placeholder="08012345678"
                    className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                      errors.phone
                        ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                        : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-400">{errors.phone.message}</p>
                )}
              </div>

              {/* Two-column row: Password + Confirm */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-white/65">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      placeholder="Min. 8 chars"
                      className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                        errors.password
                          ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                          : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-white/65">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      id="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirm_password')}
                      placeholder="Repeat password"
                      className={`w-full rounded-xl border bg-white/[0.04] py-3 pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors ${
                        errors.confirm_password
                          ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/25'
                          : 'border-white/[0.08] focus:border-[#2563EB]/60 focus:ring-1 focus:ring-[#2563EB]/25'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-400">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#F59E0B]/15 bg-[#D97706]/5 px-4 py-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FCD34D]" />
                <p className="text-xs leading-relaxed text-white/50">
                  Your account will be reviewed by our team before activation. You&apos;ll be notified once approved.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#D97706] to-[#F59E0B] py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_rgba(217,119,6,0.4)] transition hover:brightness-110 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:ring-offset-2 focus:ring-offset-[#0D1432] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Agent Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#93C5FD] transition hover:text-[#60A5FA]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

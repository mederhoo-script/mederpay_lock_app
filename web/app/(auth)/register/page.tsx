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
  Layers,
  Lock,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Smartphone,
  User,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'

const SIDE_FEATURES = [
  {
    icon: Smartphone,
    title: 'Device Lock Control',
    desc: 'Automatically lock overdue devices and unlock them on payment.',
  },
  {
    icon: RefreshCw,
    title: 'Automated Collections',
    desc: 'Match payments to buyers instantly — no spreadsheets needed.',
  },
  {
    icon: Users,
    title: 'Agent Network',
    desc: 'Manage sub-agents and track commissions from one dashboard.',
  },
  {
    icon: Layers,
    title: 'Flexible Fee Tiers',
    desc: 'Apply pricing rules automatically based on phone value.',
  },
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
    <div className="min-h-screen bg-[#06121A] lg:flex">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-[#22C55E]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-[#F97316]/8 blur-3xl" />
      </div>

      {/* ── Side panel (desktop only) ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-2/5 flex-col justify-between border-r border-white/8 bg-gradient-to-br from-[#0D1F2D]/90 to-[#06121A]/95 p-10 xl:p-14">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#22D3EE]">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">MederBuy</span>
        </div>

        {/* Headline */}
        <div className="my-12">
          <h2 className="text-3xl font-black leading-snug text-white xl:text-4xl">
            The complete platform for phone financing teams.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            Join thousands of agents automating collections, controlling devices, and scaling their business with MederBuy.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-5">
            {SIDE_FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0EA5E9]/12 border border-[#0EA5E9]/20">
                  <Icon className="h-4 w-4 text-[#67E8F9]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom testimonial */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm leading-relaxed text-white/70 italic">
            &ldquo;MederBuy cut my overdue accounts by 60% in the first month. The automatic lock feature is a game-changer.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F97316] to-[#FB923C] text-xs font-black text-white">
              AO
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Adebayo Okafor</p>
              <p className="text-xs text-white/45">Senior Agent, Lagos</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Form panel ─────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#22D3EE] shadow-[0_4px_20px_rgba(14,165,233,0.4)]">
              <User className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Create Agent Account</h1>
            <p className="mt-1 text-sm text-white/50">Start managing phone financing today</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h1 className="text-2xl font-black text-white">Create your account</h1>
            <p className="mt-1 text-sm text-white/50">Fill in your details to get started</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="block text-sm font-medium text-white/70">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    {...register('full_name')}
                    placeholder="John Doe"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.full_name
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                </div>
                {errors.full_name && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/70">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="you@example.com"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.email
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-white/70">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    {...register('username')}
                    placeholder="john_doe"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.username
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-sm font-medium text-white/70">
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    {...register('phone')}
                    placeholder="08012345678"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.phone
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-white/70">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.password
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="block text-sm font-medium text-white/70">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="confirm_password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirm_password')}
                    placeholder="Repeat your password"
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.confirm_password
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="flex items-center gap-1 text-xs text-red-400">
                    <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-white/35 leading-relaxed rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                Your account will be reviewed by our team before activation. You will be notified once approved.
              </p>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] py-2.5 text-sm font-semibold text-[#032336] shadow-[0_2px_12px_rgba(14,165,233,0.35)] transition hover:brightness-110 hover:shadow-[0_4px_20px_rgba(14,165,233,0.45)] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 focus:ring-offset-2 focus:ring-offset-[#06121A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-[#67E8F9] transition-colors hover:text-[#67E8F9]/80"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

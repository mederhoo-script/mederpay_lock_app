'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Mail, Smartphone } from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})
type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSubmitted(true)
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
            <div
              className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] flex items-center justify-center mx-auto mb-3.5 shadow-[0_4px_20px_rgba(37,99,235,0.45)]"
            >
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[22px] font-black tracking-tight leading-none mb-1">
              <span className="text-white">Meder</span>
              <span className="text-[#F59E0B]">Buy</span>
            </h1>
            <p className="text-sm text-white/45">
              {submitted ? 'Check your inbox' : 'Reset your password'}
            </p>
          </div>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-400/10 border border-emerald-400/25 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-[13px] leading-[1.7] text-white/60 mb-6">
                If an account exists for{' '}
                <span className="font-bold text-white">{getValues('email')}</span>,
                we sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-white/12 rounded-xl px-[18px] py-2.5 text-[13px] font-semibold text-white/70 hover:bg-white/[0.04] hover:border-white/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

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

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white font-bold text-[15px] rounded-xl py-3.5 shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending reset link…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to login */}
              <p className="text-center text-[13px] text-white/40">
                Remembered your password?{' '}
                <Link href="/login" className="font-bold text-[#93C5FD] hover:text-blue-300 transition-colors">
                  Sign in
                </Link>
              </p>

            </form>
          )}

        </div>
      </div>

      {/* Copyright */}
      <p className="mt-7 text-xs text-white/20">
        &copy; 2026 MederBuy. All rights reserved.
      </p>

    </div>
  )
}

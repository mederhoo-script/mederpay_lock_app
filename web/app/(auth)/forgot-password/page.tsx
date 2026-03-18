'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Loader2, Mail, Smartphone } from 'lucide-react'
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
    <div className="min-h-screen bg-[#06121A] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#0EA5E9]/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#22C55E]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#22D3EE] shadow-[0_4px_20px_rgba(14,165,233,0.4)]">
            <Smartphone className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-white/50">
            {submitted
              ? "We've sent you an email"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/15 border border-[#22C55E]/25">
                <CheckCircle className="h-7 w-7 text-[#86EFAC]" />
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                If an account exists for{' '}
                <span className="font-semibold text-white">{getValues('email')}</span>, we sent a
                password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/12 px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-white/70">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors ${
                      errors.email
                        ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                        : 'border-white/10 focus:border-[#0EA5E9]/60 focus:ring-[#0EA5E9]/40'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0EA5E9] to-[#22D3EE] py-2.5 text-sm font-semibold text-[#032336] shadow-[0_2px_12px_rgba(14,165,233,0.35)] transition hover:brightness-110 hover:shadow-[0_4px_20px_rgba(14,165,233,0.45)] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 focus:ring-offset-2 focus:ring-offset-[#06121A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending reset link…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <p className="text-center text-sm text-white/40">
                Remembered your password?{' '}
                <Link href="/login" className="font-medium text-[#67E8F9] transition-colors hover:text-[#67E8F9]/80">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

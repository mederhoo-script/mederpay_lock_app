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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0A1628 0%, #060B18 50%, #0A0D1A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#0D1432',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
      }}>

        {/* Gold top bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#D97706,#F59E0B,#FCD34D)' }} />

        <div style={{ padding: '36px 32px' }}>

          {/* Logo + brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#1D4ED8,#2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
            }}>
              <Smartphone size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ color: '#fff' }}>Meder</span>
              <span style={{ color: '#F59E0B' }}>Buy</span>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              {submitted ? "Check your inbox" : "Reset your password"}
            </div>
          </div>

          {submitted ? (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={26} color="#34D399" />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                If an account exists for{' '}
                <span style={{ fontWeight: 700, color: '#fff' }}>{getValues('email')}</span>,
                we sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                }}
              >
                <ArrowLeft size={14} />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit(onSubmit)} noValidate>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                    <Mail size={15} color="rgba(255,255,255,0.3)" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.05)',
                      border: errors.email ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '12px 14px 12px 40px',
                      fontSize: 14,
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
                {errors.email && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.email.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: isSubmitting ? 'rgba(37,99,235,0.6)' : 'linear-gradient(135deg,#2563EB,#3B82F6)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                  marginBottom: 20,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending reset link…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Back to login */}
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                Remembered your password?{' '}
                <Link href="/login" style={{ fontWeight: 700, color: '#93C5FD', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>

            </form>
          )}

        </div>
      </div>

      {/* Copyright */}
      <p style={{ marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        &copy; 2026 MederBuy. All rights reserved.
      </p>

    </div>
  )
}

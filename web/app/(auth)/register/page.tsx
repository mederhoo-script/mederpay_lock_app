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
import { createClient } from '@/lib/supabase/client'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'

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

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.05)',
    border: hasError ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 14px 12px 40px',
    fontSize: 14,
    color: '#fff',
    outline: 'none',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0A1628 0%, #060B18 50%, #0A0D1A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 16px',
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 520,
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
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Create your agent account</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="full_name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <User size={15} color="rgba(255,255,255,0.3)" />
                </span>
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  {...register('full_name')}
                  style={inputStyle(!!errors.full_name)}
                />
              </div>
              {errors.full_name && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.full_name.message}</p>}
            </div>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="username" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <AtSign size={15} color="rgba(255,255,255,0.3)" />
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="john_doe"
                  {...register('username')}
                  style={inputStyle(!!errors.username)}
                />
              </div>
              {errors.username && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Email Address
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
                  style={inputStyle(!!errors.email)}
                />
              </div>
              {errors.email && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="phone" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <Phone size={15} color="rgba(255,255,255,0.3)" />
                </span>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="08012345678"
                  {...register('phone')}
                  style={inputStyle(!!errors.phone)}
                />
              </div>
              {errors.phone && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <Lock size={15} color="rgba(255,255,255,0.3)" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  style={{
                    ...inputStyle(!!errors.password),
                    paddingRight: 44,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="confirm_password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                  <Lock size={15} color="rgba(255,255,255,0.3)" />
                </span>
                <input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...register('confirm_password')}
                  style={{
                    ...inputStyle(!!errors.confirm_password),
                    paddingRight: 44,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm_password && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.confirm_password.message}</p>}
            </div>

            {/* Disclaimer */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: 'rgba(217,119,6,0.07)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
            }}>
              <CheckCircle size={15} color="#FCD34D" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Your account will be reviewed by our team before activation. You&apos;ll be notified once approved.
              </p>
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
                background: isSubmitting ? 'rgba(217,119,6,0.6)' : 'linear-gradient(135deg,#D97706,#F59E0B)',
                border: 'none',
                borderRadius: 12,
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 700,
                color: '#000',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(217,119,6,0.4)',
                marginBottom: 20,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating account…
                </>
              ) : (
                <>
                  Create Agent Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

          {/* Login link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 700, color: '#93C5FD', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

        </div>
      </div>

      {/* Copyright */}
      <p style={{ marginTop: 28, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        &copy; 2026 MederBuy. All rights reserved.
      </p>

    </div>
  )
}

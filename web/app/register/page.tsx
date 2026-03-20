'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAgentInput>({ resolver: zodResolver(RegisterAgentSchema) })

  const onSubmit = async (data: RegisterAgentInput) => {
    setServerError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setServerError(json.error ?? 'Registration failed. Please try again.')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError('Account created but sign-in failed. Please go to Login.')
      return
    }
    router.push('/agent/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3rem',
            height: '3rem',
            borderRadius: '10px',
            background: 'var(--accent)',
            marginBottom: '1rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeWidth="3" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>MederBuy</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Create your Agent account
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Register as Agent
          </h2>

          {serverError && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input type="text" className="input" placeholder="John Doe" {...register('full_name')} />
                {errors.full_name && <span className="field-error">{errors.full_name.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Username</label>
                <input type="text" className="input" placeholder="john_doe" {...register('username')} />
                {errors.username && <span className="field-error">{errors.username.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="08012345678" {...register('phone')} />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Confirm Password</label>
                <input type="password" className="input" placeholder="••••••••" autoComplete="new-password" {...register('confirm_password')} />
                {errors.confirm_password && <span className="field-error">{errors.confirm_password.message}</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ width: '100%', marginTop: '0.5rem' }}>
              {isSubmitting ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import PasswordInput from '@/components/PasswordInput'

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterAgentInput>({ resolver: zodResolver(RegisterAgentSchema) })

  const onSubmit = async (data: RegisterAgentInput) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Registration failed. Please try again.', 'Registration failed')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.warning('Account created but sign-in failed. Please go to Login.', 'Sign-in failed')
      return
    }
    // Check profile status; pending agents are blocked by the proxy middleware
    const { data: { user: signedInUser } } = await supabase.auth.getUser()
    if (signedInUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', signedInUser.id)
        .single()
      if (profile?.status === 'pending') {
        toast.warning('Your account is pending approval.', 'Account pending')
        router.push('/login?error=pending')
        return
      }
    }
    toast.success('Account created successfully! Welcome.', 'Account created')
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MederBuy" style={{ height: '64px', width: 'auto', marginBottom: '1rem', borderRadius: '10px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>MederBuy</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Create your Agent account
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Register as Agent
          </h2>

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
                <PasswordInput autoComplete="new-password" registration={register('password')} />
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>
              <div className="form-group">
                <label className="label">Confirm Password</label>
                <PasswordInput autoComplete="new-password" registration={register('confirm_password')} />
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

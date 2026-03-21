'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import PasswordInput from '@/components/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) })

  const onSubmit = async (data: LoginInput) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message, 'Sign-in failed')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Authentication failed.', 'Sign-in failed'); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    toast.success('Welcome back!', 'Signed in')
    if (role === 'superadmin') router.push('/superadmin/dashboard')
    else if (role === 'subagent') router.push('/subagent/dashboard')
    else router.push('/agent/dashboard')
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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MederBuy" style={{ height: '64px', width: 'auto', marginBottom: '1rem', borderRadius: '10px' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>MederBuy</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Phone Finance Platform
          </p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}>Forgot password?</Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                registration={register('password')}
              />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ width: '100%' }}>
              {isSubmitting ? (
                <><span className="spinner" /> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Register as Agent
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

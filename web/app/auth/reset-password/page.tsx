'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase sends the token as hash params (#access_token=...&type=recovery)
    // The auth callback route will exchange the code. If we reach here directly
    // (magic-link flow), the client SDK will have already parsed the hash.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        // Not yet signed in — the code was already exchanged via /auth/callback
        // which redirects here. Try listening for the auth state change.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setSessionReady(true)
          }
        })
        return () => subscription.unsubscribe()
      }
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const parsed = ResetPasswordSchema.safeParse({ password, confirm_password: confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--accent)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: '#fff',
          }}>M</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>MederBuy</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>Set a new password</p>
        </div>

        <div className="card">
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.1)', margin: '0 auto 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Password updated!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Redirecting you to login…
              </p>
            </div>
          ) : !sessionReady ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.875rem' }}>
                Verifying your reset link…
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                If this takes too long, <Link href="/forgot-password" style={{ color: 'var(--accent)' }}>request a new link</Link>.
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>New password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Choose a strong password for your account.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="confirm_password">Confirm Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    className="input"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading ? <><span className="spinner" /> Updating…</> : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

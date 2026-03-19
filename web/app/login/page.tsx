'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { LoginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Authentication failed. Please try again.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (!profile) {
        toast.error('Profile not found. Please contact support.')
        return
      }

      if (profile.status === 'pending') {
        toast.warning('Your account is awaiting approval.')
        await supabase.auth.signOut()
        return
      }

      if (profile.status === 'suspended') {
        toast.error('Account suspended. Please contact support.')
        await supabase.auth.signOut()
        return
      }

      if (profile.role === 'superadmin') {
        router.push('/superadmin/dashboard')
      } else if (profile.role === 'agent') {
        router.push('/agent/dashboard')
      } else if (profile.role === 'subagent') {
        router.push('/subagent/sales')
      } else {
        router.push('/agent/dashboard')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary))' }}>
              <Smartphone className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <span className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>MederBuy</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Sign in to your account</p>
        </div>

        <div className="gold-panel p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.password.message}</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

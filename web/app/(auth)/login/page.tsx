'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { LoginSchema, type LoginInput } from '@/lib/validations'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  const errorParam = searchParams.get('error')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Authentication failed. Please try again.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      toast.error('Profile not found. Please contact support.')
      return
    }

    switch (profile.role) {
      case 'superadmin':
        router.push('/superadmin/dashboard')
        break
      case 'agent':
        router.push('/agent/dashboard')
        break
      case 'subagent':
        router.push('/subagent/dashboard')
        break
      default:
        toast.error('Unknown user role')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">MederBuy</h1>
          <p className="text-subtle">Sign in to your account</p>
        </div>

        {errorParam && (
          <div className="rounded-md border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {errorParam === 'inactive' ? 'Your account is inactive. Please contact support.' : 'An error occurred. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="surface-panel space-y-4 p-6 sm:p-7">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full rounded-md border border-input bg-input py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="w-full rounded-md border border-input bg-input py-2 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 font-medium text-primary-foreground transition-colors hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-accent transition-colors hover:text-accent/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}

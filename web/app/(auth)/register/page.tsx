'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff, Smartphone, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { RegisterAgentSchema, type RegisterAgentInput } from '@/lib/validations'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [terms, setTerms] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterAgentInput>({ resolver: zodResolver(RegisterAgentSchema) })

  const onSubmit = async (data: RegisterAgentInput) => {
    if (!terms) {
      toast.error('Please accept the terms and conditions.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Registration failed.')
        return
      }
      setSuccess(true)
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16" style={{ color: 'hsl(142 72% 60%)' }} />
          </div>
          <div className="gold-panel p-8 space-y-4">
            <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Application Submitted!</h2>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Account created! Your application is under review. You&apos;ll receive an email once approved.
            </p>
            <Link href="/login" className="btn btn-primary w-full inline-flex justify-center">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Create an account</h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Register as an agent to start selling</p>
        </div>

        <div className="gold-panel p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Full Name</label>
                <input {...register('full_name')} placeholder="John Doe" className="input-field" />
                {errors.full_name && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Username</label>
                <input {...register('username')} placeholder="john_doe" className="input-field" />
                {errors.username && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.username.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Phone</label>
                <input {...register('phone')} placeholder="08012345678" className="input-field" />
                {errors.phone && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Email</label>
                <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
                {errors.email && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Password</label>
                <div className="relative">
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input-field pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Confirm Password</label>
                <div className="relative">
                  <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="input-field pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>{errors.confirm_password.message}</p>}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={e => setTerms(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                I agree to the{' '}
                <span className="underline" style={{ color: 'hsl(var(--primary))' }}>Terms of Service</span>
                {' '}and{' '}
                <span className="underline" style={{ color: 'hsl(var(--primary))' }}>Privacy Policy</span>
              </span>
            </label>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium" style={{ color: 'hsl(var(--primary))' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

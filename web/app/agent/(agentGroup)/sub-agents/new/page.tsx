'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSubAgentSchema, type CreateSubAgentInput } from '@/lib/validations'
import { ArrowLeft, Copy, CheckCheck } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface CreatedSubAgent {
  full_name: string
  email: string
  temp_password: string
}

export default function NewSubAgentPage() {
  const router = useRouter()
  const toast = useToast()
  const [created, setCreated] = useState<CreatedSubAgent | null>(null)
  const [copied, setCopied] = useState(false)

  const copyPassword = () => {
    if (!created) return
    navigator.clipboard.writeText(created.temp_password).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubAgentInput>({ resolver: zodResolver(CreateSubAgentSchema) })

  const onSubmit = async (data: CreateSubAgentInput) => {
    const res = await fetch('/api/sub-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to create sub-agent.', 'Creation failed')
      return
    }
    toast.success('Sub-agent account created!', 'Sub-agent created')
    setCreated({
      full_name: data.full_name,
      email: data.email,
      temp_password: json.temp_password ?? json.password ?? '(see email)',
    })
  }

  if (created) {
    return (
      <div>
        <div className="page-header"><h1>Sub-Agent Created!</h1></div>
        <div className="card" style={{ maxWidth: '480px' }}>
          <div className="detail-row"><span className="detail-key">Name</span><span className="detail-value">{created.full_name}</span></div>
          <div className="detail-row"><span className="detail-key">Email</span><span className="detail-value">{created.email}</span></div>
          <div className="detail-row">
            <span className="detail-key">Temporary Password</span>
            <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>••••••••</span>
              <button onClick={copyPassword} className="btn btn-ghost btn-sm" style={{ padding: '0.125rem 0.375rem' }} aria-label="Copy password to clipboard">
                {copied ? <CheckCheck size={14} color="var(--success)" /> : <Copy size={14} />}
                <span style={{ fontSize: '0.75rem' }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--warning)', marginTop: '1rem', marginBottom: '1.25rem' }}>
            ⚠ Share this password securely. The sub-agent should change it after first login.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => { setCreated(null); router.push('/agent/sub-agents') }} className="btn btn-primary">
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/agent/sub-agents" className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></Link>
          <div>
            <h1>Add Sub-Agent</h1>
            <p>Create a sub-agent account</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '480px' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input type="text" className="input" placeholder="Jane Doe" {...register('full_name')} />
            {errors.full_name && <span className="field-error">{errors.full_name.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Email address</label>
            <input type="email" className="input" placeholder="jane@example.com" {...register('email')} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Phone Number</label>
            <input type="tel" className="input" placeholder="08012345678" {...register('phone')} />
            {errors.phone && <span className="field-error">{errors.phone.message}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <><span className="spinner" /> Creating…</> : 'Create Sub-Agent'}
            </button>
            <Link href="/agent/sub-agents" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'
import PasswordInput from '@/components/PasswordInput'

interface Profile {
  full_name: string | null
  email: string | null
  phone: string | null
  status: string | null
}

export default function SubagentSettingsPage() {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch('/api/subagent/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => {/* non-fatal */})
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.', 'Validation error')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.', 'Validation error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/subagent/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirm_password: confirmPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to update password.', 'Error')
        return
      }
      toast.success('Password updated successfully!', 'Password changed')
      setPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Something went wrong.', 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account security</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '480px' }}>
        {/* Profile details */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile</h2>
          <div className="detail-row">
            <span className="detail-key">Full Name</span>
            <span className="detail-value">{profile?.full_name ?? '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Email</span>
            <span className="detail-value">{profile?.email ?? '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Phone</span>
            <span className="detail-value">{profile?.phone ?? '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Status</span>
            <span className="detail-value">
              <span className={`badge ${profile?.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {profile?.status ?? '—'}
              </span>
            </span>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Change Password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">New Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <PasswordInput
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Confirm New Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <PasswordInput
                placeholder="Repeat your new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Saving…</> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

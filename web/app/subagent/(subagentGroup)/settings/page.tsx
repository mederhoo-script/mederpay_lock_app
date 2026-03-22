'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import PasswordInput from '@/components/PasswordInput'

export default function SubagentSettingsPage() {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

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

      <div className="card" style={{ maxWidth: '480px' }}>
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
  )
}

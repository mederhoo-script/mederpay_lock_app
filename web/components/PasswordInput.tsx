'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface PasswordInputProps {
  id?: string
  placeholder?: string
  autoComplete?: string
  className?: string
  // react-hook-form uncontrolled
  registration?: UseFormRegisterReturn
  // controlled
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  // plain uncontrolled
  name?: string
}

export default function PasswordInput({
  id,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  className = 'input',
  registration,
  value,
  onChange,
  required,
  name,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={className}
        placeholder={placeholder}
        autoComplete={autoComplete}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        style={{ paddingRight: '2.75rem' }}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

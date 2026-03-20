'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — only render after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        style={{
          width: '120px',
          height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid var(--border)',
        }}
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="btn btn-secondary"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{ gap: '0.5rem', minWidth: '120px' }}
    >
      {isDark ? (
        <>
          <Sun size={16} />
          Light mode
        </>
      ) : (
        <>
          <Moon size={16} />
          Dark mode
        </>
      )}
    </button>
  )
}

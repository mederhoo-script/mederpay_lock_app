'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const THEMES = [
  { value: 'dark',   label: 'Dark',             description: 'Default dark theme' },
  { value: 'light',  label: 'Light',            description: 'Clean light theme' },
  { value: 'amoled', label: 'AMOLED',           description: 'Pure black (saves OLED battery)' },
  { value: 'sepia',  label: 'Sepia',            description: 'Warm tones, easy on the eyes' },
  { value: 'blue',   label: 'Blue (Finance)',   description: 'Professional blue for finance apps' },
  { value: 'green',  label: 'Green (Health)',   description: 'Fresh green for health/fintech' },
  { value: 'purple', label: 'Purple (SaaS)',    description: 'Modern purple gradient for SaaS' },
] as const

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div style={{ height: '220px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {THEMES.map(({ value, label, description }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            aria-label={`Switch to ${label} theme`}
          >
            <ThemeSwatch theme={value} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                {description}
              </div>
            </div>
            {isActive && (
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function ThemeSwatch({ theme }: { theme: string }) {
  const swatches: Record<string, { bg: string; card: string; accent: string }> = {
    dark:   { bg: '#080D1A', card: '#0F1728', accent: '#6366F1' },
    light:  { bg: '#f1f5f9', card: '#ffffff', accent: '#6366F1' },
    amoled: { bg: '#000000', card: '#0a0a0a', accent: '#7c3aed' },
    sepia:  { bg: '#f4ede0', card: '#faf5ec', accent: '#a0522d' },
    blue:   { bg: '#0a1628', card: '#0f2040', accent: '#1d6eff' },
    green:  { bg: '#071a0f', card: '#0c2418', accent: '#22c55e' },
    purple: { bg: '#0f0720', card: '#170a30', accent: '#a855f7' },
  }
  const s = swatches[theme] ?? swatches.dark
  return (
    <div style={{
      width: '2.5rem', height: '2rem', borderRadius: '6px',
      background: s.bg, border: '1px solid rgba(255,255,255,0.12)',
      overflow: 'hidden', flexShrink: 0, position: 'relative',
    }}>
      <div style={{ position: 'absolute', bottom: '3px', right: '3px', width: '1rem', height: '0.75rem', borderRadius: '3px', background: s.card, border: '1px solid rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: '3px', left: '3px', width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: s.accent }} />
    </div>
  )
}

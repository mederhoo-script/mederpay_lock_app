'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
}

interface ToastContextValue {
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

const DURATION = 4500 // ms before auto-dismiss
const MAX_TOASTS = 5

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const add = useCallback((type: ToastType, message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => {
      const next = [...prev, { id, type, message, title }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
    const timer = setTimeout(() => dismiss(id), DURATION)
    timers.current.set(id, timer)
  }, [dismiss])

  const value: ToastContextValue = {
    success: (msg, title) => add('success', msg, title),
    error:   (msg, title) => add('error',   msg, title),
    warning: (msg, title) => add('warning', msg, title),
    info:    (msg, title) => add('info',    msg, title),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Toaster renderer ─────────────────────────────────────────────────────────

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error:   <XCircle     size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info        size={18} />,
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)',  icon: '#10B981', bar: '#10B981' },
  error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   icon: '#EF4444', bar: '#EF4444' },
  warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)',  icon: '#F59E0B', bar: '#F59E0B' },
  info:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  icon: '#3B82F6', bar: '#3B82F6' },
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        pointerEvents: 'none',
        maxWidth: '360px',
        width: '100%',
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const c = COLORS[toast.type]
        return (
          <div
            key={toast.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              borderRadius: '10px',
              background: `var(--bg-card, #0F1728)`,
              border: `1px solid ${c.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'toast-in 0.3s ease forwards',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Accent bar */}
            <span style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '3px',
              background: c.bar,
              borderRadius: '10px 0 0 10px',
            }} />

            {/* Icon */}
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px', marginLeft: '4px' }}>
              {ICONS[toast.type]}
            </span>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <p style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--text-primary, #F1F5F9)',
                  marginBottom: '0.125rem',
                }}>
                  {toast.title}
                </p>
              )}
              <p style={{
                fontSize: '0.8125rem',
                color: toast.title ? 'var(--text-secondary, #94A3B8)' : 'var(--text-primary, #F1F5F9)',
                wordBreak: 'break-word',
              }}>
                {toast.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary, #94A3B8)',
                padding: '0',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

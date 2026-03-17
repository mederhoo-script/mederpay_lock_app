import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100)
}

export function koboToNaira(kobo: number): number {
  return kobo / 100
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return account
  return '*'.repeat(account.length - 4) + account.slice(-4)
}

/**
 * Validates a device identifier sent by the Android app.
 * Accepts either:
 * - A 15-digit IMEI (Android < 10 with READ_PHONE_STATE permission), or
 * - An 8-16 hex-char Android ID (Android 10+ fallback, since IMEI is restricted).
 */
export function isValidDeviceId(id: string): boolean {
  return /^\d{15}$/.test(id) || /^[0-9a-fA-F]{8,16}$/.test(id)
}

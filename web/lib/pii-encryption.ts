/**
 * AES-256-GCM encryption/decryption helpers for Personally Identifiable Information
 * (BVN, NIN, and other sensitive fields stored in the database).
 *
 * The encryption key is 32 bytes, hex-encoded, stored in the BUYER_PII_KEY environment
 * variable.  Generate one with:
 *
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * The ciphertext format is:  <iv-hex>:<authTag-hex>:<ciphertext-hex>
 * All three components are required to decrypt.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.BUYER_PII_KEY
  if (!raw) {
    throw new Error('BUYER_PII_KEY environment variable is not set')
  }
  const key = Buffer.from(raw, 'hex')
  if (key.length !== 32) {
    throw new Error('BUYER_PII_KEY must be a 64-character hex string (32 bytes)')
  }
  return key
}

/**
 * Encrypt a plaintext string. Returns a colon-separated string containing the
 * IV, authentication tag, and ciphertext — all hex-encoded.
 */
export function encryptPii(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypt a value produced by `encryptPii`. Returns the original plaintext.
 * Returns `null` if the value is null or empty (no-op for optional fields).
 * Throws on tampered or malformed ciphertext.
 */
export function decryptPii(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid PII ciphertext format')
  }
  const [ivHex, authTagHex, dataHex] = parts
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encryptedData = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8')
}

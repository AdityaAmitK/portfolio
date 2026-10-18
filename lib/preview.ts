import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

function secret() {
  return process.env.ADMIN_SESSION_SECRET || 'development-only-secret'
}

function signature(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

export function createPreviewToken(postId: number, lifetimeHours = 24) {
  const value = `${postId}.${Date.now() + lifetimeHours * 60 * 60 * 1000}`
  return `${value}.${signature(value)}`
}

export function verifyPreviewToken(token: string, postId: number) {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [id, expiry, supplied] = parts
  if (Number(id) !== postId || !/^\d+$/.test(expiry) || !Number.isFinite(Number(expiry)) || Number(expiry) <= Date.now() || !/^[A-Za-z0-9_-]{43}$/.test(supplied)) return false
  const expected = signature(`${id}.${expiry}`)
  return expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}

export function previewUrl(postId: number, lifetimeHours = 24) {
  return `https://adityakinjawadekar.com/preview/${postId}?token=${createPreviewToken(postId, lifetimeHours)}`
}

export function verifyStoredPreviewToken(post: { published: number; preview_token_hash?: string; preview_expires_at?: string | null }, token: string) {
  if (post.published || !/^[a-f0-9]{64}$/.test(token) || !post.preview_token_hash || !/^[a-f0-9]{64}$/.test(post.preview_token_hash) || !post.preview_expires_at) return false
  const expiresAt = Date.parse(post.preview_expires_at)
  if (!Number.isFinite(expiresAt) || new Date(expiresAt).toISOString() !== post.preview_expires_at || expiresAt <= Date.now()) return false
  const supplied = createHash('sha256').update(token).digest()
  return timingSafeEqual(supplied, Buffer.from(post.preview_token_hash, 'hex'))
}

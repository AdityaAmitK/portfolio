import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

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
  const [id, expiry, supplied] = token.split('.')
  if (Number(id) !== postId || !expiry || !supplied || Number(expiry) < Date.now()) return false
  const expected = signature(`${id}.${expiry}`)
  return expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}

export function previewUrl(postId: number, lifetimeHours = 24) {
  return `https://adityakinjawadekar.com/preview/${postId}?token=${createPreviewToken(postId, lifetimeHours)}`
}

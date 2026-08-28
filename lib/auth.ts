import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'portfolio-admin'

function signature(value: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'development-only-secret').update(value).digest('hex')
}

export function passwordsMatch(value: string) {
  const configured = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'development' ? 'admin' : '')
  if (!configured) return false
  const expected = Buffer.from(configured)
  const supplied = Buffer.from(value)
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

export async function createSession() {
  const value = `${Date.now() + 1000 * 60 * 60 * 24 * 7}`
  const store = await cookies()
  store.set(COOKIE, `${value}.${signature(value)}`, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function isAuthenticated() {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return false
  const [expiry, supplied] = raw.split('.')
  if (!expiry || !supplied || Number(expiry) < Date.now()) return false
  const expected = signature(expiry)
  return expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
}

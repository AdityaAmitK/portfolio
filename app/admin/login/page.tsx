import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/auth'
import { login } from '../actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAuthenticated()) redirect('/admin')
  const { error } = await searchParams
  return <main className="admin-shell login"><form className="admin-card admin-form" action={login}><div><p className="eyebrow">Private desk</p><h1 className="serif" style={{ margin: 0 }}>Portfolio admin</h1><p className="muted">Sign in to write and publish posts.</p></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required autoFocus /></div>{error && <p role="alert" style={{ color: '#932f27', margin: 0 }}>That password is not correct.</p>}<button className="admin-button" type="submit">Sign in</button><Link className="inline-link" href="/">Return to site</Link></form></main>
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { logout } from '../actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect('/admin/login')
  return <><header className="admin-shell admin-header"><Link href="/admin" className="wordmark">Aditya / Admin</Link><nav className="admin-nav"><Link href="/admin">Posts</Link><Link href="/admin/tags">Tags</Link><Link href="/admin/content">Site content</Link><Link href="/admin/posts/new">New post</Link><Link href="/" target="_blank">View site ↗</Link><form action={logout}><button className="admin-button admin-button--secondary" type="submit">Sign out</button></form></nav></header>{children}</>
}

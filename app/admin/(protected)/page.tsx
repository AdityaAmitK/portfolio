import Link from 'next/link'
import { getAllPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const posts = getAllPosts()
  return <main className="admin-shell admin-main"><div className="section-head"><div><p className="eyebrow">Publishing desk</p><h1>Posts</h1></div><Link className="admin-button" href="/admin/posts/new">Write a post</Link></div>{posts.length ? <div className="admin-list">{posts.map(post => <div className="admin-list__row" key={post.id}><div><strong>{post.title}</strong><div className="muted" style={{ fontSize: 12 }}>{post.published ? 'Published' : 'Draft'} · {post.category}</div></div><span className="mono muted" style={{ fontSize: 11 }}>{new Date(post.updated_at).toLocaleDateString('en-IN')}</span><Link className="inline-link" href={`/admin/posts/${post.id}`}>Edit</Link></div>)}</div> : <div className="empty-note">No posts yet. Start with a match, player, or idea you keep returning to.</div>}</main>
}

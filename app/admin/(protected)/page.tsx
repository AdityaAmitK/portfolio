import Link from 'next/link'
import { getAllPosts } from '@/lib/db'
import { PostActions } from '@/components/post-actions'
import { previewUrl } from '@/lib/preview'

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const posts = getAllPosts()
  return <main className="admin-shell admin-main"><div className="section-head"><div><p className="eyebrow">Publishing desk</p><h1>Posts</h1></div><Link className="admin-button" href="/admin/posts/new">Write a post</Link></div>{posts.length ? <div className="admin-list">{posts.map(post => <div className="admin-list__row" key={post.id}><div><strong>{post.title}</strong><div className="muted" style={{ fontSize: 12 }}>{post.published ? 'Published' : 'Draft'}{post.tags.length ? ` · ${post.tags.map(tag => tag.name).join(', ')}` : ''}</div></div><span className="mono muted" style={{ fontSize: 11 }}>{new Date(post.updated_at).toLocaleDateString('en-IN')}</span><PostActions slug={post.slug} published={Boolean(post.published)} previewUrl={previewUrl(post.id)} compact /><Link className="inline-link" href={`/admin/posts/${post.id}`}>Edit</Link></div>)}</div> : <div className="empty-note">No posts yet.</div>}</main>
}

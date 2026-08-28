import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Writing', description: 'Notes on sport, software, and the systems between them.', alternates: { canonical: '/writing' } }

export default function WritingPage() {
  const posts = getPublishedPosts()
  return <main id="main" className="reading-shell"><header className="page-intro"><p className="eyebrow">Mostly sport, sometimes software</p><h1>Writing</h1><p>Observations I wanted to keep, arguments I wanted to test, and matches worth revisiting.</p></header>{posts.length ? <div className="writing-list">{posts.map(post => <Link href={`/writing/${post.slug}`} className="post-row" key={post.id}><div><h2>{post.title}</h2><p>{post.description}</p><div className="tags"><span className="tag">{post.category}</span></div></div><time>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time></Link>)}</div> : <div className="empty-note">No posts yet. The first sports piece is being warmed up.</div>}</main>
}

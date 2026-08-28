import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/markdown'
import { getPostBySlug } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return { title: post.title, description: post.description, keywords: post.tags.map(tag => tag.name), alternates: { canonical: `/writing/${post.slug}` }, openGraph: { title: post.title, description: post.description, type: 'article', publishedTime: post.published_at || undefined, tags: post.tags.map(tag => tag.name) } }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  return <main id="main" className="reading-shell prose">{post.tags.length > 0 && <div className="article-tags">{post.tags.map(tag => <span className="tag" key={tag.id}>{tag.name}</span>)}</div>}<h1>{post.title}</h1><div className="article-meta">{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div><Markdown>{post.body}</Markdown></main>
}

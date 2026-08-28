import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/markdown'
import { getPostBySlug } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return { title: post.title, description: post.description, alternates: { canonical: `/writing/${post.slug}` }, openGraph: { title: post.title, description: post.description, type: 'article', publishedTime: post.published_at || undefined } }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  return <main id="main" className="reading-shell prose"><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><div className="article-meta">{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div><Markdown>{post.body}</Markdown></main>
}

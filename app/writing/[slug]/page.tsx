import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Markdown } from '@/components/markdown'
import { getPostBySlug } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  const image = post.cover_image ? [{ url: post.cover_image, alt: post.cover_alt || post.title }] : undefined
  return { title: post.title, description: post.description, keywords: post.tags.map(tag => tag.name), authors: [{ name: 'Aditya Kinjawadekar', url: '/' }], alternates: { canonical: `/writing/${post.slug}` }, openGraph: { title: post.title, description: post.description, url: `/writing/${post.slug}`, type: 'article', authors: ['Aditya Kinjawadekar'], publishedTime: post.published_at || undefined, modifiedTime: post.updated_at, tags: post.tags.map(tag => tag.name), images: image }, twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: image } }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  const url = `https://adityakinjawadekar.com/writing/${post.slug}`
  const coverUrl = post.cover_image ? new URL(post.cover_image, 'https://adityakinjawadekar.com').toString() : undefined
  const articleJsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, image: coverUrl, url, mainEntityOfPage: url, datePublished: post.published_at || post.created_at, dateModified: post.updated_at, author: { '@type': 'Person', name: 'Aditya Kinjawadekar', url: 'https://adityakinjawadekar.com' }, keywords: post.tags.map(tag => tag.name) }
  return <main id="main" className="reading-shell prose"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }} />{post.tags.length > 0 && <div className="article-tags">{post.tags.map(tag => <span className="tag" key={tag.id}>{tag.name}</span>)}</div>}<h1>{post.title}</h1><time className="article-meta" dateTime={post.published_at || post.created_at}>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time>{post.cover_image && <figure className="article-cover"><Image src={post.cover_image} alt={post.cover_alt || ''} width={1200} height={630} priority unoptimized /></figure>}<Markdown>{post.body}</Markdown></main>
}

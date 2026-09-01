import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Article } from '@/components/article'
import { getPostBySlug } from '@/lib/db'
import { socialImageFor } from '@/lib/uploads'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  const image = post.cover_image ? [{ url: socialImageFor(post.cover_image), width: 1200, height: 630, alt: post.cover_alt || post.title }] : undefined
  return { title: post.title, description: post.description, keywords: post.tags.map(tag => tag.name), authors: [{ name: 'Aditya Kinjawadekar', url: '/' }], alternates: { canonical: `/writing/${post.slug}` }, openGraph: { title: post.title, description: post.description, url: `/writing/${post.slug}`, type: 'article', authors: ['Aditya Kinjawadekar'], publishedTime: post.published_at || undefined, modifiedTime: post.updated_at, tags: post.tags.map(tag => tag.name), images: image }, twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: image } }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()
  const url = `https://adityakinjawadekar.com/writing/${post.slug}`
  const coverUrl = post.cover_image ? new URL(post.cover_image, 'https://adityakinjawadekar.com').toString() : undefined
  const articleJsonLd = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.description, image: coverUrl, url, mainEntityOfPage: url, datePublished: post.published_at || post.created_at, dateModified: post.updated_at, author: { '@type': 'Person', name: 'Aditya Kinjawadekar', url: 'https://adityakinjawadekar.com' }, keywords: post.tags.map(tag => tag.name) }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }} /><Article post={post} /></>
}

import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://adityakinjawadekar.com'
  const staticPages = ['', '/projects', '/writing', '/tools', '/about'].map(path => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === '/writing' ? 'weekly' as const : 'monthly' as const, priority: path === '' ? 1 : .8 }))
  return [...staticPages, ...getPublishedPosts().map(post => ({ url: `${base}/writing/${post.slug}`, lastModified: new Date(post.updated_at), changeFrequency: 'monthly' as const, priority: .7 }))]
}

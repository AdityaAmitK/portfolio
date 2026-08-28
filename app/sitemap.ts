import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://adityakinjawadekar.com'
  const staticPages = ['', '/projects', '/writing', '/tools', '/about'].map(path => ({ url: `${base}${path}` }))
  return [...staticPages, ...getPublishedPosts().map(post => ({ url: `${base}/writing/${post.slug}`, lastModified: new Date(post.updated_at) }))]
}

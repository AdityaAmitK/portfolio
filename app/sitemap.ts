import type { MetadataRoute } from 'next'
import { getAllSeries, getPublishedPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://adityakinjawadekar.com'
  const staticPages = ['', '/projects', '/writing', '/tools', '/about'].map(path => ({ url: `${base}${path}` }))
  const seriesPages = getAllSeries().map(series => ({ url: `${base}/writing/series/${series.slug}` }))
  return [...staticPages, ...seriesPages, ...getPublishedPosts().map(post => ({ url: `${base}/writing/${post.slug}`, lastModified: new Date(post.updated_at) }))]
}

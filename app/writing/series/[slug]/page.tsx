import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedPostsInSeries, getSeries } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const series = getSeries(slug)
  if (!series) return {}
  return { title: series.title, description: series.description, alternates: { canonical: `/writing/series/${series.slug}` }, openGraph: { title: series.title, description: series.description, url: `/writing/series/${series.slug}` } }
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const series = getSeries(slug)
  if (!series) notFound()
  const posts = [...getPublishedPostsInSeries(series.slug)].sort((a, b) => (a.published_at || a.created_at).localeCompare(b.published_at || b.created_at))

  return <main id="main" className="reading-shell"><header className="page-intro"><h1>{series.title}</h1><p>{series.description}</p></header>{posts.length ? <div className="writing-list">{posts.map(post => <Link href={`/writing/${post.slug}`} className="post-row" key={post.id}><div><h2>{post.title}</h2><p>{post.description}</p>{post.tags.length > 0 && <div className="tags">{post.tags.map(tag => <span className="tag" key={tag.id}>{tag.name}</span>)}</div>}</div><time>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time></Link>)}</div> : <div className="empty-note">No articles in this series yet. <Link className="inline-link" href="/writing">Browse all writing</Link></div>}</main>
}

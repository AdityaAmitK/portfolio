import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSeries, getPublishedPosts, getTags } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Writing', description: 'Notes by Aditya Kinjawadekar.', alternates: { canonical: '/writing' } }

export default async function WritingPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; tag?: string | string[] }> }) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const activeTag = typeof params.tag === 'string' ? params.tag : ''
  const posts = getPublishedPosts({ query, tag: activeTag })
  const tags = getTags(true)
  const series = getAllSeries()
  const tagHref = (slug: string) => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (slug !== activeTag) next.set('tag', slug)
    const value = next.toString()
    return value ? `/writing?${value}` : '/writing'
  }

  return <main id="main" className="reading-shell"><header className="page-intro"><h1>Writing</h1></header>{series.length > 0 && <section className="writing-series" aria-labelledby="series-heading"><div className="section-head"><h2 id="series-heading">Series</h2></div><div className="writing-list">{series.map(item => <Link href={`/writing/series/${item.slug}`} className="post-row" key={item.id}><div><h3>{item.title}</h3><p>{item.description}</p></div></Link>)}</div></section>}<section className="writing-tools" aria-label="Search and filter posts"><form action="/writing" method="get" className="writing-search"><label className="sr-only" htmlFor="writing-search">Search posts</label><input id="writing-search" name="q" type="search" defaultValue={query} placeholder="Search posts" />{activeTag && <input type="hidden" name="tag" value={activeTag} />}<button type="submit">Search</button></form>{tags.length > 0 && <div className="writing-filters" aria-label="Filter by tag">{tags.map(tag => <Link href={tagHref(tag.slug)} className="tag" aria-current={activeTag === tag.slug ? 'true' : undefined} key={tag.id}>{tag.name}</Link>)}</div>}</section>{posts.length ? <div className="writing-list">{posts.map(post => <Link href={`/writing/${post.slug}`} className="post-row" key={post.id}><div><h2>{post.title}</h2><p>{post.description}</p>{post.tags.length > 0 && <div className="tags">{post.tags.map(tag => <span className="tag" key={tag.id}>{tag.name}</span>)}</div>}</div><time>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time></Link>)}</div> : <div className="empty-note">{query || activeTag ? <>No matching posts. <Link className="inline-link" href="/writing">Clear filters</Link></> : 'No posts yet.'}</div>}</main>
}

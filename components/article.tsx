import Image from 'next/image'
import type { Post } from '@/lib/db'
import { Markdown } from './markdown'

export function Article({ post }: { post: Post }) {
  return <main id="main" className="reading-shell prose">
    {post.tags.length > 0 && <div className="article-tags">{post.tags.map(tag => <span className="tag" key={tag.id}>{tag.name}</span>)}</div>}
    <h1>{post.title}</h1>
    <time className="article-meta" dateTime={post.published_at || post.created_at}>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
    {post.cover_image && <figure className="article-cover"><Image src={post.cover_image} alt={post.cover_alt || ''} width={1200} height={630} priority unoptimized /></figure>}
    <Markdown>{post.body}</Markdown>
  </main>
}

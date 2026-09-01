import { notFound } from 'next/navigation'
import { PostEditor } from '@/components/post-editor'
import { getPostById, getTags } from '@/lib/db'
import { removePost } from '@/app/admin/actions'
import { PostActions } from '@/components/post-actions'
import { previewUrl } from '@/lib/preview'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const post = getPostById(Number(id))
  if (!post) notFound()
  const { saved } = await searchParams
  return <main className="admin-shell admin-main"><p className="eyebrow">Edit post</p><div className="admin-title-row"><h1>{post.title}</h1><a className="inline-link" href={`/admin/analytics?path=${encodeURIComponent(`/writing/${post.slug}`)}`}>View analytics</a></div><PostActions slug={post.slug} published={Boolean(post.published)} previewUrl={previewUrl(post.id)} />{saved && <p style={{ color: 'var(--signal)' }}>Saved.</p>}<PostEditor post={post} tags={getTags()} /><form action={removePost} style={{ marginTop: 50 }}><input type="hidden" name="id" value={post.id} /><button className="admin-button admin-button--danger" type="submit">Delete post</button></form></main>
}

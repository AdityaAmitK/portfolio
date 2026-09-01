import { getApprovedComments, getPostLikeCount } from '@/lib/db'
import { CommentForm } from './comment-form'
import { LikeButton } from './like-button'

export function ArticleEngagement({ postId }: { postId: number }) {
  const comments = getApprovedComments(postId)
  const roots = comments.filter(comment => !comment.parent_id)
  return <section className="article-engagement" aria-label="Article discussion">
    <LikeButton postId={postId} initialCount={getPostLikeCount(postId)} />
    <div className="comments-heading"><h2>Comments</h2><span>{roots.length}</span></div>
    {roots.length > 0 && <div className="comment-list">{roots.map(comment => <article className="comment" key={comment.id}><header><strong>{comment.name}</strong><time>{new Date(`${comment.created_at}Z`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</time></header><p>{comment.body}</p>{comments.filter(reply => reply.parent_id === comment.id).map(reply => <div className="comment-reply" key={reply.id}><header><strong>{reply.name}<small>Author</small></strong><time>{new Date(`${reply.created_at}Z`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</time></header><p>{reply.body}</p></div>)}</article>)}</div>}
    <CommentForm postId={postId} />
  </section>
}

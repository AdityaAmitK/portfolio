import Link from 'next/link'
import { getCommentsForAdmin } from '@/lib/db'
import { moderateComment, replyToComment } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default function CommentsPage() {
  const comments = getCommentsForAdmin()
  return <main className="admin-shell admin-main"><div className="section-head"><div><p className="eyebrow">Discussion</p><h1>Comments</h1></div><span className="muted">{comments.length} total</span></div>{comments.length ? <div className="comment-moderation">{comments.map(comment => <article className="admin-card" key={comment.id}><header><div><strong>{comment.name}</strong>{comment.is_admin ? <span className="tag">Author reply</span> : null}<span className={`comment-status comment-status--${comment.status}`}>{comment.status}</span></div><time>{new Date(`${comment.created_at}Z`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</time></header><Link className="inline-link" href={`/writing/${comment.post_slug}`} target="_blank">{comment.post_title} ↗</Link><p>{comment.body}</p><div className="comment-moderation__actions"><form action={moderateComment}><input type="hidden" name="id" value={comment.id} /><button className="admin-button admin-button--secondary" name="action" value={comment.status === 'approved' ? 'hidden' : 'approved'}>{comment.status === 'approved' ? 'Hide' : 'Restore'}</button><button className="admin-button admin-button--danger" name="action" value="delete">Delete</button></form>{!comment.is_admin && <form className="comment-reply-form" action={replyToComment}><input type="hidden" name="id" value={comment.id} /><div className="field"><label htmlFor={`reply-${comment.id}`}>Reply as Aditya</label><textarea id={`reply-${comment.id}`} name="body" maxLength={1500} required /></div><button className="admin-button" type="submit">Post reply</button></form>}</div></article>)}</div> : <div className="empty-note">No comments yet.</div>}</main>
}

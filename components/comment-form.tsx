'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function CommentForm({ postId }: { postId: number }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setName(localStorage.getItem('portfolio-comment-name') || ''), 0)
    return () => clearTimeout(timer)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, name, body, website: form.get('website') }) })
    const result = await response.json().catch(() => ({})) as { error?: string }
    setSubmitting(false)
    if (!response.ok) return setMessage(result.error || 'Unable to post your comment.')
    localStorage.setItem('portfolio-comment-name', name)
    setBody('')
    setMessage('Comment posted.')
    router.refresh()
  }

  return <form className="comment-form" onSubmit={submit}>
    <div className="field"><label htmlFor={`comment-name-${postId}`}>Name</label><input id={`comment-name-${postId}`} value={name} onChange={event => setName(event.target.value)} maxLength={50} autoComplete="name" required /></div>
    <div className="field"><label htmlFor={`comment-body-${postId}`}>Comment</label><textarea id={`comment-body-${postId}`} value={body} onChange={event => setBody(event.target.value)} maxLength={1500} required /></div>
    <div className="comment-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="comment-form__footer"><button className="comment-submit" type="submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post comment'}</button><span role="status">{message}</span></div>
  </form>
}

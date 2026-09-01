'use client'

import { useEffect, useState } from 'react'

function visitorId() {
  let value = localStorage.getItem('portfolio-like-id')
  if (!value) {
    value = crypto.randomUUID()
    localStorage.setItem('portfolio-like-id', value)
  }
  return value
}

export function LikeButton({ postId, initialCount }: { postId: number; initialCount: number }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const id = visitorId()
    fetch(`/api/likes?postId=${postId}&visitorId=${encodeURIComponent(id)}`).then(response => response.json()).then((result: { liked?: boolean; count?: number }) => {
      setLiked(Boolean(result.liked))
      if (typeof result.count === 'number') setCount(result.count)
    }).catch(() => {})
  }, [postId])

  async function toggle() {
    setBusy(true)
    const response = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, visitorId: visitorId() }) })
    const result = await response.json() as { liked?: boolean; count?: number }
    if (response.ok) {
      setLiked(Boolean(result.liked))
      if (typeof result.count === 'number') setCount(result.count)
    }
    setBusy(false)
  }

  return <button className="article-like" type="button" aria-pressed={liked} onClick={toggle} disabled={busy}><span aria-hidden="true">{liked ? '♥' : '♡'}</span> {liked ? 'Liked' : 'Like this article'} <strong>{count}</strong></button>
}

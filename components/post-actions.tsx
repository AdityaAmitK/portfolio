'use client'

import { useState } from 'react'

const site = 'https://adityakinjawadekar.com'

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
}

export function PostActions({ slug, published, previewUrl, compact = false }: { slug: string; published: boolean; previewUrl: string; compact?: boolean }) {
  const [copied, setCopied] = useState('')
  const publicUrl = `${site}/writing/${slug}`
  const tracked = (source: string) => `${publicUrl}?utm_source=${source}&utm_medium=social&utm_campaign=${encodeURIComponent(slug)}`
  const copyLink = async (label: string, url: string) => {
    await copy(url)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  return <div className={`post-actions${compact ? ' post-actions--compact' : ''}`}>
    <a className="admin-button admin-button--secondary" href={published ? publicUrl : previewUrl} target="_blank" rel="noreferrer">Preview ↗</a>
    <button className="admin-button admin-button--secondary" type="button" onClick={() => copyLink(published ? 'Public link' : 'Preview link', published ? publicUrl : previewUrl)}>{copied || (published ? 'Copy public link' : 'Copy 24h preview')}</button>
    {published && <>
      <button className="admin-button admin-button--secondary" type="button" onClick={() => copyLink('WhatsApp link', tracked('whatsapp'))}>WhatsApp</button>
      <button className="admin-button admin-button--secondary" type="button" onClick={() => copyLink('Instagram link', tracked('instagram'))}>Instagram</button>
      {!compact && <><button className="admin-button admin-button--secondary" type="button" onClick={() => copyLink('X link', tracked('x'))}>X</button><button className="admin-button admin-button--secondary" type="button" onClick={() => copyLink('LinkedIn link', tracked('linkedin'))}>LinkedIn</button></>}
    </>}
    {published && compact && <a className="admin-button admin-button--secondary" href={`/admin/analytics?path=${encodeURIComponent(`/writing/${slug}`)}`}>Analytics</a>}
  </div>
}

'use client'

import { useState } from 'react'
import type { Post } from '@/lib/db'
import { Markdown } from './markdown'
import { upsertPost } from '@/app/admin/actions'

export function PostEditor({ post }: { post?: Post }) {
  const [body, setBody] = useState(post?.body || '# Start with a clear thought\n\nWrite the piece here. Markdown preview updates as you type.')
  return <form action={upsertPost} className="admin-form"><input type="hidden" name="id" value={post?.id || ''} /><div className="form-row"><div className="field"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={post?.title} required /></div><div className="field"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" defaultValue={post?.slug} placeholder="generated-from-title" /></div></div><div className="field"><label htmlFor="description">Description</label><input id="description" name="description" defaultValue={post?.description} maxLength={180} placeholder="One useful sentence for readers and search results." /></div><div className="form-row"><div className="field"><label htmlFor="category">Category</label><select id="category" name="category" defaultValue={post?.category || 'Sport'}><option>Sport</option><option>Cricket</option><option>Football</option><option>Software</option><option>Trading</option><option>Life</option></select></div><label className="checkbox"><input name="published" type="checkbox" defaultChecked={Boolean(post?.published)} /> Published</label></div><div className="editor-grid"><div className="field"><label htmlFor="body">Markdown</label><textarea id="body" name="body" value={body} onChange={event => setBody(event.target.value)} spellCheck /></div><div><span className="eyebrow">Live preview</span><article className="editor-preview prose"><Markdown>{body}</Markdown></article></div></div><div><button className="admin-button" type="submit">Save post</button></div></form>
}

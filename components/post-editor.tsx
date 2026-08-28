'use client'

import { useState } from 'react'
import type { Post, Tag } from '@/lib/db'
import { Markdown } from './markdown'
import { upsertPost } from '@/app/admin/actions'

export function PostEditor({ post, tags }: { post?: Post; tags: Tag[] }) {
  const [body, setBody] = useState(post?.body || '# Start with a clear thought\n\nWrite the piece here. Markdown preview updates as you type.')
  const selectedTags = new Set(post?.tags.map(tag => tag.id) || [])
  return <form action={upsertPost} className="admin-form"><input type="hidden" name="id" value={post?.id || ''} /><div className="form-row"><div className="field"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={post?.title} required /></div><div className="field"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" defaultValue={post?.slug} placeholder="generated-from-title" /></div></div><div className="field"><label htmlFor="description">Description</label><input id="description" name="description" defaultValue={post?.description} maxLength={180} placeholder="One useful sentence for readers and search results." /></div><div className="form-row"><fieldset className="field tag-picker"><legend>Tags</legend>{tags.length ? <div>{tags.map(tag => <label className="checkbox" key={tag.id}><input name="tags" value={tag.id} type="checkbox" defaultChecked={selectedTags.has(tag.id)} /> {tag.name}</label>)}</div> : <p className="muted">Create tags from the Tags page first.</p>}</fieldset><label className="checkbox"><input name="published" type="checkbox" defaultChecked={Boolean(post?.published)} /> Published</label></div><div className="editor-grid"><div className="field"><label htmlFor="body">Markdown</label><textarea id="body" name="body" value={body} onChange={event => setBody(event.target.value)} spellCheck /></div><div><span className="eyebrow">Live preview</span><article className="editor-preview prose"><Markdown>{body}</Markdown></article></div></div><div><button className="admin-button" type="submit">Save post</button></div></form>
}

'use client'

import Image from 'next/image'
import { useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react'
import type { Post, Tag } from '@/lib/db'
import { upsertPost } from '@/app/admin/actions'
import { Markdown } from './markdown'

async function uploadImage(file: File) {
  const data = new FormData()
  data.set('file', file)
  const response = await fetch('/api/admin/uploads', { method: 'POST', body: data })
  const result = await response.json() as { url?: string; error?: string }
  if (!response.ok || !result.url) throw new Error(result.error || 'Upload failed.')
  return result.url
}

function imageAltFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}

export function PostEditor({ post, tags }: { post?: Post; tags: Tag[] }) {
  const [body, setBody] = useState(post?.body || '# Start with a clear thought\n\nWrite the piece here. Markdown preview updates as you type.')
  const [coverImage, setCoverImage] = useState(post?.cover_image || '')
  const [uploadStatus, setUploadStatus] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const selectedTags = new Set(post?.tags.map(tag => tag.id) || [])

  async function insertBodyImage(file: File, start: number, end: number) {
    const textarea = textareaRef.current
    try {
      setUploadStatus('Uploading article image…')
      const url = await uploadImage(file)
      const markdown = `![${imageAltFromFilename(file.name)}](${url})`
      const before = body.slice(0, start)
      const after = body.slice(end)
      const insertion = `${before && !before.endsWith('\n') ? '\n\n' : ''}${markdown}${after && !after.startsWith('\n') ? '\n\n' : ''}`
      setBody(before + insertion + after)
      setUploadStatus('Image added. Edit its alt text in the Markdown if needed.')
      requestAnimationFrame(() => {
        textarea?.focus()
        textarea?.setSelectionRange(start + insertion.length, start + insertion.length)
      })
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed.')
    }
  }

  async function addBodyImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const textarea = textareaRef.current
    await insertBodyImage(file, textarea?.selectionStart ?? body.length, textarea?.selectionEnd ?? body.length)
    event.target.value = ''
  }

  function pasteBodyImage(event: ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(event.clipboardData.files).find(item => item.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    void insertBodyImage(file, event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
  }

  async function addCoverImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploadStatus('Uploading cover image…')
      setCoverImage(await uploadImage(file))
      setUploadStatus('Cover image uploaded.')
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      event.target.value = ''
    }
  }

  return <form action={upsertPost} className="admin-form">
    <input type="hidden" name="id" value={post?.id || ''} />
    <input type="hidden" name="coverImage" value={coverImage} />
    <div className="form-row"><div className="field"><label htmlFor="title">Title</label><input id="title" name="title" defaultValue={post?.title} required /></div><div className="field"><label htmlFor="slug">URL slug</label><input id="slug" name="slug" defaultValue={post?.slug} placeholder="generated-from-title" /></div></div>
    <div className="field"><label htmlFor="description">Description</label><input id="description" name="description" defaultValue={post?.description} maxLength={180} placeholder="One useful sentence for readers and search results." /></div>
    <section className="cover-editor" aria-labelledby="cover-label">
      <div className="field"><label id="cover-label" htmlFor="cover-upload">Cover image</label><input id="cover-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={addCoverImage} /><small>Used at the top of the article and when its link is shared.</small></div>
      <div className="field"><label htmlFor="cover-alt">Cover alt text</label><input id="cover-alt" name="coverAlt" defaultValue={post?.cover_alt} placeholder="Describe the image for readers using screen readers" /></div>
      {coverImage && <div className="cover-editor__preview"><Image src={coverImage} alt="Cover preview" width={1200} height={630} unoptimized /><button type="button" className="admin-button admin-button--secondary" onClick={() => setCoverImage('')}>Remove cover</button></div>}
    </section>
    <div className="form-row"><fieldset className="field tag-picker"><legend>Tags</legend>{tags.length ? <div>{tags.map(tag => <label className="checkbox" key={tag.id}><input name="tags" value={tag.id} type="checkbox" defaultChecked={selectedTags.has(tag.id)} /> {tag.name}</label>)}</div> : <p className="muted">Create tags from the Tags page first.</p>}</fieldset><label className="checkbox"><input name="published" type="checkbox" defaultChecked={Boolean(post?.published)} /> Published</label></div>
    <div className="editor-grid"><div className="field"><div className="editor-label-row"><div><label htmlFor="body">Markdown</label><small>Paste screenshots directly with Cmd/Ctrl+V.</small></div><label className="admin-button admin-button--secondary image-upload-button">Add image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={addBodyImage} /></label></div><textarea ref={textareaRef} id="body" name="body" value={body} onChange={event => setBody(event.target.value)} onPaste={pasteBodyImage} spellCheck /></div><div><span className="eyebrow">Live preview</span><article className="editor-preview prose"><Markdown>{body}</Markdown></article></div></div>
    {uploadStatus && <p className="upload-status" role="status">{uploadStatus}</p>}
    <div><button className="admin-button" type="submit">Save post</button></div>
  </form>
}

'use client'

import Image from 'next/image'
import { useState, type ChangeEvent, type ClipboardEvent } from 'react'
import { updateContent } from '@/app/admin/actions'
import type { ManagedContent, Project, Tool } from '@/lib/content'

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

export function ContentEditor({ initial }: { initial: ManagedContent }) {
  const [content, setContent] = useState(initial)
  const [uploadStatus, setUploadStatus] = useState('')

  const updateProject = (index: number, patch: Partial<Project>) =>
    setContent(value => ({
      ...value,
      projects: value.projects.map((project, i) => i === index ? { ...project, ...patch } : project),
    }))

  const updateTool = (index: number, patch: Partial<Tool>) =>
    setContent(value => ({
      ...value,
      tools: value.tools.map((tool, i) => i === index ? { ...tool, ...patch } : tool),
    }))

  async function uploadProjectImage(index: number, file: File) {
    try {
      setUploadStatus(`Uploading image for ${content.projects[index].title || 'project'}…`)
      const url = await uploadImage(file)
      const imageAlt = content.projects[index].imageAlt || imageAltFromFilename(file.name)
      updateProject(index, { image: url, imageAlt })
      setUploadStatus('Project image uploaded.')
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed.')
    }
  }

  async function addProjectImage(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadProjectImage(index, file)
    event.target.value = ''
  }

  function pasteProjectImage(index: number, event: ClipboardEvent<HTMLElement>) {
    const file = Array.from(event.clipboardData.files).find(item => item.type.startsWith('image/'))
    if (!file) return
    event.preventDefault()
    void uploadProjectImage(index, file)
  }

  return (
    <form action={updateContent} className="admin-form">
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <section>
        <div className="section-head"><h2>About</h2></div>
        <div className="admin-card admin-form">
          <div className="field"><label>Headline</label><input value={content.about.headline} onChange={event => setContent(value => ({ ...value, about: { ...value.about, headline: event.target.value } }))} /></div>
          <div className="field"><label>Body (Markdown)</label><textarea className="about-textarea" value={content.about.body} onChange={event => setContent(value => ({ ...value, about: { ...value.about, body: event.target.value } }))} /></div>
        </div>
      </section>

      <section>
        <div className="section-head"><h2>Projects</h2></div>
        <div className="content-stack">
          {content.projects.map((project, index) => (
            <details className="admin-card" key={index}>
              <summary><strong>{project.title || 'Untitled project'}</strong><span className="mono muted">{project.year}</span></summary>
              <div className="admin-form content-fields">
                <div className="form-row">
                  <div className="field"><label>Title</label><input value={project.title} onChange={event => updateProject(index, { title: event.target.value })} /></div>
                  <div className="field"><label>Slug</label><input value={project.slug} onChange={event => updateProject(index, { slug: event.target.value })} /></div>
                </div>
                <div className="field"><label>Summary</label><textarea className="short-textarea" value={project.summary} onChange={event => updateProject(index, { summary: event.target.value })} /></div>
                <div className="form-row">
                  <div className="field"><label>Year</label><input type="number" value={project.year} onChange={event => updateProject(index, { year: Number(event.target.value) })} /></div>
                  <div className="field"><label>Tags (comma separated)</label><input value={project.tags.join(', ')} onChange={event => updateProject(index, { tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} /></div>
                </div>
                <section className="cover-editor project-image-editor" aria-labelledby={`project-image-label-${index}`} onPaste={event => pasteProjectImage(index, event)} tabIndex={0}>
                  <div className="field"><label id={`project-image-label-${index}`} htmlFor={`project-image-upload-${index}`}>Project image</label><input id={`project-image-upload-${index}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => addProjectImage(index, event)} /><small>Upload or paste an image here.</small></div>
                  <div className="field"><label htmlFor={`project-image-alt-${index}`}>Image alt text</label><input id={`project-image-alt-${index}`} value={project.imageAlt || ''} onChange={event => updateProject(index, { imageAlt: event.target.value || undefined })} placeholder="Describe the project image" /></div>
                  <div className="field project-image-editor__path"><label htmlFor={`project-image-path-${index}`}>Image path</label><input id={`project-image-path-${index}`} value={project.image || ''} onChange={event => updateProject(index, { image: event.target.value || undefined })} placeholder="/uploads/image.webp or https://…" /></div>
                  {project.image && <div className="cover-editor__preview"><Image src={project.image} alt={project.imageAlt || 'Project image preview'} width={1200} height={675} unoptimized /><button type="button" className="admin-button admin-button--secondary" onClick={() => updateProject(index, { image: undefined })}>Remove image</button></div>}
                </section>
                <div className="form-row">
                  <div className="field"><label>Repository (optional)</label><input type="url" placeholder="https://github.com/..." value={project.repoHref || ''} onChange={event => updateProject(index, { repoHref: event.target.value || undefined })} /></div>
                  <div className="field"><label>Demo (optional)</label><input type="url" placeholder="https://demos..." value={project.demoHref || ''} onChange={event => updateProject(index, { demoHref: event.target.value || undefined })} /></div>
                </div>
                <div className="field"><label>Live implementation (optional)</label><input type="url" placeholder="https://..." value={project.liveHref || ''} onChange={event => updateProject(index, { liveHref: event.target.value || undefined })} /></div>
                <label className="checkbox"><input type="checkbox" checked={project.featured} onChange={event => updateProject(index, { featured: event.target.checked })} /> Featured on homepage</label>
                <button type="button" className="admin-button admin-button--danger" onClick={() => setContent(value => ({ ...value, projects: value.projects.filter((_, i) => i !== index) }))}>Remove project</button>
              </div>
            </details>
          ))}
        </div>
        {uploadStatus && <p className="upload-status" role="status">{uploadStatus}</p>}
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => setContent(value => ({ ...value, projects: [...value.projects, { slug: 'new-project', title: 'New project', year: new Date().getFullYear(), summary: '', tags: [], featured: false }] }))}>Add project</button>
      </section>

      <section>
        <div className="section-head"><h2>Recommended tools</h2></div>
        <div className="content-stack">
          {content.tools.map((tool, index) => (
            <div className="admin-card admin-form" key={index}>
              <div className="form-row">
                <div className="field"><label>Name</label><input value={tool.name} onChange={event => updateTool(index, { name: event.target.value })} /></div>
                <div className="field"><label>Category</label><input value={tool.category} onChange={event => updateTool(index, { category: event.target.value })} /></div>
              </div>
              <div className="field"><label>Official link</label><input type="url" placeholder="https://" value={tool.href || ''} onChange={event => updateTool(index, { href: event.target.value || undefined })} /></div>
              <div className="field"><label>Why I use it</label><input value={tool.note} onChange={event => updateTool(index, { note: event.target.value })} /></div>
              <button type="button" className="admin-button admin-button--danger" onClick={() => setContent(value => ({ ...value, tools: value.tools.filter((_, i) => i !== index) }))}>Remove</button>
            </div>
          ))}
        </div>
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => setContent(value => ({ ...value, tools: [...value.tools, { name: 'New tool', category: 'Tool', note: '', href: '' }] }))}>Add tool</button>
      </section>

      <section>
        <div className="section-head"><h2>Skills</h2></div>
        <div className="content-stack">
          {content.skills.map((skill, index) => (
            <div className="skill-edit" key={index}>
              <input value={skill} onChange={event => setContent(value => ({ ...value, skills: value.skills.map((item, i) => i === index ? event.target.value : item) }))} />
              <button type="button" aria-label={`Remove ${skill}`} onClick={() => setContent(value => ({ ...value, skills: value.skills.filter((_, i) => i !== index) }))}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => setContent(value => ({ ...value, skills: [...value.skills, 'New skill'] }))}>Add skill</button>
      </section>

      <div className="sticky-save"><button type="submit" className="admin-button">Save site content</button></div>
    </form>
  )
}

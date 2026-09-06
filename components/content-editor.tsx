'use client'

import Image from 'next/image'
import { useState, type ChangeEvent, type ClipboardEvent } from 'react'
import { updateContent } from '@/app/admin/actions'
import type { Engagement, Experience, ManagedContent, Project, Tool } from '@/lib/content'

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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function ContentEditor({ initial }: { initial: ManagedContent }) {
  const [content, setContent] = useState(initial)
  const [uploadStatus, setUploadStatus] = useState('')

  const updateProject = (index: number, patch: Partial<Project>) =>
    setContent(value => ({
      ...value,
      projects: value.projects.map((project, i) => i === index ? { ...project, ...patch } : project),
    }))

  const updateExperience = (index: number, patch: Partial<Experience>) =>
    setContent(value => ({ ...value, experiences: value.experiences.map((experience, i) => i === index ? { ...experience, ...patch } : experience) }))

  const updateEngagement = (experienceIndex: number, engagementIndex: number, patch: Partial<Engagement>) =>
    updateExperience(experienceIndex, { engagements: content.experiences[experienceIndex].engagements.map((engagement, i) => i === engagementIndex ? { ...engagement, ...patch } : engagement) })

  const updateTool = (index: number, patch: Partial<Tool>) =>
    setContent(value => ({
      ...value,
      tools: value.tools.map((tool, i) => i === index ? { ...tool, ...patch } : tool),
    }))

  const moveFeaturedProject = (index: number, direction: -1 | 1) =>
    setContent(value => {
      const featured = value.projects.map((project, i) => project.featured ? i : -1).filter(i => i >= 0)
      const position = featured.indexOf(index)
      const target = featured[position + direction]
      if (target === undefined) return value
      const projects = [...value.projects]
      const current = projects[index]
      projects[index] = projects[target]
      projects[target] = current
      return { ...value, projects }
    })

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
        <div className="section-head"><h2>Experience</h2></div>
        <div className="content-stack">
          {content.experiences.map((experience, experienceIndex) => (
            <details className="admin-card" key={experienceIndex}>
              <summary><strong>{experience.company || 'New company'}</strong><span className="mono muted">{experience.startDate}–{experience.endDate || 'present'}</span></summary>
              <div className="admin-form content-fields">
                <div className="form-row">
                  <div className="field"><label>Company</label><input value={experience.company} onChange={event => updateExperience(experienceIndex, { company: event.target.value })} /></div>
                  <div className="field"><label>Role</label><input value={experience.role} onChange={event => updateExperience(experienceIndex, { role: event.target.value })} /></div>
                </div>
                <div className="field"><label>Company link (optional)</label><input type="url" value={experience.companyHref || ''} placeholder="https://" onChange={event => updateExperience(experienceIndex, { companyHref: event.target.value || undefined })} /></div>
                <div className="form-row">
                  <div className="field"><label>Started</label><input type="month" value={experience.startDate} onChange={event => updateExperience(experienceIndex, { startDate: event.target.value })} /></div>
                  <div className="field"><label>Ended (leave blank if current)</label><input type="month" value={experience.endDate || ''} onChange={event => updateExperience(experienceIndex, { endDate: event.target.value || undefined })} /></div>
                </div>
                <div className="engagement-editor">
                  <p className="eyebrow">Client projects</p>
                  {experience.engagements.map((engagement, engagementIndex) => (
                    <div className="admin-form engagement-editor__item" key={engagementIndex}>
                      <div className="form-row">
                        <div className="field"><label>Project</label><input value={engagement.name} onChange={event => updateEngagement(experienceIndex, engagementIndex, { name: event.target.value })} /></div>
                        <div className="field"><label>Project link (optional)</label><input type="url" value={engagement.href || ''} placeholder="https://" onChange={event => updateEngagement(experienceIndex, engagementIndex, { href: event.target.value || undefined })} /></div>
                      </div>
                      <div className="form-row">
                        <div className="field"><label>Started</label><input type="month" value={engagement.startDate} onChange={event => updateEngagement(experienceIndex, engagementIndex, { startDate: event.target.value })} /></div>
                        <div className="field"><label>Ended (leave blank if current)</label><input type="month" value={engagement.endDate || ''} onChange={event => updateEngagement(experienceIndex, engagementIndex, { endDate: event.target.value || undefined })} /></div>
                      </div>
                      <div className="field"><label>Summary</label><textarea className="short-textarea" value={engagement.summary} onChange={event => updateEngagement(experienceIndex, engagementIndex, { summary: event.target.value })} /></div>
                      <div className="field"><label>Highlights (one per line)</label><textarea className="short-textarea" value={engagement.highlights.join('\n')} onChange={event => updateEngagement(experienceIndex, engagementIndex, { highlights: event.target.value.split('\n').map(item => item.trim()).filter(Boolean) })} /></div>
                      <div className="field"><label>Tags (comma separated)</label><input value={engagement.tags.join(', ')} onChange={event => updateEngagement(experienceIndex, engagementIndex, { tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} /></div>
                      <button type="button" className="admin-button admin-button--danger" onClick={() => updateExperience(experienceIndex, { engagements: experience.engagements.filter((_, i) => i !== engagementIndex) })}>Remove client project</button>
                    </div>
                  ))}
                  <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => updateExperience(experienceIndex, { engagements: [...experience.engagements, { name: '', startDate: '', summary: '', highlights: [], tags: [] }] })}>Add client project</button>
                </div>
                <button type="button" className="admin-button admin-button--danger" onClick={() => setContent(value => ({ ...value, experiences: value.experiences.filter((_, i) => i !== experienceIndex) }))}>Remove experience</button>
              </div>
            </details>
          ))}
        </div>
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => setContent(value => ({ ...value, experiences: [...value.experiences, { company: '', role: '', startDate: '', engagements: [] }] }))}>Add experience</button>
      </section>

      <section>
        <div className="section-head"><h2>Projects</h2></div>
        <div className="project-order" aria-label="Selected project order">
          <p className="eyebrow">Selected project order</p>
          {content.projects.map((project, index) => project.featured && (
            <div className="project-order__item" key={project.slug || index}>
              <strong>{project.title || 'Untitled project'}</strong>
              <div><button type="button" disabled={index === content.projects.findIndex(item => item.featured)} onClick={() => moveFeaturedProject(index, -1)}>Move up</button><button type="button" disabled={index === content.projects.findLastIndex(item => item.featured)} onClick={() => moveFeaturedProject(index, 1)}>Move down</button></div>
            </div>
          ))}
        </div>
        <div className="content-stack">
          {content.projects.map((project, index) => (
            <details className="admin-card" key={index}>
              <summary><strong>{project.title || 'Untitled project'}</strong><span className="mono muted">{project.date || project.year}</span></summary>
              <div className="admin-form content-fields">
                <div className="form-row">
                  <div className="field"><label>Title</label><input value={project.title} onChange={event => updateProject(index, { title: event.target.value, ...((!project.slug || project.slug === slugify(project.title)) && { slug: slugify(event.target.value) }) })} /></div>
                  <div className="field"><label>Slug</label><input value={project.slug} placeholder="generated-from-title" onChange={event => updateProject(index, { slug: event.target.value })} /></div>
                </div>
                <div className="field"><label>Summary</label><textarea className="short-textarea" value={project.summary} onChange={event => updateProject(index, { summary: event.target.value })} /></div>
                <div className="form-row">
                  <div className="field"><label>Date</label><input type="date" value={project.date || ''} onChange={event => updateProject(index, { date: event.target.value || undefined, year: Number(event.target.value.slice(0, 4)) || project.year })} /></div>
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
                <div className="form-row">
                  <div className="field"><label>Live implementation (optional)</label><input type="url" placeholder="https://..." value={project.liveHref || ''} onChange={event => updateProject(index, { liveHref: event.target.value || undefined })} /></div>
                  <div className="field"><label>VS Code Marketplace (optional)</label><input type="url" placeholder="https://marketplace.visualstudio.com/items?..." value={project.marketplaceHref || ''} onChange={event => updateProject(index, { marketplaceHref: event.target.value || undefined })} /></div>
                </div>
                <div className="field"><label>CLI install command (optional)</label><input placeholder="npm install -g package-name" value={project.installCommand || ''} onChange={event => updateProject(index, { installCommand: event.target.value || undefined })} /></div>
                <label className="checkbox"><input type="checkbox" checked={project.featured} onChange={event => updateProject(index, { featured: event.target.checked })} /> Featured on homepage</label>
                <button type="button" className="admin-button admin-button--danger" onClick={() => setContent(value => ({ ...value, projects: value.projects.filter((_, i) => i !== index) }))}>Remove project</button>
              </div>
            </details>
          ))}
        </div>
        {uploadStatus && <p className="upload-status" role="status">{uploadStatus}</p>}
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => { const date = new Date().toLocaleDateString('en-CA'); setContent(value => ({ ...value, projects: [...value.projects, { slug: '', title: '', date, year: Number(date.slice(0, 4)), summary: '', tags: [], featured: false }] })) }}>Add project</button>
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

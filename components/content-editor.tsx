'use client'

import { useState } from 'react'
import { updateContent } from '@/app/admin/actions'
import type { ManagedContent, Project, Tool } from '@/lib/content'

export function ContentEditor({ initial }: { initial: ManagedContent }) {
  const [content, setContent] = useState(initial)

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

  return (
    <form action={updateContent} className="admin-form">
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <section>
        <div className="section-head"><h2>Projects</h2></div>
        <div className="content-stack">
          {content.projects.map((project, index) => (
            <details className="admin-card" key={`${project.slug}-${index}`}>
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
                <div className="form-row">
                  <div className="field"><label>Image path</label><input value={project.image || ''} onChange={event => updateProject(index, { image: event.target.value })} /></div>
                  <div className="field"><label>External link</label><input type="url" value={project.href || ''} onChange={event => updateProject(index, { href: event.target.value || undefined })} /></div>
                </div>
                <div className="field"><label>Link label</label><input value={project.linkLabel || ''} onChange={event => updateProject(index, { linkLabel: event.target.value || undefined })} /></div>
                <label className="checkbox"><input type="checkbox" checked={project.featured} onChange={event => updateProject(index, { featured: event.target.checked })} /> Featured on homepage</label>
                <button type="button" className="admin-button admin-button--danger" onClick={() => setContent(value => ({ ...value, projects: value.projects.filter((_, i) => i !== index) }))}>Remove project</button>
              </div>
            </details>
          ))}
        </div>
        <button type="button" className="admin-button admin-button--secondary add-button" onClick={() => setContent(value => ({ ...value, projects: [...value.projects, { slug: 'new-project', title: 'New project', year: new Date().getFullYear(), summary: '', tags: [], featured: false }] }))}>Add project</button>
      </section>

      <section>
        <div className="section-head"><h2>Recommended tools</h2></div>
        <div className="content-stack">
          {content.tools.map((tool, index) => (
            <div className="admin-card admin-form" key={`${tool.name}-${index}`}>
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
            <div className="skill-edit" key={`${skill}-${index}`}>
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

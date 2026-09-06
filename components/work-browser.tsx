'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { Experience, Project } from '@/lib/content'
import { CopyCommand } from './copy-command'

type WorkType = 'all' | 'experience' | 'projects'

function monthLabel(value?: string) {
  if (!value) return 'Present'
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function projectDate(project: Project) {
  return project.date ? new Date(`${project.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : String(project.year)
}

export function WorkBrowser({ projects, experiences, initialQuery = '', initialTag = '', initialType = 'all' }: { projects: Project[]; experiences: Experience[]; initialQuery?: string; initialTag?: string; initialType?: WorkType }) {
  const [query, setQuery] = useState(initialQuery)
  const [tag, setTag] = useState(initialTag)
  const [type, setType] = useState<WorkType>(initialType)
  const normalizedQuery = query.trim().toLowerCase()
  const tags = useMemo(() => [...new Set([...projects.flatMap(project => project.tags), ...experiences.flatMap(experience => experience.engagements.flatMap(engagement => engagement.tags))])].sort((a, b) => a.localeCompare(b)), [projects, experiences])

  const visibleProjects = projects.filter(project => type !== 'experience' && (!tag || project.tags.includes(tag)) && (!normalizedQuery || [project.title, project.summary, ...project.tags].join(' ').toLowerCase().includes(normalizedQuery)))
  const visibleExperiences = experiences.flatMap(experience => experience.engagements.map(engagement => ({ experience, engagement }))).filter(({ experience, engagement }) => type !== 'projects' && (!tag || engagement.tags.includes(tag)) && (!normalizedQuery || [experience.company, experience.role, engagement.name, engagement.summary, ...engagement.highlights, ...engagement.tags].join(' ').toLowerCase().includes(normalizedQuery)))

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (tag) params.set('tag', tag)
    if (type !== 'all') params.set('type', type)
    window.history.replaceState(null, '', params.size ? `/projects?${params}` : '/projects')
  }, [query, tag, type])

  return <>
    <section className="work-tools" aria-label="Search and filter work">
      <label className="work-search"><span className="sr-only">Search work</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects, experience, or technologies" /></label>
      <div className="work-tabs" aria-label="Filter work type">{([['all', 'All'], ['experience', 'Experience'], ['projects', 'Projects']] as const).map(([value, label]) => <button type="button" aria-pressed={type === value} onClick={() => setType(value)} key={value}>{label}</button>)}</div>
      {tags.length > 0 && <div className="work-tags" aria-label="Filter work by tag">{tags.map(value => <button type="button" className="tag" aria-pressed={tag === value} onClick={() => setTag(tag === value ? '' : value)} key={value}>{value}</button>)}</div>}
    </section>

    <div className="work-results" aria-live="polite">
      {visibleExperiences.length > 0 && <section className="work-group"><header><p className="eyebrow">Professional work</p><h2>Experience</h2></header><div className="work-list">{visibleExperiences.map(({ experience, engagement }) => <article className="work-entry" key={`${experience.company}-${engagement.name}`}><div className="work-entry__meta"><span>{monthLabel(engagement.startDate)}–{monthLabel(engagement.endDate)}</span><span>{experience.company}</span></div><h3>{engagement.href ? <a href={engagement.href} target="_blank" rel="noreferrer">{engagement.name}</a> : engagement.name}</h3><p>{engagement.summary}</p>{engagement.highlights.length > 0 && <ul>{engagement.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>}<div className="tags">{engagement.tags.map(value => <button type="button" className="tag" onClick={() => setTag(value)} key={value}>{value}</button>)}</div></article>)}</div></section>}

      {visibleProjects.length > 0 && <section className="work-group"><header><p className="eyebrow">Things I have built</p><h2>Projects</h2></header><div className="work-list">{visibleProjects.map(project => <article className="work-entry project-entry" id={project.slug} key={project.slug}><div className="work-entry__meta"><span>{projectDate(project)}</span></div><h3>{project.title}</h3>{project.image && <div className={`project-entry__image ${project.slug === 'secure-face-recognition' || project.slug === 'iphone-mac-keyboard' ? 'project-entry__image--contain' : ''}`}><Image src={project.image} alt={project.imageAlt || ''} width={1800} height={1100} sizes="(max-width: 760px) 100vw, 850px" unoptimized={project.image.endsWith('.gif')} /></div>}<p>{project.summary}</p><div className="tags">{project.tags.map(value => <button type="button" className="tag" onClick={() => setTag(value)} key={value}>{value}</button>)}</div>{project.installCommand && <CopyCommand command={project.installCommand} />}<div className="project-entry__links">{project.repoHref && <a className="project-entry__link" href={project.repoHref} target="_blank" rel="noreferrer">repository</a>}{project.demoHref && <a className="project-entry__link" href={project.demoHref} target="_blank" rel="noreferrer">explore demo</a>}{project.liveHref && <a className="project-entry__link" href={project.liveHref} target="_blank" rel="noreferrer">{project.installCommand ? 'npm package' : 'visit project'}</a>}{project.marketplaceHref && <a className="project-entry__link" href={project.marketplaceHref} target="_blank" rel="noreferrer">VS Code Marketplace</a>}</div></article>)}</div></section>}

      {!visibleExperiences.length && !visibleProjects.length && <div className="empty-note">No matching work. <button type="button" className="inline-link" onClick={() => { setQuery(''); setTag(''); setType('all') }}>Clear filters</button></div>}
    </div>
  </>
}

'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { Experience, Project } from '@/lib/content'
import { CopyCommand } from './copy-command'

type WorkType = 'all' | 'experience' | 'projects' | 'research'

const isResearch = (project: Project) => project.slug === 'secure-face-recognition'
const projectSortDate = (project: Project) => project.date || `${project.year}-01-01`

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
  const tags = useMemo(() => {
    const values = [...projects.flatMap(project => project.tags), ...experiences.flatMap(experience => experience.engagements.flatMap(engagement => engagement.tags))]
    const counts = new Map<string, number>()
    values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1))
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value)
  }, [projects, experiences])
  const primaryTags = tags.slice(0, 15)
  const secondaryTags = tags.slice(15)

  const matchesProject = (project: Project) => (!tag || project.tags.includes(tag)) && (!normalizedQuery || [project.title, project.summary, ...project.tags].join(' ').toLowerCase().includes(normalizedQuery))
  const visibleProjects = [...projects].filter(project => type !== 'experience' && type !== 'research' && !isResearch(project) && matchesProject(project)).sort((a, b) => projectSortDate(b).localeCompare(projectSortDate(a)))
  const visibleResearch = [...projects].filter(project => type !== 'experience' && type !== 'projects' && isResearch(project) && matchesProject(project)).sort((a, b) => projectSortDate(b).localeCompare(projectSortDate(a)))
  const visibleExperiences = experiences.flatMap(experience => experience.engagements.map(engagement => ({ experience, engagement }))).filter(({ experience, engagement }) => type !== 'projects' && type !== 'research' && (!tag || engagement.tags.includes(tag)) && (!normalizedQuery || [experience.company, experience.role, engagement.name, engagement.summary, ...engagement.highlights, ...engagement.tags].join(' ').toLowerCase().includes(normalizedQuery))).sort((a, b) => b.engagement.startDate.localeCompare(a.engagement.startDate))

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (tag) params.set('tag', tag)
    if (type !== 'all') params.set('type', type)
    window.history.replaceState(null, '', params.size ? `/projects?${params}` : '/projects')
  }, [query, tag, type])

  return <>
    <header className="page-intro"><h1>{tag ? `${tag} work` : 'Work'}</h1></header>
    <section className="work-tools" aria-label="Search and filter work">
      <label className="work-search"><span className="sr-only">Search work</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects, experience, or technologies" /></label>
      <div className="work-tabs" aria-label="Filter work type">{([['all', 'All'], ['experience', 'Experience'], ['projects', 'Projects'], ['research', 'Research']] as const).map(([value, label]) => <button type="button" aria-pressed={type === value} onClick={() => setType(value)} key={value}>{label}</button>)}</div>
      {primaryTags.length > 0 && <div className="work-tags" aria-label="Filter work by tag">{primaryTags.map(value => <button type="button" className="tag" aria-pressed={tag === value} onClick={() => setTag(tag === value ? '' : value)} key={value}>{value}</button>)}</div>}
      {secondaryTags.length > 0 && <details className="work-more-tags" open={secondaryTags.includes(tag) || undefined}><summary>More filters</summary><div className="work-tags">{secondaryTags.map(value => <button type="button" className="tag" aria-pressed={tag === value} onClick={() => setTag(tag === value ? '' : value)} key={value}>{value}</button>)}</div></details>}
    </section>

    <div className="work-results" aria-live="polite">
      {visibleExperiences.length > 0 && <section className="work-group"><header><p className="eyebrow">Professional work</p><h2>Experience</h2></header><div className="work-list">{visibleExperiences.map(({ experience, engagement }) => <article className="work-entry" key={`${experience.company}-${engagement.name}`}><div className="work-entry__meta"><span>{monthLabel(engagement.startDate)}–{monthLabel(engagement.endDate)}</span><span>{experience.company}</span></div><h3>{engagement.href ? <a href={engagement.href} target="_blank" rel="noreferrer">{engagement.name}</a> : engagement.name}</h3><p>{engagement.summary}</p>{engagement.highlights.length > 0 && <ul>{engagement.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>}<div className="tags">{engagement.tags.map(value => <button type="button" className="tag" onClick={() => setTag(value)} key={value}>{value}</button>)}</div></article>)}</div></section>}

      {visibleProjects.length > 0 && <section className="work-group"><header><p className="eyebrow">Things I have built</p><h2>Projects</h2></header><div className="work-list">{visibleProjects.map(project => <article className="work-entry project-entry" id={project.slug} key={project.slug}><div className="work-entry__meta"><span>{projectDate(project)}</span></div><h3>{project.title}</h3>{project.image && <div className={`project-entry__image ${project.slug === 'secure-face-recognition' || project.slug === 'iphone-mac-keyboard' ? 'project-entry__image--contain' : ''}`}><Image src={project.image} alt={project.imageAlt || ''} width={1800} height={1100} sizes="(max-width: 760px) 100vw, 850px" unoptimized={project.image.endsWith('.gif')} /></div>}<p>{project.summary}</p><div className="tags">{project.tags.map(value => <button type="button" className="tag" onClick={() => setTag(value)} key={value}>{value}</button>)}</div>{project.installCommand && <CopyCommand command={project.installCommand} />}<div className="project-entry__links">{project.repoHref && <a className="project-entry__link" href={project.repoHref} target="_blank" rel="noreferrer">repository</a>}{project.demoHref && <a className="project-entry__link" href={project.demoHref} target="_blank" rel="noreferrer">explore demo</a>}{project.liveHref && <a className="project-entry__link" href={project.liveHref} target="_blank" rel="noreferrer">{project.installCommand ? 'npm package' : 'visit project'}</a>}{project.marketplaceHref && <a className="project-entry__link" href={project.marketplaceHref} target="_blank" rel="noreferrer">VS Code Marketplace</a>}</div></article>)}</div></section>}

      {visibleResearch.length > 0 && <section className="work-group"><header><h2>Research</h2></header><div className="work-list">{visibleResearch.map(project => <article className="work-entry project-entry" id={project.slug} key={project.slug}><div className="work-entry__meta"><span>{projectDate(project)}</span></div><h3>{project.title}</h3>{project.image && <div className="project-entry__image project-entry__image--contain"><Image src={project.image} alt={project.imageAlt || ''} width={1800} height={1100} sizes="(max-width: 760px) 100vw, 850px" /></div>}<p>{project.summary}</p><div className="tags">{project.tags.map(value => <button type="button" className="tag" onClick={() => setTag(value)} key={value}>{value}</button>)}</div><div className="project-entry__links">{project.liveHref && <a className="project-entry__link" href={project.liveHref} target="_blank" rel="noreferrer">read paper</a>}</div></article>)}</div></section>}

      {!visibleExperiences.length && !visibleProjects.length && !visibleResearch.length && <div className="empty-note">No matching work. <button type="button" className="inline-link" onClick={() => { setQuery(''); setTag(''); setType('all') }}>Clear filters</button></div>}
    </div>
  </>
}

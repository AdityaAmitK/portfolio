import type { Metadata } from 'next'
import Image from 'next/image'
import { getManagedContent } from '@/lib/db'
import { CopyCommand } from '@/components/copy-command'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Projects', description: 'Products, developer tools, research, and experiments built by Aditya Kinjawadekar.', alternates: { canonical: '/projects' } }

export default function ProjectsPage() {
  const { projects } = getManagedContent()
  const years = [...new Set(projects.map(project => project.year))].sort((a, b) => b - a)
  return (
    <main id="main" className="shell">
      <header className="page-intro"><p className="eyebrow">Selected work · 2024–now</p><h1>Projects</h1></header>
      <div className="timeline">
        {years.map(year => <section className="year-group" key={year}><span className="year">{year}</span><div className="project-list">{projects.filter(project => project.year === year).map(project => <article className="project-entry" id={project.slug} key={project.slug}><h2>{project.title}</h2>{project.image && <div className={`project-entry__image ${project.slug === 'secure-face-recognition' || project.slug === 'iphone-mac-keyboard' ? 'project-entry__image--contain' : ''}`}><Image src={project.image} alt={project.imageAlt || ''} width={1800} height={1100} sizes="(max-width: 760px) 100vw, 850px" unoptimized={project.image.endsWith('.gif')} /></div>}<div className="project-entry__body"><p>{project.summary}</p><div className="tags">{project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>{project.installCommand && <CopyCommand command={project.installCommand} />}<div className="project-entry__links">{project.repoHref && <a className="project-entry__link" href={project.repoHref} target="_blank" rel="noreferrer">repository ↗</a>}{project.demoHref && <a className="project-entry__link" href={project.demoHref} target="_blank" rel="noreferrer">explore demo ↗</a>}{project.liveHref && <a className="project-entry__link" href={project.liveHref} target="_blank" rel="noreferrer">{project.installCommand ? 'npm package ↗' : 'visit project ↗'}</a>}{project.marketplaceHref && <a className="project-entry__link" href={project.marketplaceHref} target="_blank" rel="noreferrer">VS Code Marketplace ↗</a>}</div></div></article>)}</div></section>)}
      </div>
    </main>
  )
}

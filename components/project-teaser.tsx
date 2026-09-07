import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/content'

export function ProjectTeaser({ project }: { project: Project }) {
  const projectHref = `/projects#${project.slug}`
  const projectDate = project.date ? new Date(`${project.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : project.year
  return (
    <article className="project-teaser">
      {project.image && <Link href={projectHref} className="project-teaser__media"><Image src={project.image} alt={project.imageAlt || ''} width={1280} height={800} sizes="(max-width: 760px) 100vw, 62vw" /></Link>}
      <div className="project-teaser__body">
        <p className="eyebrow">{projectDate} · {project.tags[0]}</p>
        <h3><Link href={projectHref}>{project.title}</Link></h3>
        <p>{project.summary}</p>
        <div className="tags">{project.tags.map(tag => <Link className="tag" href={`/projects?tag=${encodeURIComponent(tag)}`} key={tag}>{tag}</Link>)}</div>
        <Link className="project-teaser__link" href={projectHref}>View project →</Link>
      </div>
    </article>
  )
}

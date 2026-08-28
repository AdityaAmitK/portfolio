import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/lib/content'

export function ProjectTeaser({ project }: { project: Project }) {
  const projectHref = `/projects#${project.slug}`
  return (
    <article className="project-teaser">
      {project.image && <Link href={projectHref} className="project-teaser__media"><Image src={project.image} alt={project.imageAlt || ''} width={1280} height={800} sizes="(max-width: 760px) 100vw, 62vw" /></Link>}
      <div>
        <p className="eyebrow">{project.year} · {project.tags[0]}</p>
        <h3><Link href={projectHref}>{project.title}</Link></h3>
        <div className="tags">{project.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>
      </div>
    </article>
  )
}

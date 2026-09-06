import Link from 'next/link'
import Image from 'next/image'
import { ProjectTeaser } from '@/components/project-teaser'
import { GitHubContributions } from '@/components/github-contributions'
import { getManagedContent, getPublishedPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

function monthLabel(value?: string) {
  if (!value) return 'Present'
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export default function Home() {
  const posts = getPublishedPosts().slice(0, 3)
  const { experiences, projects, tools } = getManagedContent()
  return (
    <main id="main">
      <section className="shell hero">
        <div>
          <p className="eyebrow">Software engineer</p>
          <h1>I build useful software for <em>real problems.</em></h1>
          <p className="hero-copy">I’m Aditya Kinjawadekar, a software engineer at <a className="employer-link" href="https://fischerjordan.com" target="_blank" rel="noreferrer">Fischer Jordan</a>. I build products, developer tools, and backend systems.</p>
          <p className="hero-copy"><a className="inline-link" href="https://github.com/AdityaAmitK" target="_blank" rel="noreferrer">GitHub</a> · <a className="inline-link" href="https://www.linkedin.com/in/adityaamit" target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
        <div className="hero-side">
          <figure className="profile-frame"><Image src="/images/profile/aditya-kinjawadekar.png" alt="Aditya Kinjawadekar" width={1086} height={1448} priority sizes="(max-width: 760px) 230px, 286px" /></figure>
          <aside className="workbench" aria-label="Current workbench">
            <div className="workbench__row"><span className="workbench__label">Now</span><span className="workbench__value"><span className="status-dot" />Building at <a className="employer-link" href="https://fischerjordan.com" target="_blank" rel="noreferrer">Fischer Jordan</a></span></div>
          </aside>
        </div>
      </section>

      <section className="shell section">
        <div className="section-head"><h2>Experience</h2></div>
        <div className="experience-list">
          {experiences.map(experience => (
            <article className="experience" key={`${experience.company}-${experience.startDate}`}>
              <header className="experience__employer">
                <p className="eyebrow">{monthLabel(experience.startDate)}–{monthLabel(experience.endDate)}</p>
                <h3>{experience.companyHref ? <a href={experience.companyHref} target="_blank" rel="noreferrer">{experience.company} ↗</a> : experience.company}</h3>
                <p>{experience.role}</p>
              </header>
              <div className="experience__engagements">
                {experience.engagements.map(engagement => (
                  <section className="engagement" key={`${engagement.name}-${engagement.startDate}`}>
                    <div className="engagement__heading"><h4>{engagement.href ? <a href={engagement.href} target="_blank" rel="noreferrer">{engagement.name} ↗</a> : engagement.name}</h4><span>{monthLabel(engagement.startDate)}–{monthLabel(engagement.endDate)}</span></div>
                    <p>{engagement.summary}</p>
                    {engagement.highlights.length > 0 && <ul>{engagement.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>}
                    {engagement.tags.length > 0 && <div className="tags">{engagement.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="section-head"><h2>Selected projects</h2><Link className="section-link" href="/projects">All projects →</Link></div>
        <div className="project-teasers">{projects.filter(project => project.featured).map(project => <ProjectTeaser project={project} key={project.slug} />)}</div>
      </section>

      <section className="shell section contribution-section" aria-label="GitHub contributions"><GitHubContributions /></section>

      <section className="shell section">
        <div className="section-head"><h2>Recent writing</h2><Link className="section-link" href="/writing">All writing →</Link></div>
        {posts.length ? <div className="writing-list">{posts.map(post => <Link href={`/writing/${post.slug}`} className="post-row" key={post.id}><div><h3>{post.title}</h3><p>{post.description}</p></div><time>{new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}</time></Link>)}</div> : <div className="empty-note">No posts yet.</div>}
      </section>

      <section className="shell section">
        <div className="section-head"><h2>Tools I keep around</h2><Link className="section-link" href="/tools">The full workbench →</Link></div>
        <div className="tool-list">{tools.slice(0, 3).map(tool => <div className="tool-row" key={tool.name}><h2>{tool.href ? <a className="tool-link" href={tool.href} target="_blank" rel="noreferrer">{tool.name} ↗</a> : tool.name}</h2><span className="tool-row__category">{tool.category}</span><p>{tool.note}</p></div>)}</div>
      </section>
    </main>
  )
}

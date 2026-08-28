import type { Metadata } from 'next'
import { getManagedContent } from '@/lib/db'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Tools', description: 'Software and tools Aditya recommends and uses regularly.', alternates: { canonical: '/tools' } }

export default function ToolsPage() {
  const { skills, tools } = getManagedContent()
  return <main id="main" className="shell"><header className="page-intro"><p className="eyebrow">Opinionated and regularly revised</p><h1>My workbench</h1><p>Tools earn a place here by saving time or making the work noticeably better. These are recommendations, not sponsorships.</p></header><section className="section" style={{ paddingTop: 0 }}><div className="tool-list">{tools.map(tool => <article className="tool-row" key={tool.name}><h2>{tool.href ? <a className="tool-link" href={tool.href} target="_blank" rel="noreferrer">{tool.name} ↗</a> : tool.name}</h2><span className="tool-row__category">{tool.category}</span><p>{tool.note}</p></article>)}</div></section><section className="section"><div className="section-head"><h2>Skills I reach for</h2></div><div className="skill-grid">{skills.map(skill => <div className="skill" key={skill}>{skill}</div>)}</div></section></main>
}

import type { Metadata } from 'next'
import { getManagedContent } from '@/lib/db'
import { WorkBrowser } from '@/components/work-browser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Work', description: 'Professional experience, products, developer tools, research, and experiments by Aditya Kinjawadekar.', alternates: { canonical: '/projects' } }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; tag?: string | string[]; type?: string | string[] }> }) {
  const { projects, experiences } = getManagedContent()
  const params = await searchParams
  const type = typeof params.type === 'string' && ['experience', 'projects'].includes(params.type) ? params.type as 'experience' | 'projects' : 'all'
  return (
    <main id="main" className="shell">
      <header className="page-intro"><p className="eyebrow">Professional and personal · 2024–now</p><h1>Work</h1><p>Client work, products, developer tools, and research in one place.</p></header>
      <WorkBrowser projects={projects} experiences={experiences} initialQuery={typeof params.q === 'string' ? params.q : ''} initialTag={typeof params.tag === 'string' ? params.tag : ''} initialType={type} />
    </main>
  )
}

import type { Metadata } from 'next'
import { getManagedContent } from '@/lib/db'
import { WorkBrowser } from '@/components/work-browser'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Work', description: 'Professional experience, products, developer tools, research, and experiments by Aditya Kinjawadekar.', alternates: { canonical: '/projects' } }

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; tag?: string | string[]; type?: string | string[] }> }) {
  const { projects, experiences } = getManagedContent()
  const params = await searchParams
  const type = typeof params.type === 'string' && ['experience', 'projects', 'research'].includes(params.type) ? params.type as 'experience' | 'projects' | 'research' : 'all'
  return (
    <main id="main" className="shell">
      <WorkBrowser projects={projects} experiences={experiences} initialQuery={typeof params.q === 'string' ? params.q : ''} initialTag={typeof params.tag === 'string' ? params.tag : ''} initialType={type} />
    </main>
  )
}

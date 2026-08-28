import type { Metadata } from 'next'
import { Markdown } from '@/components/markdown'
import { getManagedContent } from '@/lib/db'

export const metadata: Metadata = { title: 'About', description: 'About Aditya Kinjawadekar, a software engineer building products, developer tools, and backend systems.', alternates: { canonical: '/about' } }
export const dynamic = 'force-dynamic'

export default function AboutPage() {
  const { about } = getManagedContent()
  return <main id="main" className="reading-shell prose"><p className="eyebrow">About</p><h1>{about.headline}</h1><Markdown>{about.body}</Markdown></main>
}

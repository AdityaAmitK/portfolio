import { ContentEditor } from '@/components/content-editor'
import { getManagedContent } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  return <main className="admin-shell admin-main"><p className="eyebrow">Public site</p><h1>Profile, experience, projects &amp; contact</h1>{saved && <p style={{ color: 'var(--signal)' }}>Site content saved.</p>}<ContentEditor initial={getManagedContent()} /></main>
}

import { ContentEditor } from '@/components/content-editor'
import { updateFinanceSeries } from '@/app/admin/actions'
import { getManagedContent, getSeries } from '@/lib/db'

export const dynamic = 'force-dynamic'

const seriesErrors: Partial<Record<string, string>> = {
  required: 'Enter both a title and a description.',
  length: 'Title must be 120 characters or fewer, and description 1000 or fewer.',
  missing: 'The finance series could not be found, so nothing was saved.',
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; seriesSaved?: string; seriesError?: string }> }) {
  const { saved, seriesSaved, seriesError } = await searchParams
  const series = getSeries('finance')
  const seriesErrorMessage = seriesError && Object.hasOwn(seriesErrors, seriesError) ? seriesErrors[seriesError] : undefined
  return <main className="admin-shell admin-main"><p className="eyebrow">Public site</p><h1>Profile, experience, projects &amp; contact</h1>{saved && <p style={{ color: 'var(--signal)' }}>Site content saved.</p>}
    <section className="admin-card admin-form" aria-labelledby="finance-series-heading">
      <div><p className="eyebrow">Writing series</p><h2 id="finance-series-heading">Finance series</h2><p>The title and description shown on the homepage and the series page.</p></div>
      {seriesSaved && <p role="status" style={{ color: 'var(--signal)' }}>Finance series saved.</p>}
      {seriesErrorMessage && <p role="alert" style={{ color: '#932f27' }}>{seriesErrorMessage}</p>}
      <form action={updateFinanceSeries} className="admin-form">
        <div className="field"><label htmlFor="finance-series-title">Title</label><input id="finance-series-title" name="title" type="text" required maxLength={120} defaultValue={series?.title ?? ''} /></div>
        <div className="field"><label htmlFor="finance-series-description">Description</label><textarea id="finance-series-description" name="description" required maxLength={1000} className="short-textarea" defaultValue={series?.description ?? ''} /></div>
        <div><button type="submit" className="admin-button">Save series</button></div>
      </form>
    </section>
    <ContentEditor initial={getManagedContent()} />
  </main>
}

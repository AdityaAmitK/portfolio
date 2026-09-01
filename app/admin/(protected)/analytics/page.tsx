import Link from 'next/link'
import { getAnalytics } from '@/lib/db'

export const dynamic = 'force-dynamic'

function percent(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : '0%'
}

function time(seconds: number) {
  if (!seconds) return '0s'
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string | string[]; path?: string | string[] }> }) {
  const query = await searchParams
  const days = Math.max(1, Math.min(365, Number(typeof query.days === 'string' ? query.days : 30) || 30))
  const selectedPath = typeof query.path === 'string' && query.path.startsWith('/') ? query.path : ''
  const data = getAnalytics({ days, path: selectedPath })
  const overview = {
    views: data.overview.views ?? 0,
    sessions: data.overview.sessions ?? 0,
    engaged: data.overview.engaged ?? 0,
    completed: data.overview.completed ?? 0,
    active_seconds: data.overview.active_seconds ?? 0,
  }
  const averageTime = overview.sessions ? overview.active_seconds / overview.sessions : 0
  const maxDaily = Math.max(1, ...data.daily.map(day => day.views))
  const href = (nextDays: number) => `/admin/analytics?days=${nextDays}${selectedPath ? `&path=${encodeURIComponent(selectedPath)}` : ''}`

  return <main className="admin-shell admin-main">
    <div className="section-head"><div><p className="eyebrow">First-party analytics</p><h1>{selectedPath || 'All pages'}</h1></div>{selectedPath && <Link className="inline-link" href="/admin/analytics">View all pages</Link>}</div>
    <div className="analytics-range" aria-label="Date range">{[7, 30, 90, 365].map(value => <Link href={href(value)} aria-current={days === value ? 'page' : undefined} key={value}>{value === 365 ? '1 year' : `${value} days`}</Link>)}</div>
    <section className="analytics-cards" aria-label="Summary">
      <div className="admin-card"><span>Views</span><strong>{overview.views || 0}</strong></div>
      <div className="admin-card"><span>Sessions</span><strong>{overview.sessions || 0}</strong></div>
      <div className="admin-card"><span>Engaged</span><strong>{percent(overview.engaged || 0, overview.sessions || 0)}</strong></div>
      <div className="admin-card"><span>Reached 90%</span><strong>{percent(overview.completed || 0, overview.sessions || 0)}</strong></div>
      <div className="admin-card"><span>Average active time</span><strong>{time(averageTime)}</strong></div>
    </section>

    <section className="analytics-section"><h2>Traffic by day</h2>{data.daily.length ? <div className="analytics-chart">{data.daily.map(day => <div className="analytics-bar" key={day.day} title={`${day.day}: ${day.views} views`}><span style={{ height: `${Math.max(4, (day.views / maxDaily) * 100)}%` }} /><small>{day.day.slice(5)}</small></div>)}</div> : <div className="empty-note">No visits recorded in this period.</div>}</section>

    {!selectedPath && <section className="analytics-section"><h2>Pages</h2><div className="analytics-table"><div className="analytics-table__head"><span>Page</span><span>Views</span><span>Sessions</span><span>Engaged</span><span>90%</span><span>Avg. time</span></div>{data.pages.map(page => <Link className="analytics-table__row" href={`/admin/analytics?days=${days}&path=${encodeURIComponent(page.path)}`} key={page.path}><strong>{page.path}</strong><span>{page.views}</span><span>{page.sessions}</span><span>{percent(page.engaged, page.sessions)}</span><span>{percent(page.completed, page.sessions)}</span><span>{time(page.sessions ? page.active_seconds / page.sessions : 0)}</span></Link>)}</div></section>}

    <div className="analytics-columns">
      <section className="analytics-section"><h2>Sources</h2><div className="analytics-simple-list">{data.sources.map(source => <div key={source.source}><strong>{source.source}</strong><span>{source.sessions} sessions</span></div>)}</div></section>
      <section className="analytics-section"><h2>Devices</h2><div className="analytics-simple-list">{data.devices.map(device => <div key={device.device}><strong>{device.device}</strong><span>{device.sessions} sessions</span></div>)}</div></section>
      <section className="analytics-section"><h2>Countries</h2><div className="analytics-simple-list">{data.countries.map(country => <div key={country.country}><strong>{country.country}</strong><span>{country.sessions} sessions</span></div>)}</div></section>
    </div>
    <section className="analytics-section"><h2>Clicked links</h2>{data.clicks.length ? <div className="analytics-simple-list">{data.clicks.map(click => <div key={click.target}><strong>{click.target}</strong><span>{click.clicks} clicks</span></div>)}</div> : <div className="empty-note">No link clicks recorded in this period.</div>}</section>
    <section className="analytics-section"><h2>Recent journeys</h2>{data.journeys.length ? <div className="analytics-journeys">{data.journeys.map(journey => <div key={journey.session_id}><div><strong>{journey.source}</strong><time>{new Date(`${journey.started_at}Z`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST</time></div><p>{journey.pages}</p></div>)}</div> : <div className="empty-note">No journeys recorded in this period.</div>}</section>
    <p className="analytics-note">Admin and preview pages are excluded. Sessions are anonymous and stored only for the current browser tab. No raw IP addresses or complete user-agent strings are saved.</p>
  </main>
}

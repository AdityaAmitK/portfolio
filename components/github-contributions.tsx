type ContributionDay = { date: string; level: number; count: number }

async function getContributions(): Promise<{ days: ContributionDay[]; total: number }> {
  try {
    const response = await fetch('https://github.com/users/AdityaAmitK/contributions', {
      headers: { 'User-Agent': 'adityakinjawadekar.com' },
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return { days: [], total: 0 }

    const html = await response.text()
    const counts = new Map(
      [...html.matchAll(/for="(contribution-day-component-[^"]+)"[^>]*>(No|[\d,]+) contributions? on/g)]
        .map(([, id, count]) => [id, count === 'No' ? 0 : Number(count.replaceAll(',', ''))])
    )
    const days = [...html.matchAll(/<td[^>]*data-date="([^"]+)"[^>]*id="([^"]+)"[^>]*data-level="([0-4])"[^>]*>/g)]
      .map(([, date, id, level]) => ({ date, level: Number(level), count: counts.get(id) || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date))
    return { days, total: days.reduce((sum, day) => sum + day.count, 0) }
  } catch {
    return { days: [], total: 0 }
  }
}

export async function GitHubContributions() {
  const { days, total } = await getContributions()
  if (!days.length) return <p className="contribution-unavailable">GitHub activity is temporarily unavailable.</p>

  return (
    <div className="contribution-panel">
      <div className="contribution-scroll" role="img" aria-label={`GitHub contribution activity from ${days[0].date} to ${days.at(-1)?.date}`}>
        <div className="contribution-grid" aria-hidden="true">
          {days.map(day => <span className="contribution-day" data-level={day.level} title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`} key={day.date} />)}
        </div>
      </div>
      <div className="contribution-meta">
        <strong>{total.toLocaleString('en-IN')} contributions</strong>
        <a href="https://github.com/AdityaAmitK" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </div>
  )
}

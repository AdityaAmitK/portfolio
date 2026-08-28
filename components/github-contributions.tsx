type ContributionDay = { date: string; level: number }

async function getContributions(): Promise<ContributionDay[]> {
  try {
    const response = await fetch('https://github.com/users/AdityaAmitK/contributions', {
      headers: { 'User-Agent': 'adityakinjawadekar.com' },
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []

    const html = await response.text()
    return [...html.matchAll(/<td[^>]*data-date="([^"]+)"[^>]*data-level="([0-4])"[^>]*>/g)]
      .map(([, date, level]) => ({ date, level: Number(level) }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    return []
  }
}

export async function GitHubContributions() {
  const days = await getContributions()
  if (!days.length) return <p className="contribution-unavailable">GitHub activity is temporarily unavailable.</p>

  return (
    <div className="contribution-panel">
      <div className="contribution-scroll" role="img" aria-label={`GitHub contribution activity from ${days[0].date} to ${days.at(-1)?.date}`}>
        <div className="contribution-grid" aria-hidden="true">
          {days.map(day => <span className="contribution-day" data-level={day.level} title={day.date} key={day.date} />)}
        </div>
      </div>
      <div className="contribution-meta">
        <span>{days[0].date} — {days.at(-1)?.date}</span>
        <span className="contribution-legend"><i data-level="0" /> Less <i data-level="1" /><i data-level="2" /><i data-level="3" /><i data-level="4" /> More</span>
      </div>
    </div>
  )
}

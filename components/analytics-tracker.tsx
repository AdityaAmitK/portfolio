'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Attribution = { source: string; medium: string; campaign: string }

function sourceFromReferrer(referrer: string) {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (host.includes('instagram')) return 'instagram'
    if (host.includes('linkedin')) return 'linkedin'
    if (host === 't.co' || host.includes('twitter') || host === 'x.com') return 'x'
    if (host.includes('google')) return 'google'
    if (host.includes('facebook')) return 'facebook'
    if (host === location.hostname) return 'internal'
    return host
  } catch {
    return 'direct'
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/preview') || navigator.doNotTrack === '1' || navigator.webdriver) return
    const params = new URLSearchParams(location.search)
    let sessionId = sessionStorage.getItem('portfolio-analytics-session')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('portfolio-analytics-session', sessionId)
    }
    let attribution: Attribution
    const stored = sessionStorage.getItem('portfolio-analytics-attribution')
    try {
      attribution = stored ? JSON.parse(stored) as Attribution : { source: '', medium: '', campaign: '' }
    } catch {
      attribution = { source: '', medium: '', campaign: '' }
    }
    if (!attribution.source) {
      attribution = {
        source: params.get('utm_source') || sourceFromReferrer(document.referrer),
        medium: params.get('utm_medium') || '',
        campaign: params.get('utm_campaign') || '',
      }
      sessionStorage.setItem('portfolio-analytics-attribution', JSON.stringify(attribution))
    }
    const base = { sessionId, path: pathname, referrer: document.referrer, ...attribution }
    const send = (event: Record<string, unknown>) => {
      const data = JSON.stringify({ ...base, ...event })
      if (!navigator.sendBeacon('/api/analytics', new Blob([data], { type: 'application/json' }))) {
        void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true })
      }
    }

    send({ type: 'pageview' })
    const engagedTimer = window.setTimeout(() => send({ type: 'engaged' }), 15000)
    const reached = new Set<number>()
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - innerHeight
      const percent = available > 0 ? Math.round((scrollY / available) * 100) : 100
      for (const milestone of [25, 50, 75, 90]) {
        if (percent >= milestone && !reached.has(milestone)) {
          reached.add(milestone)
          send({ type: 'scroll', value: milestone })
        }
      }
    }
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest('a')
      if (!link?.href) return
      try {
        const url = new URL(link.href)
        send({ type: 'click', target: url.hostname === location.hostname ? url.pathname : url.hostname + url.pathname })
      } catch {}
    }
    let activeSince = document.visibilityState === 'visible' ? Date.now() : 0
    const sendDuration = () => {
      if (!activeSince) return
      const seconds = Math.round((Date.now() - activeSince) / 1000)
      activeSince = 0
      if (seconds > 0) send({ type: 'duration', value: seconds })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sendDuration()
      else activeSince = Date.now()
    }
    addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('click', onClick)
    document.addEventListener('visibilitychange', onVisibility)
    addEventListener('pagehide', sendDuration)
    onScroll()
    return () => {
      clearTimeout(engagedTimer)
      sendDuration()
      removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVisibility)
      removeEventListener('pagehide', sendDuration)
    }
  }, [pathname])

  return null
}

import { recordAnalyticsEvent, type AnalyticsEventInput } from '@/lib/db'

const eventTypes = new Set(['pageview', 'engaged', 'scroll', 'duration', 'click'])
const botPattern = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|twitterbot|linkedinbot/i
const requests = new Map<string, { minute: number; count: number }>()

function clean(value: unknown, length: number) {
  return typeof value === 'string' ? value.slice(0, length) : ''
}

function deviceFor(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return 'Tablet'
  if (/mobile|iphone|android/i.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

function allowed(request: Request) {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return false
  const key = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  const minute = Math.floor(Date.now() / 60000)
  const current = requests.get(key)
  if (!current || current.minute !== minute) requests.set(key, { minute, count: 1 })
  else if (++current.count > 120) return false
  if (requests.size > 2000) requests.clear()
  return true
}

export async function POST(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''
  if (!allowed(request) || botPattern.test(userAgent)) return new Response(null, { status: 204 })
  if (Number(request.headers.get('content-length') || 0) > 8192) return Response.json({ error: 'Event is too large' }, { status: 413 })
  try {
    const body = await request.json() as Record<string, unknown>
    const type = clean(body.type, 20)
    const path = clean(body.path, 300)
    const sessionId = clean(body.sessionId, 80)
    if (!eventTypes.has(type) || !path.startsWith('/') || !sessionId) return Response.json({ error: 'Invalid event' }, { status: 400 })
    const event: AnalyticsEventInput = {
      sessionId,
      type: type as AnalyticsEventInput['type'],
      path,
      referrer: clean(body.referrer, 300),
      source: clean(body.source, 80) || 'direct',
      medium: clean(body.medium, 80),
      campaign: clean(body.campaign, 120),
      target: clean(body.target, 300),
      value: Number.isFinite(Number(body.value)) ? Math.max(0, Math.min(86400, Math.round(Number(body.value)))) : undefined,
      country: clean(request.headers.get('cf-ipcountry'), 2),
      device: deviceFor(userAgent),
    }
    recordAnalyticsEvent(event)
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Invalid event' }, { status: 400 })
  }
}

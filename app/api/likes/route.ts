import { getPostLikeCount, hasPostLike, togglePostLike } from '@/lib/db'

function input(url: URL) {
  const postId = Number(url.searchParams.get('postId'))
  const visitorId = (url.searchParams.get('visitorId') || '').slice(0, 80)
  if (!Number.isInteger(postId) || !/^[a-zA-Z0-9-]{16,80}$/.test(visitorId)) return undefined
  return { postId, visitorId }
}

export async function GET(request: Request) {
  const value = input(new URL(request.url))
  if (!value) return Response.json({ error: 'Invalid request.' }, { status: 400 })
  return Response.json({ liked: hasPostLike(value.postId, value.visitorId), count: getPostLikeCount(value.postId) })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if ((origin && origin !== 'https://adityakinjawadekar.com' && !origin.startsWith('http://localhost:')) || request.headers.get('sec-fetch-site') === 'cross-site') return Response.json({ error: 'Invalid request.' }, { status: 403 })
  try {
    const body = await request.json() as { postId?: unknown; visitorId?: unknown }
    const url = new URL(request.url)
    url.searchParams.set('postId', String(body.postId || ''))
    url.searchParams.set('visitorId', typeof body.visitorId === 'string' ? body.visitorId : '')
    const value = input(url)
    if (!value) return Response.json({ error: 'Invalid request.' }, { status: 400 })
    return Response.json(togglePostLike(value.postId, value.visitorId))
  } catch {
    return Response.json({ error: 'Unable to update the like.' }, { status: 400 })
  }
}

import { createHmac } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import profanity from 'leo-profanity'
import { createPublicComment, getPostById } from '@/lib/db'

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function authorKey(request: Request) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'development-only-secret').update(ip).digest('hex')
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if ((origin && origin !== 'https://adityakinjawadekar.com' && !origin.startsWith('http://localhost:')) || request.headers.get('sec-fetch-site') === 'cross-site') return Response.json({ error: 'Invalid request.' }, { status: 403 })
  try {
    const body = await request.json() as Record<string, unknown>
    if (clean(body.website, 200)) return new Response(null, { status: 204 })
    const postId = Number(body.postId)
    const name = clean(body.name, 50)
    const comment = clean(body.body, 1500)
    if (!Number.isInteger(postId) || name.length < 2 || comment.length < 2) return Response.json({ error: 'Add your name and a comment.' }, { status: 400 })
    if (profanity.check(`${name} ${comment}`)) return Response.json({ error: 'Please remove offensive language before commenting.' }, { status: 422 })
    if ((comment.match(/https?:\/\//gi) || []).length > 2) return Response.json({ error: 'Please remove the extra links from your comment.' }, { status: 422 })
    createPublicComment({ postId, name, body: comment, authorKey: authorKey(request), isPrivate: body.isPrivate === true })
    const post = getPostById(postId)
    if (post) revalidatePath(`/writing/${post.slug}`)
    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to post the comment.'
    return Response.json({ error: message }, { status: message === 'Post not found' ? 404 : 429 })
  }
}

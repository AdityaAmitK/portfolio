import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { uploadDirectory } from '@/lib/uploads'

const contentTypes: Record<string, string> = { '.gif': 'image/gif', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params
  if (!/^[a-zA-Z0-9.-]+$/.test(filename)) return new Response('Not found', { status: 404 })
  const contentType = contentTypes[path.extname(filename).toLowerCase()]
  if (!contentType) return new Response('Not found', { status: 404 })
  try {
    const image = await readFile(path.join(uploadDirectory, filename))
    return new Response(new Uint8Array(image), { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

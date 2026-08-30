import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { isAuthenticated } from '@/lib/auth'
import { uploadDirectory } from '@/lib/uploads'

const MAX_SIZE = 8 * 1024 * 1024
const extensions: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (Number(request.headers.get('content-length') || 0) > MAX_SIZE + 1024 * 100) return Response.json({ error: 'Image must be smaller than 8 MB.' }, { status: 413 })

  const file = (await request.formData()).get('file')
  if (!(file instanceof File)) return Response.json({ error: 'Choose an image to upload.' }, { status: 400 })
  const extension = extensions[file.type]
  if (!extension) return Response.json({ error: 'Use a JPEG, PNG, WebP, or GIF image.' }, { status: 415 })
  if (file.size > MAX_SIZE) return Response.json({ error: 'Image must be smaller than 8 MB.' }, { status: 413 })

  const filename = `${Date.now()}-${randomUUID()}.${extension}`
  await writeFile(path.join(uploadDirectory, filename), new Uint8Array(await file.arrayBuffer()))
  return Response.json({ url: `/uploads/${filename}` })
}

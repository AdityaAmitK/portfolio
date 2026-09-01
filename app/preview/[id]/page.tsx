import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Article } from '@/components/article'
import { getPostById } from '@/lib/db'
import { verifyPreviewToken } from '@/lib/preview'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string | string[] }> }

async function previewPost({ params, searchParams }: Props) {
  const id = Number((await params).id)
  const tokenValue = (await searchParams).token
  const token = typeof tokenValue === 'string' ? tokenValue : ''
  if (!Number.isInteger(id) || !verifyPreviewToken(token, id)) return undefined
  return getPostById(id)
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const post = await previewPost(props)
  if (!post) return { robots: { index: false, follow: false } }
  return { title: `Preview: ${post.title}`, description: post.description, referrer: 'no-referrer', robots: { index: false, follow: false, noarchive: true } }
}

export default async function PreviewPage(props: Props) {
  const post = await previewPost(props)
  if (!post) notFound()
  return <Article post={post} />
}

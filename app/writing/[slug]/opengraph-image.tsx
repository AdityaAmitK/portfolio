import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/db'

export const alt = 'Article by Aditya Kinjawadekar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const title = getPostBySlug(slug)?.title || 'Writing by Aditya Kinjawadekar'

  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#181916', color: '#efeee8', padding: '70px 80px', fontFamily: 'Georgia' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26 }}><span>Aditya Kinjawadekar</span><span style={{ color: '#9bc9b7', fontFamily: 'monospace', fontSize: 18 }}>WRITING</span></div><div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', maxWidth: 1020, fontSize: title.length > 60 ? 62 : 76, lineHeight: 1.05 }}>{title}</div><div style={{ marginTop: 34, color: '#aaa79d', fontFamily: 'monospace', fontSize: 18 }}>SOFTWARE ENGINEER</div></div></div>, size)
}

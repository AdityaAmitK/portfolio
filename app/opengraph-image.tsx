import { ImageResponse } from 'next/og'

export const alt = 'Aditya Kinjawadekar — Software Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#181916', color: '#efeee8', padding: '70px 80px', fontFamily: 'Georgia' }}><div style={{ fontSize: 28 }}>Aditya Kinjawadekar</div><div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 74, lineHeight: 1.03, maxWidth: 900 }}>I build useful software for&nbsp;<span style={{ color: '#9bc9b7', fontStyle: 'italic' }}>real problems.</span></div><div style={{ marginTop: 35, fontFamily: 'monospace', fontSize: 18, color: '#aaa79d' }}>SOFTWARE ENGINEER · PUNE, INDIA</div></div></div>, size)
}

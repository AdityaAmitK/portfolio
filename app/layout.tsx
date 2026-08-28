import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://adityakinjawadekar.com'),
  title: { default: 'Aditya Kinjawadekar — Software Engineer', template: '%s — Aditya Kinjawadekar' },
  description: 'Software engineer building thoughtful products, developer tools, and trading systems.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Aditya Kinjawadekar', description: 'Software engineer building thoughtful products, developer tools, and trading systems.', url: '/', siteName: 'Aditya Kinjawadekar', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Aditya Kinjawadekar', description: 'Software engineer building thoughtful products, developer tools, and trading systems.' },
}

const themeScript = `(()=>{try{const m=localStorage.getItem('theme')||'system',t=m==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m,p=localStorage.getItem('palette')||'moss',r=document.documentElement;r.dataset.theme=t;r.dataset.themeMode=m;r.dataset.palette=p;if(p==='custom'){const c=JSON.parse(localStorage.getItem('custom-palette-'+t)||'{}');['paper','paper-deep','ink','muted','line','signal','signal-soft'].forEach(k=>{if(/^#[0-9a-f]{6}$/i.test(c[k]||''))r.style.setProperty('--'+k,c[k])})}}catch{}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aditya Kinjawadekar',
    url: 'https://adityakinjawadekar.com',
    jobTitle: 'Software Engineer',
    worksFor: { '@type': 'Organization', name: 'Fischer Jordan', url: 'https://fischerjordan.com' },
    sameAs: ['https://github.com/AdityaAmitK', 'https://www.linkedin.com/in/adityaamit'],
    knowsAbout: ['Software engineering', 'TypeScript', 'Python', 'Developer tools', 'Systematic trading'],
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c') }} />
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}

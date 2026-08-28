import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://adityakinjawadekar.com'),
  title: { default: 'Aditya Kinjawadekar | Software Engineer', template: '%s | Aditya Kinjawadekar' },
  description: 'Aditya Kinjawadekar is a software engineer building products, developer tools, backend systems, and open-source software.',
  authors: [{ name: 'Aditya Kinjawadekar', url: '/' }],
  creator: 'Aditya Kinjawadekar',
  alternates: { canonical: '/' },
  openGraph: { title: 'Aditya Kinjawadekar | Software Engineer', description: 'Software engineer building products, developer tools, backend systems, and open-source software.', url: '/', siteName: 'Aditya Kinjawadekar', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Aditya Kinjawadekar | Software Engineer', description: 'Software engineer building products, developer tools, backend systems, and open-source software.' },
}

const themeScript = `(()=>{try{const m=localStorage.getItem('theme')||'system',t=m==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m,p=localStorage.getItem('palette')||'moss',r=document.documentElement;r.dataset.theme=t;r.dataset.themeMode=m;r.dataset.palette=p;r.dataset.titleFont=localStorage.getItem('font-title')||'newsreader';r.dataset.bodyFont=localStorage.getItem('font-body')||'manrope';r.dataset.codeFont=localStorage.getItem('font-code')||'dm-mono';if(p==='custom'){const c=JSON.parse(localStorage.getItem('custom-palette-'+t)||'{}');['paper','paper-deep','ink','muted','line','signal','signal-soft'].forEach(k=>{if(/^#[0-9a-f]{6}$/i.test(c[k]||''))r.style.setProperty('--'+k,c[k])})}}catch{}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aditya Kinjawadekar',
    alternateName: 'Aditya Amit Kinjawadekar',
    url: 'https://adityakinjawadekar.com',
    image: 'https://adityakinjawadekar.com/images/profile/aditya-kinjawadekar.png',
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

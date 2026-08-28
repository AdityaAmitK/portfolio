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

const themeScript = `(()=>{try{const t=localStorage.getItem('theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch{}})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Aditya Kinjawadekar',
    url: 'https://adityakinjawadekar.com',
    jobTitle: 'Software Engineer',
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

'use client'

import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <span>© {new Date().getFullYear()} Aditya Kinjawadekar</span>
        <span className="credits">Overall design inspired by <a href="https://www.conordewey.com/" target="_blank" rel="noreferrer">Conor Dewey</a>; project presentation inspired by <a href="https://www.psrth.sh/projects" target="_blank" rel="noreferrer">Parth Sharma</a>.</span>
      </div>
    </footer>
  )
}

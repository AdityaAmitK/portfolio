'use client'

import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <span>© {new Date().getFullYear()} Aditya Kinjawadekar</span>
      </div>
    </footer>
  )
}

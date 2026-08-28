'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="wordmark">Aditya Kinjawadekar</Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/projects">Projects</Link>
          <Link href="/writing">Writing</Link>
          <Link href="/tools" className="nav-hide-mobile">Tools</Link>
          <Link href="/about">About</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

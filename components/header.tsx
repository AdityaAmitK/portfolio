'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  const current = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)) ? 'page' : undefined
  const links = [
    ['/projects', 'Work'],
    ['/writing', 'Writing'],
    ['/tools', 'Tools'],
    ['/about', 'About'],
  ] as const
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="wordmark">Aditya Kinjawadekar</Link>
        <nav className="nav nav--desktop" aria-label="Main navigation">
          {links.map(([href, label]) => <Link href={href} aria-current={current(href)} key={href}>{label}</Link>)}
          <ThemeToggle />
        </nav>
        <details className="mobile-nav" key={pathname}>
          <summary aria-label="Open navigation"><Menu size={20} /><span>Menu</span></summary>
          <nav aria-label="Main navigation">
            {links.map(([href, label]) => <Link href={href} aria-label={label} aria-current={current(href)} key={href}>{label}</Link>)}
            <ThemeToggle />
          </nav>
        </details>
      </div>
    </header>
  )
}

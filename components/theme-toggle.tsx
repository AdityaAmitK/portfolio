'use client'

import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme !== 'dark'
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return <button className="theme-button" onClick={toggle} aria-label="Toggle color theme"><span className="theme-icon theme-icon--moon"><Moon size={16} /></span><span className="theme-icon theme-icon--sun"><Sun size={16} /></span></button>
}

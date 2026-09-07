'use client'

import { MoonStar } from 'lucide-react'
import { useEffect } from 'react'

const modes = ['light', 'dark', 'system'] as const

export function ThemeToggle() {
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
    }
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  function setMode(mode: typeof modes[number]) {
    const theme = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-theme-mode', mode)
    localStorage.setItem('theme', mode)
  }

  return (
    <details className="theme-picker">
      <summary className="theme-button" aria-label="Choose appearance"><MoonStar size={18} /><span className="theme-button__label">Appearance</span></summary>
      <div className="theme-menu">
        <span className="theme-menu__label">Appearance</span>
        <div className="theme-modes">{modes.map(mode => <button type="button" data-mode={mode} onClick={() => setMode(mode)} key={mode}>{mode}</button>)}</div>
      </div>
    </details>
  )
}

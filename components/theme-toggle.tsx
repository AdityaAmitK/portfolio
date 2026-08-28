'use client'

import { Palette } from 'lucide-react'
import { useEffect } from 'react'

const modes = ['light', 'dark', 'system'] as const
const palettes = ['moss', 'ocean', 'clay', 'plum'] as const

export function ThemeToggle() {
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      if ((localStorage.getItem('theme') || 'system') === 'system') document.documentElement.setAttribute('data-theme', media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  function setMode(mode: typeof modes[number]) {
    const theme = mode === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-theme-mode', mode)
    localStorage.setItem('theme', mode)
  }

  function setPalette(palette: typeof palettes[number]) {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem('palette', palette)
  }

  return (
    <details className="theme-picker">
      <summary className="theme-button" aria-label="Customize theme"><Palette size={17} /></summary>
      <div className="theme-menu">
        <span className="theme-menu__label">Mode</span>
        <div className="theme-modes">{modes.map(mode => <button type="button" data-mode={mode} onClick={() => setMode(mode)} key={mode}>{mode}</button>)}</div>
        <span className="theme-menu__label">Palette</span>
        <div className="palette-options">{palettes.map(palette => <button type="button" className={`palette-option palette-option--${palette}`} data-palette={palette} onClick={() => setPalette(palette)} aria-label={`${palette} palette`} title={palette} key={palette} />)}</div>
      </div>
    </details>
  )
}

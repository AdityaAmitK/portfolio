'use client'

import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'

const modes = ['light', 'dark', 'system'] as const
const palettes = ['moss', 'ocean', 'clay', 'plum', 'custom'] as const
const fonts = {
  title: [['newsreader', 'Newsreader'], ['fraunces', 'Fraunces'], ['manrope', 'Manrope']],
  body: [['manrope', 'Manrope'], ['inter', 'Inter'], ['source-serif', 'Source Serif 4']],
  code: [['dm-mono', 'DM Mono'], ['jetbrains-mono', 'JetBrains Mono'], ['system-mono', 'System Mono']],
} as const
type FontRole = keyof typeof fonts
type FontChoices = Record<FontRole, string>
const defaultFonts: FontChoices = { title: 'newsreader', body: 'manrope', code: 'dm-mono' }
const tokens = [
  ['paper', 'Background'], ['paper-deep', 'Surface'], ['ink', 'Text'], ['muted', 'Muted text'],
  ['line', 'Borders'], ['signal', 'Accent'], ['signal-soft', 'Accent soft'],
] as const
type Colors = Record<typeof tokens[number][0], string>

const defaults: Record<'light' | 'dark', Colors> = {
  light: { paper: '#f4f1e9', 'paper-deep': '#ebe6da', ink: '#20201d', muted: '#6e6a61', line: '#d7d1c3', signal: '#315f55', 'signal-soft': '#dce7e1' },
  dark: { paper: '#181916', 'paper-deep': '#20211d', ink: '#efeee8', muted: '#aaa79d', line: '#35372f', signal: '#9bc9b7', 'signal-soft': '#283a33' },
}

function savedColors(theme: 'light' | 'dark') {
  try { return { ...defaults[theme], ...JSON.parse(localStorage.getItem(`custom-palette-${theme}`) || '{}') } as Colors }
  catch { return defaults[theme] }
}

function applyColors(colors: Colors) {
  document.documentElement.setAttribute('style', tokens.map(([token]) => `--${token}:${colors[token]}`).join(';'))
}

export function ThemeToggle() {
  const [colors, setColors] = useState<Colors>(defaults.light)
  const [fontChoices, setFontChoices] = useState<FontChoices>(defaultFonts)

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      if ((localStorage.getItem('theme') || 'system') !== 'system') return
      const theme = media.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
      if (localStorage.getItem('palette') === 'custom') {
        const next = savedColors(theme)
        setColors(next)
        applyColors(next)
      }
    }
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    queueMicrotask(() => {
      setColors(savedColors(theme))
      setFontChoices({
        title: document.documentElement.dataset.titleFont || defaultFonts.title,
        body: document.documentElement.dataset.bodyFont || defaultFonts.body,
        code: document.documentElement.dataset.codeFont || defaultFonts.code,
      })
    })
    media.addEventListener('change', syncSystemTheme)
    return () => media.removeEventListener('change', syncSystemTheme)
  }, [])

  function setMode(mode: typeof modes[number]) {
    const theme = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-theme-mode', mode)
    localStorage.setItem('theme', mode)
    if (localStorage.getItem('palette') === 'custom') {
      const next = savedColors(theme)
      setColors(next)
      applyColors(next)
    }
  }

  function setPalette(palette: typeof palettes[number]) {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem('palette', palette)
    if (palette === 'custom') {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
      const next = savedColors(theme)
      setColors(next)
      applyColors(next)
    } else document.documentElement.removeAttribute('style')
  }

  function setColor(token: keyof Colors, value: string) {
    const next = { ...colors, [token]: value }
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    setColors(next)
    applyColors(next)
    localStorage.setItem(`custom-palette-${theme}`, JSON.stringify(next))
  }

  function setFont(role: FontRole, font: string) {
    setFontChoices(current => ({ ...current, [role]: font }))
    document.documentElement.setAttribute(`data-${role}-font`, font)
    localStorage.setItem(`font-${role}`, font)
  }

  return (
    <details className="theme-picker">
      <summary className="theme-button" aria-label="Customize theme"><Palette size={17} /></summary>
      <div className="theme-menu">
        <span className="theme-menu__label">Mode</span>
        <div className="theme-modes">{modes.map(mode => <button type="button" data-mode={mode} onClick={() => setMode(mode)} key={mode}>{mode}</button>)}</div>
        <span className="theme-menu__label">Palette</span>
        <div className="palette-options">{palettes.map(palette => <button type="button" className={`palette-option palette-option--${palette}`} data-palette={palette} onClick={() => setPalette(palette)} aria-label={`${palette} palette`} title={palette} key={palette} />)}</div>
        <div className="custom-colors">{tokens.map(([token, label]) => <label key={token}><span>{label}</span><input type="color" value={colors[token]} onChange={event => setColor(token, event.target.value)} /></label>)}</div>
        <span className="theme-menu__label theme-menu__label--fonts">Typography</span>
        <div className="font-options">{Object.entries(fonts).map(([role, options]) => <label key={role}><span>{role === 'body' ? 'Content' : role}</span><select value={fontChoices[role as FontRole]} onChange={event => setFont(role as FontRole, event.target.value)}>{options.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>)}</div>
      </div>
    </details>
  )
}

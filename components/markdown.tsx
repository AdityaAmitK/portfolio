'use client'

import { Check, Copy } from 'lucide-react'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)

const languageAliases: Record<string, string> = {
  fish: 'bash',
  js: 'javascript',
  jsx: 'javascript',
  jsonc: 'json',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
  zsh: 'bash',
}

function textFromChildren(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(textFromChildren).join('')
  if (isValidElement<{ children?: ReactNode }>(children)) return textFromChildren(children.props.children)
  return ''
}

function languageFromClassName(className?: string) {
  return /language-([\w-]+)/.exec(className || '')?.[1]?.toLowerCase()
}

function formatJsonIfPossible(code: string) {
  try {
    return JSON.stringify(JSON.parse(code), null, 2)
  } catch {
    return code
  }
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const displayCode = useMemo(() => language === 'json' || language === 'jsonc' ? formatJsonIfPossible(code) : code, [code, language])
  const highlightedCode = useMemo(() => {
    const highlightLanguage = language ? languageAliases[language] || language : undefined
    if (!highlightLanguage || !hljs.getLanguage(highlightLanguage)) return null
    return hljs.highlight(displayCode, { language: highlightLanguage }).value
  }, [displayCode, language])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return <div className="markdown-code">
    <div className="markdown-code__bar"><span>{language || 'code'}</span><button type="button" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</button></div>
    <pre tabIndex={0}><code className={highlightedCode ? 'hljs' : undefined} {...(highlightedCode ? { dangerouslySetInnerHTML: { __html: highlightedCode } } : { children: displayCode })} /></pre>
  </div>
}

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ children, className }) => {
    const code = textFromChildren(children).replace(/\n$/, '')
    const language = languageFromClassName(className)
    if (language || code.includes('\n')) return <CodeBlock code={code} language={language} />
    return <code>{children}</code>
  },
}

export function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
}

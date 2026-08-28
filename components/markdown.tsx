'use client'

import { Check, Copy } from 'lucide-react'
import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

function JsonCode({ code }: { code: string }) {
  const parts = code.split(/("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g)
  return <>{parts.map((part, index) => {
    if (!part) return null
    const kind = part.startsWith('"') ? (/"\s*$/.test(part) ? 'key' : 'string') : /^(true|false|null)$/.test(part) ? 'literal' : /^-?\d/.test(part) ? 'number' : undefined
    return <span className={kind ? `code-token code-token--${kind}` : undefined} key={index}>{part}</span>
  })}</>
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const displayCode = useMemo(() => language === 'json' || language === 'jsonc' ? formatJsonIfPossible(code) : code, [code, language])

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
    <pre tabIndex={0}><code>{language === 'json' || language === 'jsonc' ? <JsonCode code={displayCode} /> : displayCode}</code></pre>
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

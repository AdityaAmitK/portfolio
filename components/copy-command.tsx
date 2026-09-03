'use client'

import { useState } from 'react'

export function CopyCommand({ command }: { command: string }) {
  const [label, setLabel] = useState('Copy')

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setLabel('Copied')
      window.setTimeout(() => setLabel('Copy'), 1500)
    } catch {
      setLabel('Select command')
    }
  }

  return <div className="project-entry__command"><code>{command}</code><button type="button" onClick={copy}>{label}</button></div>
}

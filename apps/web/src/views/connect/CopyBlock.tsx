import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { changesText } from '../../i18n/messages/changes'
import { useText } from '../../i18n/text'

export interface CopyBlockProps {
  // What the text is, for the copy button's label and the toast, e.g. "MCP URL".
  name: string
  // Where the text goes, e.g. a file path or "Terminal".
  caption: string
  text: string
  onCopy: (name: string, copied: boolean) => void
}

// Text to paste somewhere else, with a copy button. The text stays selectable for browsers that block the clipboard.
export function CopyBlock({ name, caption, text, onCopy }: CopyBlockProps) {
  const t = useText(changesText)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      // The Clipboard API is missing on plain-HTTP origins other than localhost, which throws here too.
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopy(name, true)
    } catch {
      onCopy(name, false)
    }
  }

  const Icon = copied ? Check : Copy

  return (
    <div className="min-w-0 rounded-md border border-border-subtle bg-bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 pl-4 pr-1.5">
        <span className="min-w-0 truncate font-mono text-mono-s text-text-muted">{caption}</span>
        <Button
          variant="secondary"
          iconStart={<Icon className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />}
          onClick={copy}
        >
          {copied ? t.copied : t.copy}
          <span className="sr-only"> {name}</span>
        </Button>
      </div>
      <pre className="whitespace-pre-wrap p-4 font-mono text-mono-m text-text-primary wrap-anywhere">
        <code>{text}</code>
      </pre>
    </div>
  )
}

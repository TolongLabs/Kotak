import { useState } from 'react'
import { Banner } from '../ui/Banner'

// Closing the notice hides it on every page for that job on this device. Another AI-drafted job shows it again, and
// Reset All in Settings clears the choice with every other kotak: key.
const STORAGE_KEY = 'kotak:ai-drafted-dismissed'

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((code): code is string => typeof code === 'string') : []
  } catch {
    return []
  }
}

export function AiDraftedBanner({ roleCode }: { roleCode: string }) {
  const [dismissed, setDismissed] = useState(() => readDismissed().includes(roleCode))
  if (dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...readDismissed(), roleCode])]))
    } catch {
      // Blocked storage: the notice stays closed on this page only.
    }
    setDismissed(true)
    // The close button goes with the notice, so focus moves to the page rather than falling to the document body.
    document.getElementById('main')?.focus()
  }

  return (
    <Banner
      type="info"
      title="AI-Drafted Skills"
      body="Kopi drafted these skills from the job’s O*NET tasks. The team has not checked them by hand yet."
      onDismiss={dismiss}
    />
  )
}

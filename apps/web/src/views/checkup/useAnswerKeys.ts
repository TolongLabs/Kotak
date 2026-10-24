import type { Rating } from '@kotak/shared'
import { useEffect } from 'react'

const RATING_KEYS = ['1', '2', '3', '4']

/**
 * Keys 1 to 4 answer the question from anywhere on the page (#240), but not while the user types or a sheet is open.
 */
export function useAnswerKeys(onAnswer: (rating: Rating) => void, paused: boolean) {
  useEffect(() => {
    if (paused) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      if (!RATING_KEYS.includes(event.key)) return

      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
          target.closest('[role="dialog"]'))
      ) {
        return
      }

      event.preventDefault()
      onAnswer(Number(event.key) as Rating)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onAnswer, paused])
}

// Renders nothing; mounts the key listener while the question is on screen (hooks can't follow QuestionsView's early returns).
export function AnswerKeys({ onAnswer, paused = false }: { onAnswer: (rating: Rating) => void; paused?: boolean }) {
  useAnswerKeys(onAnswer, paused)
  return null
}

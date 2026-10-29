import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { updateGuestSession, useGuestSession } from '../../session/store'
import { renderCited } from '../kotak/renderCited'
import { IconButton } from '../ui/IconButton'
import { VoiceToggle } from '../ui/VoiceToggle'
import { cn } from '../ui/cn'
import { setManualReducedMotion, useReducedMotion } from './motion'
import { canAutoplay, speakKopiLine, stopKopiVoice } from './voice'

const WORD_MS = 45

export interface KopiSpeechBoxProps {
  // Kopi's line. Write [n] where a source number goes; it becomes a citation link.
  speech: string
  // Every line this box will show in turn (the questions page's 12). The box keeps the size of the tallest, so it
  // doesn't grow and shrink as `speech` changes among them.
  reserve?: string[]
  className?: string
}

// Kopi's game-style speech box (DESIGN.md): types the line out, reads it aloud unless muted, and links citations.
export function KopiSpeechBox({ speech, reserve, className }: KopiSpeechBoxProps) {
  const { tts_muted: muted } = useGuestSession()
  const motion = useReducedMotion()
  const [owner] = useState(() => ({}))
  const [typed, setTyped] = useState({ speech: '', words: 0 })
  const words = useMemo(() => speech.split(/(\s+)/), [speech])

  // Types the line word by word. The full text stays in the live region, so screen readers hear it once.
  useEffect(() => {
    if (motion.reduced) return
    let count = 0
    const timer = window.setInterval(() => {
      count += 1
      setTyped({ speech, words: count })
      if (count >= words.length) window.clearInterval(timer)
    }, WORD_MS)
    return () => window.clearInterval(timer)
  }, [speech, words, motion.reduced])

  // Reads each new line aloud, and cancels it at once when the line changes or the screen goes.
  // Not keyed on `muted`: toggleVoice stops or reads the line itself.
  useEffect(() => {
    if (!muted && canAutoplay()) void speakKopiLine(owner, speech, false)
    return () => stopKopiVoice(owner)
  }, [owner, speech])

  useEffect(() => {
    if (muted) stopKopiVoice()
  }, [muted])

  const toggleVoice = () => {
    if (!muted) stopKopiVoice()
    else void speakKopiLine(owner, speech, true)
    updateGuestSession({ tts_muted: !muted })
  }

  const shownWords = motion.reduced ? words.length : typed.speech === speech ? typed.words : 0

  return (
    <div
      className={cn('min-w-0 flex-1 space-y-2 rounded-md border-2 border-text-primary bg-bg-default p-4', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-mono-s text-text-muted">Kopi</span>
        <div className="flex items-center gap-2">
          {!motion.system && (
            <IconButton
              label={motion.manual ? 'Let Kopi Move' : 'Stop Kopi Moving'}
              icon={motion.manual ? Play : Pause}
              onClick={() => setManualReducedMotion(!motion.manual)}
              className="rounded-full"
            />
          )}
          <VoiceToggle muted={muted} onToggle={toggleVoice} />
        </div>
      </div>
      {/* The reserved lines sit hidden in the same grid cell as the shown line, so the cell takes the tallest one's height
          at any width. They're invisible, so screen readers read only the shown line. */}
      <div className="grid">
        {reserve?.map((line, index) => (
          <p key={index} aria-hidden="true" className="invisible col-start-1 row-start-1 font-speech text-speech">
            {renderCited(line)}
          </p>
        ))}
        <p
          aria-live="polite"
          aria-atomic="true"
          className="col-start-1 row-start-1 font-speech text-speech text-text-primary"
        >
          {words.map((word, index) => (
            <span key={index} className={cn(index >= shownWords && 'opacity-0')}>
              {renderCited(word)}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

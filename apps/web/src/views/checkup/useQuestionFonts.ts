import { useEffect, useState } from 'react'

// The faces that wrap text above the answers: Kopi's line, the title and hint, and the counter and topic row. The
// fallback faces have other metrics, so a swap rewraps those lines and moves the answers (#394).
const FACES = [
  '500 1em "Shantell Sans"',
  '400 1em "Atkinson Hyperlegible Next"',
  '600 1em "Atkinson Hyperlegible Next"',
  '400 1em "Atkinson Hyperlegible Mono"'
]
// The block period CSS Fonts 4 recommends: on a stalled network the questions show in the fallback faces after this.
const WAIT_MS = 3000

let settled: Promise<void> | undefined
let done = false

/**
 * True once the question faces have loaded or failed (offline, blocked), or WAIT_MS after the questions page first
 * opened, so the questions first show in the faces they keep. Faces already loaded make it true at once.
 */
export function useQuestionFonts() {
  const [ready, setReady] = useState(() => done || FACES.every((face) => document.fonts.check(face)))

  useEffect(() => {
    if (ready) return
    settled ??= Promise.race([
      Promise.allSettled(FACES.map((face) => document.fonts.load(face))),
      new Promise((resolve) => window.setTimeout(resolve, WAIT_MS))
    ]).then(() => {
      done = true
    })
    void settled.then(() => setReady(true))
  }, [ready])

  return ready
}

import { TtsResponseSchema, type TtsRequest } from '@kotak/shared'

// One voice channel for the whole app, so two speech boxes never talk over each other.
interface Playback {
  owner: object
  controller: AbortController
  audio?: HTMLAudioElement
}

let current: Playback | null = null

export function stopKopiVoice(owner?: object) {
  if (!current || (owner && current.owner !== owner)) return
  current.controller.abort()
  current.audio?.pause()
  current = null
}

// Browsers block audio before the first tap or key press, so skip the request until then.
export function canAutoplay() {
  return navigator.userActivation?.hasBeenActive ?? true
}

// Reads one line out loud through POST /api/tts. Any failure (no key, network, autoplay block) leaves Kopi text-only.
// A line that does not interrupt waits its turn: it stays silent while another speech box is talking.
export async function speakKopiLine(owner: object, line: string, interrupt: boolean) {
  if (current && current.owner !== owner && !interrupt) return
  stopKopiVoice()

  const request: TtsRequest = {
    text: line
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (!request.text) return

  const playback: Playback = { owner, controller: new AbortController() }
  current = playback
  const release = () => {
    if (current === playback) current = null
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: playback.controller.signal
    })
    if (!response.ok) return release()

    const voice = TtsResponseSchema.parse(await response.json())
    if (current !== playback) return

    playback.audio = new Audio(`data:${voice.content_type};base64,${voice.audio_base64}`)
    playback.audio.addEventListener('ended', release)
    await playback.audio.play()
  } catch {
    release()
  }
}

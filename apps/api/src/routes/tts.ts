import { TtsRequestSchema, TtsResponseSchema } from '@kotak/shared'
import { Hono, type Context } from 'hono'
import { fail } from '../ai/errors'
import { cacheGet, cachePut, sha256Hex } from '../cache'
import { getConfig } from '../config'

// TRD.md (#46, #144): fixed lines are pre-generated with eleven_v4, live lines use eleven_v4_turbo over the Text to
// Dialogue WebSocket, and the fallback streams eleven_v4 over HTTP. The cache key names eleven_v4, so a cached line
// and its pre-generated file share one key whichever model spoke it.
export const TTS_MODEL_ID = 'eleven_v4'
export const LIVE_TTS_MODEL_ID = 'eleven_v4_turbo'
// Kopi's voice: Johari (warm, clear, young Malaysian male). ELEVENLABS_VOICE_ID overrides it.
export const KOPI_VOICE_ID = 'lvNyQwaZPcGFiNUWWiVa'
// Pre-generated fixed lines live in the static build at /tts/<key>.mp3 (scripts/tts-pregenerate.ts).
export const TTS_STATIC_DIRECTORY = 'tts'
const OUTPUT_FORMAT = 'mp3_44100_128'
const UPSTREAM_TIMEOUT_MS = 15_000
// A failed socket answers with an error message at once. This idle limit, restarted by every message, only stops a
// hung socket before the HTTP fallback; a long line that keeps streaming is never cut off.
const LIVE_IDLE_TIMEOUT_MS = 6_000

type AssetsBinding = { fetch: (input: string) => Promise<Response> }

export const ttsCacheKey = (text: string, voiceId: string) => sha256Hex(JSON.stringify([text, voiceId, TTS_MODEL_ID]))

type SpeechInput = { text: string; voiceId: string; apiKey: string }

// eleven_v4 over HTTP, read to the end: Stream speech (https://elevenlabs.io/docs/api-reference/text-to-speech/stream).
export const synthesizeSpeech = async (input: SpeechInput) => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}/stream?output_format=${OUTPUT_FORMAT}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': input.apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text: input.text, model_id: TTS_MODEL_ID }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`ElevenLabs returned HTTP ${response.status}`)
  const audio = new Uint8Array(await response.arrayBuffer())
  if (audio.length === 0) throw new Error('ElevenLabs returned no audio')
  return audio
}

// eleven_v4_turbo over the Text to Dialogue WebSocket, which takes one registered voice for this model
// (https://elevenlabs.io/docs/api-reference/text-to-dialogue/ttd-websocket). The key goes in the first message, so
// the same WebSocket client runs on Workers and Bun. Audio arrives as base64 chunks until is_final.
export const synthesizeLiveSpeech = (input: SpeechInput) =>
  new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const url = `wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input?model_id=${LIVE_TTS_MODEL_ID}&output_format=${OUTPUT_FORMAT}`
    const socket = new WebSocket(url)
    const chunks: Uint8Array[] = []
    let done = false
    const finish = (error?: Error) => {
      if (done) return
      done = true
      clearTimeout(timer)
      socket.close()
      const audio = fromChunks(chunks)
      if (error) reject(error)
      else if (audio.length === 0) reject(new Error('ElevenLabs returned no audio'))
      else resolve(audio)
    }
    const idle = () => setTimeout(() => finish(new Error('ElevenLabs WebSocket went quiet')), LIVE_IDLE_TIMEOUT_MS)
    let timer = idle()
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ voices: [input.voiceId], xi_api_key: input.apiKey }))
      socket.send(JSON.stringify({ inputs: [{ text: input.text, voice_id: input.voiceId }] }))
      socket.send(JSON.stringify({ close_socket: true }))
    })
    socket.addEventListener('message', (event) => {
      clearTimeout(timer)
      timer = idle()
      const message = JSON.parse(String(event.data)) as { audio?: string; is_final?: boolean; error?: string }
      if (message.error) return finish(new Error(`ElevenLabs WebSocket error: ${message.error}`))
      if (message.audio) chunks.push(fromBase64(message.audio))
      if (message.is_final) finish()
    })
    socket.addEventListener('error', () => finish(new Error('ElevenLabs WebSocket failed')))
    socket.addEventListener('close', () => finish(new Error('ElevenLabs WebSocket closed before its final message')))
  })

// A plain loop: Uint8Array.from with a map function costs far more CPU, and Workers count every millisecond.
const fromBase64 = (base64: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

const fromChunks = (chunks: Uint8Array[]) => {
  const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return bytes
}

// On Workers, the ASSETS binding serves files from the static build. Unknown paths fall back to
// index.html, so only an audio response counts.
const pregeneratedAudio = async (context: Context, key: string) => {
  const assets = (context.env as { ASSETS?: AssetsBinding } | undefined)?.ASSETS
  if (!assets) return undefined
  const response = await assets.fetch(`https://assets.local/${TTS_STATIC_DIRECTORY}/${key}.mp3`).catch(() => undefined)
  if (!response?.ok || !response.headers.get('content-type')?.startsWith('audio/')) return undefined
  return new Uint8Array(await response.arrayBuffer())
}

const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

export const tts = new Hono()

tts.post('/', async (context) => {
  const request = TtsRequestSchema.safeParse(await context.req.json().catch(() => undefined))
  if (!request.success) return fail(context, 400, 'invalid_request', 'Send { "text" } with 1 to 600 characters.')

  const notConfigured = () => fail(context, 503, 'tts_unavailable', 'Text to speech is not set up on this server.')
  const voiceId = getConfig(context, 'ELEVENLABS_VOICE_ID') ?? KOPI_VOICE_ID

  const text = request.data.text
  const key = await ttsCacheKey(text, voiceId)
  // Which voice path answered: the cache, a pre-generated file or the model that spoke the line.
  let source = 'cache'
  let audio = await cacheGet(`tts:${key}`)
  if (!audio) {
    source = 'pregenerated'
    audio = await pregeneratedAudio(context, key)
    if (!audio) {
      const apiKey = getConfig(context, 'ELEVENLABS_API_KEY')
      if (!apiKey) return notConfigured()
      try {
        audio = await synthesizeLiveSpeech({ text, voiceId, apiKey })
        source = LIVE_TTS_MODEL_ID
      } catch (liveError) {
        console.warn(
          'TTS live socket failed, streaming over HTTP:',
          liveError instanceof Error ? liveError.message : liveError
        )
        try {
          audio = await synthesizeSpeech({ text, voiceId, apiKey })
          source = TTS_MODEL_ID
        } catch (error) {
          console.error('TTS upstream failed:', error instanceof Error ? error.message : error)
          return fail(context, 503, 'tts_unavailable', 'Kopi’s voice is unavailable right now.')
        }
      }
    }
    await cachePut(`tts:${key}`, audio)
  }

  context.header('x-kopi-voice-source', source)
  return context.json(TtsResponseSchema.parse({ audio_base64: toBase64(audio), content_type: 'audio/mpeg' }))
})

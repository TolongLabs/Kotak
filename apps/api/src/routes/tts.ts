import { TtsRequestSchema, TtsResponseSchema } from '@kotak/shared'
import { Hono, type Context } from 'hono'
import { fail } from '../ai/errors'
import { cacheGet, cachePut, sha256Hex } from '../cache'
import { getConfig } from '../config'

// eleven_v4 serves both fixed and live lines over HTTP; eleven_v4_turbo exists only on the dialogue WebSocket.
export const TTS_MODEL_ID = 'eleven_v4'
// Kopi's voice: Johari (warm, clear, young Malaysian male). ELEVENLABS_VOICE_ID overrides it.
export const KOPI_VOICE_ID = 'lvNyQwaZPcGFiNUWWiVa'
// Pre-generated fixed lines live in the static build at /tts/<key>.mp3 (scripts/tts-pregenerate.ts).
export const TTS_STATIC_DIRECTORY = 'tts'
const OUTPUT_FORMAT = 'mp3_44100_128'
const UPSTREAM_TIMEOUT_MS = 15_000

type AssetsBinding = { fetch: (input: string) => Promise<Response> }

export const ttsCacheKey = (text: string, voiceId: string) => sha256Hex(JSON.stringify([text, voiceId, TTS_MODEL_ID]))

export const synthesizeSpeech = async (input: { text: string; voiceId: string; apiKey: string }) => {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}?output_format=${OUTPUT_FORMAT}`
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
  let audio = await cacheGet(`tts:${key}`)
  if (!audio) {
    audio = await pregeneratedAudio(context, key)
    if (!audio) {
      const apiKey = getConfig(context, 'ELEVENLABS_API_KEY')
      if (!apiKey) return notConfigured()
      try {
        audio = await synthesizeSpeech({ text, voiceId, apiKey })
      } catch (error) {
        console.error('TTS upstream failed:', error instanceof Error ? error.message : error)
        return fail(context, 503, 'tts_unavailable', 'Kopi’s voice is unavailable right now.')
      }
    }
    await cachePut(`tts:${key}`, audio)
  }

  return context.json(TtsResponseSchema.parse({ audio_base64: toBase64(audio), content_type: 'audio/mpeg' }))
})

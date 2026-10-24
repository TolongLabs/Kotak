// OpenAI Whisper (whisper-1) word timings. The key is OPENAI_API_KEY from the environment, or read from
// ENV_FILE (default: the repo-root .env). It is never printed.
// API: https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export type Heard = { text: string; words: { word: string; start: number; end: number }[] }

function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY
  const file = process.env.ENV_FILE ?? resolve(import.meta.dirname, '../../.env')
  const line = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => /^\s*(export\s+)?OPENAI_API_KEY\s*=/.test(l))
  const key = line
    ?.split('=')
    .slice(1)
    .join('=')
    .trim()
    .replace(/^['"]|['"]$/g, '')
  if (!key) throw new Error(`OPENAI_API_KEY is not set and not in ${file}`)
  return key
}

/** Transcribes a WAV with word timestamps. `prompt` guides spelling (the script's own words). */
export async function transcribe(file: string, prompt?: string): Promise<Heard> {
  const form = new FormData()
  form.append('file', new Blob([readFileSync(file)], { type: 'audio/wav' }), 'take.wav')
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')
  form.append('language', 'en')
  if (prompt) form.append('prompt', prompt)
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form
  })
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`)
  return (await res.json()) as Heard
}

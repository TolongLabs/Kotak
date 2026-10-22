// Pre-generates Kopi's fixed lines as static MP3 files in apps/web/public/tts/. On Workers the TTS route
// serves these from the static build, so fixed lines never wait on ElevenLabs. Existing files are kept.
// ElevenLabs bills about 1 credit per character on eleven_v4.
// Run with ELEVENLABS_API_KEY set: bun run tts:pregenerate [lines.json]. ELEVENLABS_VOICE_ID overrides Kopi's voice,
// as it does in the route.
// lines.json, if given, is a JSON array of strings that replaces the built-in list.
import { mkdir } from 'node:fs/promises'
import { KOPI_VOICE_ID, TTS_STATIC_DIRECTORY, synthesizeSpeech, ttsCacheKey } from '../apps/api/src/routes/tts'
import { TtsRequestSchema } from '../packages/shared/src/api'
import { KOPI_FIXED_LINES } from './kopi-lines'

const apiKey = Bun.env.ELEVENLABS_API_KEY?.trim()
const voiceId = Bun.env.ELEVENLABS_VOICE_ID?.trim() || KOPI_VOICE_ID
if (!apiKey) {
  console.error('Set ELEVENLABS_API_KEY first.')
  process.exit(1)
}

const linesFile = Bun.argv[2]
const lines: unknown[] = linesFile ? await Bun.file(linesFile).json() : KOPI_FIXED_LINES
const texts = lines.map((text) => TtsRequestSchema.parse({ text }).text)
const outputDirectory = new URL(`../apps/web/public/${TTS_STATIC_DIRECTORY}/`, import.meta.url)
await mkdir(outputDirectory, { recursive: true })

let characters = 0
let failed = 0
for (const text of texts) {
  const name = `${await ttsCacheKey(text, voiceId)}.mp3`
  const file = Bun.file(new URL(name, outputDirectory))
  if (await file.exists()) {
    console.info(`kept     ${name}  ${text}`)
    continue
  }
  // One failed line doesn't stop the rest; the route speaks it live.
  try {
    await Bun.write(file, await synthesizeSpeech({ text, voiceId, apiKey }))
  } catch (error) {
    failed += 1
    console.error(`failed   ${name}  ${text}: ${error instanceof Error ? error.message : error}`)
    continue
  }
  characters += text.length
  console.info(`created  ${name}  ${text}`)
}

console.info(`Done. Sent ${characters} characters to ElevenLabs.`)
if (failed > 0) {
  console.error(`${failed} line(s) failed.`)
  process.exit(1)
}

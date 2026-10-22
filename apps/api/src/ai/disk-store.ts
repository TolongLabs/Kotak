import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { KeyValueStore } from './cache'

// Bun only, imported by bun.ts: the persistent half of the response cache outside Cloudflare, one file per key.
export function createDiskStore(directory: string): KeyValueStore {
  const fileFor = (key: string) => join(directory, `${key.replace(/[^\w-]/g, '_')}.json`)
  return {
    async get(key) {
      return readFile(fileFor(key), 'utf8').catch(() => null)
    },
    async put(key, value) {
      await mkdir(directory, { recursive: true })
      await writeFile(fileFor(key), value)
    }
  }
}

import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export async function createOutputDirectory(path: string): Promise<string> {
  const output = resolve(path)
  await mkdir(dirname(output), { recursive: true })
  await mkdir(output) // Exclusive: concurrent runs cannot mix files or overwrite evidence.
  return output
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`)
  await rename(`${path}.tmp`, path)
}

export async function writeListings(path: string, jobs: Iterable<unknown>): Promise<void> {
  await writeFile(`${path}.tmp`, [...jobs].map((job) => `${JSON.stringify(job)}\n`).join(''))
  await rename(`${path}.tmp`, path)
}

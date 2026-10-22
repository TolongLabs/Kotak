import { readFile, realpath, stat } from 'node:fs/promises'
import { parseListing } from './records'
import type { JobListing } from './records'

export async function resolveInputs(inputs: string[]): Promise<string[]> {
  if (!inputs.length) throw new Error('Provide at least one --input breadth jobs.jsonl or observations.jsonl file')
  const paths = [...new Set(await Promise.all(inputs.map((path) => realpath(path))))]
  for (const path of paths) {
    if (!(await stat(path)).isFile()) throw new Error(`Input must be a JSONL file: ${path}`)
  }
  return paths
}

interface InputRow {
  file: string
  line: number
  raw: string
  job: JobListing | null
  error: string | null
}

export async function* readListingRows(paths: string[]): AsyncGenerator<InputRow> {
  for (const file of paths) {
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/)
    for (const [index, original] of lines.entries()) {
      const raw = original.replace(/^\uFEFF/, '').trim()
      if (!raw) continue
      const row: InputRow = { file, line: index + 1, raw, job: null, error: null }
      try {
        row.job = parseListing(JSON.parse(raw))
      } catch (error) {
        row.error = String(error)
      }
      yield row
    }
  }
}

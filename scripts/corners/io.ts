// Shared file helpers for the corner scripts.

/** Writes `file` as JSON with one record of `key` per line, so a regeneration shows as a readable diff. */
export async function writeRecordsJson(path: string, file: object, key: string): Promise<number> {
  const parts = Object.entries(file).map(([name, value]) =>
    name === key && Array.isArray(value)
      ? `${JSON.stringify(name)}: [\n${value.map((row) => JSON.stringify(row)).join(',\n')}\n]`
      : `${JSON.stringify(name)}: ${JSON.stringify(value)}`
  )
  return Bun.write(path, `{\n${parts.join(',\n')}\n}\n`)
}

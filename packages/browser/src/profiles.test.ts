import { expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deleteProfile } from './profiles'

// A killed browser's child processes hold files in its profile for a moment after it dies (#264). Only Windows
// refuses to delete a file another process holds open.
test.skipIf(process.platform !== 'win32')(
  'deleteProfile waits for a file another process still holds',
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'kotak-profiles-'))
    await mkdir(join(root, 'held', 'data'), { recursive: true })
    await writeFile(join(root, 'held', 'profile.json'), '{}')
    const file = join(root, 'held', 'data', 'Cookies')
    await writeFile(file, '')
    const holder = Bun.spawn(
      [
        'powershell.exe',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `$file = [IO.File]::Open('${file}', 'Open', 'ReadWrite', 'None'); 'held'; Start-Sleep -Milliseconds 1500; $file.Close()`
      ],
      { stdin: 'ignore', stdout: 'pipe' }
    )
    try {
      await holder.stdout.getReader().read()
      await deleteProfile('held', root)
      expect(existsSync(join(root, 'held'))).toBe(false)
    } finally {
      await holder.exited
      await rm(root, { recursive: true, force: true })
    }
  },
  20_000
)

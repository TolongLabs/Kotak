import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { launchPersistentContext, type PersistentContextOptions } from 'clearcote'
import type { BrowserContext } from 'playwright-core'
import { readMachine, type Machine } from './machine'

// Git-ignored, next to the scraper's other local state.
export const DEFAULT_ROOT = resolve(import.meta.dir, '../../../.local/browser-profiles')

export interface Profile {
  id: string
  name: string
  created_at: string
  // Clearcote derives one coherent machine from the seed: same seed, same machine on every launch.
  seed: string
  platform: 'windows'
  // Ignored while geoip is on.
  accept_language: string
  timezone: string
  proxy: string | null
  // Opt-in: match timezone, languages, location and WebRTC IP to the exit IP at each launch, as Kameleo does.
  geoip: boolean
  // This machine's real values when the profile was created; they override the seed's persona.
  machine: Machine
}

export interface CreateProfileOptions {
  name?: string
  acceptLanguage?: string
  timezone?: string
  proxy?: string
  geoip?: boolean
  root?: string
}

export async function createProfile(options: CreateProfileOptions = {}): Promise<Profile> {
  const root = options.root ?? DEFAULT_ROOT
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: options.name ?? `kotak-${Date.now()}`,
    created_at: new Date().toISOString(),
    seed: crypto.randomUUID(),
    platform: 'windows',
    accept_language: options.acceptLanguage ?? 'en-MY,en',
    timezone: options.timezone ?? 'Asia/Kuala_Lumpur',
    proxy: options.proxy ?? null,
    geoip: options.geoip ?? false,
    machine: await readMachine()
  }
  await mkdir(join(root, profile.id, 'data'), { recursive: true })
  await writeProfile(profile, root)
  return profile
}

export async function readProfile(id: string, root = DEFAULT_ROOT): Promise<Profile> {
  return JSON.parse(await readFile(join(root, id, 'profile.json'), 'utf8')) as Profile
}

export async function listProfiles(root = DEFAULT_ROOT): Promise<Profile[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => [])
  const profiles = await Promise.all(
    entries.filter((entry) => entry.isDirectory()).map((entry) => readProfile(entry.name, root).catch(() => null))
  )
  return profiles.filter((profile): profile is Profile => profile !== null)
}

export async function deleteProfile(id: string, root = DEFAULT_ROOT): Promise<void> {
  await readProfile(id, root) // Refuse to remove a directory that is not a profile.
  await rm(join(root, id), { recursive: true, force: true })
}

// Launch a profile as a persistent Chromium context; cookies and storage live in its data directory.
export async function startProfile(
  profile: Profile,
  options: { root?: string; headless?: boolean } = {}
): Promise<BrowserContext> {
  return launchPersistentContext(join(options.root ?? DEFAULT_ROOT, profile.id, 'data'), {
    ...clearcoteOptions(profile),
    headless: options.headless ?? false
  })
}

function clearcoteOptions(profile: Profile): PersistentContextOptions {
  const { cores, memory, screen } = profile.machine
  return {
    fingerprint: profile.seed,
    platform: profile.platform,
    brand: 'Chrome',
    // geoip contacts IP-echo services and GitHub, so it is per-profile opt-in; explicit values would win over it.
    ...(profile.geoip ? { geoip: true } : { timezone: profile.timezone, acceptLanguage: profile.accept_language }),
    proxy: profile.proxy ? proxyOption(profile.proxy) : undefined,
    // Stay close to this machine: its cores, memory, screen and pixel ratio. The GPU stays the seed's:
    // over Remote Desktop this VM's Chrome renders on "Microsoft Basic Render Driver", a VM tell.
    hardwareConcurrency: cores,
    deviceMemory: memory,
    ...(screen && {
      screenWidth: screen.width,
      screenHeight: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      devicePixelRatio: screen.pixelRatio
    }),
    // Native, trusted input along human paths, including the challenge checkbox click.
    humanize: true
  }
}

// Accept http://user:pass@host:port or socks5://…; credentials go in their own fields.
function proxyOption(value: string): { server: string; username?: string; password?: string } {
  const url = new URL(value)
  return {
    server: `${url.protocol}//${url.host}`,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined
  }
}

async function writeProfile(profile: Profile, root: string): Promise<void> {
  const path = join(root, profile.id, 'profile.json')
  await writeFile(`${path}.tmp`, `${JSON.stringify(profile, null, 2)}\n`)
  await rename(`${path}.tmp`, path)
}

import { parseArgs } from 'node:util'
import { createProfile, deleteProfile, listProfiles, readProfile, startProfile, type Profile } from './profiles'

const usage = `Usage: bun run --filter @kotak/browser profile <command> [options]
  create [--name NAME] [--proxy URL] [--geoip]  Create a profile with a new fingerprint seed
                                       --geoip matches timezone, languages, location and WebRTC IP to the exit IP
                                       at each launch; it contacts IP-echo services and downloads a GeoIP database
  list                                 List saved profiles
  open ID [--url URL]                  Open a profile in a visible window; close the window to exit
  delete ID                            Delete a profile and its browser data`

try {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      name: { type: 'string' },
      proxy: { type: 'string' },
      url: { type: 'string' },
      geoip: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' }
    },
    strict: true,
    allowPositionals: true
  })
  const [command, id] = positionals
  if (values.help || !command) {
    console.info(usage)
  } else if (command === 'create') {
    const profile = await createProfile({ name: values.name, proxy: values.proxy, geoip: values.geoip })
    console.info(describe(profile))
  } else if (command === 'list') {
    for (const profile of await listProfiles()) console.info(`${describe(profile)}  ${profile.created_at}`)
  } else if (command === 'open' && id) {
    const context = await startProfile(await readProfile(id))
    const page = context.pages()[0] ?? (await context.newPage())
    if (values.url) await page.goto(values.url)
    console.info(`Profile ${id} is open. Close the browser window to exit.`)
    await new Promise((done) => context.on('close', done))
  } else if (command === 'delete' && id) {
    await deleteProfile(id)
    console.info(`Deleted ${id}`)
  } else {
    throw new Error(usage)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

function describe(profile: Profile): string {
  const { cores, memory, screen } = profile.machine
  const place = profile.geoip ? 'geoip' : profile.timezone
  const size = screen ? `${screen.width}x${screen.height}@${screen.pixelRatio}` : 'seed screen'
  return `${profile.id}  ${profile.name}  ${cores} cores  ${memory} GB  ${size}  ${place}`
}

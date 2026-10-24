# Browser profiles

`@kotak/browser` gives the scraper saved browser profiles. Each profile keeps one device identity. It drives the open build of [Clearcote](https://github.com/clearcotelabs/clearcote-browser), a de-Googled Chromium with fingerprint controls compiled into the engine. Everything runs on this machine: no account, quota, telemetry or local server.

Contents:

1.  [Usage](#usage)
    1.  [Command line](#command-line)
    1.  [Library](#library)
1.  [Design](#design)
    1.  [Why Chromium](#why-chromium)
1.  [Network behaviour](#network-behaviour)
1.  [Files and removal](#files-and-removal)
1.  [Limitations](#limitations)
1.  [See also](#see-also)

## Usage

### Command line

From the repository root:

```sh
bun run --filter @kotak/browser profile create --name research-01
bun run --filter @kotak/browser profile create --name research-geo --geoip
bun run --filter @kotak/browser profile list
bun run --filter @kotak/browser profile open <id> --url https://my.jobstreet.com
bun run --filter @kotak/browser profile delete <id>
```

The first launch downloads the Clearcote build pinned by the `clearcote` SDK (about 250 MB) and checks it against the SHA-256 baked into the SDK. `--geoip` is opt-in; see [Network behaviour](#network-behaviour). `open` shows a visible window and exits when you close it. The scraper uses a saved profile when `BROWSER_PROFILE_ID` is set, and a temporary one otherwise.

### Library

`withProfile()` runs a scraper operation with a browser profile. Without `profileId`, it creates a profile for the run and deletes it afterwards. With one, it reuses that saved identity and its cookies.

```ts
import { withProfile } from '@kotak/browser'

const title = await withProfile({ profileId: '…' }, async (page) => {
  await page.goto('https://my.jobstreet.com')
  return page.title()
})
```

`createProfile()`, `readProfile()`, `listProfiles()`, `startProfile()` and `deleteProfile()` are exported for lower-level control. On Windows, `deleteProfile()` waits up to 10 seconds for files that a closing or killed browser still holds. `startProfile()` returns a Playwright `BrowserContext` whose cookies and storage persist in the profile.

## Design

Each profile uses the local Clearcote Chromium build and stores its identity under `.local/browser-profiles/<id>/` in `profile.json` and `data/`. A per-profile seed and machine values are passed as launch options. GeoIP matching is opt-in; otherwise profiles use the configured default timezone and languages. No remote profile service is required.

A profile presents Chrome on Windows, `en-MY` and `Asia/Kuala_Lumpur` by default. The engine derives the GPU, canvas and WebGL noise and the rest of the machine from the seed; the user agent, client hints, TLS handshake and HTTP/2 settings come from the same Chromium, so they agree. Values are kept close to the machine that created the profile:

- CPU cores and device memory (capped at 8 GB, as Chrome reports it) are the real ones.
- Screen, work area and device pixel ratio are the real primary screen's.
- The GPU stays the seed's. Over Remote Desktop this VM's Chrome renders on "Microsoft Basic Render Driver", a common VM and bot signal, so the real GPU is not exposed.

Every launch turns on Clearcote's `humanize`, which sends mouse, keyboard and scroll input as native, trusted events along human paths.

### Why Chromium

The first version drove a patched Firefox. On 22 October 2026, from the same Malaysian exit IP, JobStreet's Cloudflare answered its first request with a 403 managed challenge, while the installed Google Chrome 155 and Clearcote 150 both got a 200 search page. The challenge came before any page script ran, so it was decided from the Firefox network signature, not the JavaScript fingerprint. Keep this package on Chromium.

## Network behaviour

- The browser downloads once from `clearcotelabs/clearcote-browser` GitHub releases. The SDK's pinned build needs no version lookup.
- Licence checks, the Widevine DRM module and certificate-revocation downloads stay off: they need a licence key or an explicit option.
- GeoIP is off by default, so no IP-echo services are contacted, and the timezone and languages are fixed. A `--geoip` profile looks up its exit IP at each launch, through its proxy if it has one, using api.ipify.org or icanhazip.com. The first such launch downloads the geoip-all-in-one database (about 52 MB) from GitHub.
- The base is ungoogled-chromium, which removes Chrome's calls to Google services.

Pages you visit are contacted as usual. A `--proxy` set at creation applies to all of that profile's traffic.

## Files and removal

| Path                                        | Contents                                                 |
| ------------------------------------------- | -------------------------------------------------------- |
| `%LOCALAPPDATA%\clearcote\Cache`            | Browser builds and the GeoIP database; `CLEARCOTE_CACHE` |
| `.local/browser-profiles` in the repository | Profiles; git-ignored                                    |

To remove everything, delete both directories and this package.

## Limitations

- The open build is Chromium 150; the installed Chrome is 155. Clearcote's newer builds need a licence and are not reproducible from public source, so they are not used.
- The IP address is your own unless a proxy is set.
- Verification checkboxes still have to be completed by hand.
- In `bun test`, don't launch a profile inside `expect(promise).rejects` or `.resolves`; settle the promise with a plain `await` and check the result. Bun 1.4 waits for those promises in a nested event loop that can skip the microtask checkpoint after a `setImmediate` callback ([oven-sh/bun#45020](https://github.com/oven-sh/bun/issues/45020)). Playwright handles each DevTools message in its own `setImmediate`, so the first page's `load` event can arrive before Playwright listens for it, and the launch hangs until Playwright's 180-second timeout. A launch awaited directly, as the scraper and its runner do, is not affected.

## See also

- https://github.com/clearcotelabs/clearcote-browser
- https://github.com/clearcotelabs/clearcote-browser/blob/main/sdk/node/README.md

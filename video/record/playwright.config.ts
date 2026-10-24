import { defineConfig } from '@playwright/test'

// One run id per invocation, shared by the workers through the environment. Re-record into an existing run with
// KOTAK_RUN_ID=<id>; takes get the next free number there.
const now = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})
  .formatToParts(new Date())
  .reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {})
process.env.KOTAK_RUN_ID ??= `${now.year}${now.month}${now.day}-${now.hour}${now.minute}`

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.rec\.ts/,
  workers: 1,
  retries: 0,
  timeout: 5 * 60 * 1000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: './.state/test-results',
  globalSetup: './global-setup.ts',
  // M1 films the MCP Inspector against the app's /api/mcp (the app itself runs separately on port 4310).
  webServer: {
    command:
      'bunx @modelcontextprotocol/inspector@2.12.0 --web --server-url http://localhost:4310/api/mcp --transport http',
    url: 'http://127.0.0.1:6274/healthz',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { MCP_AUTO_OPEN_ENABLED: 'false', MCP_STORAGE_DIR: `${import.meta.dirname}/.state/inspector` }
  },
  use: {
    browserName: 'chromium',
    // Headless: Kopi's Live2D model draws live there too (WebGL on SwiftShader, as headed WSLg also uses), the
    // screencast records it, and no window can be disturbed mid-take.
    headless: true,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    timezoneId: 'Asia/Kuala_Lumpur',
    // Audio goes to Chromium's null sink, which keeps real time (WSLg's PulseAudio sink played a 5.07 s line in up
    // to 19 s). Kopi's line is saved from the /api/tts response, not from the speakers.
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required', '--disable-audio-output'] },
    trace: 'off',
    video: 'off',
    screenshot: 'off'
  }
})

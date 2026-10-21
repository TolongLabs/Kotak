import { app } from './app'

const port = Number(Bun.env.PORT ?? 8787)

Bun.serve({
  fetch: app.fetch,
  port
})

console.info(`Kotak API listening on http://localhost:${port}`)

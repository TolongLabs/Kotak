import { createKotakMcpServer } from '@kotak/agent'
import type { Kotak } from '@kotak/sdk'
import { createMcpHandler, InMemoryTransport, preloadSchemas, type JSONRPCMessage } from '@modelcontextprotocol/server'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { fail, tooLarge } from '../ai/errors'
import { searchTitles, toolDepsFor, type KotakBindings } from '../tool-deps'

// Kotak's tools over MCP (#186): public, read-only and stateless, so no auth and no sessions.

export const mcp = new Hono<{ Bindings: KotakBindings }>()

// Isolate startup isn't billed to a request, so warm the MCP and Zod code a cold request would otherwise compile (about
// 7 ms of V8 CPU): the SDK's wire schemas, then an in-memory tools/list and run_checkup on a Kotak with no data, so no
// I/O. workerd allows no Request body at global scope, so the HTTP layer itself stays cold.
async function warmUp() {
  preloadSchemas()
  const idle = { checkup: () => Promise.reject(new Error('warm-up')) } as unknown as Kotak
  const [client, server] = InMemoryTransport.createLinkedPair()
  const nationalView = () => Promise.reject(new Error('warm-up'))
  await createKotakMcpServer({ kotak: idle, searchTitles, nationalView }).connect(server)
  await client.start()
  for (const message of [
    {
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'warm-up', version: '1' } }
    },
    { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' },
    {
      id: 3,
      method: 'tools/call',
      params: { name: 'run_checkup', arguments: { role_code: '15-1254.00', answers: [] } }
    }
  ])
    await client.send({ jsonrpc: '2.0', ...message } as JSONRPCMessage)
}
void warmUp().catch((error) => console.warn('[mcp] Warm-up failed:', error))

// The factory can't see Hono's env, so the handler is made per request; that costs about 0.1 ms.
mcp.all('/', bodyLimit({ maxSize: 16 * 1024, onError: tooLarge(16 * 1024) }), async (context) => {
  const deps = toolDepsFor(context)
  if (!deps) return fail(context, 503, 'mcp_unavailable', 'The data bundle is not available on this server.')
  return createMcpHandler(() => createKotakMcpServer(deps)).fetch(context.req.raw)
})

import type { Kotak } from '@kotak/sdk'
import { McpServer, type StandardSchemaWithJSON } from '@modelcontextprotocol/server'
import { AGENT_RULES } from './catalog'
import { kotakTools, malaysiaToday, type ToolDeps } from './tools'

// The registry as an MCP server (#184 "Adapters"), for the stateless `createMcpHandler`, which builds one per request.
// Keep `kotak` alive across requests, so the role files it parsed stay in memory.

/**
 * The output schema as published, minus the MCP SDK's check of each result against it. Results come from the SDK's
 * rules over the build-checked bundle, so the check could only catch an SDK bug, which clients that validate against
 * the schema still catch; it cost about 2.5 ms of a cold Worker request's CPU for a check-up report.
 */
const unchecked = (schema: StandardSchemaWithJSON): StandardSchemaWithJSON => ({
  '~standard': { ...schema['~standard'], validate: (value) => ({ value }) as never }
})

async function about(kotak: Kotak): Promise<string> {
  const { snapshots, default_snapshot_id, credits } = await kotak.manifest()
  return [
    '# Kotak',
    AGENT_RULES,
    '## Data snapshots',
    snapshots
      .map(
        ({ snapshot_id, label }) =>
          `- ${label} (${snapshot_id})${snapshot_id === default_snapshot_id ? ', the default' : ''}`
      )
      .join('\n'),
    '## Data sources',
    credits
      .map((c) => `- [${c.source_name}](${c.source_url}), vintage ${c.vintage_date}, ${c.licence}. ${c.credit}`)
      .join('\n')
  ].join('\n\n')
}

export function createKotakMcpServer(deps: Omit<ToolDeps, 'today'>): McpServer {
  const server = new McpServer({ name: 'kotak', title: 'Kotak', version: '1.0.0' }, { instructions: AGENT_RULES })
  const toolDeps: ToolDeps = { ...deps, today: malaysiaToday }

  for (const tool of kotakTools) {
    const { title, description, inputSchema, outputSchema, annotations } = tool
    server.registerTool(
      tool.name,
      { title, description, inputSchema, outputSchema: unchecked(outputSchema), annotations },
      async (input: unknown) => {
        const output = await tool.run(input, toolDeps)
        // The JSON text is for clients that ignore structured output.
        return { content: [{ type: 'text' as const, text: JSON.stringify(output) }], structuredContent: output }
      }
    )
  }

  server.registerResource(
    'about',
    'kotak://about',
    {
      title: 'About Kotak',
      description: 'The rules every Kotak agent follows, and the data snapshots and sources behind every result.',
      mimeType: 'text/markdown'
    },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: await about(deps.kotak) }] })
  )

  return server
}

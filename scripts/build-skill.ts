// bun run build:skill (#188): publishes the kotak-checkup skill for the web build, in apps/web/public/: the skill as a
// zip for claude.ai (SKILL_ZIP_PATH), its SKILL.md for agents that read /llms.txt, and /llms.txt itself. It exits 1
// before writing anything if the skill drifts from @kotak/agent's catalogue: its Rules section must be AGENT_RULES, it
// must name every tool, the plugin's .mcp.json must point at the live MCP server, and every URL in the plugin must be
// on LIVE_SITE.

import { mkdir } from 'node:fs/promises'
import { strToU8, zipSync } from 'fflate'
import {
  AGENT_RULES,
  LIVE_SITE,
  MCP_PATH,
  PLUGIN_INSTALL_COMMANDS,
  SKILL_ZIP_PATH,
  TOOL_CATALOG,
  toolSummary
} from '../packages/agent/src/catalog'

const ROOT = `${import.meta.dir}/..`
const PUBLIC = `${ROOT}/apps/web/public`
const PLUGIN = `${ROOT}/plugins/kotak`
const SKILL = 'kotak-checkup'
const SKILL_MD_PATH = `/skills/${SKILL}/SKILL.md`
const MCP_URL = `${LIVE_SITE}${MCP_PATH}`

const skill = await Bun.file(`${PLUGIN}/skills/${SKILL}/SKILL.md`).text()
const mcpServers: Record<string, { url?: string }> = (await Bun.file(`${PLUGIN}/.mcp.json`).json()).mcpServers
// Every URL in every plugin file, so a moved LIVE_SITE can't leave an old address in the skill or plugin.json.
const pluginUrls = (
  await Promise.all(
    [...new Bun.Glob('**/*').scanSync({ cwd: PLUGIN, dot: true })].map(async (path) =>
      ((await Bun.file(`${PLUGIN}/${path}`).text()).match(/https?:\/\/[^\s"'`)<>]+/g) ?? []).map((url) => ({
        path,
        url
      }))
    )
  )
).flat()

// Compared with whitespace collapsed, so Markdown formatting can't fail the build but a changed word does.
const words = (text: string) => text.replace(/\s+/g, ' ').trim()
const rules = /^## Rules\n([\s\S]*?)(?=^## )/m.exec(skill)?.[1] ?? ''
const failures = [
  ...(words(rules) === words(AGENT_RULES)
    ? []
    : [`its ## Rules section must be AGENT_RULES from packages/agent/src/catalog.ts, word for word`]),
  ...Object.keys(TOOL_CATALOG)
    .filter((name) => !skill.includes(`\`${name}\``))
    .map((name) => `it never names the tool \`${name}\``),
  ...(mcpServers.kotak?.url === MCP_URL ? [] : [`plugins/kotak/.mcp.json must point kotak at ${MCP_URL}`]),
  ...pluginUrls
    .filter(({ url }) => new URL(url).origin !== LIVE_SITE)
    .map(({ path, url }) => `plugins/kotak/${path} links to ${url}; every URL in the plugin must be on ${LIVE_SITE}`)
]
if (failures.length) {
  console.error(`build:skill: the ${SKILL} skill drifted from @kotak/agent:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

const tools = Object.entries(TOOL_CATALOG).map(([name, tool]) => `- \`${name}\` (${tool.title}): ${toolSummary(tool)}`)
const llms = `# Kotak

> Kotak checks how AI is changing the skills of a job in Malaysia, from dated, sourced public data: which skills are rising or declining, which roles fit, and a plan of free learning steps. Data decides, the AI explains.

Connect any MCP client to Kotak's read-only MCP server at ${MCP_URL} (Streamable HTTP, no sign-in). Its tools compute every level, verdict, ranking and date; quote them as returned and cite the sources they give. The tools:

${tools.join('\n')}

In Claude Code, install the server with the kotak-checkup skill: \`${PLUGIN_INSTALL_COMMANDS.join('`, then `')}\`.

## Agent access

- [Kotak MCP server](${MCP_URL}): Streamable HTTP, read-only, no sign-in
- [kotak-checkup skill](${LIVE_SITE}${SKILL_MD_PATH}): how an assistant runs a Kotak check-up through the tools
- [kotak-checkup skill zip](${LIVE_SITE}${SKILL_ZIP_PATH}): the same skill, to upload to claude.ai as a custom skill

## Optional

- [Kotak](${LIVE_SITE}): the Kotak app, which runs the same check-up in the browser
`

await mkdir(`${PUBLIC}/skills/${SKILL}`, { recursive: true })
await Promise.all([
  Bun.write(`${PUBLIC}${SKILL_ZIP_PATH}`, zipSync({ [SKILL]: { 'SKILL.md': strToU8(skill) } })),
  Bun.write(`${PUBLIC}${SKILL_MD_PATH}`, skill),
  Bun.write(`${PUBLIC}/llms.txt`, llms)
])
console.info(`build:skill wrote ${SKILL_ZIP_PATH}, ${SKILL_MD_PATH} and /llms.txt to apps/web/public`)

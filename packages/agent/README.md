# Kotak agent layer

`@kotak/agent` gives AI agents Kotak's check-up as tools. It defines each tool once over [`@kotak/sdk`](/packages/sdk/README.md), together with the one rules text every agent follows ("data decides, the AI explains"), and adapts the tools to the MCP server at `/api/mcp` and to Kopi's chat in the app. The kotak-checkup skill repeats the same rules, and the build fails if it drifts.

Contents:

1.  [Entry points](#entry-points)
1.  [Catalogue, registry and adapters](#catalogue-registry-and-adapters)
1.  [Tools](#tools)
1.  [Agent rules](#agent-rules)
1.  [Add a tool](#add-a-tool)
1.  [Skill drift check](#skill-drift-check)
1.  [Try the MCP server locally](#try-the-mcp-server-locally)
1.  [See also](#see-also)

## Entry points

| Import                 | What it holds                                                                                                                                                                     | Imported by                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `@kotak/agent/catalog` | `AGENT_RULES`, `TOOL_CATALOG`, `toolSummary` and where to get Kotak: `LIVE_SITE`, `MCP_PATH`, `SKILL_ZIP_PATH`, `MARKETPLACE_REPO` and `PLUGIN_INSTALL_COMMANDS`. Imports nothing | The web's Connect your AI page, `scripts/build-skill.ts`, Kopi's chat |
| `@kotak/agent`         | The catalogue, the registry (`kotakTools`, `ToolDeps`) and the adapters (`createKotakMcpServer`, `createKotakClaudeTools`)                                                        | `apps/api`                                                            |

Like the SDK, it is a workspace package of TypeScript source. It depends on `@kotak/sdk`, `@kotak/shared`, Zod, the MCP TypeScript SDK v2 server (`@modelcontextprotocol/server`) and `@anthropic-ai/sdk`. Only the catalogue reaches the browser, so the web never loads the server packages.

## Catalogue, registry and adapters

Each layer builds on the one before:

1.  **Catalogue** (`src/catalog.ts`): each tool's name, title and description, and the agent rules. A description is a prompt for the model: its first sentence says what the tool does, and the Connect page and `/llms.txt` show only that sentence, `toolSummary(tool)`; the rest says when to call the tool and how to use the result.
2.  **Registry** (`src/tools.ts`): each tool once, as `{ name, title, description, inputSchema, outputSchema, annotations, run }`, with Zod schemas and a `run` over the SDK. `run` gets the validated input and `ToolDeps`: a `Kotak`, the O\*NET title search, `today()` and the national view reader. The registry never reads the clock or the network itself. Every tool has the same annotations: read-only, not destructive, idempotent and closed-world.
3.  **Adapters** turn the registry into a surface:

    - `createKotakMcpServer(deps)` (`src/mcp.ts`) builds an MCP server. Each tool publishes its output schema and returns its result as `structuredContent` and as JSON text. The server's instructions are the agent rules, and a `kotak://about` resource adds the snapshots and sources. `apps/api/src/routes/mcp.ts` serves it with the stateless `createMcpHandler`: one server per request, over one `Kotak` per isolate.
    - `createKotakClaudeTools(deps, { checkup, onCall })` (`src/claude.ts`) builds runnable tools for the Anthropic SDK's beta tool runner, for Kopi's chat in `apps/api/src/routes/agent.ts`. A tool that takes `answers` is bound to the user's check-up: its schema drops the user's own fields (`OWN_FIELDS`), and the what-if fields (`WHAT_IF_FIELDS`) default to the user's values. Without a check-up those tools are left out. `onCall` reports each call, for the tools and sources the chat panel shows.

Both adapters set `today()` to the date in Malaysia (UTC+8), so a check-up with no start date starts today there.

## Tools

| Tool                    | Title                          | Built on                                                                                            |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `find_role`             | Find a Role                    | The O\*NET title and alternate-title search, the job match route's first step, with no Claude       |
| `get_checkup_questions` | Get the Check-Up Questions     | `kotak.questions`                                                                                   |
| `suggest_roles`         | Suggest Roles                  | `kotak.suggestRoles` and `kotak.pathwayOptions`                                                     |
| `run_checkup`           | Run the Check-Up               | `kotak.checkup`                                                                                     |
| `what_changed`          | What Changed Between Snapshots | `kotak.whatChanged`                                                                                 |
| `national_skill_gaps`   | National Skill Gaps            | `nationalViewSummary`, the national view route's function, joined to each corner's name and verdict |
| `job_market`            | Job Ads in Malaysia            | `jobMarketsFor`, the job-ad market route's function                                                 |
| `list_sources`          | List the Data Sources          | `kotak.manifest`                                                                                    |

The catalogue's descriptions say what each tool returns and when to call it.

## Agent rules

`AGENT_RULES` is the one rules text for every Kotak agent: the MCP server's instructions and its `kotak://about` resource, the start of Kopi's system prompt, and the Rules section of the kotak-checkup skill. It tells an agent to call a tool for every number and date and quote it as returned, cite each source and vintage date, label uncertainty, ask one question at a time, and suggest rather than dictate.

Change the rules only in `src/catalog.ts`, then copy the new text into the skill's Rules section; the [drift check](#skill-drift-check) fails until you do. Keep the text short: Claude Code cuts a server's instructions at 4,096 characters ([Claude Code MCP docs](https://code.claude.com/docs/en/mcp#tool-search-for-mcp-server-authors)).

## Add a tool

1.  Add its entry to `TOOL_CATALOG` in `src/catalog.ts`: a snake_case name, a title, and a description whose first sentence says what the tool returns.
2.  Add it to `registry` in `src/tools.ts` with `tool(name, { inputSchema, outputSchema, run })`. Use strict Zod objects and `.describe()` each input field for the model. `run` uses only `ToolDeps` and writes nothing; when it fails, throw an `Error` whose message tells the model what to do next. The typecheck fails until every catalogue name has a registry entry.
3.  If it needs a new dependency, add it to `ToolDeps` and pass it in `toolDepsFor` in `apps/api/src/tool-deps.ts`, which both API routes use, and in the warm-up in `apps/api/src/routes/mcp.ts`.
4.  If it takes `answers`, Kopi's chat binds it to the user's check-up. Add any new field that only the user's check-up sets to `OWN_FIELDS` in `src/claude.ts`, and any field a what-if may change to `WHAT_IF_FIELDS`.
5.  Name it in `plugins/kotak/skills/kotak-checkup/SKILL.md` where the check-up flow needs it, and add it to the tool list that `.github/workflows/deploy.yml` checks after each deploy.
6.  Run `bun run build:skill`, then list and call the tool on a local server.

The Connect your AI page and `/llms.txt` pick up the new tool from the catalogue.

## Skill drift check

`bun run build:skill` (`scripts/build-skill.ts`, part of `bun run build` and `bun run dev`) publishes the skill to `apps/web/public`: the zip for claude.ai (`/kotak-checkup.zip`), its `SKILL.md`, and `/llms.txt` with the tool list from the catalogue. Before writing anything, it exits 1 if:

- the skill's `## Rules` section isn't `AGENT_RULES` word for word, ignoring whitespace;
- the skill doesn't name every catalogue tool in backticks;
- `plugins/kotak/.mcp.json` doesn't point at `LIVE_SITE` plus `MCP_PATH`;
- any URL in `plugins/kotak` isn't on `LIVE_SITE`.

CI and the deploy both run the build, so they fail when the skill and the catalogue disagree.

## Try the MCP server locally

Build the app and start the Bun server, which serves `/api/mcp` from the built bundle on disk:

```shell
bun run build
bun run start
```

In another terminal, list the tools and call one with the [MCP Inspector CLI](https://github.com/modelcontextprotocol/inspector):

```shell
bunx @modelcontextprotocol/inspector@2.12.0 --cli --transport http \
  --server-url http://localhost:8787/api/mcp --protocol-era legacy \
  --method tools/list
bunx @modelcontextprotocol/inspector@2.12.0 --cli --transport http \
  --server-url http://localhost:8787/api/mcp --protocol-era legacy \
  --method tools/call --tool-name find_role --tool-arg job_title=bookkeeper
```

Kopi's chat needs `ANTHROPIC_API_KEY` in `.env`; without it, `POST /api/agent/chat` answers 503 `agent_unavailable`.

## See also

- [TRD: agent layer](/docs/TRD.md#agent-layer), with the MCP and chat routes, the Worker CPU budget and privacy.
- [`@kotak/sdk` README](/packages/sdk/README.md), the engine the tools run on.
- [`plugins/kotak`](/plugins/kotak/skills/kotak-checkup/SKILL.md): the kotak-checkup skill.
- Issue #184: the SDK and agent layer spec.

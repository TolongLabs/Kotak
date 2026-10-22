import {
  LIVE_SITE,
  MCP_PATH,
  PLUGIN_INSTALL_COMMANDS,
  SKILL_ZIP_PATH,
  TOOL_CATALOG,
  toolSummary
} from '@kotak/agent/catalog'
import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Tabs } from '../components/ui/Tabs'
import { ToastRegion, type ToastItemProps } from '../components/ui/Toast'
import { CopyBlock } from './connect/CopyBlock'

// Claude's connectors reach the MCP server from Anthropic's cloud, so a local or private address can't work there.
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])|\.local$/

const clients = [
  { id: 'claude', label: 'Claude' },
  { id: 'claude-code', label: 'Claude Code' },
  { id: 'vscode', label: 'VS Code' },
  { id: 'cursor', label: 'Cursor' }
]

const EXAMPLE_QUESTION = 'What does AI mean for my job as a bookkeeper in Malaysia?'

const tools = Object.entries(TOOL_CATALOG).map(([name, tool]) => ({
  name,
  title: tool.title,
  summary: toolSummary(tool)
}))

export function ConnectView() {
  const [client, setClient] = useState(clients[0].id)
  const [toast, setToast] = useState<ToastItemProps | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const mcpUrl = `${window.location.origin}${MCP_PATH}`
  const privateHost = PRIVATE_HOST.test(window.location.hostname)
  const connectorUrl = privateHost ? `${LIVE_SITE}${MCP_PATH}` : mcpUrl

  function showCopyToast(name: string, copied: boolean) {
    window.clearTimeout(toastTimer.current)
    // A new id each time, so the live region announces a repeat copy too.
    const id = String(Date.now())
    setToast(
      copied
        ? {
            id,
            type: 'success',
            title: 'Copied',
            body: `${name[0].toUpperCase()}${name.slice(1)} copied to your clipboard.`
          }
        : {
            id,
            type: 'error',
            title: 'Couldn’t Copy',
            body: 'Your browser blocked the clipboard. Select the text and copy it.'
          }
    )
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <CatDialogue
        pose="explaining"
        speech="Want me in your own AI? Connect it here. It gets the same tools and sources I use, so data still decides."
      />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-m font-bold text-text-primary lg:text-title-l">Connect Your AI</h1>
        <p className="text-body-s text-text-muted">
          Add Kotak to Claude, Claude Code, VS Code or Cursor. Your assistant runs the same check-up as this app, with
          the same rules and sources.
        </p>
      </header>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="mcp-url-title">
        <div className="space-y-1">
          <h2 id="mcp-url-title" className="text-title-s text-text-primary">
            Your MCP URL
          </h2>
          <p className="text-body-s text-text-muted">
            Any assistant that supports remote MCP servers can connect here. It’s read-only and needs no sign-in.
          </p>
        </div>
        <CopyBlock name="MCP URL" caption="Streamable HTTP" text={mcpUrl} onCopy={showCopyToast} />
      </section>

      <section className="surface-card space-y-2 p-5 lg:p-6" aria-labelledby="setup-title">
        <h2 id="setup-title" className="text-title-s text-text-primary">
          Set Up Your Assistant
        </h2>
        <Tabs tabs={clients} value={client} onChange={setClient}>
          {client === 'claude' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  In claude.ai or Claude Desktop, go to <strong>Customize</strong>, then <strong>Connectors</strong>.
                </li>
                <li>
                  Select <strong>+ Add</strong>, then <strong>Add custom connector</strong>.
                </li>
                <li className="space-y-2">
                  <p>
                    Name it Kotak, paste this URL and select <strong>Continue</strong>.
                  </p>
                  <CopyBlock
                    name={privateHost ? 'live MCP URL' : 'MCP URL'}
                    caption="Remote MCP server URL"
                    text={connectorUrl}
                    onCopy={showCopyToast}
                  />
                </li>
                <li>
                  Kotak needs no sign-in: under <strong>Authentication</strong>, choose <strong>No sign in</strong>,
                  then select <strong>Add</strong>.
                </li>
              </ol>
              <p className="text-body-s text-text-muted">
                Claude connects from Anthropic’s cloud, so it needs a public address.
                {privateHost && ' It can’t reach this computer, so use the live site’s URL above.'} Free plans can add
                one custom connector.
              </p>
            </div>
          )}
          {client === 'claude-code' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <p>Add the server with one command:</p>
              <CopyBlock
                name="Claude Code command"
                caption="Terminal"
                text={`claude mcp add --transport http kotak ${mcpUrl}`}
                onCopy={showCopyToast}
              />
              <p>Or install the Kotak plugin. It adds the server, on the live site, and the kotak-checkup skill:</p>
              <CopyBlock
                name="plugin commands"
                caption="Terminal"
                text={PLUGIN_INSTALL_COMMANDS.join('\n')}
                onCopy={showCopyToast}
              />
            </div>
          )}
          {client === 'vscode' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <p>
                Save this as <code className="font-mono text-mono-m">.vscode/mcp.json</code> in your workspace, then
                start Kotak from <strong>MCP: List Servers</strong> in the Command Palette.
              </p>
              <CopyBlock
                name="VS Code config"
                caption=".vscode/mcp.json"
                text={JSON.stringify({ servers: { kotak: { type: 'http', url: mcpUrl } } }, null, 2)}
                onCopy={showCopyToast}
              />
            </div>
          )}
          {client === 'cursor' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <p>
                Save this as <code className="font-mono text-mono-m">.cursor/mcp.json</code> in your project, or as{' '}
                <code className="font-mono text-mono-m">~/.cursor/mcp.json</code> for every project.
              </p>
              <CopyBlock
                name="Cursor config"
                caption=".cursor/mcp.json"
                text={JSON.stringify({ mcpServers: { kotak: { url: mcpUrl } } }, null, 2)}
                onCopy={showCopyToast}
              />
            </div>
          )}
        </Tabs>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="skill-title">
          <div className="space-y-1">
            <h2 id="skill-title" className="text-title-s text-text-primary">
              Teach Claude the Check-Up
            </h2>
            <p className="text-body-s text-text-muted">
              The kotak-checkup skill shows Claude how to run a check-up with Kotak’s tools: one question at a time,
              with every source and date. The Claude Code plugin already has it.
            </p>
          </div>
          <ol className="list-decimal space-y-2 pl-6 text-body-m text-text-primary">
            <li>
              In claude.ai, go to <strong>Settings</strong>, then <strong>Capabilities</strong>, and turn on{' '}
              <strong>Code execution and file creation</strong>.
            </li>
            <li>
              Go to <strong>Customize</strong>, then <strong>Skills</strong>. Select <strong>+</strong>, then{' '}
              <strong>Create skill</strong>, then <strong>Upload a skill</strong>, and choose the zip.
            </li>
          </ol>
          <a
            href={SKILL_ZIP_PATH}
            download
            className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border-[1.5px] border-text-primary bg-accent-box px-4 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover sm:w-auto"
          >
            <Download className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            Download the Skill
          </a>
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="try-title">
          <div className="space-y-1">
            <h2 id="try-title" className="text-title-s text-text-primary">
              Try Asking
            </h2>
            <p className="text-body-s text-text-muted">
              Your assistant finds your role, asks Kotak’s can-do questions one at a time, and quotes Kotak’s verdicts
              with their sources.
            </p>
          </div>
          <CopyBlock name="example question" caption="Your assistant" text={EXAMPLE_QUESTION} onCopy={showCopyToast} />
        </section>
      </div>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="tools-title">
        <div className="space-y-1">
          <h2 id="tools-title" className="text-title-s text-text-primary">
            Tools Your Assistant Gets
          </h2>
          <p className="text-body-s text-text-muted">
            Every tool is read-only: your assistant can look things up in Kotak, but it can’t change anything.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.name} className="space-y-1 rounded-md border border-border-subtle bg-bg-panel p-4">
              <h3 className="text-label-l text-text-primary">{tool.title}</h3>
              <p className="font-mono text-mono-s text-text-muted">{tool.name}</p>
              <p className="text-body-s text-text-muted">{tool.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <ToastRegion toasts={toast ? [toast] : []} className="pointer-events-none" />
    </div>
  )
}

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
import { commonText } from '../i18n/common'
import { changesText } from '../i18n/messages/changes'
import { useText } from '../i18n/text'
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
  const t = useText(changesText)
  const c = useText(commonText)
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
            title: t.copied,
            body: t.toastCopiedBody(`${name[0].toUpperCase()}${name.slice(1)}`)
          }
        : {
            id,
            type: 'error',
            title: t.toastCopyFailTitle,
            body: t.toastCopyFailBody
          }
    )
    toastTimer.current = window.setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <CatDialogue pose="explaining" speech={t.connectSpeech} />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-m font-bold text-text-primary lg:text-title-l">{c.nav.connect}</h1>
        <p className="text-body-s text-text-muted">{t.connectIntro}</p>
      </header>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="mcp-url-title">
        <div className="space-y-1">
          <h2 id="mcp-url-title" className="text-title-s text-text-primary">
            {t.mcpUrlTitle}
          </h2>
          <p className="text-body-s text-text-muted">{t.mcpUrlBody}</p>
        </div>
        <CopyBlock name="MCP URL" caption="Streamable HTTP" text={mcpUrl} onCopy={showCopyToast} />
      </section>

      <section className="surface-card space-y-2 p-5 lg:p-6" aria-labelledby="setup-title">
        <h2 id="setup-title" className="text-title-s text-text-primary">
          {t.setupTitle}
        </h2>
        <Tabs tabs={clients} value={client} onChange={setClient}>
          {client === 'claude' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  {t.claudeStep1.before}
                  <strong>Customize</strong>
                  {t.claudeStep1.between}
                  <strong>Connectors</strong>
                  {t.claudeStep1.after}
                </li>
                <li>
                  {t.claudeStep2.before}
                  <strong>+ Add</strong>
                  {t.claudeStep2.between}
                  <strong>Add custom connector</strong>
                  {t.claudeStep2.after}
                </li>
                <li className="space-y-2">
                  <p>
                    {t.claudeStep3.before}
                    <strong>Continue</strong>
                    {t.claudeStep3.after}
                  </p>
                  <CopyBlock
                    name={privateHost ? 'live MCP URL' : 'MCP URL'}
                    caption="Remote MCP server URL"
                    text={connectorUrl}
                    onCopy={showCopyToast}
                  />
                </li>
                <li>
                  {t.claudeStep4.before}
                  <strong>Authentication</strong>
                  {t.claudeStep4.choose}
                  <strong>No sign in</strong>
                  {t.claudeStep4.thenSelect}
                  <strong>Add</strong>
                  {t.claudeStep4.after}
                </li>
              </ol>
              <p className="text-body-s text-text-muted">
                {t.claudeNoteCloud}
                {privateHost && t.claudeNotePrivate}
                {t.claudeNoteFree}
              </p>
            </div>
          )}
          {client === 'claude-code' && (
            <div className="space-y-4 text-body-m text-text-primary">
              <p>{t.codeCommandIntro}</p>
              <CopyBlock
                name="Claude Code command"
                caption="Terminal"
                text={`claude mcp add --transport http kotak ${mcpUrl}`}
                onCopy={showCopyToast}
              />
              <p>{t.codePluginIntro}</p>
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
                {t.vscodeIntro.before}
                <code className="font-mono text-mono-m">.vscode/mcp.json</code>
                {t.vscodeIntro.middle}
                <strong>MCP: List Servers</strong>
                {t.vscodeIntro.after}
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
                {t.cursorIntro.before}
                <code className="font-mono text-mono-m">.cursor/mcp.json</code>
                {t.cursorIntro.middle}
                <code className="font-mono text-mono-m">~/.cursor/mcp.json</code>
                {t.cursorIntro.after}
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
              {t.teachTitle}
            </h2>
            <p className="text-body-s text-text-muted">{t.teachIntro}</p>
          </div>
          <ol className="list-decimal space-y-2 pl-6 text-body-m text-text-primary">
            <li>
              {t.teachStep1.before}
              <strong>Settings</strong>
              {t.teachStep1.then}
              <strong>Capabilities</strong>
              {t.teachStep1.turnOn}
              <strong>Code execution and file creation</strong>
              {t.teachStep1.after}
            </li>
            <li>
              {t.teachStep2.before}
              <strong>Customize</strong>
              {t.teachStep2.then}
              <strong>Skills</strong>
              {t.teachStep2.select}
              <strong>+</strong>
              {t.teachStep2.then}
              <strong>Create skill</strong>
              {t.teachStep2.then}
              <strong>Upload a skill</strong>
              {t.teachStep2.andChoose}
              {t.teachStep2.after}
            </li>
          </ol>
          <a
            href={SKILL_ZIP_PATH}
            download
            className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-sm border-[1.5px] border-text-primary bg-accent-box px-4 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover sm:w-auto"
          >
            <Download className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
            {t.downloadSkill}
          </a>
        </section>

        <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="try-title">
          <div className="space-y-1">
            <h2 id="try-title" className="text-title-s text-text-primary">
              {t.tryTitle}
            </h2>
            <p className="text-body-s text-text-muted">{t.tryIntro}</p>
          </div>
          <CopyBlock name="example question" caption="Your assistant" text={EXAMPLE_QUESTION} onCopy={showCopyToast} />
        </section>
      </div>

      <section className="surface-card space-y-4 p-5 lg:p-6" aria-labelledby="tools-title">
        <div className="space-y-1">
          <h2 id="tools-title" className="text-title-s text-text-primary">
            {t.toolsTitle}
          </h2>
          <p className="text-body-s text-text-muted">{t.toolsIntro}</p>
        </div>
        <ul className="grid auto-rows-fr grid-cols-1 gap-3 lg:grid-cols-2">
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

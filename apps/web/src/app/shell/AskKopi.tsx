import {
  CHAT_MAX_TURNS,
  CHAT_QUESTION_MAX_LENGTH,
  type AgentChatCheckup,
  type AgentChatRequest,
  type AgentChatResponse,
  type GuestSession
} from '@kotak/shared'
import { MessageCircle, RotateCcw, SendHorizontal, Wrench, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type Ref, type RefObject } from 'react'
import { KopiFigure } from '../../components/kopi/KopiFigure'
import { useReducedMotion } from '../../components/kopi/motion'
import type { KopiPose } from '../../components/kopi/poses'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { cn } from '../../components/ui/cn'
import { askKopi } from '../../engine/api'
import { useRoleIndex } from '../../engine/bundle'
import { assessedRoleCode } from '../../engine/checkup'
import { toIsoDate } from '../../engine/dates'
import { commonText } from '../../i18n/common'
import { shellText } from '../../i18n/messages/shell'
import { useText } from '../../i18n/text'
import { useGuestSession } from '../../session/store'
import { navigate } from '../router'
import { routes } from '../routes'
import { parseChatText, plainChatText, type ChatSpan } from './chatText'

// Ask Kopi (#191): a chat window on every /app page, opened from a button in the bottom-right corner. Kopi answers with
// Kotak's tools on the guest session's check-up through POST /api/agent/chat. The conversation lives in memory until
// the page closes.

interface Exchange {
  question: string
  answer: AgentChatResponse
}

type Pending = { question: string; status: 'sending' | 'error' | 'unavailable' }

// The session as the chat's check-up context; null before the user picks a job. start_date is the Roadmap page's
// today, so Kopi's dates match it.
function checkupOf(session: GuestSession): AgentChatCheckup | null {
  if (!assessedRoleCode(session)) return null
  return {
    role_code: session.role_code,
    // The check-up always stores one of the three goals; the route checks it again.
    goal: (session.goal ?? 'explore') as AgentChatCheckup['goal'],
    target_role_code: session.target_role_code,
    plan_role_code: session.plan_role_code,
    answers: session.answers,
    snapshot_id: session.active_snapshot_id,
    weekly_hours: session.custom_weekly_hours,
    start_date: toIsoDate(new Date()),
    profile: session.profile
  }
}

/** The chat window's id, for every toggle's aria-controls. */
export const ASK_KOPI_PANEL_ID = 'ask-kopi-panel'

/** A question a page sends to Kopi, such as the radar's Interpret; `id` tells two sends of one question apart. */
export interface AskKopiRequest {
  question: string
  id: number
}

let requestListener: ((request: AskKopiRequest) => void) | null = null
let requestCount = 0

/** Opens Ask Kopi and sends `question`, as if the user had typed it. The app shell listens. */
export function askKopiAbout(question: string) {
  requestListener?.({ question, id: ++requestCount })
}

/** The app shell's subscription to `askKopiAbout`; returns the unsubscribe. */
export function onAskKopiRequest(listener: (request: AskKopiRequest) => void) {
  requestListener = listener
  return () => {
    if (requestListener === listener) requestListener = null
  }
}

// Floats in the bottom-right corner of every /app page and toggles the chat window above it. The label stays "Ask Kopi";
// aria-expanded says whether the window is open.
export function AskKopiButton({
  open,
  onClick,
  ref
}: {
  open: boolean
  onClick: () => void
  ref?: Ref<HTMLButtonElement>
}) {
  const Icon = open ? X : MessageCircle
  const c = useText(commonText)

  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={ASK_KOPI_PANEL_ID}
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border-[1.5px] border-text-primary bg-accent-box px-5 text-label-m text-accent-on-box shadow-[var(--shadow-popover)] transition-colors duration-150 ease-out hover:bg-accent-box-hover"
    >
      <Icon className="h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
      {c.askKopi}
    </button>
  )
}

export function AskKopiPanel({
  open,
  onClose,
  dataLabel,
  returnFocusRef,
  request
}: {
  open: boolean
  onClose: () => void
  dataLabel: string
  returnFocusRef: RefObject<HTMLButtonElement | null>
  /** A question a page asked Kopi to answer; sent once per id. */
  request?: AskKopiRequest | null
}) {
  const session = useGuestSession()
  const c = useText(commonText)
  const t = useText(shellText)
  const index = useRoleIndex()
  const { reduced } = useReducedMotion()
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const [draft, setDraft] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const inputId = useId()
  const hintId = useId()

  const hasCheckup = Boolean(assessedRoleCode(session))
  const sending = pending?.status === 'sending'
  const roleCode = assessedRoleCode(session)
  const roleTitle =
    index.status === 'ready' ? index.data.roles.find((role) => role.onet_code === roleCode)?.title : undefined
  const pose: KopiPose = sending ? 'thinking' : pending ? 'worried' : exchanges.length > 0 ? 'explaining' : 'idle'
  const suggestions = hasCheckup
    ? [
        t.askKopi.suggestions.studyHours,
        t.askKopi.suggestions.decliningSkills,
        session.goal === 'target' ? t.askKopi.suggestions.targetRole : t.askKopi.suggestions.dataChange
      ]
    : [t.askKopi.suggestions.risingSkills, t.askKopi.suggestions.dataSource]

  // Opens as a modal in the middle of the screen over a blurred page; focus starts in the question box, Escape or a
  // click on the backdrop closes it, and focus returns to the Ask Kopi button (some browsers don't focus a clicked
  // button).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      returnFocusRef.current?.focus()
    }
  }, [open, returnFocusRef])

  // A page's question (the radar's Interpret) is sent once the window is open; mid-reply, it waits in the box instead.
  const handledRequest = useRef(0)
  useEffect(() => {
    if (!open || !request || request.id === handledRequest.current) return
    handledRequest.current = request.id
    if (sending) setDraft(request.question)
    else void send(request.question)
  })

  // Each new question scrolls to the top of the log, so the question and the start of Kopi's reply show together.
  useEffect(() => {
    const log = logRef.current
    const questions = log?.querySelectorAll<HTMLElement>('[data-question]')
    const latest = questions?.[questions.length - 1]
    if (log && latest) log.scrollTop = latest.offsetTop - 16
  }, [exchanges.length, pending])

  async function send(question: string) {
    if (sending) return
    setPending({ question, status: 'sending' })
    const turns: AgentChatRequest['messages'] = [
      ...exchanges.flatMap((exchange) => [
        { role: 'user' as const, content: exchange.question },
        { role: 'assistant' as const, content: exchange.answer.reply }
      ]),
      { role: 'user', content: question }
    ]
    // The route takes at most CHAT_MAX_TURNS turns, from a user turn to the new question.
    const messages = turns.slice(-CHAT_MAX_TURNS)
    if (messages[0]?.role === 'assistant') messages.shift()

    const result = await askKopi({ messages, checkup: checkupOf(session) })
    if (result.status === 'available') {
      setExchanges((current) => [...current, { question, answer: result.data }])
      setPending(null)
    } else {
      setPending({ question, status: result.status })
    }
  }

  // The button that started a send goes away, so focus moves to the question box first.
  function ask(question: string) {
    inputRef.current?.focus()
    void send(question)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const question = draft.trim()
    if (!question || sending) return
    setDraft('')
    ask(question)
  }

  function go(to: string) {
    onClose()
    navigate(to)
  }

  const latestReply = exchanges.at(-1)?.answer.reply
  const announcement = sending
    ? t.askKopi.thinkingAnnouncement
    : pending?.status === 'unavailable'
      ? t.askKopi.unavailableAnnouncement
      : pending?.status === 'error'
        ? t.askKopi.errorAnnouncement
        : latestReply
          ? t.askKopi.replyAnnouncement(plainChatText(latestReply))
          : ''

  return (
    <dialog
      ref={dialogRef}
      id={ASK_KOPI_PANEL_ID}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // The window's content fills the dialog, so a click that lands on the dialog itself is on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-0 m-auto h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-md border-[1.5px] border-text-primary bg-bg-default p-0 text-text-primary shadow-[var(--shadow-popover)] backdrop:bg-black/35 backdrop:backdrop-blur-[3px] sm:aspect-video sm:h-auto sm:w-[min(72rem,calc(100vw-4rem),calc((100dvh-4rem)*16/9))]"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          {/* Mounted only while open, so a closed panel never holds Kopi's one Live2D stage. */}
          {open && <KopiFigure pose={pose} className="h-14" />}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-title-s text-text-primary">
              {c.askKopi}
            </h2>
            <p className="truncate font-mono text-mono-s text-text-muted">
              {hasCheckup
                ? `${roleTitle ?? t.askKopi.yourCheckup} · ${t.topbar.data(dataLabel)}`
                : t.askKopi.noCheckupYet}
            </p>
          </div>
          <button
            type="button"
            aria-label={t.askKopi.close}
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-panel text-text-primary transition-colors duration-150 ease-out hover:bg-bg-default"
          >
            <X className="h-5 w-5 stroke-current" aria-hidden="true" />
          </button>
        </div>

        <div ref={logRef} className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:px-8 sm:py-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <KopiBubble>
              {hasCheckup ? (
                <p className="text-body-m">{t.askKopi.introWithCheckup}</p>
              ) : (
                <>
                  <p className="text-body-m">{t.askKopi.introWithoutCheckup}</p>
                  <Button variant="primary" onClick={() => go(routes.checkUp)}>
                    {t.askKopi.startCheckup}
                  </Button>
                </>
              )}
            </KopiBubble>

            {exchanges.length === 0 && !pending && (
              <section aria-labelledby={`${titleId}-try`} className="space-y-2">
                <h3 id={`${titleId}-try`} className="text-label-m text-text-primary">
                  {t.askKopi.tryAsking}
                </h3>
                <ul className="space-y-2">
                  {suggestions.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => ask(question)}
                        className="min-h-11 w-full rounded-sm border-[1.5px] border-border-subtle bg-bg-panel px-3 py-2 text-left text-label-m text-text-primary transition-colors duration-150 ease-out hover:border-border-control hover:bg-bg-default"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {exchanges.map(({ question, answer }, index) => (
              <div key={index} className="space-y-4">
                <Question text={question} />
                <Reply answer={answer} />
              </div>
            ))}

            {pending && <Question text={pending.question} />}
            {sending && (
              <KopiBubble>
                <p className="flex items-center gap-2 text-body-s text-text-muted">
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className={cn('h-1.5 w-1.5 rounded-full bg-text-muted', !reduced && 'animate-pulse')}
                        style={reduced ? undefined : { animationDelay: `${dot * 200}ms` }}
                      />
                    ))}
                  </span>
                  {t.askKopi.thinking}
                </p>
              </KopiBubble>
            )}
            {pending?.status === 'unavailable' && (
              <div className="space-y-3">
                <Banner
                  type="info"
                  title={t.askKopi.unavailableTitle}
                  body={hasCheckup ? t.askKopi.unavailableWithCheckup : t.askKopi.unavailableWithoutCheckup}
                />
                <div className="flex flex-wrap gap-2">
                  {hasCheckup ? (
                    <>
                      <Button variant="secondary" onClick={() => go(routes.radar)}>
                        {t.askKopi.openRadar}
                      </Button>
                      <Button variant="secondary" onClick={() => go(routes.roadmap)}>
                        {t.askKopi.openRoadmap}
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={() => go(routes.checkUp)}>
                      {t.askKopi.startCheckup}
                    </Button>
                  )}
                </div>
              </div>
            )}
            {pending?.status === 'error' && (
              <div className="space-y-3">
                <Banner type="error" title={t.askKopi.errorTitle} body={t.askKopi.errorBody} />
                <Button
                  variant="secondary"
                  iconStart={<RotateCcw className="h-5 w-5 stroke-current" aria-hidden="true" />}
                  onClick={() => ask(pending.question)}
                >
                  {c.tryAgain}
                </Button>
              </div>
            )}
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <form onSubmit={submit} className="border-t border-border-subtle p-4 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <label htmlFor={inputId} className="sr-only">
              {t.askKopi.questionLabel}
            </label>
            <textarea
              ref={inputRef}
              id={inputId}
              rows={2}
              maxLength={CHAT_QUESTION_MAX_LENGTH}
              value={draft}
              readOnly={sending}
              aria-disabled={sending || undefined}
              aria-describedby={hintId}
              placeholder={hasCheckup ? t.askKopi.placeholderWithCheckup : t.askKopi.placeholderWithoutCheckup}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }}
              className="block min-w-0 flex-1 resize-none rounded-sm border border-border-control bg-bg-default px-3 py-2.5 font-sans text-body-m text-text-primary placeholder:text-text-muted transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-disabled:bg-bg-panel aria-disabled:text-text-muted"
            />
            <span id={hintId} className="sr-only">
              {t.askKopi.inputHint}
            </span>
            <Button
              type="submit"
              variant="primary"
              iconStart={<SendHorizontal className="h-5 w-5 stroke-current" aria-hidden="true" />}
              disabled={sending || !draft.trim()}
            >
              {t.askKopi.send}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

// Kopi's turn, framed like the speech box (DESIGN.md "Spacing, radius and surfaces").
function KopiBubble({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-md border-2 border-text-primary bg-bg-default p-4">
      <p className="font-mono text-mono-s text-text-muted">Kopi</p>
      {children}
    </div>
  )
}

function Question({ text }: { text: string }) {
  const t = useText(shellText)

  return (
    <p
      data-question
      className="ml-auto w-fit max-w-[85%] whitespace-pre-line break-words rounded-md border border-border-subtle bg-bg-panel px-3 py-2 text-body-m text-text-primary"
    >
      <span className="sr-only">{t.askKopi.youAsked}</span>
      {text}
    </p>
  )
}

function Spans({ spans }: { spans: ChatSpan[] }) {
  return spans.map((span, index) =>
    span.kind === 'strong' ? (
      <strong key={index} className="font-bold">
        {span.text}
      </strong>
    ) : span.kind === 'em' ? (
      <em key={index}>{span.text}</em>
    ) : span.kind === 'code' ? (
      <code key={index} className="rounded-sm bg-bg-panel px-1 font-mono text-mono-s">
        {span.text}
      </code>
    ) : (
      span.text
    )
  )
}

function ChatList({ ordered, start, items }: { ordered: boolean; start: number; items: ChatSpan[][] }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <List
      start={ordered && start !== 1 ? start : undefined}
      className={cn('space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc')}
    >
      {items.map((item, index) => (
        <li key={index}>
          <Spans spans={item} />
        </li>
      ))}
    </List>
  )
}

// Claude's light Markdown as text elements: paragraphs, headings and lists, with bold, italic and code.
function ChatText({ text }: { text: string }) {
  return parseChatText(text).map((block, index) =>
    block.kind === 'heading' ? (
      <p key={index} className="font-bold">
        <Spans spans={block.spans} />
      </p>
    ) : block.kind === 'list' ? (
      <ChatList key={index} ordered={block.ordered} start={block.start} items={block.items} />
    ) : (
      <p key={index}>
        {block.lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            <Spans spans={line} />
          </span>
        ))}
      </p>
    )
  )
}

// A reply with the Kotak tools behind it, their sources and dates, and the AI-drafted label the app puts on Claude's
// text (Reasoning's footer).
function Reply({ answer }: { answer: AgentChatResponse }) {
  const c = useText(commonText)
  const t = useText(shellText)

  return (
    <KopiBubble>
      <div className="space-y-2 break-words text-body-m text-text-primary">
        <ChatText text={answer.reply} />
      </div>
      {answer.tools.length > 0 ? (
        <div className="space-y-1.5">
          <h3 className="text-label-s text-text-muted">{t.askKopi.toolsRan}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {answer.tools.map((tool, index) => (
              <li
                key={index}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-panel px-2.5 py-1 font-mono text-mono-s text-text-primary"
              >
                <Wrench className="h-3.5 w-3.5 shrink-0 stroke-current" aria-hidden="true" />
                {tool.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-body-s text-text-muted">{t.askKopi.noTools}</p>
      )}
      {answer.sources.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-label-s text-text-muted">{c.sources}</h3>
          <ul className="space-y-1">
            {answer.sources.map((source) => (
              <li key={`${source.source_name} ${source.vintage_date}`} className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1 text-body-s text-text-primary">{source.source_name}</span>
                <span className="shrink-0 font-mono text-mono-s text-text-muted">{source.vintage_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="border-t border-border-subtle pt-2 font-mono text-mono-s text-text-muted">{t.askKopi.aiDrafted}</p>
    </KopiBubble>
  )
}

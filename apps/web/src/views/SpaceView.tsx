import { ArrowLeft, Box, MessageCircle } from 'lucide-react'
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject
} from 'react'
import { useSearch } from '../app/router'
import { routes, spacePath } from '../app/routes'
import { ASK_KOPI_PANEL_ID, AskKopiPanel } from '../app/shell/AskKopi'
import { useReducedMotion } from '../components/kopi/motion'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { Banner } from '../components/ui/Banner'
import { Button, ButtonLink } from '../components/ui/Button'
import { Kbd } from '../components/ui/Kbd'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { commonText } from '../i18n/common'
import { spaceText } from '../i18n/messages/space'
import { useText } from '../i18n/text'
import { useScenario } from '../session/scenario'
import { useActiveSnapshot } from '../session/snapshot'
import { readGuestSession, startGuestSession, useGuestSession } from '../session/store'
import { startAgain } from './checkup/startAgain'
import { SpaceTable, spaceTableTitle } from './space/SpaceTable'
import { useSpaceModel } from './space/useSpaceModel'

// The space (/app/space): every job for the session's answers, in 3D, with the same numbers one key away in a table
// dialog over it. Without the 3D view (no WebGL, a failed scene, or reduced motion), the same dialog shows the table
// over the dark page. It fills the viewport outside the app shell and stays dark in both themes (.space-dark), leaving
// the global theme alone. The scenario and snapshot are the session's, so a flip here moves every other screen too.
// With no answers, Look Around (?view=look-around) shows the space without them, and starts no session.

const SpaceScene = lazy(() => import('./space/scene/SpaceScene'))

/** Whether this browser can draw WebGL at all; the test context is released at once. */
function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return gl !== null
  } catch {
    return false
  }
}

/** Catches a scene that fails to load or to start, so the page falls back to the table dialog. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('The 3D space failed, so the page shows its table.', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

// Inputs that take no typing, so D still works from the scenario switch's radios.
const KEYLESS_INPUTS = new Set(['radio', 'checkbox', 'button', 'submit', 'reset'])

/**
 * D opens and closes the table dialog from anywhere on the page, inside it too, but not while the user types or
 * another dialog (How to Read, the sources) has focus.
 */
function useToggleKey(onToggle: () => void, table: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key !== 'd' && event.key !== 'D') return
      const target = event.target
      if (target instanceof HTMLElement) {
        const dialog = target.closest('dialog, [role="dialog"]')
        if (
          target.isContentEditable ||
          /^(TEXTAREA|SELECT)$/.test(target.tagName) ||
          (target instanceof HTMLInputElement && !KEYLESS_INPUTS.has(target.type)) ||
          (dialog && dialog !== table.current)
        )
          return
      }
      event.preventDefault()
      onToggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onToggle, table])
}

/** The way out of the space; `iconOnPhone` keeps only its arrow on a phone, as the HUD's does, where a dialog's header
 * has no room for its words. */
function BackToDashboard({ iconOnPhone = false }: { iconOnPhone?: boolean }) {
  const t = useText(spaceText)
  return (
    <ButtonLink
      to={routes.home}
      variant="ghost"
      aria-label={iconOnPhone ? t.backToDashboard : undefined}
      iconStart={<ArrowLeft className="size-5 stroke-current" aria-hidden="true" />}
      className={iconOnPhone ? 'max-sm:w-11 max-sm:!px-0' : undefined}
    >
      {iconOnPhone ? <span className="max-sm:hidden">{t.backToDashboard}</span> : t.backToDashboard}
    </ButtonLink>
  )
}

/** Opens and closes the app's Ask Kopi chat window, as the HUD's link does; on a phone only its icon, like the exit. */
function AskKopiToggle({ open, onClick, ref }: { open: boolean; onClick: () => void; ref: Ref<HTMLButtonElement> }) {
  const c = useText(commonText)
  return (
    <Button
      ref={ref}
      variant="ghost"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={ASK_KOPI_PANEL_ID}
      aria-label={c.askKopi}
      iconStart={<MessageCircle className="size-5 stroke-current" aria-hidden="true" />}
      className="max-sm:w-11 max-sm:!px-0"
      onClick={onClick}
    >
      <span className="max-sm:hidden" translate="no">
        {c.askKopi}
      </span>
    </Button>
  )
}

interface KopiProps {
  open: boolean
  onToggle: () => void
  toggleRef: Ref<HTMLButtonElement>
}

/** The language, Ask Kopi and the way out, in one row, as the HUD's top right has them. */
function SpaceActions({ kopi }: { kopi: KopiProps }) {
  return (
    <div className="flex items-center gap-2">
      <LanguageToggle />
      <AskKopiToggle ref={kopi.toggleRef} open={kopi.open} onClick={kopi.onToggle} />
      <BackToDashboard iconOnPhone />
    </div>
  )
}

// The idle, loading and error states, with the same actions as the table and the 3D view's HUD, top right. They sit in
// the flow above the content, so a short landscape screen scrolls instead of overlapping the two.
function Centered({ kopi, children }: { kopi: KopiProps; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col gap-4 px-6 py-6">
      <div className="flex justify-end">
        <SpaceActions kopi={kopi} />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4">{children}</div>
    </main>
  )
}

export function SpaceView({ dataLabel }: { dataLabel: string }) {
  const t = useText(spaceText)
  const c = useText(commonText)
  const search = new URLSearchParams(useSearch())
  const lookAround = search.get('view') === 'look-around'
  // A deep link from another screen (?job=<O*NET code>) opens on that job; an unknown code is ignored.
  const linkedJob = search.get('job')
  if (!lookAround && !readGuestSession()) startGuestSession()

  const session = useGuestSession()
  const again = startAgain(session)
  const loaded = useSpaceModel({ lookAround })
  const [scenario, setScenario] = useScenario()
  const [snapshotId, setSnapshotId] = useActiveSnapshot()
  const { reduced } = useReducedMotion()
  const [webgl] = useState(webglAvailable)
  const [failed, setFailed] = useState(false)
  // Under reduced motion the space opens on its table until the user asks for 3D with D or Show 3D.
  const [want3D, setWant3D] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)
  // The job pinned in the space, which the table opens on.
  const [focusCode, setFocusCode] = useState<string | null>(null)
  const tableRef = useRef<HTMLDialogElement>(null)
  // The Ask Kopi window, opened from the actions above the table or the states, as the HUD opens its own.
  const [kopiOpen, setKopiOpen] = useState(false)
  const kopiToggle = useRef<HTMLButtonElement>(null)
  const kopi: KopiProps = { open: kopiOpen, onToggle: () => setKopiOpen((open) => !open), toggleRef: kopiToggle }
  const kopiPanel = (
    <AskKopiPanel
      open={kopiOpen}
      onClose={() => setKopiOpen(false)}
      dataLabel={dataLabel}
      returnFocusRef={kopiToggle}
    />
  )

  // The address follows the job in focus in the space (?job=), so a reload or a shared link opens on what was on
  // screen; the scene reads the deep link once, on mount.
  const onFocusChange = useCallback(
    (code: string | null) => {
      setFocusCode(code)
      window.history.replaceState(null, '', spacePath(code ?? undefined, lookAround))
    },
    [lookAround]
  )

  const canDraw3D = webgl && !failed
  const scene = canDraw3D && (!reduced || want3D)
  const toggle = () => {
    if (scene) setTableOpen((open) => !open)
    else if (canDraw3D) setWant3D(true)
  }
  useToggleKey(toggle, tableRef)

  let content: ReactNode
  if (loaded.status === 'idle') {
    // No answers yet: Kopi asks for the check-up, or offers a look around first.
    content = (
      <Centered kopi={kopi}>
        <h1 className="sr-only">{c.nav.space}</h1>
        <CatDialogue pose="worried" size="lg" speech={`${again.speech}${t.thenPlaceJobs}`} />
        <div className="flex flex-wrap gap-3">
          <ButtonLink to={again.route} variant="primary" size="lg">
            {again.label}
          </ButtonLink>
          <ButtonLink to={spacePath(linkedJob ?? undefined, true)} variant="secondary" size="lg">
            {t.lookAround}
          </ButtonLink>
        </div>
      </Centered>
    )
  } else if (loaded.status === 'error') {
    content = (
      <Centered kopi={kopi}>
        <h1 className="sr-only">{c.nav.space}</h1>
        <Banner type="error" title={t.couldNotOpen.title} body={t.couldNotOpen.body} />
        <Button variant="secondary" className="self-start" onClick={loaded.retry}>
          {c.tryAgain}
        </Button>
      </Centered>
    )
  } else if (loaded.status === 'loading') {
    content = (
      <Centered kopi={kopi}>
        <h1 className="sr-only">{c.nav.space}</h1>
        <p className="flex items-center gap-3 text-body-m text-text-primary">
          <Spinner label={t.loadingSpace} />
          {lookAround ? t.placingJobs : t.placingJobsForAnswers}
        </p>
      </Centered>
    )
  } else {
    const note = !webgl ? t.tableNote.noWebgl : failed ? t.tableNote.failed : !scene ? t.tableNote.reduced : undefined
    const deepJob = loaded.data.jobs.some((job) => job.code === linkedJob) ? linkedJob : null
    const tableShown = !scene || tableOpen
    content = (
      <main className="relative h-dvh w-full overflow-hidden">
        {scene ? (
          // The scene's HUD carries the page's h1 (the future's name), Back to Dashboard and Show the Table; D is
          // handled here. The scene stays mounted under the table dialog and stops drawing while it is open.
          <SceneBoundary onError={() => setFailed(true)}>
            <Suspense
              fallback={
                <div className="relative flex h-full items-center justify-center">
                  <h1 className="sr-only">{t.heading3D}</h1>
                  <div className="absolute right-6 top-6">
                    <BackToDashboard />
                  </div>
                  <Spinner label={t.loading3D} />
                </div>
              }
            >
              <SpaceScene
                model={loaded.data}
                initialJob={deepJob}
                scenario={scenario}
                snapshotId={snapshotId}
                onScenario={setScenario}
                onSnapshot={setSnapshotId}
                show2D={() => setTableOpen(true)}
                onContextLost={() => setFailed(true)}
                checkUp={again}
                paused={tableOpen}
                focusTitle={want3D}
                onFocusChange={onFocusChange}
              />
            </Suspense>
          </SceneBoundary>
        ) : (
          <h1 className="sr-only">{c.nav.space}</h1>
        )}
        {/* Over the 3D view, closing returns to it. Without it, the dialog is the page: it has no close button and Esc
            does nothing, and Back to Dashboard, in its header so a keyboard reaches it before the rows, leaves the
            space. */}
        <Modal
          ref={tableRef}
          open={tableShown}
          onClose={() => setTableOpen(false)}
          title={spaceTableTitle(loaded.data, snapshotId, scenario)}
          closeTooltip={false}
          closeVariant="bare"
          backdrop="none"
          body="fill"
          dismissible={scene}
          headerAction={scene ? undefined : <SpaceActions kopi={kopi} />}
          widthClass="w-[min(72rem,calc(100vw-2rem))]"
        >
          {tableShown && (
            <SpaceTable
              model={loaded.data}
              scenario={scenario}
              snapshotId={snapshotId}
              targetCode={scene ? focusCode : deepJob}
              pinnedCode={scene ? focusCode : null}
              note={note}
              actions={
                !scene && canDraw3D ? (
                  <Button
                    variant="secondary"
                    iconStart={<Box className="size-5 stroke-current" aria-hidden="true" />}
                    aria-keyshortcuts="D"
                    onClick={toggle}
                  >
                    {t.show3D}
                    <Kbd className="not-any-pointer-fine:hidden">D</Kbd>
                  </Button>
                ) : undefined
              }
            />
          )}
          {/* The table is modal here, so the chat window opens inside it to stay usable. */}
          {!scene && kopiPanel}
        </Modal>
      </main>
    )
  }

  return (
    // The chat window opens from a header row, with no floating button to clear at the foot.
    <div
      className="space-dark min-h-dvh bg-bg-default text-text-primary"
      style={{ '--ask-kopi-clearance': '1rem' } as CSSProperties}
    >
      {content}
      {loaded.status !== 'ready' && kopiPanel}
    </div>
  )
}

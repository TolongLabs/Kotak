import { Canvas } from '@react-three/fiber'
import type { Scenario } from '@kotak/shared'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AskKopiPanel } from '../../../app/shell/AskKopi'
import { useReducedMotion } from '../../../components/kopi/motion'
import { cn } from '../../../components/ui/cn'
import { commonText } from '../../../i18n/common'
import { spaceText } from '../../../i18n/messages/space'
import { textNow, useText } from '../../../i18n/text'
import { groupName, monthLabel } from '../format'
import type { SpaceSceneProps } from '../model'
import { HowToRead, Hud, JobCard, monthNote } from './Hud'
import { fieldLayout, monthIds, phoneShot, ringLabels, shortShot, shots, tuftPosition, type ShotName } from './layout'
import { usePhoneLayout } from './usePhoneLayout'
import { World, type HudBoxes, type Pick } from './World'

// The 3D space, "Two Futures" (lazy-loaded by SpaceView): the canvas, the HUD over it, and the keys. F or 1/2 flip the
// AI future, M the month, H the guide, R flies the camera back to the opening view, the arrows step through the jobs,
// Esc closes; SpaceView owns D, the table. `?shot=wide|field|tuft|ring` locks one of the four camera shots without
// drift, for checking the frame by eye.

const SHOT_NAMES: ShotName[] = ['wide', 'field', 'tuft', 'ring']
const KEYLESS_INPUTS = new Set(['radio', 'checkbox', 'button', 'submit', 'reset'])
/** Set once the user has moved the camera, so the first-visit hint stays away after that. */
const STEERED_KEY = 'kotak:space-steered'
/** Below this height (a short screen) or on a phone (usePhoneLayout) a card doesn't dock under the title, where the sky
 * band is too short to hold one: it takes the title block's place, or on a phone the foot's, and your card waits for a
 * tap. */
const SHORT = 600
/** From this height the full card fits in the dark sky under the title, above the field; below it the card takes its
 * short form, which stays above the horizon. */
const TALL = 1000

function typing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      /^(TEXTAREA|SELECT)$/.test(target.tagName) ||
      (target instanceof HTMLInputElement && !KEYLESS_INPUTS.has(target.type)) ||
      Boolean(target.closest('dialog, [role="dialog"]')))
  )
}

/** The viewport's size, kept in state so the cards' layout follows a resize. */
function useViewport() {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return viewport
}

function useTabVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

/** Whether the user has never moved the camera here; storage may be off, and then the hint shows once per visit. */
function firstVisit() {
  try {
    return localStorage.getItem(STEERED_KEY) === null
  } catch {
    return true
  }
}

export default function SpaceScene(props: SpaceSceneProps) {
  const { model, scenario, snapshotId, onScenario, onSnapshot, show2D, onContextLost, checkUp, paused, focusTitle } =
    props
  const { onFocusChange, initialJob } = props
  const t = useText(spaceText)
  const { reduced } = useReducedMotion()
  const visible = useTabVisible()
  const viewport = useViewport()
  const phone = usePhoneLayout()
  const sheetCards = phone || viewport.height < SHORT
  const compactCards = phone || viewport.height < TALL
  // A short landscape screen keeps the desktop layout, compacted (Hud's `short`), with its own opening shot.
  const short = !phone && viewport.height < SHORT
  const layout = useMemo(() => fieldLayout(model), [model])
  // The jobs from left to right across the fan, for the arrow keys.
  const fanOrder = useMemo(
    () => [...layout.angles.keys()].sort((a, b) => layout.angles[a]! - layout.angles[b]!),
    [layout]
  )
  const months = useMemo(() => monthIds(model), [model])
  const month = snapshotId === months[0] && months[0] !== months[1] ? 0 : 1
  const future = scenario === 'fast' ? 1 : 0
  // -1 in Look Around, which has no job of yours.
  const yours = model.jobs.findIndex((job) => job.kind === 'yours')
  // A deep link's job (?job=), read once: -1 for none or an unknown code, which is ignored.
  const [linked] = useState(() => (initialJob === null ? -1 : model.jobs.findIndex((job) => job.code === initialJob)))

  const [shotName] = useState<ShotName | null>(() => {
    const name = new URLSearchParams(window.location.search).get('shot') as ShotName | null
    return name && SHOT_NAMES.includes(name) ? name : null
  })
  // The tuft shot frames the assessed job's tuft in the newer month, May slow; it doesn't chase a switch. Look Around
  // has no such tuft, so the shot frames the box. A phone and a short screen open on their own shots, clear of their
  // HUD.
  const shot = useMemo(
    () =>
      shotName === null && phone
        ? phoneShot()
        : shotName === null && short
          ? shortShot()
          : shots(yours >= 0 ? tuftPosition(layout, yours, 0, 1) : [0, 0])[shotName ?? 'wide'],
    [layout, yours, shotName, phone, short]
  )

  const hud = useRef<HudBoxes>({})
  const canvas = useRef<HTMLCanvasElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  /** What had focus when the card opened, for focus to return to when it is closed. */
  const opener = useRef<HTMLElement | null>(null)
  const [hover, setHover] = useState<Pick | null>(null)
  // A deep link opens on its job's card, as if picked by key, so it is announced; yours opens pinned instead.
  const [selected, setSelected] = useState<Pick | null>(() =>
    linked >= 0 && linked !== yours ? { index: linked, x: Number.NaN, y: Number.NaN } : null
  )
  // Your card opens pinned in the dock; on a phone or a short screen it waits for a tap, so the field shows first.
  const [pinned, setPinned] = useState(
    () => (linked >= 0 && linked === yours) || (yours >= 0 && !phone && window.innerHeight >= SHORT)
  )
  const [kopiOpen, setKopiOpen] = useState(false)
  const kopiLink = useRef<HTMLButtonElement>(null)
  const [help, setHelp] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [resetView, setResetView] = useState(0)
  const [still, setStill] = useState(false)
  const [hint, setHint] = useState(firstVisit)

  const onPick = useCallback(
    (pick: Pick | null, how: 'hover' | 'tap') => {
      if (how === 'hover') {
        setHover((current) => (current?.index === pick?.index ? current : pick))
        return
      }
      if (pick !== null && pick.index === yours) {
        setPinned(true)
        setSelected(null)
      } else setSelected(pick)
    },
    [yours]
  )

  const onSteer = useCallback((steering: boolean) => {
    if (!steering) return
    setHover(null)
    setHint(false)
    try {
      localStorage.setItem(STEERED_KEY, '1')
    } catch {
      // Storage is off; the hint just comes back on the next visit.
    }
  }, [])

  // A double-click or double-tap flew the camera to a tuft: pin its card.
  const onFocusJob = useCallback(
    (code: string) => {
      const index = model.jobs.findIndex((job) => job.code === code)
      if (index < 0) return
      if (index === yours) {
        setPinned(true)
        setSelected(null)
      } else setSelected({ index, x: Number.NaN, y: Number.NaN })
    },
    [model, yours]
  )

  // Closing a card (its button or Esc) returns focus to what opened it, or to the title when that was the page itself,
  // as after a tap on a tuft.
  const returnFocus = useCallback(() => {
    const to = opener.current?.isConnected ? opener.current : title.current
    opener.current = null
    to?.focus()
  }, [])

  // One line on each switch, as a globe's legend does; it clears after a few seconds.
  const previous = useRef({ scenario, snapshotId })
  useEffect(() => {
    const before = previous.current
    previous.current = { scenario, snapshotId }
    const snapshot = model.snapshots.find((s) => s.id === snapshotId)
    const text = textNow(spaceText)
    const name = textNow(commonText).scenarios[scenario]
    let line: string | null = null
    if (before.scenario !== scenario) {
      line = scenario === 'fast' ? text.hud.announceFast(name) : text.hud.announceSlow(name)
    } else if (before.snapshotId !== snapshotId && snapshot) {
      line = text.hud.announceMonth(monthLabel(snapshot), monthNote(model, snapshotId))
    }
    if (!line) return
    setAnnouncement(line)
    const timer = window.setTimeout(() => setAnnouncement(null), 4500)
    return () => window.clearTimeout(timer)
  }, [scenario, snapshotId, model])

  // Keys, only while the space is mounted and nobody is typing. Any key the space handles also holds the camera still,
  // so a keyboard user can stop the drift; R flies back and lets it drift again.
  useEffect(() => {
    const flip = (to?: Scenario) => onScenario(to ?? (scenario === 'slow' ? 'fast' : 'slow'))
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
      // Esc closes the sources from anywhere, inside them too, where the other keys stand down; a dialog over them
      // (How to Read, the table) takes it first.
      if (event.key === 'Escape' && sourcesOpen !== null && !document.querySelector('dialog:modal')) {
        setSourcesOpen(null)
        setStill(true)
        event.preventDefault()
        return
      }
      if (typing(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'arrowright') {
        // The arrows belong to a focused control first: the switches move with them.
        const target = event.target
        if (target instanceof HTMLInputElement || (target instanceof Element && target.closest('[role="radiogroup"]')))
          return
        // Step through the jobs across the fan, from the one in hand, your own, or the middle of the fan.
        const from = selected?.index ?? (yours >= 0 ? yours : fanOrder[fanOrder.length >> 1]!)
        const at = fanOrder.indexOf(from)
        const next = fanOrder[Math.min(fanOrder.length - 1, Math.max(0, at + (key === 'arrowright' ? 1 : -1)))]!
        setSelected({ index: next, x: Number.NaN, y: Number.NaN })
        setStill(true)
        event.preventDefault()
        return
      }
      if (event.repeat) return
      if (key === 'f') flip()
      else if (key === '1') flip('slow')
      else if (key === '2') flip('fast')
      else if (key === 'm') onSnapshot(snapshotId === months[1] ? months[0] : months[1])
      else if (key === 'h') setHelp((open) => !open)
      else if (key === 'r') setResetView((n) => n + 1)
      else if (key === 'escape') {
        if (selected) setSelected(null)
        else if (pinned) setPinned(false)
        else return
        returnFocus()
      } else return
      setStill(key !== 'r')
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    scenario,
    snapshotId,
    months,
    onScenario,
    onSnapshot,
    sourcesOpen,
    selected,
    pinned,
    fanOrder,
    yours,
    returnFocus
  ])

  // The canvas is one picture to a screen reader, named by what it draws; How to Read says the rest.
  const picture = model.answers
    ? t.hud.pictureAnswers(model.jobs.length, t.list(ringLabels(model, t)))
    : t.hud.pictureLookAround(model.jobs.length)
  useEffect(() => {
    canvas.current?.setAttribute('role', 'img')
    canvas.current?.setAttribute('aria-label', picture)
  }, [picture])

  const onLost = useCallback(() => {
    console.error('The 3D space lost its WebGL context, so the page shows its table.')
    onContextLost()
  }, [onContextLost])

  // Every card docks in the dark sky under the title rather than beside its tuft over the lit field, one at a time, in
  // its short form on a screen under TALL: the one in hand (hovered, tapped, picked by key or flown to) takes your
  // card's place while it is open. Your own job, picked while its card isn't pinned, shows the same way.
  const floating = selected ?? hover
  const floatingJob = floating && !(floating.index === yours && pinned) ? model.jobs[floating.index] : null
  const yoursJob = yours >= 0 ? model.jobs[yours] : undefined
  // The job in focus for the table: the card picked and held open, otherwise your pinned card, otherwise none.
  const focusCode = selected ? model.jobs[selected.index]!.code : pinned && yoursJob ? yoursJob.code : null
  useEffect(() => {
    onFocusChange?.(focusCode)
  }, [focusCode, onFocusChange])
  // A card picked by key or flown to is announced; one picked by pointer is in view already.
  const byKey = floating !== null && !Number.isFinite(floating.x)

  const shownJob = floatingJob ?? (pinned ? yoursJob : undefined)
  // What has focus as a card opens is where its close returns focus; the page itself (after a tap) counts as nothing.
  const cardOpen = shownJob !== undefined
  useEffect(() => {
    if (!cardOpen) return
    const active = document.activeElement
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null
  }, [cardOpen])
  // On a phone the card opens in the HUD's foot, which gives way to it, along the bottom; the sources, opened from it,
  // take its place in turn. On a short screen it takes the title block's place, in the dark sky top left, as the field
  // fills the rest of the frame.
  const sheetShown = phone && shownJob !== undefined && sourcesOpen === null
  const shownCard = shownJob && (
    <JobCard
      model={model}
      job={shownJob}
      scenario={scenario}
      snapshotId={snapshotId}
      onCite={setSourcesOpen}
      onClose={() => {
        if (shownJob === floatingJob) {
          setSelected(null)
          setHover(null)
        } else setPinned(false)
        returnFocus()
      }}
      closeLabel={shownJob === floatingJob ? t.card.close : t.card.unpin}
      form={short ? 'line' : compactCards ? 'compact' : 'full'}
      // A hovered card lets the pointer through; a tapped one takes it.
      className={
        phone
          ? cn('pointer-events-auto fixed inset-x-3 bottom-3 z-30 w-auto', !sheetShown && 'invisible')
          : shownJob === floatingJob && !selected
            ? 'pointer-events-none'
            : 'pointer-events-auto'
      }
      style={phone ? { maxHeight: '45dvh' } : undefined}
    />
  )

  return (
    // The chat window opens from the HUD's Ask Kopi link, with no floating button to clear at the foot.
    <div className="absolute inset-0 bg-bg-default" style={{ '--ask-kopi-clearance': '1rem' } as CSSProperties}>
      {/* No frames while the tab is hidden. While the page's table covers the scene, only a resize draws one, with
          World's clock held, so the scene stays visible behind it and resumes where it stopped. */}
      <Canvas
        ref={canvas}
        flat
        dpr={1}
        frameloop={!visible ? 'never' : paused ? 'demand' : 'always'}
        camera={{ fov: 40, near: 0.1, far: 5000, position: [0, 2, 6] }}
        gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        className="!absolute inset-0"
      >
        <World
          model={model}
          layout={layout}
          future={future}
          month={month}
          reduced={reduced}
          shot={shot}
          drift={shotName === null}
          paused={paused}
          highlight={floating?.index ?? null}
          yours={yours}
          hud={hud}
          resetView={resetView}
          flyTo={linked >= 0 ? linked : null}
          still={still}
          onPick={onPick}
          onSteer={onSteer}
          onFocusJob={onFocusJob}
          onLost={onLost}
        />
      </Canvas>
      <p className="sr-only" aria-live="polite">
        {byKey && floating
          ? t.hud.jobInHand(model.jobs[floating.index]!.title, groupName(t, model.jobs[floating.index]!))
          : ''}
      </p>
      <p className="sr-only">{t.hud.sameNumbers}</p>
      <Hud
        model={model}
        scenario={scenario}
        snapshotId={snapshotId}
        onScenario={onScenario}
        onSnapshot={onSnapshot}
        show2D={show2D}
        announcement={announcement}
        hint={hint}
        hud={hud}
        sourcesOpen={sourcesOpen}
        setSourcesOpen={setSourcesOpen}
        onHelp={() => setHelp(true)}
        pinned={pinned}
        onPin={() => setPinned((on) => !on)}
        checkUp={checkUp}
        focusTitle={focusTitle}
        title={title}
        sheet={sheetShown}
        bottomSheets={sheetCards}
        docked={!sheetCards && shownJob !== undefined}
        short={short}
        headerCard={short && shownCard}
        kopiOpen={kopiOpen}
        onKopi={() => setKopiOpen((open) => !open)}
        kopiLink={kopiLink}
      >
        {!sheetCards && shownCard}
      </Hud>
      {phone && shownCard}
      <HowToRead open={help} onClose={() => setHelp(false)} model={model} />
      <AskKopiPanel
        open={kopiOpen}
        onClose={() => setKopiOpen(false)}
        dataLabel={monthLabel(model.snapshots.find((s) => s.id === snapshotId)!)}
        returnFocusRef={kopiLink}
      />
    </div>
  )
}

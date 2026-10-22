import type { KopiPose } from './poses'

// Kopi is Live2D's sample model Hijiki (© Live2D Inc.): its Cubism 3 runtime files from Live2D's sample page go in
// apps/web/public/kopi/live2d/hijiki/, with the settings file named hijiki.model3.json. Kopi plays the motion group
// named after the pose ("Idle", "Asking", "Thinking", "Happy", "Worried", "Explaining"), so map Hijiki's motions to
// poses by naming the groups under "Motions" in that file. A missing group keeps Kopi idling.
const KOPI_MODEL_URL = '/kopi/live2d/hijiki/hijiki.model3.json'

// Cubism Core is Live2D's proprietary runtime, so it loads from Live2D instead of shipping in the repository.
const CUBISM_CORE_URL = 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js'

export interface KopiStage {
  setPose: (pose: KopiPose) => void
  destroy: () => void
}

type ModelSettings = { url: string; FileReferences: { Moc: string; Motions?: Record<string, unknown> } }

// Checking the settings file first means a missing model costs one small request, not the whole Live2D stack.
let settingsRequest: Promise<ModelSettings | null> | undefined
let coreRequest: Promise<void> | undefined

function loadSettings() {
  settingsRequest ??= fetch(KOPI_MODEL_URL)
    .then((response) => (response.ok ? response.json() : null))
    .then((json) => (json?.FileReferences?.Moc ? ({ ...json, url: KOPI_MODEL_URL } as ModelSettings) : null))
    .catch(() => null)
  return settingsRequest
}

function loadCubismCore() {
  coreRequest ??= new Promise<void>((resolve, reject) => {
    if ('Live2DCubismCore' in window) return resolve()
    const script = document.createElement('script')
    script.src = CUBISM_CORE_URL
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      coreRequest = undefined
      reject(new Error('Cubism Core did not load.'))
    }
    document.head.append(script)
  })
  return coreRequest
}

function motionGroup(pose: KopiPose) {
  return pose[0]!.toUpperCase() + pose.slice(1)
}

// pixi-live2d-display 0.4 shares one Cubism shader set across WebGL contexts, so only one Kopi per page is drawn
// with Live2D. Any other Kopi on the same page keeps its static pose art.
let stageOwner: AbortSignal | null = null

// Draws Kopi into `host`. Resolves to null when the model is missing, another Kopi holds the stage or the load
// was cancelled; throws when WebGL or the runtime fails. Either way the caller keeps the static pose art.
export async function mountKopiStage(
  host: HTMLElement,
  pose: KopiPose,
  signal: AbortSignal
): Promise<KopiStage | null> {
  if (stageOwner) return null
  stageOwner = signal
  const release = () => {
    if (stageOwner === signal) stageOwner = null
  }
  signal.addEventListener('abort', release)

  const stage = await drawKopi(host, pose, signal).catch((error: unknown) => {
    release()
    throw error
  })
  if (!stage) release()
  return stage
}

async function drawKopi(host: HTMLElement, pose: KopiPose, signal: AbortSignal): Promise<KopiStage | null> {
  const settings = await loadSettings()
  if (!settings || signal.aborted) return null

  await loadCubismCore()
  const [{ Application, Ticker }, { Live2DModel, MotionPriority }] = await Promise.all([
    import('pixi.js'),
    import('pixi-live2d-display/cubism4')
  ])
  if (signal.aborted) return null

  Live2DModel.registerTicker(Ticker)
  const app = new Application({ backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: devicePixelRatio })
  const destroyApp = () => app.destroy(true, { children: true, texture: true, baseTexture: true })
  const model = await Live2DModel.from(structuredClone(settings), { autoInteract: false }).catch((error: unknown) => {
    destroyApp()
    throw error
  })
  app.stage.addChild(model)
  if (signal.aborted) {
    destroyApp()
    return null
  }

  app.view.style.display = 'block'
  host.append(app.view)
  model.anchor.set(0.5, 0.5)

  const fit = () => {
    const { clientWidth: width, clientHeight: height } = host
    app.renderer.resize(width, height)
    model.scale.set(1)
    model.scale.set(Math.min(width / model.width, height / model.height))
    model.position.set(width / 2, height / 2)
  }
  const resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(host)
  fit()

  const groups = Object.keys(settings.FileReferences.Motions ?? {})
  const setPose = (next: KopiPose) => {
    const group = motionGroup(next)
    if (groups.includes(group)) void model.motion(group, undefined, MotionPriority.FORCE)
  }
  setPose(pose)

  return {
    setPose,
    destroy: () => {
      resizeObserver.disconnect()
      destroyApp()
    }
  }
}

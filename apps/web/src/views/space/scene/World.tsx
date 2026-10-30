import { useFrame, useThree } from '@react-three/fiber'
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  Effect,
  EffectPass,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode
} from 'postprocessing'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { SpaceModel } from '../model'
import { CameraRig } from './camera'
import {
  BLADE_H0,
  FAN_EDGE,
  FUTURE_SECONDS,
  MONTH_SECONDS,
  monthIds,
  REDUCED_SECONDS,
  RING_DISTANCE,
  RING_PER_INDEX,
  RING_RADIUS,
  ringLabels,
  tuftPosition,
  type FieldLayout,
  type Shot
} from './layout'
import {
  BOX_INNER_GLOW,
  BOX_LAMP,
  BOX_OUTER_GLOW,
  BOX_SEAM_GLOW,
  FILL_GROUND,
  FILL_SKY,
  KEY_LIGHT,
  linear,
  TIP_RELATED,
  TIP_YOURS,
  WORLD_COLORS,
  WORLDS,
  type ColorKey,
  type NumberKey
} from './palette'
import * as glsl from './shaders'

// The three.js scene. Every visual reads one shared set of uniforms; the future and the month are two blend weights
// that tween here, so the HUD swaps its numbers at once while the shapes move.

/** The month sweep's width, in the field's order from the horizon in; the blade shader uses the same. */
const SWEEP_WIDTH = 0.22
const BOX_URL = `${import.meta.env.BASE_URL}space/kotak-box.glb`
/** Where an unused HUD text box lies for the sky's shader: far off the frame. */
const NO_BOX = -1e5
/** A double tap: two taps within this many milliseconds and CSS pixels. */
const DOUBLE_TAP_MS = 350
const DOUBLE_TAP_PX = 30

/** A tuft the pointer is on or has picked: its job index and its screen position, in CSS pixels. */
export interface Pick {
  index: number
  x: number
  y: number
}

/**
 * The boxes of the HUD's text in CSS pixels, kept current by the HUD (the ruler's, and the header's blocks, the docked
 * cards and the foot row), so the sky can keep its stars out from under them.
 */
export interface HudBoxes {
  avoid?: DOMRect | null
  text?: DOMRect[] | null
}

interface WorldProps {
  model: SpaceModel
  layout: FieldLayout
  future: number
  month: number
  reduced: boolean
  shot: Shot
  drift: boolean
  /** The page's table covers the scene: a frame drawn then (on a resize) holds the clock, so nothing moves. */
  paused: boolean
  /** The job to light up, hovered or picked; null for none. */
  highlight: number | null
  /** The assessed job's index; -1 in Look Around, which has none. */
  yours: number
  hud: RefObject<HudBoxes>
  /** Increments to fly back to the opening shot and resume the drift. */
  resetView: number
  /** Holds the opening shot still (no drift, no parallax) without locking the controls; R's reset clears it in SpaceScene. */
  still?: boolean
  onPick: (pick: Pick | null, how: 'hover' | 'tap') => void
  /** true while the user drags, zooms or the camera flies; false once it has settled. */
  onSteer: (steering: boolean) => void
  /** A double-click or double-tap on a tuft flew the camera to it. */
  onFocusJob: (code: string) => void
  onLost: () => void
}

type Uniforms = Record<string, THREE.IUniform>

function makeUniforms(): Uniforms {
  const u: Uniforms = {
    uTime: { value: 0 },
    uFuture: { value: 0 },
    uMonth: { value: 1 },
    uSweepOn: { value: 1 },
    uSway: { value: 1 },
    uDrift: { value: 1 },
    uPixel: { value: 1 },
    uH0: { value: BLADE_H0 },
    uHover: { value: -1 },
    uHoverOn: { value: 0 },
    uHoverPos: { value: new THREE.Vector2() },
    uYours: { value: new THREE.Vector2() },
    uYoursColor: { value: linear(TIP_YOURS).multiplyScalar(0.12) },
    uTipYours: { value: linear(TIP_YOURS) },
    uTipRelated: { value: linear(TIP_RELATED) },
    uFanEdge: { value: FAN_EDGE },
    uRings: { value: [-1, -1, -1, -1, -1] },
    uFront: { value: 0 },
    uFrontOn: { value: 0 },
    uCenterY: { value: 0 },
    uLid: { value: 0 },
    uR: { value: RING_RADIUS },
    uHudBoxes: { value: Array.from({ length: glsl.HUD_BOXES }, () => new THREE.Vector4().setScalar(NO_BOX)) }
  }
  for (const key of Object.keys(WORLD_COLORS.slow) as ColorKey[]) u[key] = { value: WORLD_COLORS.slow[key].clone() }
  for (const key of Object.keys(WORLDS.slow.numbers) as NumberKey[]) u[key] = { value: WORLDS.slow.numbers[key] }
  return u
}

interface Tween {
  from: number
  to: number
  start: number
  seconds: number
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function tweenAt(tween: Tween, now: number, ease: (t: number) => number) {
  const t = tween.seconds > 0 ? Math.min(1, Math.max(0, (now - tween.start) / tween.seconds)) : 1
  return tween.from + (tween.to - tween.from) * ease(t)
}

/** Frees a loaded model's geometries, materials and any textures its materials hold. */
function disposeTree(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose()
      material.dispose()
    }
  })
}

/**
 * Each flap shut over the box's top, its inner face down: the image of the flap's own x and y (hinge to edge) axes, and
 * how far its edge tilts up, in degrees. The long flaps (N, S) lie a flap's thickness above the short ones (E, W), as a
 * folded box's do, and reach almost to the middle, raised a little, so the lamp inside shows through the seam between.
 */
const CLOSED_FLAPS: Record<
  string,
  { x: [number, number, number]; y: [number, number, number]; tilt: number; lift: number; reach: number }
> = {
  FlapN: { x: [-1, 0, 0], y: [0, 0, 1], tilt: 4, lift: 0.022, reach: 1.2 },
  FlapS: { x: [1, 0, 0], y: [0, 0, -1], tilt: 4, lift: 0.022, reach: 1.2 },
  FlapE: { x: [0, 0, -1], y: [-1, 0, 0], tilt: 0, lift: 0, reach: 1 },
  FlapW: { x: [0, 0, 1], y: [1, 0, 0], tilt: 0, lift: 0, reach: 1 }
}
/** Kopi on the closed lid, on the far flap, still facing the horizon. */
const KOPI_ON_LID: [number, number, number] = [0, 0.632, -0.2]
const SEAM_COLOR = new THREE.Color().setRGB(...BOX_SEAM_GLOW.rgb).multiplyScalar(BOX_SEAM_GLOW.intensity)

/** The rim of the horizon's light on the box and Kopi, and on a flap's outer face, the closed lid's shading. */
function shadeBox(material: THREE.MeshStandardMaterial, uniforms: Uniforms, rim: string, flap: THREE.Box3 | null) {
  // A closed flap reads darker than the walls, and darker still toward its edges, so the four flaps stand apart.
  const lid = flap
    ? `float flapEdge = min(${flap.max.x.toFixed(3)} - abs(vFlap.x), min(vFlap.y, ${flap.max.y.toFixed(3)} - vFlap.y));
float lidShade = mix(1.0, mix(0.3, 0.72, smoothstep(0.0, 0.03, flapEdge)), uLid);
totalEmissiveRadiance *= lidShade;
diffuseColor.rgb *= lidShade;`
    : ''
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uniforms.uRim!
    shader.uniforms.uLid = uniforms.uLid!
    if (flap)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vFlap;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFlap = position.xy;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform vec3 uRim;\nuniform float uLid;${flap ? '\nvarying vec2 vFlap;' : ''}`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\ntotalEmissiveRadiance += uRim * ${rim} * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 4.0);\n${lid}`
      )
  }
  material.customProgramCacheKey = () => `kotak-rim-${rim}${flap ? `-flap-${flap.max.x.toFixed(3)}` : ''}`
}

/**
 * The box: the Blender glb, lit from inside, with Kopi on the far rim facing the horizon. Closed in Look Around,
 * with Kopi on the lid: it opens when you answer.
 */
function KotakBox({ uniforms, closed, onReady }: { uniforms: Uniforms; closed: boolean; onReady: () => void }) {
  const [root, setRoot] = useState<THREE.Object3D | null>(null)

  useEffect(() => {
    let alive = true
    let loaded: THREE.Object3D | null = null
    new GLTFLoader().load(
      BOX_URL,
      (gltf) => {
        const scene = gltf.scenes.find((s) => s.getObjectByName('Box')) ?? gltf.scene
        loaded = scene
        if (!alive) return disposeTree(scene)
        // The near flap folds down past flat, so even a low camera behind the box sees all of Kopi.
        const nearFlap = scene.getObjectByName('FlapS')
        nearFlap?.rotation.set(THREE.MathUtils.degToRad(100), 0, 0)
        scene.traverse((object) => {
          object.userData.open = { position: object.position.clone(), quaternion: object.quaternion.clone() }
          const mesh = object as THREE.Mesh
          let material = mesh.material as THREE.MeshStandardMaterial | undefined
          if (!material?.isMeshStandardMaterial) return
          // A flap's outer face gets its own copy of the box's material, for the closed lid's shading.
          const onFlap = [mesh.name, mesh.parent?.name].some((name) => name && name in CLOSED_FLAPS)
          let flap: THREE.Box3 | null = null
          if (onFlap && material.name === 'BoxOuter') {
            mesh.geometry.computeBoundingBox()
            flap = mesh.geometry.boundingBox
            material = material.clone()
            mesh.material = material
          }
          // The box reads Kotak yellow after tone mapping (palette.ts, BOX_OUTER_GLOW and BOX_INNER_GLOW).
          if (material.name === 'BoxGlow') {
            material.emissive.setRGB(...BOX_INNER_GLOW.rgb)
            material.emissiveIntensity = BOX_INNER_GLOW.intensity
            return
          }
          if (material.name === 'BoxOuter') {
            material.emissive.setRGB(...BOX_OUTER_GLOW.rgb)
            material.emissiveIntensity = BOX_OUTER_GLOW.intensity
          }
          // A rim of the horizon's light, strong on Kopi's silhouette and faint on the box.
          shadeBox(material, uniforms, material.name === 'KopiFur' ? '1.2' : '0.3', flap)
        })
        setRoot(scene)
      },
      undefined,
      (error) => console.error('The space could not load the box model.', error)
    )
    return () => {
      alive = false
      if (loaded) disposeTree(loaded)
    }
  }, [uniforms])

  useEffect(() => {
    if (root) onReady()
  }, [root, onReady])

  useEffect(() => {
    uniforms.uLid!.value = closed ? 1 : 0
    if (!root) return
    const basis = new THREE.Matrix4()
    root.traverse((object) => {
      const open = object.userData.open as { position: THREE.Vector3; quaternion: THREE.Quaternion } | undefined
      if (!open) return
      object.position.copy(open.position)
      object.quaternion.copy(open.quaternion)
      object.scale.set(1, 1, 1)
      if (!closed) return
      const flap = CLOSED_FLAPS[object.name]
      if (flap) {
        const x = new THREE.Vector3(...flap.x)
        const y = new THREE.Vector3(...flap.y).setY(Math.tan(THREE.MathUtils.degToRad(flap.tilt))).normalize()
        object.quaternion.setFromRotationMatrix(basis.makeBasis(x, y, new THREE.Vector3().crossVectors(x, y)))
        object.position.y += flap.lift
        object.scale.y = flap.reach
      }
      if (object.name === 'Kopi') object.position.set(...KOPI_ON_LID)
    })
  }, [root, closed, uniforms])

  if (!root) return null
  return (
    <>
      <primitive object={root} />
      {/* The lamp's light in the seam where the closed lid's long flaps meet, just below their edges. */}
      <mesh position={[0, 0.605, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={closed}>
        <planeGeometry args={[0.84, 0.08]} />
        <meshBasicMaterial color={SEAM_COLOR} />
      </mesh>
    </>
  )
}

/** The lens's vignette (glsl.vignetteFragment), from the camera's field of view each frame. */
class LensVignette extends Effect {
  constructor() {
    super('LensVignette', glsl.vignetteFragment, {
      uniforms: new Map<string, THREE.Uniform>([['uTan', new THREE.Uniform(new THREE.Vector2())]])
    })
  }

  lens(camera: THREE.PerspectiveCamera) {
    const up = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    ;(this.uniforms.get('uTan')!.value as THREE.Vector2).set(up * camera.aspect, up)
  }
}

/**
 * One merged effect pass after the scene: bloom, tone mapping, vignette and film grain. Grain re-rolls every frame, so
 * it goes with the rest of the motion. Rendering here, at priority 1, replaces R3F's own render. The composer is built
 * in an effect and freed in its cleanup, so StrictMode's double mount and a hot reload each get a working one
 * (EffectComposer.dispose() empties its passes for good).
 */
function Effects({ reduced }: { reduced: boolean }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const get = useThree((s) => s.get)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const composer = useRef<EffectComposer | null>(null)
  const vignette = useRef<LensVignette | null>(null)

  useEffect(() => {
    const built = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 4 })
    built.addPass(new RenderPass(scene, camera))
    const lens = new LensVignette()
    vignette.current = lens
    const effects: Effect[] = [
      new BloomEffect({
        mipmapBlur: true,
        intensity: 0.9,
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.3,
        radius: 0.8
      }),
      new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
      lens
    ]
    if (!reduced) {
      const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY })
      grain.blendMode.opacity.value = 0.12
      effects.push(grain)
    }
    built.addPass(new EffectPass(camera, ...effects))
    const { width, height } = get().size
    built.setSize(width, height)
    composer.current = built
    return () => {
      if (composer.current === built) composer.current = null
      built.dispose()
    }
  }, [gl, scene, camera, get, reduced])

  useEffect(() => composer.current?.setSize(size.width, size.height), [size.width, size.height, dpr])
  useFrame((_, delta) => {
    vignette.current?.lens(camera)
    if (composer.current) composer.current.render(delta)
    else gl.render(scene, camera)
  }, 1)
  return null
}

/** The ground labels' type, Atkinson Hyperlegible Next Bold in outline, drawn this many pixels tall into each texture. */
const LABEL_PX = 96
const LABEL_FONT = `700 ${LABEL_PX}px "Atkinson Hyperlegible Next"`
/** The outline's width in the texture's pixels: on the nearest label, about a ring line's width on screen (1.2 px). */
const LABEL_STROKE = 5
/** A label texture's height, its baseline's depth and the font's cap height, in em. */
const LABEL_EM = 1.25
const LABEL_BASELINE = 0.95
const LABEL_CAP = 0.668
/**
 * Every label's size on the ground, the same on every ring, so a farther label looks smaller only through perspective:
 * its depth across the ring, as a share of the nearest ring's radius, which sets that ring's name (Job Zone 1, or 75%
 * fit) at the HUD's body text size, a cap height of about 11 px, from the opening shot on a 1920 x 1080 frame; and how
 * much longer its letters run out from the box than along the ring, as a road marking's do, to be read at a low angle.
 */
const LABEL_DEPTH = 0.103
const LABEL_STRETCH = 2.5
/** The space between a label's last letter and its line's end, in em, with the texture's own pad: about a letter. */
const LABEL_GAP_EM = 0.5
/** Where the ground shader's ring lines have faded out past the fan's edge, in radians (shaders.ts, groundFragment). */
const LINE_END = FAN_EDGE + 0.02
/** A label's brightness over the ring lines' own colour: a touch brighter, as its strokes are as thin as a line. */
const LABEL_GAIN = 1.4

/** One label's texture: the text's outline in white on clear, its height LABEL_PX * LABEL_EM and its width the text's. */
function labelTexture(text: string, anisotropy: number) {
  const context = document.createElement('canvas').getContext('2d')!
  context.font = LABEL_FONT
  const pad = LABEL_PX * 0.1 + LABEL_STROKE
  context.canvas.width = Math.ceil(context.measureText(text).width + pad * 2)
  context.canvas.height = Math.ceil(LABEL_PX * LABEL_EM)
  // Resizing the canvas resets its state.
  context.font = LABEL_FONT
  context.strokeStyle = '#fff'
  context.lineWidth = LABEL_STROKE
  context.lineJoin = 'round'
  context.strokeText(text, pad, LABEL_PX * LABEL_BASELINE)
  const texture = new THREE.CanvasTexture(context.canvas)
  texture.anisotropy = anisotropy
  return texture
}

/**
 * A ring's label strip on the ground: an arc along the ring past the line's left end, after a letter's gap, its caps'
 * middle on the line's radius, so it reads as the line's continuation and touches no line or tuft. The texture's top
 * faces the horizon, so it reads left to right from the box.
 */
function labelStrip(radius: number, aspect: number, depth: number) {
  const capMiddle = 1 - LABEL_BASELINE / LABEL_EM + LABEL_CAP / LABEL_EM / 2
  const inner = radius - capMiddle * depth
  const sweep = (aspect * depth) / LABEL_STRETCH / radius
  const gap = (LABEL_GAP_EM * depth) / LABEL_EM / LABEL_STRETCH / radius
  const start = -LINE_END - gap - sweep
  const steps = 32
  const position: number[] = []
  const uv: number[] = []
  const index: number[] = []
  for (let i = 0; i <= steps; i++) {
    const a = start + (sweep * i) / steps
    for (const [r, v] of [
      [inner, 0],
      [inner + depth, 1]
    ] as const) {
      position.push(Math.sin(a) * r, 0.005, -Math.cos(a) * r)
      uv.push(i / steps, v)
    }
    if (i < steps) index.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(index)
  return geometry
}

/**
 * The ground rings' names (ringLabels: Job Zone 1 to 5 in Look Around, the fit rings with answers), painted flat on the
 * ground past each ring line's left end, like a road marking, in outline in the lines' colour. They are drawn once the
 * font has loaded, and freed, textures too, on unmount or when the names change.
 */
function GroundLabels({ model, layout, uniforms }: { model: SpaceModel; layout: FieldLayout; uniforms: Uniforms }) {
  const gl = useThree((s) => s.gl)
  const names = ringLabels(model).join('\n')
  const [group, setGroup] = useState<THREE.Group | null>(null)
  useEffect(() => {
    const built = new THREE.Group()
    let alive = true
    const draw = () => {
      if (!alive) return
      const texts = names.split('\n')
      const depth = LABEL_DEPTH * Math.min(...layout.rings)
      layout.rings.forEach((line, i) => {
        const texture = labelTexture(texts[i]!, gl.capabilities.getMaxAnisotropy())
        const image = texture.image as HTMLCanvasElement
        const material = new THREE.ShaderMaterial({
          vertexShader: glsl.labelVertex,
          fragmentShader: glsl.labelFragment,
          uniforms: {
            uLine: uniforms.uLine!,
            uFog: uniforms.uFog!,
            uGain: { value: LABEL_GAIN },
            uMap: { value: texture }
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide
        })
        built.add(new THREE.Mesh(labelStrip(line, image.width / image.height, depth), material))
      })
      setGroup(built)
    }
    // A canvas draws with whatever font has loaded, so the labels wait for theirs.
    document.fonts.load(LABEL_FONT).then(draw, draw)
    return () => {
      alive = false
      for (const child of built.children) {
        const mesh = child as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
        mesh.geometry.dispose()
        ;(mesh.material.uniforms.uMap!.value as THREE.Texture).dispose()
        mesh.material.dispose()
      }
      // Emptied, so a frame drawn before the next labels arrive draws nothing freed.
      built.clear()
    }
  }, [names, layout, uniforms, gl])

  return group && <primitive object={group} />
}

type Meshes = ReturnType<typeof buildMeshes>

/** The scene's own meshes: sky, ground, ring, the blades and the dust, all on the shared uniforms. */
function buildMeshes(uniforms: Uniforms, layout: FieldLayout) {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 48, 24),
    new THREE.ShaderMaterial({
      vertexShader: glsl.skyVertex,
      fragmentShader: glsl.skyFragment,
      uniforms,
      side: THREE.BackSide,
      depthWrite: false
    })
  )
  sky.renderOrder = -1
  sky.frustumCulled = false

  const groundGeometry = new THREE.CircleGeometry(1600, 96)
  groundGeometry.rotateX(-Math.PI / 2)
  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.ShaderMaterial({ vertexShader: glsl.groundVertex, fragmentShader: glsl.groundFragment, uniforms })
  )

  const ring = new THREE.Mesh(
    new THREE.PlaneGeometry(RING_RADIUS * 10, RING_RADIUS * 6),
    new THREE.ShaderMaterial({
      vertexShader: glsl.ringVertex,
      fragmentShader: glsl.ringFragment,
      uniforms,
      transparent: true,
      premultipliedAlpha: true,
      depthWrite: false
    })
  )
  ring.position.set(0, RING_RADIUS * 1.5, -RING_DISTANCE)

  const bladeGeometry = new THREE.PlaneGeometry(1, 1, 1, 4)
  bladeGeometry.translate(0, 0.5, 0)
  bladeGeometry.setAttribute('aRadius', new THREE.InstancedBufferAttribute(layout.aRadius, 4))
  bladeGeometry.setAttribute('aHeight', new THREE.InstancedBufferAttribute(layout.aHeight, 4))
  bladeGeometry.setAttribute('aBlade', new THREE.InstancedBufferAttribute(layout.aBlade, 4))
  bladeGeometry.setAttribute('aShape', new THREE.InstancedBufferAttribute(layout.aShape, 4))
  bladeGeometry.setAttribute('aMeta', new THREE.InstancedBufferAttribute(layout.aMeta, 2))
  const blades = new THREE.InstancedMesh(
    bladeGeometry,
    new THREE.ShaderMaterial({
      vertexShader: glsl.bladeVertex,
      fragmentShader: glsl.bladeFragment,
      uniforms,
      side: THREE.DoubleSide
    }),
    layout.bladeCount
  )
  blades.frustumCulled = false

  // The dust hangs low over the field, below every opening shot's eye (the phone's is the lowest, at 1.08 m), so it
  // stays under the horizon, and from 4 m past the box, so it stays above the foot: it never drifts under the HUD's
  // text in the sky or across the foot.
  const DUST = 420
  const dustPositions = new Float32Array(DUST * 3)
  const seeds = new Float32Array(DUST)
  for (let i = 0; i < DUST; i++) {
    const r = (i * 0.618034) % 1
    const s = (i * 0.414214) % 1
    const q = (i * 0.732051) % 1
    dustPositions.set([(r - 0.5) * 36, 0.25 + s * s * 0.55, -4 - q * 24], i * 3)
    seeds[i] = (i * 0.236068) % 1
  }
  const dustGeometry = new THREE.BufferGeometry()
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.ShaderMaterial({
      vertexShader: glsl.dustVertex,
      fragmentShader: glsl.dustFragment,
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  )
  dust.frustumCulled = false

  return { sky, ground, ring, blades, dust }
}

export function World(props: WorldProps) {
  const { model, layout, future, month, reduced, shot, drift, paused, highlight, yours, hud, resetView } = props
  const { still } = props
  const { onPick, onSteer, onFocusJob, onLost } = props
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const setDpr = useThree((s) => s.setDpr)

  const uniforms = useMemo(makeUniforms, [])
  const months = monthIds(model)

  // Render at DPR 1, and never above 1920 x 1080 pixels.
  useEffect(() => {
    setDpr(Math.min(1, 1920 / Math.max(1, size.width), 1080 / Math.max(1, size.height)))
  }, [size.width, size.height, setDpr])

  // A lost context comes back on its own most times; when it doesn't, the page shows the table.
  useEffect(() => {
    const canvas = gl.domElement
    let timer: number | undefined
    const lost = () => {
      timer = window.setTimeout(onLost, 4000)
    }
    const restored = () => window.clearTimeout(timer)
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    return () => {
      window.clearTimeout(timer)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, onLost])

  // Built in an effect and freed in its cleanup, like the composer, so a double mount never draws freed meshes.
  const [meshes, setMeshes] = useState<Meshes | null>(null)
  useEffect(() => {
    const built = buildMeshes(uniforms, layout)
    setMeshes(built)
    return () => {
      for (const object of Object.values(built)) {
        object.geometry.dispose()
        ;(object.material as THREE.Material).dispose()
      }
    }
  }, [uniforms, layout])

  // The ground rings, and the pool of light under the assessed job's tuft, which Look Around doesn't have.
  useEffect(() => {
    uniforms.uRings!.value = [0, 1, 2, 3, 4].map((i) => layout.rings[i] ?? -1)
    ;(uniforms.uYoursColor!.value as THREE.Color).copy(linear(TIP_YOURS).multiplyScalar(yours >= 0 ? 0.12 : 0))
  }, [uniforms, layout, yours])

  // The camera rig, built like the meshes so a double mount never keeps a disposed one.
  const latest = useRef({ onSteer, onFocusJob, reduced })
  latest.current = { onSteer, onFocusJob, reduced }
  const [rig, setRig] = useState<CameraRig | null>(null)
  useEffect(() => {
    const built = new CameraRig(camera, gl.domElement, (steering) => latest.current.onSteer(steering))
    setRig(built)
    return () => built.dispose()
  }, [camera, gl])
  const resetSeen = useRef(resetView)

  // Shaders compile before the first switch, once the box has its materials too.
  const [boxReady, setBoxReady] = useState(false)
  const onBoxReady = useMemo(() => () => setBoxReady(true), [])
  useEffect(() => {
    gl.compile(scene, camera)
  }, [gl, scene, camera, boxReady, meshes])

  const lights = useRef<{ key: THREE.DirectionalLight | null; back: THREE.DirectionalLight | null }>({
    key: null,
    back: null
  })

  const tweens = useRef({
    future: { from: future, to: future, start: 0, seconds: 0 } as Tween,
    month: { from: month, to: month, start: 0, seconds: 0 } as Tween
  })
  const now = useRef({ future, month })
  const keyLight = useMemo(() => [new THREE.Color(KEY_LIGHT.slow), new THREE.Color(KEY_LIGHT.fast)] as const, [])
  // The scene's own clock, which runs only while frames do. R3F restarts its clock at 0 whenever the frame loop stops
  // and starts again (a hidden tab, the page's table open), which would jump the camera's drift and replay finished
  // tweens; this one resumes where it stopped, and a long frame counts as a short one. A paused frame doesn't advance it.
  const clock = useRef(0)

  useFrame((state, frameDelta) => {
    const delta = paused ? 0 : Math.min(frameDelta, 0.1)
    clock.current += delta
    const t = clock.current
    const tw = tweens.current
    if (tw.future.to !== future) {
      tw.future = {
        from: now.current.future,
        to: future,
        start: t,
        seconds: reduced ? REDUCED_SECONDS : FUTURE_SECONDS
      }
    }
    if (tw.month.to !== month) {
      tw.month = { from: now.current.month, to: month, start: t, seconds: reduced ? REDUCED_SECONDS : MONTH_SECONDS }
    }
    const f = tweenAt(tw.future, t, easeInOut)
    const m = tweenAt(tw.month, t, (x) => x)
    now.current = { future: f, month: m }

    uniforms.uFuture!.value = f
    uniforms.uMonth!.value = m
    uniforms.uSweepOn!.value = reduced ? 0 : 1
    uniforms.uSway!.value = reduced ? 0 : 1
    uniforms.uDrift!.value = reduced ? 0 : 1
    if (!reduced) uniforms.uTime!.value = t
    uniforms.uPixel!.value = state.gl.getPixelRatio() * (state.size.height / 1080)
    for (const key of Object.keys(WORLD_COLORS.slow) as ColorKey[]) {
      ;(uniforms[key]!.value as THREE.Color).lerpColors(WORLD_COLORS.slow[key], WORLD_COLORS.fast[key], f)
    }
    for (const key of Object.keys(WORLDS.slow.numbers) as NumberKey[]) {
      uniforms[key]!.value = THREE.MathUtils.lerp(WORLDS.slow.numbers[key], WORLDS.fast.numbers[key], f)
    }

    // The ring: Malaysia's AI usage index, read per snapshot and future.
    const [a, b] = months.map((id) => model.anchors[id] ?? model.anchors[months[0]] ?? model.anchors[months[1]])
    const ease = easeInOut(Math.min(1, m))
    if (a && b) {
      const mysAt = (x: NonNullable<typeof a>) => x.mys + (x.fastMys - x.mys) * f
      uniforms.uCenterY!.value = THREE.MathUtils.lerp(mysAt(a), mysAt(b), ease) * RING_PER_INDEX
    }
    if (meshes) meshes.ring.visible = Boolean(a && b)

    // The sweep's front line on the ground, at the job whose blades are turning now; it shows only while it moves.
    const order = layout.sweepRadii
    const at = Math.min(1, Math.max(0, m * (1 + SWEEP_WIDTH) - SWEEP_WIDTH / 2)) * (order.length - 1)
    const lo = Math.floor(at)
    uniforms.uFront!.value = order[lo]! + (order[Math.min(lo + 1, order.length - 1)]! - order[lo]!) * (at - lo)
    uniforms.uFrontOn!.value = reduced ? 0 : Math.max(0, Math.min(1, m / 0.05, (1 - m) / 0.05))

    if (yours >= 0) (uniforms.uYours!.value as THREE.Vector2).set(...tuftPosition(layout, yours, f, m))
    uniforms.uHover!.value = highlight ?? -1
    if (highlight !== null) {
      const [hx, hz] = tuftPosition(layout, highlight, f, m)
      ;(uniforms.uHoverPos!.value as THREE.Vector2).set(hx, hz)
    }
    uniforms.uHoverOn!.value = highlight === null ? 0 : 1

    if (lights.current.key) lights.current.key.color.lerpColors(keyLight[0], keyLight[1], f)
    if (lights.current.back) lights.current.back.color.copy(uniforms.uBand!.value as THREE.Color).multiplyScalar(0.5)

    // The camera drifts slowly around its shot until the user steers it; a locked shot holds still and takes no input.
    if (rig) {
      if (resetSeen.current !== resetView) rig.reset(reduced)
      resetSeen.current = resetView
      rig.update(t, delta, shot, { locked: !drift, still, reduced })
    }

    // The HUD's text boxes, for the sky's stars: from CSS pixels down from the top to the frame's pixels up from the
    // bottom.
    const ratio = state.gl.getPixelRatio()
    const text = [hud.current?.avoid, ...(hud.current?.text ?? [])]
    ;(uniforms.uHudBoxes!.value as THREE.Vector4[]).forEach((box, i) => {
      const r = text[i]
      if (r) box.set(r.left, state.size.height - r.bottom, r.right, state.size.height - r.top).multiplyScalar(ratio)
      else box.setScalar(NO_BOX)
    })
  })

  // Picking: the nearest tuft on screen within a finger's reach, so far tufts are as easy to hit as near ones.
  useEffect(() => {
    const canvas = gl.domElement
    const v = new THREE.Vector3()
    const REACH = 24 * 24
    const pick = (event: MouseEvent): Pick | null => {
      const rect = canvas.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      let best: Pick | null = null
      let bestD = REACH
      for (let i = 0; i < layout.angles.length; i++) {
        const [x, z] = tuftPosition(layout, i, now.current.future, now.current.month)
        v.set(x, BLADE_H0 * 0.6, z).project(camera)
        if (v.z > 1) continue
        const sx = ((v.x + 1) / 2) * rect.width
        const sy = ((1 - v.y) / 2) * rect.height
        const d = (sx - px) ** 2 + (sy - py) ** 2
        if (d < bestD) {
          bestD = d
          best = { index: i, x: sx + rect.left, y: sy + rect.top }
        }
      }
      return best
    }
    // While a button is down the pointer steers, so hover waits; a drag clears it, and the click that ends one is no tap.
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      if (event.buttons === 0) onPick(pick(event), 'hover')
      else if (rig?.dragged) onPick(null, 'hover')
    }
    const leave = () => onPick(null, 'hover')
    const click = (event: MouseEvent) => {
      if (!rig?.dragged) onPick(pick(event), 'tap')
    }
    // A double-click or double-tap on a tuft flies to frame it, then hands its job to the HUD.
    const focus = (event: MouseEvent) => {
      const hit = pick(event)
      if (!rig || !hit) return
      const [x, z] = tuftPosition(layout, hit.index, now.current.future, now.current.month)
      const code = model.jobs[hit.index]!.code
      rig.focus(x, z, latest.current.reduced, () => latest.current.onFocusJob(code))
    }
    let lastTap: { time: number; x: number; y: number } | null = null
    const tap = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !event.isPrimary || rig?.dragged) return
      const near = lastTap && event.timeStamp - lastTap.time < DOUBLE_TAP_MS
      if (near && Math.hypot(event.clientX - lastTap!.x, event.clientY - lastTap!.y) < DOUBLE_TAP_PX) {
        lastTap = null
        focus(event)
      } else lastTap = { time: event.timeStamp, x: event.clientX, y: event.clientY }
    }
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerleave', leave)
    canvas.addEventListener('pointerup', tap)
    canvas.addEventListener('click', click)
    canvas.addEventListener('dblclick', focus)
    return () => {
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('pointerup', tap)
      canvas.removeEventListener('click', click)
      canvas.removeEventListener('dblclick', focus)
    }
  }, [gl, camera, layout, model, rig, onPick])

  return (
    <>
      {meshes && (
        <>
          <primitive object={meshes.sky} />
          <primitive object={meshes.ground} />
          <primitive object={meshes.ring} />
          <primitive object={meshes.blades} />
          <primitive object={meshes.dust} />
        </>
      )}
      <hemisphereLight args={[FILL_SKY, FILL_GROUND, 0.35]} />
      <directionalLight
        ref={(light) => {
          lights.current.key = light
        }}
        position={[3, 4, 8]}
        intensity={0.35}
      />
      <directionalLight
        ref={(light) => {
          lights.current.back = light
        }}
        position={[0, 4, -30]}
        intensity={2}
      />
      {/* The lamp inside the box; in Look Around it sits under the closed lid and shows only through the seam. */}
      <pointLight
        position={[0, model.answers ? 0.7 : 0.3, 0.05]}
        intensity={0.6}
        distance={2.5}
        decay={2}
        color={BOX_LAMP}
      />
      <GroundLabels model={model} layout={layout} uniforms={uniforms} />
      <KotakBox uniforms={uniforms} closed={!model.answers} onReady={onBoxReady} />
      <Effects reduced={reduced} />
    </>
  )
}

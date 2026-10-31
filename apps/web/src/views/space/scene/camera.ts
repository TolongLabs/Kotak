import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { FocusShot, Shot } from './layout'

// The camera: a slow drift around the opening shot until the user steers, then three's OrbitControls, held to limits
// that keep the view reading (the horizon ahead, never under the field), until R flies it back and the drift resumes.

const deg = THREE.MathUtils.degToRad
const RESET_SECONDS = 1.2
const FOCUS_SECONDS = 1
/** A press that moves fewer CSS pixels than this is a tap, not a drag. */
const DRAG_PX = 5
const MIN_DISTANCE = 2
const MAX_DISTANCE = 36
/**
 * From 50 degrees above the orbit's target down to 2.5 degrees, and up to 45 degrees either side of the line from the box
 * to the horizon, so the ring stays at least partly in a wide frame. A fly-to lands near the lowest (layout.ts,
 * focusShot).
 */
const MIN_POLAR = deg(40)
const MAX_POLAR = deg(87.5)
const MAX_AZIMUTH = deg(45)
/**
 * The orbit's target stays over the field: within FIELD_RADIUS metres of the box and at most BEHIND metres behind, which
 * leaves room for the phone's steeper opening shot (layout.ts, phoneShot), whose view centre lands about 3 m behind.
 */
const FIELD_RADIUS = 20.5
const BEHIND = 3.2
/** When the user takes over, the orbit's target is where the view's centre meets this height above the ground. */
const TARGET_Y = 1
/** A landing keeps this far inside the orbit's limits, in radians, so the orbit takes over without a nudge. */
const LIMIT_MARGIN = 0.001
/** The idle parallax: the camera slides this far with the pointer, in metres sideways and up. */
const PARALLAX: [number, number] = [0.05, 0.025]
/** A key that holds the shot still eases the drift out over this long, in seconds, and R eases it back in. */
const DRIFT_EASE_SECONDS = 0.6
/** The camera counts as settled once it has been still this long, in seconds. */
const SETTLE_SECONDS = 0.25
/** The narrowest horizontal view, in degrees, and the widest vertical one it may take to get there. */
const MIN_WIDE_FOV = 40
const MAX_FOV = 85

const UP = new THREE.Vector3(0, 1, 0)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

interface Pose {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

interface Flight {
  from: Pose
  start: number
  seconds: number
  /** Where it lands, looking at `target`, which the orbit then turns around; null flies back into the drift. */
  to: (Pose & { target: THREE.Vector3 }) | null
  done?: () => void
}

export class CameraRig {
  readonly controls: OrbitControls
  /** Whether the last press moved far enough to be a drag; a click after one is not a tap. */
  dragged = false
  private mode: 'drift' | 'user' | 'fly' = 'drift'
  private flight: Flight | null = null
  private steering = false
  private interacting = false
  private stillSince = 0
  /** How much of the drift is on, 0 to 1, before easing; off at once under reduced motion. */
  private drift = 1
  private press: { x: number; y: number } | null = null
  private pointer = new THREE.Vector2()
  private parallax = new THREE.Vector2()
  private aim = new THREE.Vector2()
  private last: Pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
  private pose: Pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
  private look = new THREE.Vector3()
  private matrix = new THREE.Matrix4()
  private now = 0
  private readonly cleanup: () => void

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    element: HTMLElement,
    private readonly onSteer: (steering: boolean) => void
  ) {
    const controls = new OrbitControls(camera, element)
    controls.minDistance = MIN_DISTANCE
    controls.maxDistance = MAX_DISTANCE
    controls.minPolarAngle = MIN_POLAR
    controls.maxPolarAngle = MAX_POLAR
    controls.minAzimuthAngle = -MAX_AZIMUTH
    controls.maxAzimuthAngle = MAX_AZIMUTH
    controls.screenSpacePanning = false
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.6
    this.controls = controls

    const start = () => (this.interacting = true)
    const end = () => (this.interacting = false)
    controls.addEventListener('start', start)
    controls.addEventListener('end', end)

    // These run in the capture phase, before OrbitControls' own listeners, so the orbit's target is in place before
    // the first move turns the camera.
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) return
      this.press = { x: event.clientX, y: event.clientY }
      this.dragged = false
    }
    const move = (event: PointerEvent) => {
      if (!this.press || !controls.enabled) return
      if (Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y) < DRAG_PX && event.isPrimary) return
      if (!this.dragged) {
        this.dragged = true
        this.takeOver()
      }
    }
    const up = (event: PointerEvent) => {
      if (event.isPrimary) this.press = null
    }
    const wheel = () => {
      if (controls.enabled) this.takeOver()
    }
    const track = (event: PointerEvent) => {
      if (event.pointerType === 'mouse')
        this.pointer.set((event.clientX / window.innerWidth) * 2 - 1, 1 - (event.clientY / window.innerHeight) * 2)
    }
    element.addEventListener('pointerdown', down, { capture: true })
    element.addEventListener('pointermove', move, { capture: true })
    element.addEventListener('wheel', wheel, { capture: true, passive: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('pointermove', track)
    this.cleanup = () => {
      controls.removeEventListener('start', start)
      controls.removeEventListener('end', end)
      element.removeEventListener('pointerdown', down, { capture: true })
      element.removeEventListener('pointermove', move, { capture: true })
      element.removeEventListener('wheel', wheel, { capture: true })
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('pointermove', track)
      controls.dispose()
    }
  }

  dispose() {
    this.cleanup()
  }

  /** Flies back to the opening shot and resumes the drift. */
  reset(reduced: boolean) {
    if (!this.controls.enabled) return
    this.fly(null, reduced ? 0 : RESET_SECONDS)
  }

  /**
   * Flies to a tuft's landing (layout.ts, focusShot), then orbits its target. The landing is held inside the orbit's
   * limits, so nothing moves once it is there. A flight the user didn't ask for (a deep link's) doesn't count as their
   * steering: the first-visit hint stays, and the visit isn't marked steered.
   */
  focus(shot: FocusShot, reduced: boolean, done: () => void, byUser = true) {
    if (!this.controls.enabled) return
    const target = new THREE.Vector3(...shot.target)
    const orbit = new THREE.Spherical().setFromVector3(new THREE.Vector3(...shot.position).sub(target))
    orbit.radius = THREE.MathUtils.clamp(orbit.radius, MIN_DISTANCE, MAX_DISTANCE)
    orbit.phi = THREE.MathUtils.clamp(orbit.phi, MIN_POLAR + LIMIT_MARGIN, MAX_POLAR - LIMIT_MARGIN)
    orbit.theta = THREE.MathUtils.clamp(orbit.theta, -MAX_AZIMUTH + LIMIT_MARGIN, MAX_AZIMUTH - LIMIT_MARGIN)
    const position = new THREE.Vector3().setFromSpherical(orbit).add(target)
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(this.matrix.lookAt(position, target, UP))
    this.fly({ position, quaternion, target }, reduced ? 0 : FOCUS_SECONDS, done, byUser)
  }

  /** One frame. A locked shot holds still and takes no input; `still` holds the opening shot without drift or parallax. */
  update(
    t: number,
    delta: number,
    shot: Shot,
    { locked, reduced, still = false }: { locked: boolean; reduced: boolean; still?: boolean }
  ) {
    const { camera, controls } = this
    this.now = t
    // A tall screen widens the view until it spans the shot's width (MIN_WIDE_FOV by default) across, so the ring fits
    // inside a phone's frame.
    const tan = Math.tan(deg(shot.wide ?? MIN_WIDE_FOV) / 2) / camera.aspect
    const fov = Math.min(MAX_FOV, Math.max(shot.fov, THREE.MathUtils.radToDeg(2 * Math.atan(tan))))
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    controls.enabled = !locked
    controls.enableDamping = !reduced
    // The parallax eases toward the pointer, and back to rest when motion is reduced or the shot is locked.
    const follow = locked || reduced || still ? 0 : 1
    this.parallax.lerp(this.aim.copy(this.pointer).multiplyScalar(follow), 1 - Math.exp(-delta * 2.5))
    // The drift eases out when a key holds the shot still, rather than jumping to the bare shot in one frame.
    const step = (still ? -delta : delta) / DRIFT_EASE_SECONDS
    this.drift = reduced ? 0 : THREE.MathUtils.clamp(this.drift + step, 0, 1)
    const drift = easeInOut(this.drift)

    if (locked) {
      this.mode = 'drift'
      this.flight = null
      this.driftPose(t, shot, 0, this.pose)
      camera.position.copy(this.pose.position)
      camera.quaternion.copy(this.pose.quaternion)
    } else if (this.mode === 'drift') {
      this.driftPose(t, shot, drift, this.pose)
      camera.position.copy(this.pose.position)
      camera.quaternion.copy(this.pose.quaternion)
      this.aimTarget()
    } else if (this.mode === 'fly' && this.flight) {
      const flight = this.flight
      const p = flight.seconds > 0 ? Math.min(1, Math.max(0, (t - flight.start) / flight.seconds)) : 1
      const to = flight.to ?? this.driftPose(t, shot, drift, this.pose)
      const e = easeInOut(p)
      camera.position.lerpVectors(flight.from.position, to.position, e)
      camera.quaternion.slerpQuaternions(flight.from.quaternion, to.quaternion, e)
      this.aimTarget()
      if (p >= 1) {
        this.flight = null
        this.mode = flight.to ? 'user' : 'drift'
        if (flight.to) controls.target.copy(flight.to.target)
        flight.done?.()
      }
    } else {
      controls.update(delta)
      this.keepOverField()
    }
    camera.updateMatrixWorld()

    // The camera has settled once it has held still for a moment with nothing pressed and nothing flying.
    const moved =
      camera.position.distanceToSquared(this.last.position) > 1e-8 ||
      1 - Math.abs(camera.quaternion.dot(this.last.quaternion)) > 1e-10
    this.last.position.copy(camera.position)
    this.last.quaternion.copy(camera.quaternion)
    if (this.mode === 'drift' && !this.flight) this.steer(false)
    else if (moved || this.interacting || this.mode === 'fly') this.stillSince = t
    else if (t - this.stillSince > SETTLE_SECONDS) this.steer(false)
  }

  /**
   * The opening shot, drifting slowly by `k` (0 none, 1 full), slid a little with the pointer. The drift is small, as the
   * shot stands close behind the box: the box keeps to the gap the HUD's foot leaves it.
   */
  private driftPose(t: number, shot: Shot, k: number, out: Pose): Pose {
    const [px, py] = [this.parallax.x, this.parallax.y]
    out.position.set(
      shot.position[0] + Math.sin(t * 0.045) * 0.12 * k + px * PARALLAX[0],
      shot.position[1] + Math.sin(t * 0.031 + 1) * 0.05 * k + py * PARALLAX[1],
      shot.position[2] + Math.sin(t * 0.027 + 2) * 0.12 * k
    )
    this.look.set(shot.target[0] + Math.sin(t * 0.021) * 0.5 * k, shot.target[1], shot.target[2])
    out.quaternion.setFromRotationMatrix(this.matrix.lookAt(out.position, this.look, UP))
    return out
  }

  /** Puts the orbit's target on the view's centre line, so OrbitControls takes over without a jump. */
  private aimTarget() {
    const { camera, controls } = this
    const forward = this.look.set(0, 0, -1).applyQuaternion(camera.quaternion)
    const reach = forward.y < -0.01 ? (TARGET_Y - camera.position.y) / forward.y : 18
    controls.target.copy(camera.position).addScaledVector(forward, THREE.MathUtils.clamp(reach, MIN_DISTANCE + 1, 24))
  }

  /** Keeps the orbit's target over the field, moving the camera with it so the view only slides. */
  private keepOverField() {
    const { camera, controls } = this
    const target = controls.target
    const r = Math.hypot(target.x, target.z)
    const scale = r > FIELD_RADIUS ? FIELD_RADIUS / r : 1
    const dx = target.x * scale - target.x
    const dz = Math.min(target.z * scale, BEHIND) - target.z
    if (dx === 0 && dz === 0) return
    target.x += dx
    target.z += dz
    camera.position.x += dx
    camera.position.z += dz
  }

  /**
   * The user steers: the drift and any flight stop, and OrbitControls drives from here. A flight cut short never lands,
   * so its `done` doesn't run.
   */
  private takeOver() {
    if (this.mode !== 'user') {
      this.flight = null
      this.aimTarget()
      this.mode = 'user'
    }
    this.stillSince = this.now
    this.steer(true)
  }

  private fly(to: Flight['to'], seconds: number, done?: () => void, byUser = true) {
    const { camera, controls } = this
    // Drop any glide left from the last drag, so it doesn't carry on after landing.
    const target = controls.target.clone()
    const from = { position: camera.position.clone(), quaternion: camera.quaternion.clone() }
    const damping = controls.enableDamping
    controls.enableDamping = false
    controls.update()
    controls.enableDamping = damping
    controls.target.copy(target)
    camera.position.copy(from.position)
    camera.quaternion.copy(from.quaternion)

    this.flight = { from, start: this.now, seconds, to, done }
    this.mode = 'fly'
    this.stillSince = this.now
    if (byUser) this.steer(true)
  }

  private steer(steering: boolean) {
    if (this.steering === steering) return
    this.steering = steering
    this.onSteer(steering)
  }
}

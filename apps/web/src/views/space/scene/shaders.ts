// The space's shaders. Every material shares one set of uniforms (World.tsx), so a flip or a month change is a few
// uniform writes and never a new program. Colours arrive in linear space; the effect pass tone-maps and encodes.

const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = p * 2.03 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return v;
}
`

// The sky's colour for a view direction; the ground and the blades fade into it, so the horizon has no seam.
const SKY = /* glsl */ `
uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec3 uBand;
uniform vec3 uGlow;
uniform float uBandWidth;
uniform float uBandSides;
// How much of the ring's light reaches the horizon at a bearing: all of it under the ring, falling off to either side
// (cos^40, about 9 degrees to one sigma, the ring's own radius), so the frame's sides keep a dark horizon.
float ringLight(vec3 d) {
  float toward = max(-normalize(d.xz + vec2(1e-5)).y, 0.0);
  return pow(toward, 40.0);
}
vec3 skyColor(vec3 d) {
  float e = d.y;
  float toward = max(-normalize(d.xz + vec2(1e-5)).y, 0.0);
  // The horizon's haze is lit by the ring too, so it dims toward the frame's sides.
  vec3 horizon = mix(uSkyZenith, uSkyHorizon, mix(0.2, 1.0, pow(toward, 16.0)));
  vec3 col = mix(horizon, uSkyZenith, pow(smoothstep(0.0, 0.55, max(e, 0.0)), 0.55));
  float lit = ringLight(d);
  float sides = mix(uBandSides, 1.0, pow(toward, 2.0)) * lit;
  col += uBand * exp(-abs(e) / uBandWidth) * sides;
  col += uGlow * exp(-abs(e) / (uBandWidth * 7.0)) * lit;
  return col;
}
`

export const skyVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
  gl_Position.z = gl_Position.w;
}
`

/** How many boxes of the HUD's text the sky keeps clear of stars (World.tsx, HudBoxes). */
export const HUD_BOXES = 8

export const skyFragment = /* glsl */ `
${NOISE}
${SKY}
uniform float uStars;
// The HUD's text boxes in the frame's pixels from its bottom left (left, bottom, right, top); an unused one lies far off.
uniform vec4 uHudBoxes[${HUD_BOXES}];
varying vec3 vWorld;
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  vec3 col = skyColor(d);
  // Faint stars, thinning toward the haze. A star never sits under the HUD's text, which keeps its contrast from the
  // render alone: stars fade out over the last 24 px before a text box and are gone 4 px from it.
  vec2 cell = vec2(atan(d.x, -d.z) * 260.0, d.y * 260.0);
  vec2 id = floor(cell);
  float h = hash12(id);
  float star = step(0.993, h) * smoothstep(0.42, 0.0, length(fract(cell) - 0.5)) * (0.4 + 0.6 * hash12(id + 7.0));
  float clear = 1.0;
  for (int i = 0; i < ${HUD_BOXES}; i++) {
    vec2 gap = max(max(uHudBoxes[i].xy - gl_FragCoord.xy, gl_FragCoord.xy - uHudBoxes[i].zw), 0.0);
    clear = min(clear, smoothstep(4.0, 28.0, length(gap)));
  }
  col += vec3(star) * uStars * smoothstep(0.03, 0.3, d.y) * clear;
  gl_FragColor = vec4(col, 1.0);
}
`

export const groundVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const groundFragment = /* glsl */ `
${NOISE}
${SKY}
uniform vec3 uGround;
uniform vec3 uRim;
uniform vec3 uBoxLight;
uniform vec3 uLine;
uniform vec3 uYoursColor;
uniform vec3 uHoverColor;
uniform vec2 uYours;
uniform vec2 uHoverPos;
uniform float uHoverOn;
uniform float uFog;
uniform float uFanEdge;
uniform float uRings[5];
uniform float uFront;
uniform float uFrontOn;
varying vec3 vWorld;
void main() {
  vec3 toCam = vWorld - cameraPosition;
  float dist = length(toCam);
  vec3 d = toCam / dist;
  vec2 xz = vWorld.xz;

  float n = fbm(xz * vec2(0.35, 0.9));
  vec3 col = uGround * (0.55 + 0.9 * n);

  // The ground catches the horizon's light at a grazing angle, in fine streaks, like a far field.
  float graze = pow(1.0 - clamp(-d.y, 0.0, 1.0), 14.0) * ringLight(d);
  float streak = noise2(xz * vec2(0.9, 9.0)) * noise2(xz * vec2(2.3, 21.0));
  col += uRim * graze * (0.25 + 1.6 * streak * streak);

  // The open box lights the ground around it.
  float r = length(xz);
  col += uBoxLight * exp(-r * 1.4);

  // The ground rings across the fan: fit, or Look Around's Job Zone bands. An unused ring sits at -1, off the ground.
  float ang = abs(atan(xz.x, -xz.y));
  float inFan = 1.0 - smoothstep(uFanEdge, uFanEdge + 0.02, ang);
  float w = fwidth(r) * 1.2;
  float rings = 0.0;
  for (int i = 0; i < 5; i++) rings += 1.0 - smoothstep(0.0, w, abs(r - uRings[i]));
  col += uLine * rings * inFan;

  // The month sweep's front: a bright line crossing the field from the horizon toward the box.
  float off = abs(r - uFront);
  col += uBand * uFrontOn * inFan * (2.2 * exp(-off / 0.12) + 0.35 * exp(-off / 0.9));

  // A pool of light under the assessed job's tuft, and under the one in hand.
  col += uYoursColor * exp(-dot(xz - uYours, xz - uYours) * 0.9);
  // The one in hand gets a small, soft glow in the world's colour, about a third of a metre across.
  col += uHoverColor * uHoverOn * exp(-dot(xz - uHoverPos, xz - uHoverPos) * 9.0);

  float fog = 1.0 - exp(-dist * uFog);
  col = mix(col, skyColor(d), fog);
  gl_FragColor = vec4(col, 1.0);
}
`

export const ringVertex = /* glsl */ `
varying vec2 vXY;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vXY = world.xy;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

// An analytic eclipse ring: a dark disk, a thin photon ring, a halo, a streaky lensed swirl (slow) and an edge-on band
// (fast). The swirl and the band keep within about two radii of the ring, so the sky around them stays dark for the
// HUD. Premultiplied: rgb adds light, alpha darkens the sky behind.
export const ringFragment = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uCenterY;
uniform float uR;
uniform vec3 uRingCore;
uniform vec3 uRingGlow;
uniform vec3 uShadow;
uniform float uSwirl;
uniform float uDiskBand;
uniform float uRingWidth;
uniform float uShadowAlpha;
varying vec2 vXY;
void main() {
  vec2 p = (vXY - vec2(0.0, uCenterY)) / uR;
  float r = length(p);
  // Angle from straight up, so its seam (at +-pi) sits straight down, under the horizon.
  float a = atan(-p.x, p.y);
  float outside = max(r - 1.0, 0.0);
  float fade = smoothstep(5.0, 3.6, abs(p.x)) * smoothstep(4.4, 3.4, p.y);

  float x = (r - 1.0) / uRingWidth;
  float core = exp(-x * x);
  float halo = exp(-outside / 0.08) * step(1.0, r);
  float inner = exp(-max(1.0 - r, 0.0) / 0.015) * (1.0 - step(1.0, r));

  // Light coming toward us (the left) is brighter, as a spinning disk's is.
  float doppler = clamp(1.0 - 0.6 * p.x / max(r, 1e-3), 0.3, 1.8);

  // The lensed disk: fine hairlines that follow the orbit and spiral out, wrapping the top and sweeping left.
  // Its arcs centre up and to the left of the shadow, so they crowd on the right and fan out on the left.
  vec2 ps = (p - vec2(-0.14, 0.1)) * vec2(1.0, 1.08);
  float rd = length(ps);
  float spiral = atan(-ps.x, ps.y) + log(max(rd, 1e-3)) * 1.6 - uTime * 0.008;
  float warp = noise2(p * 1.7 + 3.0) - 0.5;
  float hair = noise2(vec2(spiral * 2.2, rd * 46.0 + warp * 5.0));
  float clump = noise2(vec2(spiral * 6.0 + 11.0, rd * 7.0));
  float threads = hair * hair * hair * (0.35 + 1.5 * clump) * 2.4;
  float left = clamp(-ps.x / max(rd, 1e-3) * 0.5 + 0.5, 0.0, 1.0);
  float reach = exp(-max(rd - 1.0, 0.0) / mix(0.05, 0.5, left * left * left * left)) * smoothstep(2.3, 1.5, rd);
  float rise = 0.35 + 0.65 * smoothstep(-0.5, 0.9, ps.y / max(rd, 1e-3));
  float swirl = reach * smoothstep(0.99, 1.04, r) * (threads + 0.18) * doppler * rise;

  // The disk edge-on: a white-hot band through the ring's centre, wider than the ring.
  float band = exp(-abs(p.y) / 0.022) / (1.0 + p.x * p.x * 0.9) * smoothstep(0.9, 1.1, abs(p.x)) *
    smoothstep(1.9, 1.4, abs(p.x));

  vec3 light = uRingCore * core * (0.7 + 0.3 * doppler) + uRingGlow * (halo * 0.5 + inner * 0.3) * doppler;
  light += uRingGlow * swirl * uSwirl + uRingCore * band * uDiskBand * 0.35;
  light *= fade;

  float shadow = (1.0 - smoothstep(0.95, 1.0, r)) * uShadowAlpha;

  gl_FragColor = vec4(light + uShadow * shadow, shadow);
}
`

export const bladeVertex = /* glsl */ `
attribute vec4 aRadius;
attribute vec4 aHeight;
attribute vec4 aBlade;
attribute vec4 aShape;
attribute vec2 aMeta;
uniform float uTime;
uniform float uFuture;
uniform float uMonth;
uniform float uSweepOn;
uniform float uSway;
uniform float uH0;
uniform float uHover;
uniform float uFog;
varying vec2 vUv;
varying float vKnown;
varying float vLift;
varying float vKind;
varying float vHover;
varying float vFog;
varying float vFlash;
varying vec3 vDir;

void main() {
  float rA = mix(aRadius.x, aRadius.y, uFuture);
  float rB = mix(aRadius.z, aRadius.w, uFuture);
  // The month sweeps from the horizon toward the box, by each job's place in line (aMeta.y): far tufts change first,
  // and each flares as the front passes.
  float width = 0.22;
  float swept = smoothstep(0.0, 1.0, clamp((uMonth * (1.0 + width) - aMeta.y) / width, 0.0, 1.0));
  float m = mix(uMonth, swept, uSweepOn);
  vFlash = sin(3.14159 * swept) * uSweepOn;

  float kA = mix(step(0.0, aHeight.x), step(0.0, aHeight.y), uFuture);
  float kB = mix(step(0.0, aHeight.z), step(0.0, aHeight.w), uFuture);
  float hA = mix(max(aHeight.x, 0.0) + (1.0 - step(0.0, aHeight.x)) * uH0, max(aHeight.y, 0.0) + (1.0 - step(0.0, aHeight.y)) * uH0, uFuture);
  float hB = mix(max(aHeight.z, 0.0) + (1.0 - step(0.0, aHeight.z)) * uH0, max(aHeight.w, 0.0) + (1.0 - step(0.0, aHeight.w)) * uH0, uFuture);
  float h = mix(hA, hB, m);
  vKnown = mix(kA, kB, m);
  vLift = clamp((h - uH0) / (uH0 * 2.5), -1.0, 1.0);

  float r = mix(rA, rB, m);
  float fan = aBlade.x;
  vec3 centre = vec3(sin(fan) * r, 0.0, -cos(fan) * r) + vec3(aShape.x, 0.0, aShape.y);

  float y = position.y;
  float yaw = aBlade.y;
  vec3 across = vec3(cos(yaw), 0.0, sin(yaw));
  vec3 bend = vec3(-sin(yaw), 0.0, cos(yaw));
  float wide = 0.06 * aShape.z * (1.0 - 0.9 * y);
  float sway = sin(uTime * 0.9 + centre.x * 0.35 + centre.z * 0.2 + aBlade.w * 6.28) * uSway;
  vec3 pos = centre + across * position.x * wide + vec3(0.0, y * h, 0.0);
  pos += bend * (aBlade.z * y * y * h) + vec3(1.0, 0.0, 0.3) * sway * y * y * h * 0.08;

  vKind = aMeta.x;
  vHover = 1.0 - step(0.5, abs(aShape.w - uHover));
  vUv = vec2(position.x + 0.5, y);
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vec3 toCam = world.xyz - cameraPosition;
  vDir = normalize(toCam);
  vFog = 1.0 - exp(-length(toCam) * uFog);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const bladeFragment = /* glsl */ `
${SKY}
uniform vec3 uTipOther;
uniform vec3 uTipRelated;
uniform vec3 uTipYours;
uniform vec3 uBladeBase;
uniform vec3 uRim;
varying vec2 vUv;
varying float vKnown;
varying float vLift;
varying float vKind;
varying float vHover;
varying float vFog;
varying float vFlash;
varying vec3 vDir;

void main() {
  // MSAA can sample a hair outside the blade, so the uv is clamped before any pow().
  vec2 uv = clamp(vUv, 0.0, 1.0);
  float none = step(2.5, vKind);
  // Jobs no answer reaches are drawn hollow: only the blade's outline.
  float edge = abs(uv.x - 0.5) * 2.0;
  if (none > 0.5 && edge < 0.55 && uv.y < 0.92) discard;

  vec3 tip = vKind < 0.5 ? uTipOther : (vKind < 1.5 ? uTipRelated : uTipYours);
  tip = mix(tip, vec3(0.16), none);
  // Unknown (no projection): grey and plain.
  float grey = dot(tip, vec3(0.2126, 0.7152, 0.0722));
  tip = mix(vec3(grey) * 0.55, tip, mix(0.15, 1.0, vKnown));

  float t = pow(uv.y, 1.7);
  // The assessed job's blades are yellow all the way up, so its tuft stands out from its blue neighbours.
  float yours = step(1.5, vKind) * (1.0 - none);
  vec3 col = mix(uBladeBase, tip * mix(0.32, 0.75, yours), mix(t, sqrt(uv.y), yours));
  col += uRim * smoothstep(0.3, 1.0, edge) * uv.y * 0.5;

  // The tip glows; taller (rising) blades glow more, shorter (falling) ones less.
  float spark = smoothstep(0.8, 1.0, uv.y);
  float own = step(0.5, vKind) * (1.0 - none);
  float glow = (1.2 + 2.2 * max(vLift, 0.0) - 0.5 * max(-vLift, 0.0)) * mix(0.25, 1.0, vKnown) * (1.0 - 0.85 * none);
  col += tip * spark * glow * (1.0 + own * 1.5);
  col *= 1.0 + vHover * 2.5;
  col += (tip + vec3(0.5)) * vFlash * (0.4 + 1.6 * uv.y);

  col = mix(col, skyColor(vDir), vFog);
  gl_FragColor = vec4(col, 1.0);
}
`

// A ground ring's name, flat on the ground: the label texture's alpha in the ring lines' colour (uLine), brightened by
// uGain, added to the ground and fading into the haze as the ground does.
export const labelVertex = /* glsl */ `
uniform float uFog;
varying vec2 vUv;
varying float vClear;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vUv = uv;
  vClear = exp(-length(world.xyz - cameraPosition) * uFog);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const labelFragment = /* glsl */ `
uniform vec3 uLine;
uniform float uGain;
uniform sampler2D uMap;
varying vec2 vUv;
varying float vClear;
void main() {
  gl_FragColor = vec4(uLine * uGain * texture2D(uMap, vUv).a * vClear, 1.0);
}
`

// The lens's own vignette over the tone-mapped frame: natural falloff, cos^4 of the angle between a pixel's ray and the
// view axis, from the camera's half-field tangents (uTan, across and up). It is the same for every frame of a given
// field of view and knows nothing of the HUD.
export const vignetteFragment = /* glsl */ `
uniform vec2 uTan;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 t = (uv * 2.0 - 1.0) * uTan;
  float c2 = 1.0 / (1.0 + dot(t, t));
  outputColor = vec4(inputColor.rgb * c2 * c2, inputColor.a);
}
`

export const dustVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uDrift;
uniform float uPixel;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.05 + aSeed * 40.0) * 1.6 * uDrift;
  p.y += sin(uTime * 0.07 + aSeed * 23.0) * 0.25 * uDrift;
  p.z += cos(uTime * 0.04 + aSeed * 31.0) * 1.2 * uDrift;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = uPixel * (0.6 + aSeed) * 24.0 / max(-view.z, 0.5);
  vAlpha = (0.35 + 0.65 * fract(aSeed * 13.7)) * smoothstep(80.0, 10.0, -view.z) * smoothstep(0.4, 2.0, -view.z);
}
`

export const dustFragment = /* glsl */ `
uniform vec3 uDust;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uDust * a * a * vAlpha, 1.0);
}
`

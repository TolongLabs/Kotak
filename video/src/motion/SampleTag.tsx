import { useEffect, useState } from 'react'
import { AbsoluteFill, cancelRender, continueRender, delayRender } from 'remotion'
import { ATKINSON_MONO_WOFF2 } from './atkinsonMono'

const FAMILY = 'Atkinson Hyperlegible Mono'
let fontLoad: Promise<void> | undefined

function loadMonoFont(): Promise<void> {
  fontLoad ??= (async () => {
    const style = document.createElement('style')
    style.textContent = `@font-face{font-family:'${FAMILY}';font-style:normal;font-weight:400 800;font-display:block;src:url(data:font/woff2;base64,${ATKINSON_MONO_WOFF2}) format('woff2')}`
    document.head.append(style)
    const faces = await document.fonts.load(`600 15px '${FAMILY}'`)
    if (faces.length === 0) throw new Error(`${FAMILY} did not load`)
  })()
  return fontLoad
}

/**
 * The HUD's "Sample Persona · Demo Answers" tag on its own, for the H1 clip in V4, which has no HUD. Same type, size
 * and place as in hud-1 to hud-8 (graphics/overlays.html .tag): right edge at x 1855, centred on y 1013.
 */
export const SampleTag: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading Atkinson Hyperlegible Mono for the sample tag'))
  useEffect(() => {
    loadMonoFont()
      .then(() => continueRender(handle))
      .catch((error: unknown) => cancelRender(error))
  }, [handle])
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          right: 65,
          top: 1013 - 7.5,
          font: `600 15px/1 '${FAMILY}', ui-monospace, monospace`,
          letterSpacing: '0.06em',
          color: '#595851',
          whiteSpace: 'nowrap'
        }}
      >
        Sample Persona · Demo Answers
      </div>
    </AbsoluteFill>
  )
}

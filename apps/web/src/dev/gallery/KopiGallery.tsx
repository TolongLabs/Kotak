import { useState } from 'react'
import { CatDialogue } from '../../components/kotak/CatDialogue'
import { KopiFigure } from '../../components/kopi/KopiFigure'
import { kopiPoses, type KopiPose } from '../../components/kopi/poses'
import { Button } from '../../components/ui/Button'
import { corners } from '../../demo/data'
import { questions } from '../../demo/questions'

// One line per DESIGN.md moment; the explaining line carries citation markers.
const poseLines: Record<KopiPose, string> = {
  idle: 'Hi, I’m Kopi. Let’s open the box on your job.',
  asking: questions[0]?.text ?? '',
  thinking: 'Let me read the dated sources for you.',
  happy: 'Your plan is ready. Tick the first milestone when you finish it.',
  worried: 'Hmm, I couldn’t find that job. Try a simpler title?',
  explaining: corners.find((corner) => corner.sources?.length)?.reasoning ?? ''
}

const poseLabel = (pose: KopiPose) => pose[0]!.toUpperCase() + pose.slice(1)

export function KopiGallery() {
  const [pose, setPose] = useState<KopiPose>('idle')

  return (
    <section className="space-y-8" aria-labelledby="kopi-gallery-title">
      <h2 id="kopi-gallery-title" className="text-title-l">
        Kopi Gallery
      </h2>
      <div className="space-y-4">
        <h3 className="text-title-s">Cat Dialogue</h3>
        <div role="group" aria-label="Kopi Pose" className="flex flex-wrap gap-2">
          {kopiPoses.map((item) => (
            <Button
              key={item}
              variant={item === pose ? 'primary' : 'secondary'}
              aria-pressed={item === pose}
              onClick={() => setPose(item)}
            >
              {poseLabel(item)}
            </Button>
          ))}
        </div>
        <CatDialogue pose={pose} speech={poseLines[pose]} size="lg" />
      </div>
      <div className="space-y-4">
        <h3 className="text-title-s">Poses</h3>
        <ul className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {kopiPoses.map((item) => (
            <li key={item} className="flex flex-col items-center gap-2">
              <KopiFigure pose={item} className="h-28" />
              <span className="font-mono text-mono-s text-text-muted">{poseLabel(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

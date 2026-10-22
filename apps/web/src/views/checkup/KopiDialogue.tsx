import { KopiFigure } from '../../components/kopi/KopiFigure'
import { KopiSpeechBox } from '../../components/kopi/KopiSpeechBox'
import type { KopiPose } from '../../components/kopi/poses'

export interface KopiDialogueProps {
  pose: KopiPose
  speech: string
}

// Kopi sits beside the speech box on the start and no-match screens, at both widths.
export function KopiAside({ pose, speech }: KopiDialogueProps) {
  return (
    <div className="flex min-w-0 items-end gap-4">
      <KopiFigure pose={pose} className="h-28 max-[479px]:h-20" />
      <KopiSpeechBox speech={speech} />
    </div>
  )
}

// The question screen gives Kopi the stage: a larger cat centred above a full-width speech box.
export function KopiStage({ pose, speech }: KopiDialogueProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-4">
      <KopiFigure pose={pose} className="h-[250px] max-[479px]:h-[198px]" />
      <KopiSpeechBox speech={speech} className="w-full" />
    </div>
  )
}

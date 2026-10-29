import { KopiFigure } from '../../components/kopi/KopiFigure'
import { KopiSpeechBox } from '../../components/kopi/KopiSpeechBox'
import type { KopiPose } from '../../components/kopi/poses'
import { cn } from '../../components/ui/cn'

export interface KopiDialogueProps {
  pose: KopiPose
  speech: string
  // The lines the speech box keeps room for (see KopiSpeechBox).
  reserve?: string[]
}

// Kopi sits beside the speech box on the start and no-match screens, at both widths.
// `react` makes Kopi react to an answer once (see KopiFigure); reduced motion skips it.
// `centred` centres Kopi on the speech box below 480 px.
export function KopiAside({
  pose,
  speech,
  reserve,
  react = false,
  centred = false
}: KopiDialogueProps & { react?: boolean; centred?: boolean }) {
  return (
    <div className={cn('flex min-w-0 items-end gap-4', centred && 'max-[479px]:items-center')}>
      <KopiFigure pose={pose} react={react} className="h-28 max-[479px]:h-20" />
      <KopiSpeechBox speech={speech} reserve={reserve} />
    </div>
  )
}

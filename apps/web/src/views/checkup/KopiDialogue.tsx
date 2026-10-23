import { useReducedMotion } from '../../components/kopi/motion'
import { KopiFigure } from '../../components/kopi/KopiFigure'
import { KopiSpeechBox } from '../../components/kopi/KopiSpeechBox'
import type { KopiPose } from '../../components/kopi/poses'
import { cn } from '../../components/ui/cn'

export interface KopiDialogueProps {
  pose: KopiPose
  speech: string
}

// Kopi sits beside the speech box on the start and no-match screens, at both widths.
// `hop` gives one short bounce (CSS .kopi-hop); reduced motion skips it.
// `centred` centres Kopi on the speech box below 480 px.
export function KopiAside({
  pose,
  speech,
  hop = false,
  centred = false
}: KopiDialogueProps & { hop?: boolean; centred?: boolean }) {
  const { reduced } = useReducedMotion()
  return (
    <div className={cn('flex min-w-0 items-end gap-4', centred && 'max-[479px]:items-center')}>
      <KopiFigure pose={pose} className={cn('h-28 max-[479px]:h-20', hop && !reduced && 'kopi-hop')} />
      <KopiSpeechBox speech={speech} />
    </div>
  )
}

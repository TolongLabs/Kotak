import { KopiFigure } from '../kopi/KopiFigure'
import { KopiSpeechBox } from '../kopi/KopiSpeechBox'
import type { KopiPose } from '../kopi/poses'
import { cn } from '../ui/cn'

export type { KopiPose }

export interface CatDialogueProps {
  pose: KopiPose
  // Kopi's line; [n] markers become citations. The speech box owns the mute button and voice.
  speech: string
  size?: 'md' | 'lg'
  // Stack the cat above the speech box, for narrow columns on wide screens.
  stacked?: boolean
}

export function CatDialogue({ pose, speech, size = 'md', stacked = false }: CatDialogueProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 gap-4',
        stacked
          ? 'flex-col items-stretch gap-3'
          : size === 'lg'
            ? 'items-center max-[479px]:flex-col max-[479px]:items-stretch max-[479px]:gap-3'
            : // Kopi sits beside the speech box at both widths, as on the Check-Up start screen.
              'items-end max-[479px]:gap-3'
      )}
    >
      <KopiFigure
        pose={pose}
        className={cn(
          'max-w-full shrink-0',
          (stacked || size === 'lg') && 'max-[479px]:self-center',
          stacked && 'self-center',
          size === 'lg' ? 'h-60 max-[479px]:h-48' : 'h-28 max-[479px]:h-20'
        )}
      />
      <KopiSpeechBox speech={speech} />
    </div>
  )
}

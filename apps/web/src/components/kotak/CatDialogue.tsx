import { VoiceToggle } from '../ui/VoiceToggle'
import { cn } from '../ui/cn'

export type KopiPose = 'idle' | 'asking' | 'thinking' | 'happy' | 'worried' | 'explaining'

export interface CatDialogueProps {
  pose: KopiPose
  speech: string
  muted: boolean
  onToggleVoice: () => void
  size?: 'md' | 'lg'
  // Stack the cat above the speech box, for narrow columns on wide screens.
  stacked?: boolean
}

export function CatDialogue({ pose, speech, muted, onToggleVoice, size = 'md', stacked = false }: CatDialogueProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 gap-4',
        stacked
          ? 'flex-col items-stretch gap-3'
          : cn(
              size === 'lg' ? 'items-center' : 'items-end',
              'max-[479px]:flex-col max-[479px]:items-stretch max-[479px]:gap-3'
            )
      )}
    >
      <img
        src={`/kopi/${pose}.png`}
        alt=""
        className={cn(
          'w-auto max-w-full shrink-0 object-contain max-[479px]:self-center',
          stacked && 'self-center',
          size === 'lg' ? 'h-60 max-[479px]:h-48' : 'h-28 max-[479px]:h-16'
        )}
      />
      <div className="min-w-0 flex-1 space-y-2 rounded-md border-2 border-text-primary bg-bg-default p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-mono-s text-text-muted">Kopi</span>
          <VoiceToggle muted={muted} onToggle={onToggleVoice} />
        </div>
        <p aria-live="polite" aria-atomic="true" className="font-speech text-body-l text-text-primary">
          {speech}
        </p>
      </div>
    </div>
  )
}

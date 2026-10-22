import { VoiceToggle } from '../ui/VoiceToggle'

export type KopiPose = 'idle' | 'asking' | 'thinking' | 'happy' | 'worried' | 'explaining'

export interface CatDialogueProps {
  pose: KopiPose
  speech: string
  muted: boolean
  onToggleVoice: () => void
  size?: 'md' | 'lg'
}

// Placeholder: issue #59 builds the full dialogue from the Kotak component contract.
export function CatDialogue({ pose, speech, muted, onToggleVoice }: CatDialogueProps) {
  return (
    <div className="flex items-end gap-4">
      <img src={`/kopi/${pose}.png`} alt="" className="h-28 w-auto shrink-0" />
      <div className="min-w-0 flex-1 space-y-2 rounded-md border-2 border-text-primary bg-bg-default p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-mono-s text-text-muted">Kopi</span>
          <VoiceToggle muted={muted} onToggle={onToggleVoice} />
        </div>
        <p aria-live="polite" className="font-speech text-body-l text-text-primary">
          {speech}
        </p>
      </div>
    </div>
  )
}

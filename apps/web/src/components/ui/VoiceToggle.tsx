import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { AudioLines, VolumeX } from 'lucide-react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { IconButton } from './IconButton'
import { cn } from './cn'

export interface VoiceToggleProps extends ComponentPropsWithoutRef<'button'> {
  muted: boolean
  onToggle?: () => void
}

export const VoiceToggle = forwardRef<HTMLButtonElement, VoiceToggleProps>(function VoiceToggle(
  { muted, onToggle, className, ...props },
  ref
) {
  const t = useText(uiText)
  return (
    <IconButton
      ref={ref}
      label={muted ? t.unmuteKopi : t.muteKopi}
      icon={muted ? VolumeX : AudioLines}
      onClick={onToggle}
      aria-pressed={muted}
      className={cn('rounded-full', className)}
      {...props}
    />
  )
})

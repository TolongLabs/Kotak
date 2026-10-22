import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { AudioLines, VolumeX } from 'lucide-react'
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
  return (
    <IconButton
      ref={ref}
      label={muted ? 'Unmute Kopi' : 'Mute Kopi'}
      icon={muted ? VolumeX : AudioLines}
      onClick={onToggle}
      aria-pressed={muted}
      className={cn('rounded-full', className)}
      {...props}
    />
  )
})

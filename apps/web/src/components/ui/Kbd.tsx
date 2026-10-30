import type { ComponentProps } from 'react'
import { cn } from './cn'

// A key the user can press, after shadcn/ui's Kbd (https://ui.shadcn.com/docs/components/kbd), in Kotak's tokens. It
// names a shortcut beside the control it works, hidden from screen readers, which get the shortcut from the control's
// aria-keyshortcuts instead; where the key is the content itself, as in a list of keys, pass aria-hidden={false}.
// `bare` drops the key's box, for a key drawn straight on a picture, such as the 3D space.

export function Kbd({ bare = false, className, ...props }: ComponentProps<'kbd'> & { bare?: boolean }) {
  return (
    <kbd
      data-slot="kbd"
      aria-hidden="true"
      className={cn(
        'pointer-events-none inline-flex h-5 w-fit min-w-5 shrink-0 select-none items-center justify-center rounded-sm border px-1 font-sans text-label-s text-text-muted',
        bare ? 'border-transparent' : 'border-border-subtle bg-bg-panel',
        className
      )}
      {...props}
    />
  )
}

export function KbdGroup({ className, ...props }: ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex items-center gap-1', className)} {...props} />
}

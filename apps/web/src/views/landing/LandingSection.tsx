import type { ReactNode } from 'react'
import { cn } from '../../components/ui/cn'

const tones = {
  default: 'bg-bg-default',
  panel: 'bg-bg-panel',
  dark: 'tone-dark bg-bg-default'
}

interface LandingSectionProps {
  id?: string
  tone: keyof typeof tones
  className?: string
  children: ReactNode
}

// Every landing scene fills the viewport and centres its content (DESIGN.md "Layout"); taller content grows the scene
// instead of clipping.
export function LandingSection({ id, tone, className, children }: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'flex min-h-svh flex-col border-t border-border-subtle px-6 py-16 text-text-primary lg:px-16',
        tones[tone],
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-[1312px] flex-1 flex-col justify-center gap-10">{children}</div>
    </section>
  )
}

interface SectionHeadingProps {
  title: string
  // A source or date line under the lede, in mono.
  note?: string
  children: ReactNode
}

export function SectionHeading({ title, note, children }: SectionHeadingProps) {
  return (
    <header className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end lg:gap-6">
      <h2 className="text-balance font-extrabold text-display text-text-primary lg:col-span-7 lg:text-display-l">
        {title}
      </h2>
      <div className="flex max-w-[560px] flex-col gap-3 lg:col-span-5">
        <p className="text-body-m text-text-muted lg:text-body-l">{children}</p>
        {note ? <p className="font-mono text-mono-s text-text-muted">{note}</p> : null}
      </div>
    </header>
  )
}

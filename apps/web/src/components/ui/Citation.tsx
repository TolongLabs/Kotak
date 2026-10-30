import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export interface CitationProps extends ComponentPropsWithoutRef<'a'> {
  n: number
  href?: string
}

export const Citation = forwardRef<HTMLAnchorElement, CitationProps>(function Citation(
  { n, href, className, children, ...props },
  ref
) {
  const t = useText(uiText)
  const targetHref = href ?? `#source-${n}`

  return (
    <a
      ref={ref}
      href={targetHref}
      aria-label={t.sourceNumber(n)}
      className={cn(
        'inline-flex min-h-[24px] min-w-[24px] shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-bg-panel px-1.5 font-mono text-mono-s text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted',
        className
      )}
      {...props}
    >
      {children ?? `[${n}]`}
    </a>
  )
})

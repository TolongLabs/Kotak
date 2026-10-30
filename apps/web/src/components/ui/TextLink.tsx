import { ExternalLink } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef } from 'react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'

export interface TextLinkProps extends ComponentPropsWithoutRef<'a'> {
  href: string
  external?: boolean
}

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(function TextLink(
  { href, external = false, className, children, target, rel, ...props },
  ref
) {
  const t = useText(uiText)
  const computedTarget = external ? (target ?? '_blank') : target
  const computedRel = external ? (rel ? `${rel} noreferrer noopener` : 'noreferrer noopener') : rel

  return (
    <a
      ref={ref}
      href={href}
      target={computedTarget}
      rel={computedRel}
      className={cn(
        'inline-flex items-center gap-1 font-sans font-medium text-text-primary underline decoration-current underline-offset-2 transition-colors duration-150 ease-out hover:text-text-muted',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {external && (
        <>
          <ExternalLink className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
          <span className="sr-only">{t.opensInNewTab}</span>
        </>
      )}
    </a>
  )
})

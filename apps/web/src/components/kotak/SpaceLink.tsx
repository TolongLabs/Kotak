import { ArrowUpRight, Orbit } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from '../../app/router'

// The way into the 3D space from a control strip (DESIGN.md "Components"): a compact ink pill, never an underlined link.
export function SpaceLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-text-primary px-3.5 text-label-m text-bg-default transition-colors duration-150 ease-out hover:bg-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <Orbit className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
      {children}
      <ArrowUpRight className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
    </Link>
  )
}

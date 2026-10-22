import { Link } from '../app/router'
import { routes } from '../app/routes'
import { Logo } from '../components/brand/Logo'

export function LandingView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <h1>
        <Logo />
      </h1>
      <p className="text-body-l text-text-muted">The landing page is being built in issue #54.</p>
      <Link
        to={routes.checkUp}
        className="inline-flex h-12 items-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover"
      >
        Start Your Free Check-Up
      </Link>
    </main>
  )
}

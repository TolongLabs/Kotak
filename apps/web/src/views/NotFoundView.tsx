import { Link } from '../app/router'
import { routes } from '../app/routes'

export function NotFoundView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-title-l text-text-primary">Page Not Found</h1>
      <p className="text-body-m text-text-muted">This page isn't in the box.</p>
      <Link to={routes.home} className="text-label-l text-text-primary underline underline-offset-4">
        Go to Home
      </Link>
    </main>
  )
}

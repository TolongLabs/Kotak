import { Link } from '../app/router'
import { routes } from '../app/routes'
import { Logo } from '../components/brand/Logo'
import { shellText } from '../i18n/messages/shell'
import { useText } from '../i18n/text'

export function NotFoundView() {
  const t = useText(shellText)

  return (
    <div className="flex min-h-dvh flex-col bg-bg-default font-sans text-text-primary">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border-subtle px-4 lg:px-12">
        <Link
          to={routes.home}
          aria-label={t.navigation.brandHome}
          className="inline-flex items-center gap-2 rounded-sm"
        >
          <Logo variant="icon" className="h-8 w-8" />
          <span aria-hidden="true" className="text-title-m font-extrabold lowercase">
            kotak
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-start gap-4">
          <p className="font-mono text-mono-s text-text-muted">404</p>
          <h1 className="text-title-l text-text-primary">{t.notFound.title}</h1>
          <p className="text-body-m text-text-muted">{t.notFound.body}</p>
          <Link
            to={routes.home}
            className="inline-flex h-12 min-h-12 items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l font-semibold text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover"
          >
            {t.notFound.goHome}
          </Link>
        </div>
      </main>
    </div>
  )
}

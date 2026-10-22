import { ArrowLeft } from 'lucide-react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'
import { TextField } from '../components/ui/TextField'
import { startGuestSession } from '../session/guest'

// Layout and behaviour adapted from Safe Edge's sign-in page (TolongLabs/sdp-hack apps/site/sign-in.html).
export function SignInView() {
  function signInAsGuest() {
    startGuestSession()
    navigate(routes.home)
  }

  return (
    <div className="min-h-svh bg-bg-default font-sans text-text-primary md:grid md:grid-cols-[5fr_6fr]">
      <aside className="flex flex-col gap-6 border-border-subtle bg-bg-panel px-6 py-8 md:min-h-svh md:border-r md:px-12">
        <Link to={routes.landing} className="inline-flex w-fit">
          <Logo />
        </Link>
        <div className="flex flex-col gap-3 md:mt-12">
          <p className="text-title-m md:max-w-[14ch] md:text-display">Find Your Next Skill, One Question at a Time.</p>
          <p className="font-mono text-mono-s text-text-muted">Pilot · Sample Data</p>
        </div>
        <div
          aria-hidden="true"
          className="hidden h-[clamp(180px,28vh,280px)] items-center justify-center rounded-lg border-[1.5px] border-text-primary bg-accent-box md:mt-auto md:flex"
        >
          <Logo variant="mark" className="h-24 w-24" />
        </div>
      </aside>

      <main className="flex flex-col px-6 py-8 md:min-h-svh md:items-center md:justify-center md:px-6">
        <div className="flex w-full flex-col gap-6 md:w-[400px]">
          <Link
            to={routes.landing}
            className="inline-flex min-h-11 w-fit items-center gap-1 text-label-m font-medium text-text-primary underline decoration-current underline-offset-2 hover:text-text-muted"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            Back to Kotak
          </Link>

          <h1 className="text-title-l">Sign In</h1>

          <div className="flex flex-col gap-4">
            <TextField label="Email" type="email" placeholder="name@example.com" disabled />
            <PasswordField label="Password" placeholder="••••••••" disabled />
            <p className="text-body-s text-text-muted">Accounts are not open in the pilot.</p>
          </div>

          <div className="flex items-center gap-3 text-body-s text-text-muted">
            <span className="h-px flex-1 bg-border-subtle" />
            <span>or</span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={signInAsGuest}>
              Sign In as Guest
            </Button>
            <p className="text-body-s text-text-muted">Opens the Kotak demo on sample data.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

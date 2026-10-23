import { Check, Lock, Mail } from 'lucide-react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { Logo } from '../components/brand/Logo'
import { Button } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'
import { TextField } from '../components/ui/TextField'
import { startGuestSession } from '../session/guest'

const benefits = [
  'Verdicts from public data, with every source shown',
  'A 12-week roadmap you can follow after work',
  'No account needed for the pilot'
]

const footer = 'SDC Hackathon 2026 · Domain 1 · Built in Malaysia'

export function SignInView() {
  function signInAsGuest() {
    startGuestSession()
    navigate(routes.home)
  }

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-bg-default font-sans text-text-primary lg:grid lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:gap-0">
      <aside className="flex flex-col gap-6 px-6 pt-6 lg:min-h-svh lg:justify-between lg:bg-accent-box lg:px-12 lg:py-12">
        <Link to={routes.landing} aria-label="Kotak Home" className="inline-flex w-fit items-center gap-2">
          <Logo variant="icon" className="h-8 w-8 lg:h-9 lg:w-9" />
          <span className="text-[22px] leading-none font-extrabold lowercase text-text-primary lg:text-[26px] lg:text-accent-on-box">
            kotak
          </span>
        </Link>

        <div className="flex flex-col gap-6 lg:gap-5">
          <div className="flex items-end gap-3 rounded-md bg-accent-box p-4 lg:flex-col lg:items-start lg:gap-5 lg:rounded-none lg:bg-transparent lg:p-0">
            <img
              src="/kopi/happy.png"
              alt=""
              aria-hidden="true"
              className="h-[114px] w-[88px] shrink-0 object-contain lg:h-[229px] lg:w-[176px]"
            />
            <p className="min-w-0 flex-1 text-title-m text-accent-on-box lg:flex-none lg:w-full lg:text-display-l">
              Open the Box on Your Job.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:gap-5">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex min-w-0 items-center gap-2.5">
                <Check className="h-5 w-5 shrink-0 stroke-current text-accent-on-box" aria-hidden="true" />
                <p className="min-w-0 text-body-m text-accent-on-box lg:text-body-l">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="hidden font-mono text-mono-s text-accent-on-box lg:block">{footer}</p>
      </aside>

      <main className="flex min-w-0 flex-col items-center justify-center px-6 pb-8 lg:min-h-svh lg:py-8">
        <div className="flex w-full max-w-[440px] flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-title-m lg:text-title-l">Sign In to Kotak</h1>
            <p className="text-body-s text-text-muted">
              Accounts open after the pilot. For now, guest mode keeps your check-up on this device.
            </p>
          </div>

          <TextField
            label="Email"
            type="email"
            placeholder="name@example.com"
            helper="Email sign-in opens after the pilot."
            icon={Mail}
            disabled
          />

          <PasswordField label="Password" placeholder="••••••••" disabled />

          <Button variant="primary" size="lg" fullWidth disabled>
            Sign In
          </Button>

          <div className="flex items-center gap-3 font-mono text-mono-s text-text-muted">
            <span className="h-px flex-1 bg-border-subtle" />
            <span>or</span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <Button variant="primary" size="lg" fullWidth onClick={signInAsGuest}>
            Sign In as Guest
          </Button>

          <p className="flex items-start gap-2 text-body-s text-text-muted">
            <Lock className="mt-0.5 h-[18px] w-[18px] shrink-0 stroke-current" aria-hidden="true" />
            <span>Your check-up stays on this device.</span>
          </p>

          <p className="text-center text-body-s text-text-muted">
            Managing scraper data?{' '}
            <Link
              to={routes.adminSignIn}
              className="font-semibold text-text-primary underline decoration-border-control underline-offset-4 hover:decoration-text-primary"
            >
              Admin Sign In
            </Link>
          </p>
        </div>
      </main>

      <p className="px-6 pb-8 font-mono text-mono-s text-text-primary lg:hidden">{footer}</p>
    </div>
  )
}

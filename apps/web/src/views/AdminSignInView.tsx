import { UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, navigate } from '../app/router'
import { routes } from '../app/routes'
import { Logo } from '../components/brand/Logo'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { PasswordField } from '../components/ui/PasswordField'
import { TextField } from '../components/ui/TextField'

const LEGACY_TOKEN_KEY = 'kotak:scraper-admin-token'

export function AdminSignInView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const requestRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    try {
      sessionStorage.removeItem(LEGACY_TOKEN_KEY)
      localStorage.removeItem(LEGACY_TOKEN_KEY)
    } catch {
      // Browser storage can be blocked; admin authentication uses its HttpOnly cookie.
    }

    return () => {
      mountedRef.current = false
      requestRef.current?.abort()
    }
  }, [])

  function updateUsername(value: string) {
    setUsername(value)
    setError(null)
  }

  function updatePassword(value: string) {
    setPassword(value)
    setError(null)
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    submittingRef.current = true
    setSubmitting(true)
    setError(null)

    const controller = new AbortController()
    requestRef.current = controller

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      })

      if (!mountedRef.current) return

      if (response.ok) {
        setPassword('')
        navigate(routes.adminScraping)
        return
      }

      setError(
        response.status === 401
          ? 'The username or password is incorrect. Check both fields and try again.'
          : response.status === 429
            ? 'Too many sign-in attempts. Wait a minute before trying again.'
            : 'Kotak could not sign you in. Try again.'
      )
    } catch (cause) {
      if (!mountedRef.current || (cause instanceof DOMException && cause.name === 'AbortError')) return
      setError('Kotak could not reach the server. Check your connection and try again.')
    } finally {
      if (mountedRef.current) {
        submittingRef.current = false
        setSubmitting(false)
      }
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-bg-panel px-6 py-10 font-sans text-text-primary">
      <div className="w-full max-w-[440px] space-y-6">
        <Link to={routes.landing} aria-label="Kotak Home" className="inline-flex w-fit items-center gap-2">
          <Logo variant="icon" className="h-9 w-9" />
          <span className="text-[26px] leading-none font-extrabold lowercase">kotak</span>
        </Link>

        <section className="surface-card space-y-6 p-5 sm:p-6" aria-labelledby="admin-sign-in-title">
          <div className="space-y-2">
            <h1 id="admin-sign-in-title" className="text-title-m sm:text-title-l">
              Admin Sign In
            </h1>
            <p className="text-body-s text-text-muted">Sign in to manage JobStreet scraper runs.</p>
          </div>

          <form className="space-y-4" onSubmit={signIn}>
            <TextField
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={64}
              icon={UserRound}
              required
              value={username}
              onChange={(event) => updateUsername(event.target.value)}
            />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => updatePassword(event.target.value)}
            />

            {error && <Banner type="error" title="Sign-in failed" body={error} role="alert" />}

            <Button variant="primary" size="lg" fullWidth type="submit" loading={submitting}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-body-s text-text-muted">
            Looking for the pilot?{' '}
            <Link
              to={routes.signIn}
              className="font-semibold text-text-primary underline decoration-border-control underline-offset-4 hover:decoration-text-primary"
            >
              Continue as a guest
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

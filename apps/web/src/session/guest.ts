// The #136 stand-in now reads and writes the guest session store (#41), so sign-in, the dashboard and the engine
// share one session.
export { readGuestSession, startGuestSession } from './store'

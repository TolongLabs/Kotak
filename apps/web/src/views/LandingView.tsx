import { LandingEvidence, LandingFooter } from './landing/LandingEvidence'
import { LandingHero } from './landing/LandingHero'
import { LandingSections } from './landing/LandingSections'

export function LandingView() {
  return (
    <main id="top" className="min-h-screen overflow-x-clip bg-bg-default text-text-primary">
      <LandingHero />
      <LandingSections />
      <LandingEvidence />
      <LandingFooter />
    </main>
  )
}

import { Briefcase, GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { Accordion } from '../../components/ui/Accordion'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { ChoiceCard } from '../../components/ui/ChoiceCard'
import { Modal } from '../../components/ui/Modal'
import { ScenarioSwitch, type ScenarioValue } from '../../components/ui/ScenarioSwitch'
import { Tabs } from '../../components/ui/Tabs'
import { TextLink } from '../../components/ui/TextLink'
import { ToastRegion, type ToastItemProps } from '../../components/ui/Toast'
import { VoiceToggle } from '../../components/ui/VoiceToggle'

const toastDemo: ToastItemProps[] = [
  {
    id: 'toast-saved',
    type: 'success',
    title: 'Plan Saved on This Device',
    action: (
      <TextLink href="#undo" className="text-accent-box! decoration-accent-box! hover:text-accent-box-hover!">
        Undo
      </TextLink>
    )
  },
  {
    id: 'toast-error',
    type: 'error',
    title: "Couldn't Load Explanations",
    action: <TextLink href="#retry">Retry</TextLink>
  },
  {
    id: 'toast-info',
    type: 'info',
    title: 'New Data Landed: May 2026',
    body: 'Verdicts and the radar now use the newer AI usage data.',
    action: <TextLink href="#see-what-changed">See What Changed</TextLink>
  }
]

const tabsDemo = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills' },
  { id: 'roadmap', label: 'Roadmap' }
]

const tabPanels: Record<string, string> = {
  overview: 'Your check-up cards, radar and plan summary sit here.',
  skills: 'Skills on this device are listed with gaps and citations.',
  roadmap: 'Timed pathway steps with courses from live catalogues.'
}

const faqDemo = [
  {
    id: 'sources',
    question: 'Where Do the Verdicts Come From?',
    answer:
      'Every verdict reads dated snapshots of AI usage data and cites its source with a numbered link you can open.'
  },
  {
    id: 'scenarios',
    question: 'Why Two Scenarios?',
    answer: 'Slow and fast AI uptake give two plans when the sources disagree, so you can prepare for either future.'
  },
  {
    id: 'device',
    question: 'Is Anything Sent to a Server?',
    answer: 'Answers, radar and plan stay on this device until you choose to share them.'
  }
]

export function OverlaysGallery() {
  const [modalOpen, setModalOpen] = useState(false)
  const [tabValue, setTabValue] = useState(tabsDemo[0].id)
  const [goalValue, setGoalValue] = useState('keep')
  const [scenarioValue, setScenarioValue] = useState<ScenarioValue>('slow')
  const [voiceMuted, setVoiceMuted] = useState(false)

  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-12 bg-bg-default p-8 font-sans text-text-primary">
      <header className="border-b border-border-subtle pb-6">
        <h1 className="text-title-l font-bold">Overlays &amp; Disclosure Gallery</h1>
        <p className="mt-2 text-body-m text-text-muted">
          Group C primitives for Kotak: modal, toasts, banner, tabs, accordion, choice card, scenario switch and voice
          toggle.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Modal</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Reset Your Check-Up?"
          actions={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Keep My Data
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Reset Check-Up
              </Button>
            </>
          }
        >
          Your answers, radar and plan on this device will be cleared. This can&apos;t be undone.
        </Modal>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Toast</h2>
        <p className="text-body-m text-text-muted">
          The three types below render inside the Toast Region, a polite live area fixed to the viewport.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Banner</h2>
        <div className="space-y-4">
          <Banner
            type="info"
            title="New Data Landed: May 2026"
            body="Verdicts and the radar now use the newer AI usage data."
          />
          <Banner type="error" title="Couldn't Load Explanations" body="Check your connection and try again." />
          <Banner type="sample" body="Verdicts shown until real data loads." />
          <Banner type="sample" title="Sample Data" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Tabs</h2>
        <Tabs tabs={tabsDemo} value={tabValue} onChange={setTabValue}>
          <p className="text-body-m text-text-muted">{tabPanels[tabValue]}</p>
        </Tabs>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Accordion</h2>
        <Accordion items={faqDemo} defaultOpenIds={['sources']} />
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Choice Card</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChoiceCard
            name="focus-goal"
            value="keep"
            title="Stay Strong in My Job"
            description="Keep your current role safe as AI changes it."
            icon={Briefcase}
            selected={goalValue === 'keep'}
            onSelect={setGoalValue}
          />
          <ChoiceCard
            name="focus-goal"
            value="learn"
            title="Learn Something New"
            description="Follow a pathway into a role that AI grows."
            icon={GraduationCap}
            selected={goalValue === 'learn'}
            onSelect={setGoalValue}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Scenario Switch</h2>
        <ScenarioSwitch value={scenarioValue} onChange={setScenarioValue} aria-label="AI Uptake Scenario" />
      </section>

      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Voice Toggle</h2>
        <div className="flex flex-wrap items-center gap-6">
          <VoiceToggle muted={voiceMuted} onToggle={() => setVoiceMuted(!voiceMuted)} />
          <VoiceToggle muted />
        </div>
      </section>

      <ToastRegion toasts={toastDemo} />
    </div>
  )
}

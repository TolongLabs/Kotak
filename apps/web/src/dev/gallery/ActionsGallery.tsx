import { ArrowRight, Download, Heart, Plus, Search, Settings, Share2, Trash2, Volume2 } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Citation } from '../../components/ui/Citation'
import { IconButton } from '../../components/ui/IconButton'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { SdgChip } from '../../components/ui/SdgChip'
import { Spinner } from '../../components/ui/Spinner'
import { Stepper } from '../../components/ui/Stepper'
import { TextLink } from '../../components/ui/TextLink'
import { Tooltip } from '../../components/ui/Tooltip'
import { VerdictChip } from '../../components/ui/VerdictChip'

const stepperLabels: [string, string, string, string, string] = ['Check-Up', 'Questions', 'Radar', 'Roadmap', 'Summary']

const allGoals = Array.from({ length: 17 }, (_, i) => i + 1)

export function ActionsGallery() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-12 bg-bg-default p-8 font-sans text-text-primary">
      <header className="border-b border-border-subtle pb-6">
        <h1 className="text-title-l font-bold">Actions & Indicators Gallery</h1>
        <p className="mt-2 text-body-m text-text-muted">
          Group A primitives for Kotak: buttons, links, indicators, chips, and feedback components.
        </p>
      </header>

      {/* Button */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Button</h2>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Variants</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="inverse">Inverse Action</Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="md">
              Medium 44 Px
            </Button>
            <Button variant="primary" size="lg">
              Large 48 Px
            </Button>
            <Button variant="secondary" size="md">
              Medium 44 Px
            </Button>
            <Button variant="secondary" size="lg">
              Large 48 Px
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Icons And States</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" iconStart={<Plus className="h-5 w-5" aria-hidden="true" />}>
              Add New Plan
            </Button>
            <Button variant="secondary" iconEnd={<ArrowRight className="h-5 w-5" aria-hidden="true" />}>
              Continue Forward
            </Button>
            <Button
              variant="primary"
              iconStart={<Download className="h-5 w-5" aria-hidden="true" />}
              iconEnd={<ArrowRight className="h-5 w-5" aria-hidden="true" />}
            >
              Download Report
            </Button>
            <Button variant="primary" loading>
              Loading State
            </Button>
            <Button variant="secondary" disabled>
              Disabled Action
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Full Width</h3>
          <div className="max-w-md">
            <Button variant="primary" fullWidth>
              Full Width Action
            </Button>
          </div>
        </div>
      </section>

      {/* IconButton */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Icon Button</h2>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Outline Variant</h3>
          <div className="flex flex-wrap items-center gap-4">
            <IconButton label="Open Settings" icon={Settings} variant="outline" />
            <IconButton label="Search Roles" icon={Search} variant="outline" />
            <IconButton label="Add Item" icon={Plus} variant="outline" />
            <IconButton label="Save Favorite" icon={Heart} variant="outline" />
            <IconButton label="Disabled Settings" icon={Settings} variant="outline" disabled />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Plain Variant</h3>
          <div className="flex flex-wrap items-center gap-4">
            <IconButton label="Adjust Sound" icon={Volume2} variant="plain" />
            <IconButton label="Share Roadmap" icon={Share2} variant="plain" />
            <IconButton label="Remove Entry" icon={Trash2} variant="plain" />
            <IconButton label="Disabled Share" icon={Share2} variant="plain" disabled />
          </div>
        </div>
      </section>

      {/* TextLink */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Text Link</h2>

        <div className="flex flex-wrap items-center gap-6">
          <TextLink href="#internal">Internal Page Anchor</TextLink>
          <TextLink href="https://example.com" external>
            Official External Source
          </TextLink>
        </div>
        <p className="text-body-m text-text-muted">
          Here is a paragraph demonstrating how a <TextLink href="#details">Nested Inline Link</TextLink> sits smoothly
          alongside body text and an{' '}
          <TextLink href="https://un.org" external>
            External UN Reference
          </TextLink>{' '}
          in context.
        </p>
      </section>

      {/* VerdictChip */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Verdict Chip</h2>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Medium Size (Default)</h3>
          <div className="flex flex-wrap items-center gap-4">
            <VerdictChip verdict="rising" size="md" />
            <VerdictChip verdict="steady" size="md" />
            <VerdictChip verdict="declining" size="md" />
            <VerdictChip verdict="split" size="md" />
            <VerdictChip verdict="unknown" size="md" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Small Size</h3>
          <div className="flex flex-wrap items-center gap-4">
            <VerdictChip verdict="rising" size="sm" />
            <VerdictChip verdict="steady" size="sm" />
            <VerdictChip verdict="declining" size="sm" />
            <VerdictChip verdict="split" size="sm" />
            <VerdictChip verdict="unknown" size="sm" />
          </div>
        </div>
      </section>

      {/* SdgChip */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Sdg Chip</h2>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Full Mode (All 17 Goals)</h3>
          <div className="flex flex-wrap gap-2.5">
            {allGoals.map((goal) => (
              <SdgChip key={goal} goal={goal} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-title-s font-semibold">Compact Mode (All 17 Goals)</h3>
          <div className="flex flex-wrap gap-2.5">
            {allGoals.map((goal) => (
              <SdgChip key={goal} goal={goal} compact />
            ))}
          </div>
        </div>
      </section>

      {/* Citation */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Citation</h2>

        <div className="flex flex-wrap items-center gap-4">
          <Citation n={1} />
          <Citation n={2} />
          <Citation n={8} />
          <Citation n={17} />
          <Citation n={42} href="#custom-source-target" />
        </div>
        <p className="text-body-m text-text-muted">
          TalentCorp National Critical Occupations List confirms rising demand for digital forensics skills in financial
          services <Citation n={3} /> with cross-scenario alignment <Citation n={7} />.
        </p>
      </section>

      {/* Tooltip */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Tooltip</h2>

        <div className="flex flex-wrap items-center gap-8 py-4">
          <Tooltip content="Tooltip Placed Top" placement="top">
            <Button variant="secondary">Hover For Top Tooltip</Button>
          </Tooltip>

          <Tooltip content="Tooltip Placed Bottom" placement="bottom">
            <Button variant="secondary">Hover For Bottom Tooltip</Button>
          </Tooltip>

          <Tooltip content="Press Escape To Dismiss">
            <span
              tabIndex={0}
              className="inline-flex cursor-pointer rounded-sm border border-border-control px-3 py-2 text-label-m text-text-primary"
            >
              Focusable Text Target
            </span>
          </Tooltip>
        </div>
      </section>

      {/* Spinner */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Spinner</h2>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Spinner size="sm" label="Loading small data" />
            <span className="text-label-s text-text-muted">Small (16 Px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Spinner size="md" label="Loading medium data" />
            <span className="text-label-m text-text-muted">Medium (20 Px)</span>
          </div>
          <div className="flex items-center gap-2">
            <Spinner size="lg" label="Loading large data" />
            <span className="text-label-l text-text-muted">Large (24 Px)</span>
          </div>
        </div>
      </section>

      {/* ProgressBar */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Progress Bar</h2>

        <div className="max-w-md space-y-4">
          <ProgressBar label="Check-Up Questions" value={0} max={10} />
          <ProgressBar label="Assessment Readiness" value={35} max={100} />
          <ProgressBar label="Skills Analysis Progress" value={7} max={10} valueText="7 of 10 Skills Verified" />
          <ProgressBar label="Curriculum Milestone Completion" value={100} max={100} />
        </div>
      </section>

      {/* Stepper */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Stepper</h2>

        <div className="max-w-xl space-y-5">
          <Stepper step={1} labels={stepperLabels} />
          <Stepper step={2} labels={stepperLabels} />
          <Stepper step={3} labels={stepperLabels} />
          <Stepper step={4} labels={stepperLabels} />
          <Stepper step={5} labels={stepperLabels} />
        </div>
      </section>

      {/* Avatar */}
      <section className="space-y-6">
        <h2 className="text-title-m font-bold">Avatar</h2>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <Avatar name="Kopi Counsellor" size="sm" />
            <Avatar name="Kopi Counsellor" size="md" />
            <Avatar name="Kopi Counsellor" size="lg" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Avatar name="Alaskan Tuna" size="md" />
            <Avatar name="Siti Nurhaliza" size="md" />
            <Avatar name="Adam Chen" size="md" />
          </div>
        </div>
      </section>
    </div>
  )
}

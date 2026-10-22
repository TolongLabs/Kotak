import type { Swot } from '../../demo/types'

export interface SkillsSwotProps {
  swot: Swot
  size?: 'desktop' | 'phone'
  onOpenRadar?: () => void
}

// Placeholder: issue #61 builds the 2 × 2 SWOT card from the Kotak component contract.
export function SkillsSwot({ swot }: SkillsSwotProps) {
  const quadrants = [
    ['Strengths', swot.strengths],
    ['Weaknesses', swot.weaknesses],
    ['Opportunities', swot.opportunities],
    ['Threats', swot.threats]
  ] as const

  return (
    <section className="surface-card space-y-3 p-5">
      <h2 className="text-title-s text-text-primary">Your Skills SWOT</h2>
      {quadrants.map(([title, items]) => (
        <div key={title}>
          <h3 className="text-label-m text-text-primary">{title}</h3>
          <p className="font-mono text-mono-s text-text-muted">
            {items.map((item) => item.label).join(' · ') || 'None'}
          </p>
        </div>
      ))}
    </section>
  )
}

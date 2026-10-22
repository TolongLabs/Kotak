import type { Corner, Scenario } from '../../demo/types'

export interface FutureSkillsRadarProps {
  corners: Corner[]
  scenario: Scenario
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Placeholder: issue #61 draws the Recharts radar (role line dashed ink, your shape yellow).
export function FutureSkillsRadar({ corners, scenario, className }: FutureSkillsRadarProps) {
  return (
    <figure className={className}>
      <figcaption className="text-label-m text-text-primary">Future Skills Radar</figcaption>
      <ul className="mt-2 space-y-1 font-mono text-mono-s text-text-muted">
        {corners.map((corner) => (
          <li key={corner.id}>
            {corner.name}: You {corner.you} · Needed {scenario === 'slow' ? corner.neededSlow : corner.neededFast}
          </li>
        ))}
      </ul>
    </figure>
  )
}

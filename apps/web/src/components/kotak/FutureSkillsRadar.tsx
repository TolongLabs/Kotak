import type { BaseTickContentProps } from 'recharts'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { Corner, Scenario } from '../../demo/types'
import { cn } from '../ui/cn'

export interface FutureSkillsRadarProps {
  corners: Corner[]
  scenario: Scenario
  size?: 'sm' | 'md' | 'lg'
  className?: string
  neededLabel?: string
}

type RadarDatum = {
  name: string
  you: number
  needed: number
}

const figureWidths = {
  sm: 'max-w-[342px]',
  md: 'max-w-[400px]',
  lg: 'max-w-[445px]'
}

const chartHeights = {
  sm: 'h-[290px]',
  md: 'h-[290px] md:h-[340px]',
  lg: 'h-[290px] md:h-[340px] lg:h-[377px]'
}

function wrapLabel(value: string, maxLength: number): string[] {
  const words = value.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word
    if (line && nextLine.length > maxLength) {
      lines.push(line)
      line = word
    } else {
      line = nextLine
    }
  }

  if (line) lines.push(line)
  return lines
}

function renderAngleTick({ x, y, payload, textAnchor }: BaseTickContentProps) {
  const lines = wrapLabel(String(payload.value), 12)
  const firstLineOffset = -((lines.length - 1) * 1.1) / 2

  return (
    <g transform={`translate(${x}, ${y})`} aria-hidden="true">
      <text
        className="fill-text-primary font-sans text-label-s lg:text-body-s"
        textAnchor={textAnchor}
        dominantBaseline="middle"
      >
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? `${firstLineOffset}em` : '1.1em'}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

export function FutureSkillsRadar({
  corners,
  scenario,
  size = 'md',
  className,
  neededLabel = 'Needed by 2027'
}: FutureSkillsRadarProps) {
  const data: RadarDatum[] = corners.map((corner) => ({
    name: corner.name,
    you: corner.you,
    needed: scenario === 'slow' ? corner.neededSlow : corner.neededFast
  }))

  return (
    <figure className={cn('mx-auto w-full', figureWidths[size], className)}>
      <figcaption className="sr-only">Future Skills Radar</figcaption>
      <div className={cn('w-full', chartHeights[size])}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <RadarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 24 }} outerRadius="62%">
            <PolarGrid zIndex={150} gridType="polygon" stroke="var(--color-border-subtle)" />
            <PolarAngleAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={renderAngleTick}
              tickSize={18}
            />
            <PolarRadiusAxis
              type="number"
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              axisLine={false}
              tickLine={false}
              tick={false}
            />
            <Radar
              name="You (Self-Reported)"
              dataKey="you"
              zIndex={100}
              stroke="none"
              strokeWidth={0}
              fill="var(--color-radar-you-fill)"
              fillOpacity={1}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Radar
              name="You (Self-Reported)"
              dataKey="you"
              zIndex={175}
              stroke="var(--color-text-primary)"
              strokeWidth={1.5}
              fill="none"
              fillOpacity={0}
              dot={{ r: 2.5, fill: 'var(--color-text-primary)', stroke: 'var(--color-text-primary)' }}
              activeDot={false}
              isAnimationActive={false}
            />
            <Radar
              name={neededLabel}
              dataKey="needed"
              zIndex={200}
              stroke="var(--color-radar-role)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              fillOpacity={0}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2" aria-label="Radar chart legend">
        <li className="flex items-center gap-2 text-label-s text-text-primary">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-sm border-[1.5px] border-text-primary bg-radar-you-fill"
            aria-hidden="true"
          />
          You (Self-Reported)
        </li>
        <li className="flex items-center gap-2 text-label-s text-text-primary">
          <span className="w-5 shrink-0 border-t-2 border-dashed border-radar-role" aria-hidden="true" />
          {neededLabel}
        </li>
      </ul>

      <div className="sr-only">
        <table>
          <caption>Skill levels from 0 to 3. Values for You and {neededLabel} by skill.</caption>
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">You</th>
              <th scope="col">{neededLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.name}>
                <th scope="row">{datum.name}</th>
                <td>{datum.you}</td>
                <td>{datum.needed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

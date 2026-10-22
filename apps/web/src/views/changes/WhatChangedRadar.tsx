import type { BaseTickContentProps } from 'recharts'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { Corner, Scenario } from '../../demo/types'
import { cn } from '../../components/ui/cn'

export interface WhatChangedRadarProps {
  beforeCorners: Corner[]
  afterCorners: Corner[]
  scenario: Scenario
  neededNowLabel?: string
  beforeLabel?: string
  className?: string
}

type RadarDatum = {
  name: string
  you: number
  neededNow: number
  before: number
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

export function WhatChangedRadar({
  beforeCorners,
  afterCorners,
  scenario,
  neededNowLabel = 'Needed Now (May)',
  beforeLabel = 'Before (April)',
  className
}: WhatChangedRadarProps) {
  const beforeMap = new Map(beforeCorners.map((corner) => [corner.id, corner]))
  const data: RadarDatum[] = afterCorners.map((corner) => {
    const prev = beforeMap.get(corner.id)
    return {
      name: corner.name,
      you: corner.you,
      neededNow: scenario === 'slow' ? corner.neededSlow : corner.neededFast,
      before: prev
        ? scenario === 'slow'
          ? prev.neededSlow
          : prev.neededFast
        : scenario === 'slow'
          ? corner.neededSlow
          : corner.neededFast
    }
  })

  return (
    <figure className={cn('mx-auto w-full max-w-[342px] lg:max-w-[428px]', className)}>
      <figcaption className="sr-only">Future Skills Radar comparison</figcaption>
      <div className="h-[290px] w-full md:h-[340px] lg:h-[362px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <RadarChart data={data} margin={{ top: 16, right: 28, bottom: 16, left: 28 }} outerRadius="62%">
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
            {/* You (Self-Reported) Fill */}
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
            {/* You (Self-Reported) Outline */}
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
            {/* Before line */}
            <Radar
              name={beforeLabel}
              dataKey="before"
              zIndex={190}
              stroke="var(--color-border-control)"
              strokeWidth={2}
              strokeDasharray="3 3"
              fill="none"
              fillOpacity={0}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            {/* Needed Now line */}
            <Radar
              name={neededNowLabel}
              dataKey="neededNow"
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

      <ul
        className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-label-s text-text-primary"
        aria-label="Radar chart legend"
      >
        <li className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-[4px] border-[1.5px] border-text-primary bg-radar-you-fill"
            aria-hidden="true"
          />
          You (Self-Reported)
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 shrink-0 border-t-[3px] border-radar-role" aria-hidden="true" />
          {neededNowLabel}
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 shrink-0 border-t-2 border-border-control" aria-hidden="true" />
          {beforeLabel}
        </li>
      </ul>

      <div className="sr-only">
        <table>
          <caption>
            Skill levels from 0 to 3. Values for You, {neededNowLabel}, and {beforeLabel} by skill.
          </caption>
          <thead>
            <tr>
              <th scope="col">Skill</th>
              <th scope="col">You</th>
              <th scope="col">{neededNowLabel}</th>
              <th scope="col">{beforeLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.name}>
                <th scope="row">{datum.name}</th>
                <td>{datum.you}</td>
                <td>{datum.neededNow}</td>
                <td>{datum.before}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

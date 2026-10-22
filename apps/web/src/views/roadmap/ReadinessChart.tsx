import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import { readiness } from '../../demo/data'
import type { ScenarioValue } from '../../components/ui/ScenarioSwitch'

interface ReadinessChartProps {
  scenario: ScenarioValue
}

export function ReadinessChart({ scenario }: ReadinessChartProps) {
  const xTicks = readiness.xLabels.map((label) => Number(label.replace('W', '')))
  const yTicks = readiness.yLabels.map((label) => Number(label.replace('%', '')))
  const xMin = Math.min(...xTicks)
  const xMax = Math.max(...xTicks)
  const yMin = Math.min(...yTicks)
  const yMax = Math.max(...yTicks)
  const threshold = Number(readiness.threshold.match(/\d+/)?.[0])
  const readyWeek = Number(readiness.readyBy.match(/Week (\d+)/)?.[1])
  const readyPoint = readiness.points.find((point) => point.week === readyWeek)
  const selectedFit = readyPoint?.[scenario === 'fast' ? 'fast' : 'plan']
  const readyLabel =
    selectedFit === undefined ? readiness.readyBy : `${readiness.readyBy.split(' · ')[0]} · ${selectedFit}%`

  return (
    <section
      aria-labelledby="readiness-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h2 id="readiness-title" className="text-title-s text-text-primary">
          {readiness.title}
        </h2>
        <p className="font-mono text-mono-s text-text-muted">{readiness.caption}</p>
      </div>
      <div className="flex justify-end">
        <span className="font-mono text-mono-s text-text-primary">{readyLabel}</span>
      </div>
      <div
        role="img"
        aria-label={`${readiness.title}. ${readyLabel}. ${readiness.threshold}.`}
        className="h-[220px] w-full lg:h-[260px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={readiness.points} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis
              type="number"
              dataKey="week"
              domain={[xMin, xMax]}
              ticks={xTicks}
              tickFormatter={(week: number) => `W${week}`}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border-control)' }}
              tickMargin={10}
              allowDecimals={false}
            />
            <YAxis
              type="number"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(fit: number) => `${fit}%`}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            {Number.isFinite(threshold) ? (
              <ReferenceLine
                y={threshold}
                stroke="var(--color-state-success)"
                strokeDasharray="4 4"
                label={{
                  value: readiness.threshold,
                  fill: 'var(--color-state-success)',
                  fontSize: 12,
                  position: 'insideTopLeft'
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="fast"
              name="Fast Uptake"
              stroke="var(--color-border-control)"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="plan"
              name="Your Plan"
              stroke="var(--color-text-primary)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-accent-box)', stroke: 'var(--color-text-primary)', strokeWidth: 1.5 }}
              activeDot={{
                r: 5,
                fill: 'var(--color-accent-box)',
                stroke: 'var(--color-text-primary)',
                strokeWidth: 1.5
              }}
              isAnimationActive={false}
            />
            {readyPoint && selectedFit !== undefined ? (
              <ReferenceDot
                x={readyPoint.week}
                y={selectedFit}
                r={5}
                fill="var(--color-accent-box)"
                stroke="var(--color-text-primary)"
                strokeWidth={1.5}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{readiness.title} sample values</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">Your Plan Fit</th>
              <th scope="col">Fast Uptake Fit</th>
            </tr>
          </thead>
          <tbody>
            {readiness.points.map((point) => (
              <tr key={point.week}>
                <th scope="row">{point.week}</th>
                <td>{point.plan}%</td>
                <td>{point.fast}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

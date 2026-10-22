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
import type { Readiness } from '../../demo/types'
import type { ScenarioValue } from '../../components/ui/ScenarioSwitch'

interface ReadinessChartProps {
  scenario: ScenarioValue
  points: Readiness['points']
  roleTitle: string
}

export function ReadinessChart({ scenario, points, roleTitle }: ReadinessChartProps) {
  const selectedPoint = points[points.length - 1]
  const fitKey = scenario === 'fast' ? 'fast' : 'plan'
  const readyPoint = points.find((point) => point[fitKey] >= 80)
  const annotationPoint = readyPoint ?? selectedPoint
  const annotationFit = annotationPoint?.[fitKey]
  const annotation =
    readyPoint && annotationFit !== undefined
      ? `Ready by Week ${readyPoint.week} · ${Math.round(annotationFit)}%`
      : annotationPoint && annotationFit !== undefined
        ? `Not Ready Yet · ${Math.round(annotationFit)}% by Week ${annotationPoint.week}`
        : 'No Readiness Estimate Yet'
  const minimumFit =
    points.length > 0
      ? Math.min(60, Math.floor(Math.min(...points.flatMap((point) => [point.plan, point.fast])) / 10) * 10)
      : 60
  const yTicks = [...new Set([minimumFit, 60, 70, 80, 90, 100].filter((tick) => tick >= minimumFit))]
  const xTicks = [...new Set(points.map((point) => point.week))]

  return (
    <section
      aria-labelledby="readiness-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h2 id="readiness-title" className="text-title-s text-text-primary">
          Readiness for {roleTitle}
        </h2>
        <p className="hidden font-mono text-mono-s text-text-muted lg:block">Solid: your plan · Dashed: fast uptake</p>
      </div>
      {points.length > 1 ? (
        <div
          role="img"
          aria-label={`Estimated fit by plan week. ${annotation}.`}
          className="h-[220px] w-full lg:h-[260px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis
                type="number"
                dataKey="week"
                domain={['dataMin', 'dataMax']}
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
                domain={[minimumFit, 100]}
                ticks={yTicks}
                tickFormatter={(fit: number) => ([minimumFit, 60, 80, 100].includes(fit) ? `${Math.round(fit)}%` : '')}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
              />
              <ReferenceLine
                y={80}
                stroke="var(--color-state-success)"
                strokeDasharray="4 4"
                label={{
                  value: 'Ready = 80% Fit',
                  position: 'insideTopLeft',
                  fill: 'var(--color-state-success)',
                  fontSize: 12
                }}
              />
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
              {annotationPoint && annotationFit !== undefined ? (
                <ReferenceDot
                  x={annotationPoint.week}
                  y={annotationFit}
                  r={5}
                  fill="var(--color-accent-box)"
                  stroke="var(--color-text-primary)"
                  strokeWidth={1.5}
                  label={{
                    value: annotation,
                    position: annotationPoint.week === xTicks[xTicks.length - 1] ? 'left' : 'bottom',
                    fill: 'var(--color-text-primary)',
                    fontSize: 12
                  }}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
          No Roadmap Steps To Plot Yet.
        </p>
      )}
      <p className="font-mono text-mono-s text-text-muted lg:hidden">Solid: your plan · Dashed: fast uptake</p>
      <div className="sr-only">
        <table>
          <caption>Estimated fit by plan week</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">Your Plan Fit</th>
              <th scope="col">Fast Uptake Fit</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
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

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { Readiness } from '../../demo/types'
import type { ScenarioValue } from '../../components/ui/ScenarioSwitch'

interface ReadinessChartProps {
  scenario: ScenarioValue
  points: Readiness['points']
}

export function ReadinessChart({ scenario, points }: ReadinessChartProps) {
  const selectedPoint = points[points.length - 1]
  const selectedFit = selectedPoint?.[scenario === 'fast' ? 'fast' : 'plan']
  const selectedLabel =
    selectedPoint && selectedFit !== undefined
      ? `About ${Math.round(selectedFit)}% Fit By Week ${selectedPoint.week}`
      : 'No Readiness Estimate Yet'
  const xTicks = [...new Set(points.map((point) => point.week))]

  return (
    <section
      aria-labelledby="readiness-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h2 id="readiness-title" className="text-title-s text-text-primary">
          Readiness Estimate
        </h2>
        <p className="font-mono text-mono-s text-text-muted">Fit With Your Current Job</p>
      </div>
      <div className="flex justify-end">
        <span className="font-mono text-mono-s text-text-primary">{selectedLabel}</span>
      </div>
      {points.length > 1 ? (
        <div
          role="img"
          aria-label={`Estimated fit by plan week. ${selectedLabel}.`}
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
                domain={['auto', 100]}
                tickFormatter={(fit: number) => `${Math.round(fit)}%`}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
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
              {selectedPoint && selectedFit !== undefined ? (
                <ReferenceDot
                  x={selectedPoint.week}
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
      ) : (
        <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
          No Roadmap Steps To Plot Yet.
        </p>
      )}
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

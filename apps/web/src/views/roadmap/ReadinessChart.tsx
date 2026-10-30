import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam
} from 'recharts'
import { dayDiff, formatPlanDay, planWeekDate, stepActiveInWeek, type TimelineStep } from './planSupport'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

interface ReadinessPoint {
  week: number
  plan: number
}

interface ReadinessChartProps {
  points: ReadinessPoint[]
  roleTitle: string
  startIso: string
  todayIso: string
  steps: TimelineStep[]
  onSelectStep: (stepId: string) => void
}

export function ReadinessChart({ points, roleTitle, startIso, todayIso, steps, onSelectStep }: ReadinessChartProps) {
  const t = useText(roadmapText)
  const readyIndex = points.findIndex((point) => point.plan >= 80)
  const readyPoint = readyIndex >= 0 ? points[readyIndex] : undefined
  const lastPoint = points[points.length - 1]
  const annotationPoint = readyPoint ?? lastPoint
  const annotationFit = annotationPoint ? Math.round(annotationPoint.plan) : undefined
  const annotation =
    readyPoint && annotationFit !== undefined
      ? readyPoint.week === 0
        ? `${t.fit.already} · ${annotationFit}%`
        : `${t.fit.byWeek(readyPoint.week)} · ${annotationFit}%`
      : annotationPoint && annotationFit !== undefined
        ? t.fit.belowAtWeek(annotationFit, annotationPoint.week)
        : t.fit.noEstimate

  const minimumFit =
    points.length > 0 ? Math.min(60, Math.floor(Math.min(...points.map((point) => point.plan)) / 10) * 10) : 60
  const yTicks = [...new Set([minimumFit, 60, 70, 80, 90, 100].filter((tick) => tick >= minimumFit))]
  const xTicks = [...new Set(points.map((point) => point.week))]

  const lastWeek = lastPoint?.week ?? 0
  const todayWeek = Math.floor(dayDiff(startIso, todayIso) / 7)
  const showToday = todayWeek >= 0 && todayWeek <= lastWeek

  return (
    <section
      aria-labelledby="readiness-title"
      className="space-y-3 rounded-md border border-border-subtle bg-bg-default p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-1">
          <h2 id="readiness-title" className="text-title-s text-text-primary">
            {t.fit.heading(roleTitle)}
          </h2>
          <p className="font-mono text-mono-m text-text-primary">{annotation}</p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label={t.fit.legend}>
          <li className="inline-flex items-center gap-2 text-label-s text-text-muted">
            <span aria-hidden="true" className="h-0 w-6 border-t-2 border-text-primary" />
            {t.fit.yourPlan}
          </li>
          <li className="inline-flex items-center gap-2 text-label-s text-text-muted">
            <span aria-hidden="true" className="h-0 w-6 border-t-2 border-dashed border-text-muted" />
            {t.fit.threshold}
          </li>
          <li className="inline-flex items-center gap-2 text-label-s text-text-muted">
            <span aria-hidden="true" className="h-4 w-0 border-l-2 border-text-primary" />
            {t.fit.today}
          </li>
        </ul>
      </div>
      {points.length > 1 ? (
        <div role="img" aria-label={t.fit.chartDescription(annotation)} className="h-[220px] w-full lg:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 12, right: 8, bottom: 4, left: 0 }}
              onClick={(state: MouseHandlerDataParam) => {
                const index = Number(state?.activeTooltipIndex)
                if (!Number.isFinite(index)) return
                const point = points[index]
                if (!point) return
                const step = stepActiveInWeek(steps, point.week)
                if (step) onSelectStep(step.id)
              }}
            >
              <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis
                type="number"
                dataKey="week"
                domain={['dataMin', 'dataMax']}
                ticks={xTicks}
                tickFormatter={t.timeline.axisWeek}
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
              <Tooltip
                isAnimationActive={false}
                cursor={{ stroke: 'var(--color-border-control)', strokeWidth: 1.5, strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  const point = payload?.[0]?.payload as ReadinessPoint | undefined
                  if (!point) return null
                  return (
                    <div className="pointer-events-none w-max rounded-sm border border-border-subtle bg-bg-default p-2.5 shadow-popover">
                      <p className="font-mono text-mono-s text-text-muted">
                        {t.fit.weekNumber(point.week)} · {formatPlanDay(planWeekDate(startIso, point.week))}
                      </p>
                      <p className="mt-1 text-label-m text-text-primary">{t.fit.percent(Math.round(point.plan))}</p>
                    </div>
                  )
                }}
              />
              {showToday && <ReferenceLine x={todayWeek} stroke="var(--color-text-primary)" strokeWidth={2} />}
              <ReferenceLine y={80} stroke="var(--color-text-muted)" strokeDasharray="4 4" />
              <Line
                type="stepAfter"
                dataKey="plan"
                name={t.fit.yourPlan}
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
                  y={annotationPoint.plan}
                  r={6}
                  fill="var(--color-accent-box)"
                  stroke="var(--color-text-primary)"
                  strokeWidth={2}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-md border border-border-subtle bg-bg-panel p-4 text-body-s text-text-muted">
          {t.fit.noStepsToPlot}
        </p>
      )}
      <div className="sr-only">
        <table>
          <caption>{t.fit.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{t.fit.week}</th>
              <th scope="col">{t.fit.date}</th>
              <th scope="col">{t.fit.yourPlanFit}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.week}>
                <th scope="row">{point.week}</th>
                <td>{formatPlanDay(planWeekDate(startIso, point.week))}</td>
                <td>{Math.round(point.plan)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

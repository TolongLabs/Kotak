import { accessFor } from '@kotak/sdk'
import { jobMarketLevelForYears, needsQualification, yearsOfWork } from '@kotak/shared'
import { Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, navigate } from '../app/router'
import { routes, spacePath } from '../app/routes'
import { AccessNotice } from '../components/kotak/AccessNotice'
import { CatDialogue } from '../components/kotak/CatDialogue'
import { FutureSkillsRadar } from '../components/kotak/FutureSkillsRadar'
import { GapCard } from '../components/kotak/GapCard'
import { QuadrantMap } from '../components/kotak/QuadrantMap'
import { JobMarketCard } from '../components/kotak/JobMarketCard'
import { ExplanationSourceProvider, ReasoningFooter } from '../components/kotak/Reasoning'
import { SdgTargetChip } from '../components/kotak/SdgReasonChip'
import { SkillsSwot } from '../components/kotak/SkillsSwot'
import { ScenarioControl } from '../components/kotak/ScenarioControl'
import { SgfSkillList } from '../components/kotak/SgfSkills'
import { SourceList } from '../components/kotak/SourceList'
import { ToolsCard } from '../components/kotak/ToolsCard'
import { Banner } from '../components/ui/Banner'
import { Button } from '../components/ui/Button'
import { Stepper } from '../components/ui/Stepper'
import { Tooltip } from '../components/ui/Tooltip'
import { routeLinkClassName } from '../components/ui/TextLink'
import { changesText } from '../i18n/messages/changes'
import { radarText } from '../i18n/messages/radar'
import { useText } from '../i18n/text'
import { isEstimatedLevel, toCorners, toRoles, neededByLabel, sourceRefs } from '../engine/viewModel'
import { topGapLabel, trendOf, type QuadrantPoint } from '../engine/quadrant'
import { assessedRoleCode, computeCheckup } from '../engine/checkup'
import { occupationSdgs } from '../engine/occupationSdg'
import { useCheckupBundle, useLocaleIndex } from '../engine/bundle'
import { fetchExplanations } from '../engine/api'
import { radarFutureDiff } from '../engine/futureDiff'
import { useJobMarkets } from '../engine/useJobMarkets'
import { roleTitle } from '../i18n/content/overlay'
import { hasAnswers, useGuestSession } from '../session/store'
import { useScenario } from '../session/scenario'
import type { Corner, Scenario, SourceRef } from '../demo/types'
import { deriveSwot } from '../demo/swot'
import type { ExplanationResponse } from '@kotak/shared'
import { buildExplanationRequest } from './roles/derived'
import { startAgain } from './checkup/startAgain'

function gapFor(corner: Corner, scenario: Scenario) {
  const needed = scenario === 'slow' ? corner.neededSlow : corner.neededFast
  return needed - corner.you
}

export function RadarView() {
  const session = useGuestSession()
  const t = useText(radarText)
  const futures = useText(changesText).receipts
  const bundle = useCheckupBundle(session)
  // The map's candidates are the check-up's, whose titles stay English; each label is shown translated (#449).
  const localeIndex = useLocaleIndex()
  const [scenario, setScenario] = useScenario()
  const roleData = bundle.status === 'ready' ? bundle.data : null
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const checkups = useMemo(() => {
    if (!roleData) return null
    // Both futures, so the switch can say what flipping changes; the page shows the chosen one.
    const run = (future: Scenario) =>
      computeCheckup({
        role: roleData.role,
        related: roleData.related,
        answers: session.answers,
        snapshotId: '2026-05',
        scenario: future,
        weeklyHours: session.custom_weekly_hours,
        startDate: today
      })
    return { slow: run('slow'), fast: run('fast') }
  }, [roleData, session.answers, session.custom_weekly_hours, today])
  const checkup = checkups ? checkups[scenario] : null
  // Explanations come from the AI route (#43). Until it exists, ?ai=off shows the paused state for demos.
  const [explanationsPaused, setExplanationsPaused] = useState(
    () => new URLSearchParams(window.location.search).get('ai') === 'off'
  )
  const [explanationState, setExplanationState] = useState<{
    roleCode: string
    snapshotId: string
    explanations: ExplanationResponse['explanations']
  } | null>(null)
  const activeRoleCheckup = checkup?.roles.find((candidate) => candidate.onet_code === roleData?.role.onet_code)
  // What Malaysian job ads say about the role (#272), shown beside the verdicts when admins have reviewed any.
  const roleCode = roleData?.role.onet_code ?? null
  const jobMarket = useJobMarkets(roleCode ? [roleCode] : []).get(roleCode ?? '') ?? null

  useEffect(() => {
    if (explanationsPaused || !roleData || !checkup || !activeRoleCheckup) return
    const request = buildExplanationRequest(roleData.role, activeRoleCheckup, checkup.snapshotId, scenario)
    if (!request) return

    let current = true
    void fetchExplanations(roleData.role.onet_code, request).then((result) => {
      if (current && result.status === 'available') {
        setExplanationState({
          roleCode: roleData.role.onet_code,
          snapshotId: checkup.snapshotId,
          explanations: result.data.explanations
        })
      }
    })

    return () => {
      current = false
    }
  }, [activeRoleCheckup, checkup, explanationsPaused, roleData, scenario])

  const retryExplanations = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('ai')
    window.history.replaceState(null, '', url)
    setExplanationsPaused(false)
  }

  if (!assessedRoleCode(session) || !hasAnswers(session)) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">{t.futureSkillsRadar}</h1>
        <Stepper step={3} />
        <CatDialogue pose="worried" speech={`${startAgain(session).speech}${t.thenMapSkills}`} />
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(startAgain(session).route)}>
          {startAgain(session).label}
        </Button>
      </div>
    )
  }

  if (bundle.status !== 'ready' || !checkup) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <h1 className="sr-only">{t.futureSkillsRadar}</h1>
        <Stepper step={3} />
        {bundle.status === 'error' ? (
          <Banner type="error" title={t.kopiCouldNotOpenJob.title} body={t.kopiCouldNotOpenJob.body} />
        ) : (
          <CatDialogue pose="thinking" speech={t.openingBox} />
        )}
      </div>
    )
  }

  const { role, related } = bundle.data
  const workSdgs = occupationSdgs(assessedRoleCode(session))
  const { sources: verdictSources, numbers } = sourceRefs(checkup)
  // The job-ad source is numbered after the verdicts' sources, so their citation numbers stay as they are.
  const jobMarketSource: SourceRef | null =
    jobMarket?.onet_code === role.onet_code
      ? {
          n: verdictSources.length + 1,
          name: jobMarket.source.source_name,
          detail: `${jobMarket.source.geo_or_layer} · ${jobMarket.source.vintage_date}`,
          href: jobMarket.source.source_url
        }
      : null
  const pathways = bundle.data.pathways
  // The O*NET tools source comes last, after the verdicts' and the job ads'.
  const toolsSource: SourceRef | null = role.tools.length
    ? {
        n: verdictSources.length + (jobMarketSource ? 2 : 1),
        name: pathways.sources.onet_tools.source_name,
        detail: `${pathways.sources.onet_tools.geo_or_layer} · ${pathways.sources.onet_tools.vintage_date}`,
        href: pathways.sources.onet_tools.source_url
      }
    : null
  // SkillsFuture Singapore (#464) comes after the tools, on roles with a linked corner.
  const sgfSource: SourceRef | null =
    Object.keys(role.sgf.corners).length > 0
      ? {
          n: verdictSources.length + (jobMarketSource ? 1 : 0) + (toolsSource ? 1 : 0) + 1,
          name: pathways.sources.sgf.source_name,
          detail: `${pathways.sources.sgf.geo_or_layer} · ${pathways.sources.sgf.vintage_date}`,
          href: pathways.sources.sgf.source_url
        }
      : null
  const sources = [
    ...verdictSources,
    ...(jobMarketSource ? [jobMarketSource] : []),
    ...(toolsSource ? [toolsSource] : []),
    ...(sgfSource ? [sgfSource] : [])
  ]
  const access = accessFor(role.onet_code, session.profile, pathways, session.role_code)
  const explanationByCorner = new Map(
    explanationState?.roleCode === role.onet_code && explanationState.snapshotId === checkup.snapshotId
      ? explanationState.explanations.map((explanation) => [explanation.corner_id, explanation] as const)
      : []
  )
  const corners = toCorners(checkup, numbers).map((corner) => {
    const explanation = explanationByCorner.get(corner.id)
    return explanation ? { ...corner, reasoning: explanation.sentences.join(' ') } : corner
  })
  const roles = toRoles(checkup, [role, ...related], session.role_code, { bundle: bundle.data, session })
  const swot = deriveSwot(corners, roles, scenario)
  const neededLabel = neededByLabel(checkup)
  // What the other AI future moves here: needed levels only, since verdicts stay the same in both.
  // The radar draws needed levels in half steps, so a small target move can leave the chart as it is while the fit
  // still moves; the receipt then names the fit.
  const futureDiff = radarFutureDiff(corners)
  const fitIn = (future: Scenario) =>
    Math.round(
      checkups?.[future].roles.find((candidate) => candidate.onet_code === role.onet_code)?.fit.score ?? Number.NaN
    )
  const [slowFit, fastFit] = [fitIn('slow'), fitIn('fast')]
  const futureReceipt =
    futureDiff.moved > 0
      ? {
          slow: futures.radarPreview(futureDiff.moved, futureDiff.total),
          fast: futures.radarDone(futureDiff.moved, futureDiff.total)
        }
      : Number.isFinite(slowFit) && Number.isFinite(fastFit) && slowFit !== fastFit
        ? { slow: futures.radarFitPreview(slowFit, fastFit), fast: futures.radarFitDone(slowFit, fastFit) }
        : { slow: futures.radarSame, fast: futures.radarSame }

  const biggestRisingGap = corners
    .filter((corner) => corner.verdict === 'rising' && gapFor(corner, scenario) > 0)
    .sort((left, right) => gapFor(right, scenario) - gapFor(left, scenario))[0]
  const firstRoadmapItem = checkup.roadmap.items[0]
  const firstRoadmapCorner = firstRoadmapItem
    ? role.corners.find((corner) => corner.corner_id === firstRoadmapItem.corner_id)
    : undefined
  const firstRoadmapStatement =
    firstRoadmapItem && firstRoadmapCorner?.statements
      ? firstRoadmapCorner.statements[firstRoadmapItem.statement]
      : null
  const speech =
    access.profession && needsQualification(access)
      ? access.status === 'qualify'
        ? t.qualiAlso(role.title)
        : t.qualiRegulated(role.title)
      : biggestRisingGap
        ? firstRoadmapStatement
          ? t.biggestGapTry(biggestRisingGap.name, firstRoadmapStatement)
          : t.noStatementYet
        : t.noRisingGapJob

  // The role's biggest gap, the same term the roles page names, with its levels.
  const gapOf = (code: string) => {
    const fit = checkup.roles.find((candidate) => candidate.onet_code === code)?.fit
    const corners = [role, ...related].find((candidate) => candidate.onet_code === code)?.corners ?? []
    return fit ? topGapLabel(fit, corners) : undefined
  }
  const quadrantOf = (candidate: (typeof roles)[number], kind: QuadrantPoint['kind']): QuadrantPoint => ({
    id: candidate.id,
    label: roleTitle(localeIndex, candidate.id, candidate.title),
    fit: candidate.fit,
    trend: trendOf(candidate.outlook),
    kind,
    gap: gapOf(candidate.id)
  })
  // You, the target and up to 5 other jobs from the check-up; the map merges repeats by code.
  const quadrantPoints = [
    ...roles.filter((candidate) => candidate.isCurrentJob).map((candidate) => quadrantOf(candidate, 'you')),
    ...roles
      .filter((candidate) => candidate.id === session.target_role_code)
      .map((candidate) => quadrantOf(candidate, 'target')),
    ...roles
      .filter((candidate) => !candidate.isCurrentJob && candidate.id !== session.target_role_code)
      .slice(0, 5)
      .map((candidate) => quadrantOf(candidate, 'suggested'))
  ]

  const weaknessNames = new Set(swot.weaknesses.map((item) => item.label))
  const weaknessCorners = corners
    .filter((corner) => weaknessNames.has(corner.name))
    .sort((left, right) => gapFor(right, scenario) - gapFor(left, scenario))
  const sourceByNumber = new Map(sources.map((source) => [source.n, source]))
  const sdgByCorner = new Map(role.corners.map((corner) => [corner.corner_id, corner.sdg_targets]))
  const pausedGapCorners = weaknessCorners.filter(
    (corner) => corner.verdict === 'rising' && gapFor(corner, scenario) > 0
  )

  const renderGapCard = (corner: Corner) => {
    const sgfSkills = role.sgf.corners[corner.id] ?? []
    const cornerSources: SourceRef[] = [
      ...(corner.sources ?? []).flatMap((number) => {
        const source = sourceByNumber.get(number)
        return source ? [source] : []
      }),
      ...(sgfSource && sgfSkills.length > 0 ? [sgfSource] : [])
    ]
    const explanationSource = explanationByCorner.get(corner.id)?.source ?? 'template'
    const targets = sdgByCorner.get(corner.id) ?? []

    return (
      <ExplanationSourceProvider key={corner.id} source={explanationSource}>
        <GapCard
          corner={corner}
          sources={cornerSources}
          scenario={scenario}
          neededLabel={neededLabel}
          paused={explanationsPaused}
          aside={
            (targets.length > 0 || sgfSkills.length > 0) && (
              <div className="space-y-2">
                {targets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-label-s text-text-muted">{t.closingSupports}</span>
                    {targets.map((target) => (
                      <SdgTargetChip key={target} target={target} />
                    ))}
                  </div>
                )}
                <SgfSkillList skills={sgfSkills} />
              </div>
            )
          }
        />
      </ExplanationSourceProvider>
    )
  }

  if (explanationsPaused) {
    return (
      <div className="mx-auto w-full max-w-[45rem] space-y-6">
        <Banner type="error" title={t.explanationsPaused.title} body={t.explanationsPaused.body} />
        <CatDialogue pose="worried" speech={t.aiResting} />

        {pausedGapCorners.map(renderGapCard)}
        {pausedGapCorners.length > 0 && <ReasoningFooter sources={[]} paused />}

        <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
          <Button variant="secondary" size="lg" fullWidth onClick={retryExplanations}>
            {t.tryExplanationsAgain}
          </Button>
          <Link
            to={routes.roles}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t.seeRoles}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <Stepper step={3} />

      <CatDialogue pose="explaining" speech={speech} />

      <header className="space-y-1.5">
        <div className="flex items-start gap-1">
          <h1 className="text-title-m text-text-primary lg:text-title-l">{t.roleHeading(role.title, neededLabel)}</h1>
          <Tooltip
            content={t.neededTooltip}
            className="mt-0.5 lg:mt-1 [&_[role=tooltip]]:left-auto [&_[role=tooltip]]:right-0 [&_[role=tooltip]]:translate-x-0 [&_[role=tooltip]]:max-w-[calc(100vw-3rem)] [&_[role=tooltip]]:whitespace-normal [&_[role=tooltip]]:text-left"
          >
            <button
              type="button"
              aria-label={t.aboutNeededBy}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-panel hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <Info className="h-4 w-4 stroke-current" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        {workSdgs && workSdgs.targets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-s text-text-muted">{t.linkedSdg}</span>
            {workSdgs.targets.map((target) => (
              <SdgTargetChip key={target} target={target} workReason={workSdgs.reason} />
            ))}
          </div>
        )}
        <p className="text-body-s text-text-muted">{t.radarIntro}</p>
      </header>

      <ScenarioControl
        scenario={scenario}
        onChange={setScenario}
        receipt={futureReceipt}
        anchors={role.signals[checkup.snapshotId]?.anchors}
        trailing={
          <Link to={spacePath()} className={routeLinkClassName}>
            {t.seeFutureInSpace}
          </Link>
        }
      />

      <AccessNotice
        access={access}
        roleTitle={role.title}
        fit={
          activeRoleCheckup
            ? {
                percent: Math.round(activeRoleCheckup.fit.score),
                estimated: activeRoleCheckup.levels.some(isEstimatedLevel)
              }
            : undefined
        }
      />

      {/* An equal pair: the map's table starts folded, so no hole opens under the radar. The snapshot month sits in
          the top bar's data chip. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <section
          className="flex items-center justify-center lg:rounded-md lg:border lg:border-border-subtle lg:bg-bg-default lg:p-4"
          aria-label={t.futureSkillsRadar}
        >
          <FutureSkillsRadar corners={corners} scenario={scenario} size="lg" neededLabel={neededLabel} />
        </section>

        <QuadrantMap points={quadrantPoints} className="h-full" />
      </div>

      <div className="space-y-4">
        <SkillsSwot swot={swot} size="desktop" />

        <section className="space-y-4" aria-labelledby="gaps-title">
          <header className="flex items-center justify-between gap-3">
            <h2 id="gaps-title" className="text-title-s text-text-primary">
              {t.yourGaps}
            </h2>
            <span className="shrink-0 font-mono text-mono-s text-text-muted">
              {t.gapsCount(weaknessCorners.length, corners.length)}
            </span>
          </header>

          {weaknessCorners.map(renderGapCard)}
          {weaknessCorners.length > 0 && (
            <ReasoningFooter
              sources={weaknessCorners.map((corner) => explanationByCorner.get(corner.id)?.source ?? 'template')}
            />
          )}
        </section>

        {/* The O*NET tools sit in the job ads' breakdown, so the page lists tools once. */}
        {jobMarket && jobMarketSource ? (
          <JobMarketCard
            market={jobMarket}
            roleTitle={role.title}
            sourceNumber={jobMarketSource.n}
            level={jobMarketLevelForYears(yearsOfWork(session.profile))}
          >
            {toolsSource && <ToolsCard role={role} sourceNumber={toolsSource.n} embedded />}
          </JobMarketCard>
        ) : (
          toolsSource && <ToolsCard role={role} sourceNumber={toolsSource.n} folded />
        )}

        <SourceList sources={sources} label={t.allSources} />

        <div className="surface-glass sticky bottom-(--ask-kopi-clearance) z-10 rounded-md p-3 lg:static lg:border-0 lg:bg-bg-default lg:p-0 lg:backdrop-blur-none">
          <Link
            to={routes.roles}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-sm border-[1.5px] border-text-primary bg-accent-box px-6 text-label-l text-accent-on-box transition-colors duration-150 ease-out hover:bg-accent-box-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {t.seeRoles}
          </Link>
        </div>
      </div>
    </div>
  )
}

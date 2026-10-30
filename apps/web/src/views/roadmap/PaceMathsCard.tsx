import { PACE_MAX, PACE_MIN, type Pace, type UsageAnchors } from '@kotak/shared'
import { ScenarioMathsNote } from '../../components/kotak/ScenarioMathsNote'
import { roadmapText } from '../../i18n/messages/roadmap'
import { useText } from '../../i18n/text'

interface PaceProfile {
  situation?: keyof typeof roadmapText.en.pace.situations | null
  years_experience?: number | null
  education_level?: keyof typeof roadmapText.en.pace.education | null
}

type YearBand = 'none' | 'underTwo' | 'twoToThree' | 'fourToFive' | 'sixToNine' | 'tenOrMore'

function yearsKey(years: number): YearBand {
  return years < 1
    ? 'none'
    : years < 2
      ? 'underTwo'
      : years < 4
        ? 'twoToThree'
        : years < 6
          ? 'fourToFive'
          : years < 10
            ? 'sixToNine'
            : 'tenOrMore'
}

function inputText(input: Pace['inputs'][number], profile: PaceProfile | undefined, t: typeof roadmapText.en) {
  if (input.label === 'Situation')
    return {
      label: t.pace.inputLabels.situation,
      value: profile?.situation
        ? (t.pace.situations[profile.situation] ?? input.value)
        : translateNotGiven(input.value, t)
    }
  if (input.label === 'Years of work')
    return {
      label: t.pace.inputLabels.yearsOfWork,
      value:
        profile?.years_experience != null
          ? (t.pace.years[yearsKey(profile.years_experience)] ?? input.value)
          : translateNotGiven(input.value, t)
    }
  if (input.label === 'Qualification')
    return {
      label: t.pace.inputLabels.qualification,
      value: profile?.education_level
        ? (t.pace.education[profile.education_level] ?? input.value)
        : translateNotGiven(input.value, t)
    }
  return { label: input.label, value: input.value }
}

function translateNotGiven(value: string, t: typeof roadmapText.en) {
  return value === 'Not given' ? t.pace.notGiven : value
}

/** The pace rule in plain rows: three inputs, each with its multiplier, and the bounded product. */
export function PaceMathsCard({
  pace,
  scenarioAnchors,
  profile
}: {
  pace: Pace
  scenarioAnchors?: UsageAnchors
  profile?: PaceProfile
}) {
  const t = useText(roadmapText)
  const lastMath = pace.maths[pace.maths.length - 1]
  return (
    <section
      id="pace-maths"
      tabIndex={-1}
      aria-labelledby="pace-maths-title"
      className="scroll-mt-24 space-y-3 rounded-md border border-border-subtle bg-bg-default p-4"
    >
      <h2 id="pace-maths-title" className="text-title-s text-text-primary">
        {t.stepDetails.seeMaths}
      </h2>
      <p className="font-mono text-mono-s font-medium text-text-primary">{t.pace.yourPace}</p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-body-s text-text-primary">
        {pace.inputs.map((input) => {
          const text = inputText(input, profile, t)
          return (
            <div key={input.label} className="contents">
              <dt>
                {text.label}
                <span className="block text-label-s text-text-muted">{text.value}</span>
              </dt>
              <dd className="text-right font-mono text-mono-s">×{input.factor.toFixed(2)}</dd>
            </div>
          )
        })}
        <dt className="border-t border-text-primary pt-2 font-semibold">{t.pace.paceFactor}</dt>
        <dd className="border-t border-text-primary pt-2 text-right font-mono text-mono-s font-semibold">
          {pace.factor.toFixed(2)}x
        </dd>
      </dl>
      <p className="text-label-s text-text-muted">
        {t.pace.keptBetween(
          PACE_MIN,
          PACE_MAX,
          lastMath === 'Each step’s hours are multiplied by the factor; the finish week follows.'
            ? t.pace.mathsFinal
            : lastMath
        )}
      </p>
      {pace.refresher && <p className="text-label-s text-text-muted">{t.pace.refresherNote(pace.refresher.hours)}</p>}
      {scenarioAnchors && (
        <div className="border-t border-border-subtle pt-3">
          <ScenarioMathsNote anchors={scenarioAnchors} />
        </div>
      )}
    </section>
  )
}

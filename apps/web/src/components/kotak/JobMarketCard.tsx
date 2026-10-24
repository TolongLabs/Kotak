import { JOB_MARKET_MIN_SKILL_ADS, JobMarketLevelSchema, type JobMarketLevel } from '@kotak/shared'
import type { JobMarket } from '../../engine/api'
import { Citation } from '../ui/Citation'

// What Malaysian job ads say about a role (#272): JobStreet ads Kotak's admins approved for its O*NET occupation.
// Context beside the verdicts; it sets none. Every figure is from /api/market and cites its source.

const ringgit = (value: number) => `RM ${value.toLocaleString('en-MY')}`
const share = (ads: number, base: number) => (base > 0 ? Math.round((ads / base) * 100) : 0)
// Under half a percent rounds to 0, so it reads as under 1%.
const shareLabel = (ads: number, base: number) => {
  const percent = share(ads, base)
  return percent === 0 && ads > 0 ? '<1%' : `${percent}%`
}
const dateLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString('en-MY')} ${count === 1 ? one : many}`
const ordinal = (n: number) => {
  const tens = n % 100
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10]
  return `${n.toLocaleString('en-MY')}${suffix ?? 'th'}`
}

// Where the role ranks by its estimated JobStreet ads among the roles Kotak has an estimate for: "the 3rd most of the
// 24 roles with a JobStreet estimate", or null when it is the only one.
const rankLabel = ({ rank, roles }: NonNullable<JobMarket['popularity']>) =>
  roles < 2 ? null : `the ${rank === 1 ? '' : `${ordinal(rank)} `}most of the ${roles} roles with a JobStreet estimate`

const LEVELS: Record<JobMarketLevel, { name: string; asks: string }> = {
  junior: { name: 'Junior', asks: 'under 2 years, or new graduates' },
  mid: { name: 'Mid-Level', asks: '2 to 4 years' },
  senior: { name: 'Senior', asks: '5 years or more' }
}

/** The pay of the ads that ask for this level, or null when too few of them state pay. */
export function payForLevel(market: JobMarket, level: JobMarketLevel | null) {
  return (level && market.levels?.pay.find((band) => band.level === level)) || null
}

/** "junior roles", for a sentence. */
const levelRoles = (level: JobMarketLevel) => `${LEVELS[level].name.toLowerCase()} roles`

/**
 * The role card's pay: "median pay RM 4,800 a month for junior roles, by your years of work" when enough ads at the user's level state pay,
 * else the median of every level, or null when too few ads state any.
 */
export function payLabel(market: JobMarket, level: JobMarketLevel | null) {
  const band = payForLevel(market, level)
  if (band && level) return `median pay ${ringgit(band.median)} a month for ${levelRoles(level)}, by your years of work`
  return market.pay ? `median advertised pay ${ringgit(market.pay.median)} a month` : null
}

/** The role card's line: "about 980 on JobStreet, the 2nd most of the 24 roles with a JobStreet estimate", or null without one. */
export function popularityLabel(market: JobMarket) {
  const { popularity } = market
  if (!popularity) return null
  const rank = rankLabel(popularity)
  return `about ${popularity.estimated_ads.toLocaleString('en-MY')} on JobStreet${rank ? `, ${rank}` : ''}`
}

function ShareList({
  label,
  items,
  base
}: {
  label: string
  items: Array<{ name: string; ads: number }>
  base: number
}) {
  if (!items.length) return null
  return (
    <div className="space-y-2">
      <h3 className="text-label-m text-text-primary">{label}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const percent = share(item.ads, base)
          return (
            <li key={item.name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-body-s">
                <span className="min-w-0 break-words text-text-primary">{item.name}</span>
                <span className="shrink-0 font-mono text-mono-s text-text-muted">
                  {shareLabel(item.ads, base)} · {plural(item.ads, 'ad', 'ads')}
                </span>
              </div>
              <span aria-hidden="true" className="block h-1.5 w-full overflow-hidden rounded-full bg-bg-panel">
                <span
                  className="block h-full rounded-full bg-text-primary"
                  style={{ width: `${Math.max(percent, 1)}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Pay for each level, the user's own marked, with the ads that ask for it. A level with too few ads stating pay says so.
function LevelPay({ market, level }: { market: JobMarket; level: JobMarketLevel | null }) {
  const { levels } = market
  if (!levels || !levels.pay.length) return null
  const stated = levels.ads.junior + levels.ads.mid + levels.ads.senior
  return (
    <div className="space-y-2">
      <h3 className="text-label-m text-text-primary">Pay by Level</h3>
      <ul className="space-y-1.5">
        {JobMarketLevelSchema.options.map((key) => {
          const band = payForLevel(market, key)
          return (
            <li key={key} className="flex items-baseline justify-between gap-3 text-body-s">
              <span className="min-w-0 break-words text-text-primary">
                {LEVELS[key].name}
                {key === level && <span className="text-text-muted"> (your level)</span>}
                <span className="text-text-muted"> · asks {LEVELS[key].asks}</span>
              </span>
              <span className="shrink-0 text-right font-mono text-mono-s text-text-muted">
                {band
                  ? `${ringgit(band.median)} · ${plural(band.ads_with_pay, 'ad', 'ads')}`
                  : `too few state pay · ${plural(levels.ads[key], 'ad', 'ads')}`}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-body-s text-text-muted">
        Each figure is the median monthly pay of the ads that ask for that level. The level is the experience an ad asks
        for, or its job title when it asks none: {plural(stated, 'active ad says', 'active ads say')} one, and{' '}
        {plural(levels.ads.not_stated, 'ad doesn’t', 'ads don’t')}.
      </p>
    </div>
  )
}

export function JobMarketCard({
  market,
  roleTitle,
  sourceNumber,
  level = null
}: {
  market: JobMarket
  roleTitle: string
  sourceNumber: number
  // The user's level from their years of work, whose pay leads when enough ads at that level state it.
  level?: JobMarketLevel | null
}) {
  const { ads, pay, skills, benefits, popularity } = market
  const titleId = `job-ads-${market.onet_code}`
  const rank = popularity && rankLabel(popularity)
  const levelPay = payForLevel(market, level)
  // regions lists the top five states, so the rest of the ads that name one are in other states.
  const otherStates =
    ads.active - market.without_state - market.regions.reduce((total, region) => total + region.ads, 0)
  return (
    <section aria-labelledby={titleId} className="surface-card space-y-4 p-4">
      <header className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-title-s text-text-primary">
          Job Ads in Malaysia
        </h2>
        <Citation n={sourceNumber} />
      </header>
      <p className="text-body-s text-text-muted">
        From {plural(ads.reviewed, 'JobStreet ad', 'JobStreet ads')} Kotak’s admins approved for {roleTitle}, last seen{' '}
        {dateLabel(market.source.vintage_date)}. This is context: it sets no verdict.
      </p>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {popularity && (
          <div className="rounded-md border border-border-subtle p-3 sm:col-span-2">
            <dt className="text-label-m text-text-muted">Ads on JobStreet</dt>
            <dd className="text-title-m tabular-nums text-text-primary">
              About {popularity.estimated_ads.toLocaleString('en-MY')}
              {rank && <span className="text-body-s text-text-primary">, {rank}</span>}
            </dd>
            <dd className="text-body-s text-text-muted">
              Estimated from JobStreet’s {plural(popularity.search_ads, 'ad', 'ads')} for “{popularity.search_title}”:
              Kotak’s admins approved {shareLabel(popularity.sample_approved, popularity.sample_reviewed)} of the{' '}
              {popularity.sample_reviewed.toLocaleString('en-MY')} they reviewed.
            </dd>
          </div>
        )}
        <div className="rounded-md border border-border-subtle p-3">
          <dt className="text-label-m text-text-muted">Active Ads</dt>
          <dd className="text-title-m tabular-nums text-text-primary">{ads.active.toLocaleString('en-MY')}</dd>
          <dd className="text-body-s text-text-muted">
            {plural(ads.employers, 'employer', 'employers')}, seen in the last 2 weeks of scraping
          </dd>
        </div>
        <div className="rounded-md border border-border-subtle p-3">
          {level && levelPay ? (
            <>
              <dt className="text-label-m text-text-muted">Median Pay, {LEVELS[level].name} Roles</dt>
              <dd className="text-title-m tabular-nums text-text-primary">{ringgit(levelPay.median)} a month</dd>
              <dd className="text-body-s text-text-muted">
                Middle half {ringgit(levelPay.p25)} to {ringgit(levelPay.p75)}, from{' '}
                {plural(levelPay.ads_with_pay, 'ad', 'ads')} asking for your level that state pay
                {pay && `; ${ringgit(pay.median)} across all levels`}
              </dd>
            </>
          ) : (
            <>
              <dt className="text-label-m text-text-muted">Median Advertised Pay, All Levels</dt>
              {pay ? (
                <>
                  <dd className="text-title-m tabular-nums text-text-primary">{ringgit(pay.median)} a month</dd>
                  <dd className="text-body-s text-text-muted">
                    Middle half {ringgit(pay.p25)} to {ringgit(pay.p75)}, from {plural(pay.ads_with_pay, 'ad', 'ads')}{' '}
                    that state pay
                    {level && `. Too few ${levelRoles(level)} state pay for a figure of their own`}
                  </dd>
                </>
              ) : (
                <dd className="text-body-s text-text-muted">Too few ads state pay in ringgit to give a figure.</dd>
              )}
            </>
          )}
        </div>
      </dl>

      <LevelPay market={market} level={level} />

      <ShareList label="Where the Jobs Are" items={market.regions} base={ads.active} />
      {(otherStates > 0 || market.without_state > 0 || market.remote > 0 || market.hybrid > 0) && (
        <p className="text-body-s text-text-muted">
          {[
            otherStates > 0 && `${plural(otherStates, 'ad is', 'ads are')} in other states`,
            market.without_state > 0 && `${plural(market.without_state, 'ad names', 'ads name')} no state`,
            market.remote > 0 && `${plural(market.remote, 'ad is', 'ads are')} remote`,
            market.hybrid > 0 && `${plural(market.hybrid, 'ad is', 'ads are')} hybrid`
          ]
            .filter(Boolean)
            .join('; ')}
          .
        </p>
      )}

      {skills ? (
        <>
          <ShareList
            label="Tools the Ads Name"
            items={skills.tools.map((skill) => ({ name: skill.label, ads: skill.ads }))}
            base={skills.ads_checked}
          />
          <ShareList
            label="Languages the Ads Ask For"
            items={skills.languages.map((skill) => ({ name: skill.label, ads: skill.ads }))}
            base={skills.ads_checked}
          />
          <div className="space-y-1">
            <h3 className="text-label-m text-text-primary">AI in the Ads</h3>
            <p className="text-body-s text-text-primary">
              {skills.ai_ads > 0
                ? `${shareLabel(skills.ai_ads, skills.ads_checked)} of ads mention AI${
                    skills.ai.length ? `, most often ${skills.ai.map((skill) => skill.label).join(', ')}` : ''
                  }.`
                : 'None of the ads Kotak read mention AI.'}
            </p>
          </div>
          <p className="text-body-s text-text-muted">
            Shares are of the {plural(skills.ads_checked, 'active ad', 'active ads')} Kotak read. Most ads show only a
            summary, so a tool can be needed without being named.
          </p>
        </>
      ) : (
        <p className="text-body-s text-text-muted">
          {ads.active >= JOB_MARKET_MIN_SKILL_ADS
            ? 'Kotak hasn’t read enough of these ads yet to say which tools and languages they ask for.'
            : 'Too few active ads to say which tools and languages they ask for.'}
        </p>
      )}

      {benefits &&
        (benefits.items.length ? (
          <>
            <ShareList
              label="Benefits the Ads Name"
              items={benefits.items.map((benefit) => ({ name: benefit.label, ads: benefit.ads }))}
              base={benefits.ads_checked}
            />
            <p className="text-body-s text-text-muted">
              Shares are of the {plural(benefits.ads_checked, 'active ad', 'active ads')} whose JobStreet card lists the
              employer’s selling points. Most cards list none, so a benefit can be offered without being named.
            </p>
          </>
        ) : (
          <p className="text-body-s text-text-muted">
            None of the selling points on {plural(benefits.ads_checked, 'active ad', 'active ads')} name a benefit.
          </p>
        ))}
    </section>
  )
}

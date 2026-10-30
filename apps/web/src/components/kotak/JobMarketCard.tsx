import { JOB_MARKET_MIN_SKILL_ADS, JobMarketLevelSchema, type JobMarketLevel } from '@kotak/shared'
import type { JobMarket } from '../../engine/api'
import { Citation } from '../ui/Citation'
import { dateLocale } from '../../i18n/locale'
import { rolesText } from '../../i18n/messages/roles'
import { textNow, useText } from '../../i18n/text'

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
  new Date(`${date}T00:00:00Z`).toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  })
// Where the role ranks by its estimated JobStreet ads among the roles Kotak has an estimate for: "the 3rd most of the
// 24 roles with a JobStreet estimate", or null when it is the only one.
const rankLabel = ({ rank, roles }: NonNullable<JobMarket['popularity']>) => {
  const t = textNow(rolesText).market
  return t.rank(rank, roles, t.ordinal(rank))
}

/** The pay of the ads that ask for this level, or null when too few of them state pay. */
export function payForLevel(market: JobMarket, level: JobMarketLevel | null) {
  return (level && market.levels?.pay.find((band) => band.level === level)) || null
}

/**
 * The role card's pay: "median pay RM 4,800 a month for junior roles, by your years of work" when enough ads at the user's level state pay,
 * else the median of every level, or null when too few ads state any.
 */
export function payLabel(market: JobMarket, level: JobMarketLevel | null) {
  const band = payForLevel(market, level)
  if (band && level) return textNow(rolesText).market.payLabel(ringgit(band.median), level)
  return market.pay ? textNow(rolesText).market.payLabel(ringgit(market.pay.median), null) : null
}

/** The role card's line: "about 980 on JobStreet, the 2nd most of the 24 roles with a JobStreet estimate", or null without one. */
export function popularityLabel(market: JobMarket) {
  const { popularity } = market
  if (!popularity) return null
  const rank = rankLabel(popularity)
  return textNow(rolesText).market.rankPopularity(popularity.estimated_ads, rank)
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
  const t = useText(rolesText)
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
                  {shareLabel(item.ads, base)} · {t.market.adsCount(item.ads)}
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
  const t = useText(rolesText)
  const { levels } = market
  if (!levels || !levels.pay.length) return null
  const stated = levels.ads.junior + levels.ads.mid + levels.ads.senior
  return (
    <div className="space-y-2">
      <h3 className="text-label-m text-text-primary">{t.market.payByLevel}</h3>
      <ul className="space-y-1.5">
        {JobMarketLevelSchema.options.map((key) => {
          const band = payForLevel(market, key)
          return (
            <li key={key} className="flex items-baseline justify-between gap-3 text-body-s">
              <span className="min-w-0 break-words text-text-primary">
                {t.market.levelName(key)}
                {key === level && <span className="text-text-muted">{t.market.yourLevel}</span>}
                <span className="text-text-muted">{t.market.asks(t.market.levelAsk(key))}</span>
              </span>
              <span className="shrink-0 text-right font-mono text-mono-s text-text-muted">
                {band
                  ? `${ringgit(band.median)} · ${t.market.adsCount(band.ads_with_pay)}`
                  : t.market.tooFewAds(levels.ads[key])}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-body-s text-text-muted">{t.market.payLevelNote(stated, levels.ads.not_stated)}</p>
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
  const t = useText(rolesText)
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
          {t.market.title}
        </h2>
        <Citation n={sourceNumber} />
      </header>
      <p className="text-body-s text-text-muted">
        {t.market.intro(ads.reviewed, roleTitle, dateLabel(market.source.vintage_date))}
      </p>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {popularity && (
          <div className="rounded-md border border-border-subtle p-3 sm:col-span-2">
            <dt className="text-label-m text-text-muted">{t.market.popularityTitle}</dt>
            <dd className="text-title-m tabular-nums text-text-primary">
              {t.market.popularityHeadline(popularity.estimated_ads, rank ?? null)}
            </dd>
            <dd className="text-body-s text-text-muted">
              {t.market.popularitySample(
                popularity.search_ads,
                popularity.search_title,
                shareLabel(popularity.sample_approved, popularity.sample_reviewed),
                popularity.sample_reviewed
              )}
            </dd>
          </div>
        )}
        <div className="rounded-md border border-border-subtle p-3">
          <dt className="text-label-m text-text-muted">{t.market.activeAds}</dt>
          <dd className="text-title-m tabular-nums text-text-primary">{ads.active.toLocaleString('en-MY')}</dd>
          <dd className="text-body-s text-text-muted">{t.market.employersSeen(ads.employers)}</dd>
        </div>
        <div className="rounded-md border border-border-subtle p-3">
          {level && levelPay ? (
            <>
              <dt className="text-label-m text-text-muted">{t.market.medianPayLevel(t.market.levelName(level))}</dt>
              <dd className="text-title-m tabular-nums text-text-primary">
                {t.market.monthly(ringgit(levelPay.median))}
              </dd>
              <dd className="text-body-s text-text-muted">
                {t.market.payRangeByLevel(
                  ringgit(levelPay.p25),
                  ringgit(levelPay.p75),
                  levelPay.ads_with_pay,
                  pay ? ringgit(pay.median) : null
                )}
              </dd>
            </>
          ) : (
            <>
              <dt className="text-label-m text-text-muted">{t.market.allLevelsMedian}</dt>
              {pay ? (
                <>
                  <dd className="text-title-m tabular-nums text-text-primary">
                    {t.market.monthly(ringgit(pay.median))}
                  </dd>
                  <dd className="text-body-s text-text-muted">
                    {t.market.payRangeAll(ringgit(pay.p25), ringgit(pay.p75), pay.ads_with_pay)}
                    {level && `. ${t.market.tooFewLevelPay(t.market.levelRoles(level))}`}
                  </dd>
                </>
              ) : (
                <dd className="text-body-s text-text-muted">{t.market.tooFewPay}</dd>
              )}
            </>
          )}
        </div>
      </dl>

      <LevelPay market={market} level={level} />

      <ShareList label={t.market.whereJobs} items={market.regions} base={ads.active} />
      {(otherStates > 0 || market.without_state > 0 || market.remote > 0 || market.hybrid > 0) && (
        <p className="text-body-s text-text-muted">
          {t.market.distribution(otherStates, market.without_state, market.remote, market.hybrid)}
        </p>
      )}

      {skills ? (
        <>
          <ShareList
            label={t.market.toolsNamed}
            items={skills.tools.map((skill) => ({ name: skill.label, ads: skill.ads }))}
            base={skills.ads_checked}
          />
          <ShareList
            label={t.market.languagesAsked}
            items={skills.languages.map((skill) => ({ name: skill.label, ads: skill.ads }))}
            base={skills.ads_checked}
          />
          <div className="space-y-1">
            <h3 className="text-label-m text-text-primary">{t.market.aiInAds}</h3>
            <p className="text-body-s text-text-primary">
              {skills.ai_ads > 0
                ? t.market.aiShare(
                    shareLabel(skills.ai_ads, skills.ads_checked),
                    skills.ai.map((skill) => skill.label).join(t.market.skillSeparator)
                  )
                : t.market.noAi}
            </p>
          </div>
          <p className="text-body-s text-text-muted">
            {t.market.sharesOfAds(skills.ads_checked)} {t.market.skillCaveat}
          </p>
        </>
      ) : (
        <p className="text-body-s text-text-muted">
          {ads.active >= JOB_MARKET_MIN_SKILL_ADS ? t.market.notEnoughRead : t.market.tooFewAdsSkills}
        </p>
      )}

      {benefits &&
        (benefits.items.length ? (
          <>
            <ShareList
              label={t.market.benefitsNamed}
              items={benefits.items.map((benefit) => ({
                name: t.benefits[benefit.key] ?? benefit.label,
                ads: benefit.ads
              }))}
              base={benefits.ads_checked}
            />
            <p className="text-body-s text-text-muted">
              {t.market.benefitShare(benefits.ads_checked)} {t.market.benefitCaveat}
            </p>
          </>
        ) : (
          <p className="text-body-s text-text-muted">{t.market.noBenefits(benefits.ads_checked)}</p>
        ))}
    </section>
  )
}

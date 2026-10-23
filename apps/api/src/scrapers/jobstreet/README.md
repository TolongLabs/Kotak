# JobStreet research scraper

Implemented on 22 October 2026. The Bun pipeline uses Clearcote and Playwright in two modes: **breadth** reads Malaysian JobStreet search cards; **depth** enriches saved listings with full descriptions. Local runs write auditable files. Production uses Neon Postgres for run state, current listings, dated observations and depth attempts, with a separate Bun runner for browser work.

Contents:

1.  [Run](#run)
1.  [Production setup](#production-setup)
1.  [Depth and description reuse](#depth-and-description-reuse)
1.  [Merge contributor captures](#merge-contributor-captures)
1.  [Deduplication rules](#deduplication-rules)
1.  [Observation dates and trend tracking](#observation-dates-and-trend-tracking)
1.  [Sorting rules](#sorting-rules)
1.  [Output](#output)
1.  [Waiting for verification](#waiting-for-verification)
1.  [Reliability and failure handling](#reliability-and-failure-handling)
1.  [Verification](#verification)
1.  [Implementation](#implementation)
1.  [References](#references)

## Run

The browser comes from the `@kotak/browser` workspace package, which drives the open build of [Clearcote](https://github.com/clearcotelabs/clearcote-browser), a patched Chromium. The first launch fetches the pinned build if it is not already cached. Create or inspect a local profile from the repository root:

```powershell
bun run --filter @kotak/browser profile list
bun run --filter @kotak/browser profile create --name jobstreet-research
```

From the repository root:

```sh
bun install
bun run scrape:jobstreet --max-jobs 5
bun run scrape:jobstreet --url https://my.jobstreet.com/data-analyst-jobs --max-pages 2 --max-jobs 40 --sort company
bun run scrape:jobstreet --mode breadth --max-pages 50 --max-jobs 1000 --delay-ms 30000 --delay-jitter-ms 30000
bun run scrape:jobstreet --mode breadth --max-pages 120 --max-jobs 5000
bun run scrape:jobstreet --help
```

The scraper opens a visible browser window by default. Set `BROWSER_PROFILE_ID` to reuse a saved profile and its cookies; otherwise, it creates a temporary local profile for the run and removes it afterward. No separate local browser service is needed.

The active scraper uses the repository's `@kotak/browser` package (`clearcote` SDK 0.60, Chromium 150 open build, Playwright Core 1.64). Browser setup and profile management are documented in [the browser package guide](/packages/browser/README.md).

Breadth is the default mode, with one page and 20 unique jobs. Opt in to larger runs with `--max-pages` (up to 200) and `--max-jobs` (up to 5,000). When JobStreet exposes a result count in its page description, the scraper records that count on each page and uses the first observed total as an additional unique-job target. The effective target is the smaller of that total and `--max-jobs`; duplicate cards do not advance it. Reports include `target_jobs`, the first and latest reported totals, the source used to read the count, and a `reported_total` stop reason when that target ends the run. If no count is exposed, the explicit job/page limits and pagination end remain the stopping signals. The site count is a changing estimate and can differ between page metadata and the underlying search results, so it is useful for sizing and stopping but should not be treated as an exact census. It represents the current JobStreet query in its location/filter scope, not a standardized count for an entire career field. For example, a Software Engineer result count near 2,373 can guide a run configured with a larger `--max-jobs`; use enough pages to cover it (at roughly 30 results per page, about 80 pages). The default remains deliberately bounded.

Both modes default to a **30-second base delay plus 0–30 seconds of random variation** between pages/jobs. Configure the base with `--delay-ms` (minimum 2000) and the extra variation with `--delay-jitter-ms` (0–60000). Set variation to zero for a fixed delay. The scraper logs each chosen pause and records `delay_ms`, `delay_jitter_ms` and `browser_mode` in `run.json`. These are configurable test settings; slower pacing does not guarantee that verification will be avoided.

Breadth opens the first search URL, then scrolls toward and clicks the actual validated Next link. Clearcote's `humanize` option provides the trusted curved pointer and click input; `hand.ts` adds whole 100-pixel wheel notches in short flicks, variable pauses, and an occasional one-notch overshoot with correction, adapted from TolongLarp's `browser/human.py`. Only the validated pagination link is clicked. Disabled and `aria-hidden` Next placeholders are ignored, so the scraper stops at the final page instead of scrolling toward a non-interactive link. Scrolling adds time beyond the base pause and is bounded to two minutes. The selected Next control must be visible, preserve the current search path/filters and advance exactly one page; changed links are refused. Both full-page and client-side pagination are supported; each page still needs a valid URL and a new set of listing IDs. First-page navigation, depth URLs and transient retries use `page.goto()`. Verification must be completed manually.

JobStreet's current [robots.txt](https://my.jobstreet.com/robots.txt) contains directives for job-detail paths and query-string URLs. The scraper does not enforce those directives; the run remains subject to JobStreet's HTTP responses and the configured pacing and verification limits.

## Production setup

The production API and web app run on Cloudflare Workers. A Worker cannot launch this repository's Clearcote desktop process, so it authenticates admin requests, stores run state in Neon, and queues work. A separate Windows Bun process runs the same Clearcote/Playwright breadth and depth functions, then writes the local run artifacts and persists them to Neon. Keep that runner online for manual runs and the daily queue. It claims one queued run at a time.

### Neon and deployment

1. Create or select the Neon project used by the production app. Create a database and copy its pooled Postgres connection string from the Neon connection details.
2. Add `DATABASE_URL` as a GitHub Actions repository secret. The deploy workflow applies the idempotent SQL migrations before deploying and passes this secret to the Worker.
3. Generate a long random `SCRAPER_ADMIN_TOKEN`. Add it as a GitHub Actions secret and as a Cloudflare Worker secret for trusted automation. Browser admins use the provisioned accounts described below; the service token is not entered into or stored by the browser UI.
4. For a local database migration or data import, set `DATABASE_URL` in the shell without committing it. Preview local captures first with `bun run jobs:import --dry-run`, then run `bun run jobs:import` to import every completed capture under `data/jobstreet/`.

The import is repeatable and commits each run in one transaction. Job listings are keyed by JobStreet job ID and search career. Each distinct run observation remains in `jobstreet_observations` with its original `scraped_at` and run ID; legacy captures without an ID receive a stable content-derived ID. Detail attempts come from the raw `details.jsonl` ledger, while cached descriptions in an enriched view do not become fresh attempts. Depth captures without an enriched file can recover listing snapshots from their raw details. The latest successful detail is also attached to the listing, and older imports cannot replace a newer description. Re-running an import does not duplicate an identical observation. Failed runs with valid partial captures are imported with their failed status so their data remains traceable.

Runner artifacts retain `database_run_id` alongside the browser pipeline's `run_id`. The importer reuses that database queue identity when loading those artifacts later, preserving one run and one set of observations.

### Browser runner

On a Windows host with Clearcote available, install the repository dependencies and set `DATABASE_URL`. Start `bun run scraper:worker` as a long-running process. The worker polls Neon for queued breadth or depth runs and uses the same pipeline, profile lifecycle, scrolling, pagination, delays and verification timeout as local commands. `BROWSER_PROFILE_ID` is optional. `JOBSTREET_DELAY_MS` and `JOBSTREET_DELAY_JITTER_MS` default to 30,000 ms each.

The scraper remains headed by default to match local operation. Set `BROWSER_HEADLESS=true` only when the production host cannot keep a desktop session open. Headless mode is configurable, but a verification page still requires completion in a visible browser; the unattended runner waits for the configured timeout and records a failed run rather than trying to bypass it.

### Admin panel and schedule

Open `/admin/sign-in`, or use **Admin Sign In** on the public sign-in page. `/admin` and `/admin/scraping` redirect unauthenticated visitors there. Sign in with a provisioned admin username and password, choose one of the seeded career queries, and select breadth or depth. The page shows listing and description counts plus the latest 50 run records. The seeded searches are Software Engineer, Front-End Developer, Design Systems Developer and Accessibility Engineer. These JobStreet search titles are separate from the public check-up's O*NET suggestions.

There is no public admin registration. After applying database migrations, provision an account from a trusted checkout with `DATABASE_URL` configured:

```sh
bun run admin:create --username admin
```

The command generates a strong password and writes it to the Git-ignored `.local/admin-credentials.txt`; it never prints the password. Each contributor can receive a separate username by running the command with a different `--username` and a fresh `--output .local/<name>-credentials.txt`. An existing credential file is never overwritten. To choose a password, put it in a local environment variable and pass its name with `--password-env`; the password must contain 16–72 UTF-8 bytes. To rotate an existing account's password and revoke all of its sessions, add `--reset-password` and choose a fresh output filename. Setting that user's `enabled` column to `false` also denies its current sessions immediately.

Passwords are stored as salted bcrypt hashes in Neon. Sessions use opaque random tokens, stored only as SHA-256 hashes in the database, with an eight-hour expiry. The browser receives a `Secure`, `HttpOnly`, `SameSite=Strict` cookie; passwords and service tokens are not retained in browser storage. Sign Out revokes the database session. The Worker gates the dashboard document as well as every scraper data/action endpoint. Login has an IP rate limit and a 15-minute account lock after five failed attempts; unsafe cookie-authenticated requests require same-origin JSON requests. Guest sessions confer no admin access. Trusted scripts can continue using `Authorization: Bearer <SCRAPER_ADMIN_TOKEN>`.

Cloudflare queues one breadth refresh for each career daily at **12:00 a.m. Asia/Singapore** (`16:00 UTC`). Keep in mind that result totals are estimates for broad JobStreet queries, not exact counts of jobs whose title matches the career. Breadth stores each repeated sighting with its date while updating the latest listing view. Depth is manual and selects listings without a saved description; it does not refresh existing descriptions by default.

The queue is consumed only while the Bun runner is online. If no runner is connected, runs stay queued and the admin page shows that status. The Cloudflare Worker handles scheduling and queueing; it does not run a browser. A run left in `running` for more than 12 hours is marked failed on the next runner poll so it cannot block later work for that career. The timeout is intentionally much longer than ordinary runs at the configured pace.

## Depth and description reuse

Pass saved breadth captures, prepared observations or the prepared latest-job view to depth mode. Repeat `--input` to combine files. The latest breadth observation per job ID supplies the card fields, while first encounter order determines which unique IDs fit within `--max-jobs` (default 100, maximum 1,000).

```sh
bun run scrape:jobstreet --mode depth --input data/jobstreet/alice-run/jobs.jsonl
bun run scrape:jobstreet --mode depth --input data/jobstreet/collections/research-01/jobs.jsonl --max-jobs 20
bun run scrape:jobstreet --mode depth --input data/jobstreet/new-run/jobs.jsonl --previous-depth shared/bob/jobs.enriched.jsonl
```

Use **`jobs.enriched.jsonl` as the combined consumer view**: each row contains the latest breadth fields, the latest successful description in `detail` (or `null`) and `detail_fetch_status`. A later failed or unavailable attempt is retained in `detail_last_attempt` without displacing the saved description. It includes all valid input job IDs, even those beyond the depth limit; those without a saved description or attempt have `not_fetched` status. The breadth input files remain unchanged. Separate raw breadth and detail files retain their observation histories rather than overwriting each other.

`detail_fetch_status` describes the current run's fetch/reuse result. A later cache-only run can report `reused` while `detail_last_attempt.outcome` still says `unavailable`. For availability analysis, inspect that dated attempt and the raw detail ledgers; reuse is not evidence that an ad reopened. When the latest attempt successfully fetched a description, its evidence is already in `detail` and `detail_last_attempt` is `null`.

**Description refresh is off by default.** Completed runs under `data/jobstreet/depth/` are discovered automatically. Depth reuses a successful saved description for the same job ID indefinitely and opens only IDs without a reusable description. Supply `--previous-depth` for captures on another machine or outside the default depth directory; both `details.jsonl` and `jobs.enriched.jsonl` are accepted. Keep the same JobStreet IDs when sharing data.

Cache reuse preserves the original `detail_scraped_at` and hash, writes no duplicate detail observation and needs no browser when every selected ID is cached. A new breadth sighting still gets its own date and run ID. Description reuse says nothing about whether the ad is still accepting applications. Failed and unavailable attempts are retained; a later default run reuses any known successful description, or retries if none exists.

An optional refresh age can be supplied for a particular run:

```sh
bun run scrape:jobstreet --mode depth --input data/jobstreet/new-run/jobs.jsonl --refresh-after-hours 168
bun run scrape:jobstreet --mode depth --input data/jobstreet/new-run/jobs.jsonl --refresh-after-hours 0
```

The first refreshes descriptions at least a week old; zero forces a new fetch. There is no refresh scheduler. Newly fetched descriptions include visible text, source HTML, a SHA-256 hash of normalized text, detail title, company and classification when available. Explicit matching `JobPosting` JSON-LD dates become `date_posted` and `valid_through`; absent or invalid dates remain `null`. No automatic skill extraction or demand scoring is performed.

## Merge contributor captures

Share raw `jobs.jsonl` captures or a prepared collection's `observations.jsonl` manually for now, then run the offline merger. Git ignores `data/jobstreet/`, so pulling the repository does not transfer captured data. This command does not need a browser or network access:

```sh
bun run jobs:prepare --input data/jobstreet/alice-run/jobs.jsonl --input data/jobstreet/bob-run/jobs.jsonl --output data/jobstreet/collections/research-01 --sort newest
bun run jobs:prepare --input data/jobstreet/collections/research-01/observations.jsonl --output data/jobstreet/collections/by-title --sort title
bun run jobs:prepare --help
```

Repeat `--input` for each file. Use explicit paths; shell glob expansion differs across operating systems. Repeating the same resolved file path reads it once. Outputs are written separately and inputs remain unchanged. Share `observations.jsonl` when sharing a prepared collection: its `jobs.jsonl` is only the latest-job view and cannot reconstruct older sightings on its own. Keep original captures and run reports for browser evidence, coverage and failure context.

`jobs:prepare` merges breadth observations only; it does not preserve nested detail fields. Share detail ledgers or enriched views separately and pass them to depth via `--previous-depth` to rebuild a unified view without downloading known descriptions again. Keep each run's `details.jsonl` to retain every actual depth attempt.

## Deduplication rules

- **During scraping:** the first valid occurrence of a `job_id` wins within that run. Repeated cards on the same page or later pages are skipped and counted.
- **Across files:** all distinct normalized observations are retained in `observations.jsonl`. The latest `scraped_at` per `(source, job_id)` wins only in the sortable `jobs.jsonl` view, including its null fields. Optional fields are never filled from stale observations.
- **Equal observation times:** the lexicographically greatest normalized JSON record wins, giving consistent results regardless of input order. This does not claim either conflicting observation is more accurate.
- **Identity:** canonical job URLs drop tracking parameters. Different job IDs remain separate even when title and company match; reposts and separate vacancies must not collapse through fuzzy matching.
- **Repeated imports:** an identical normalized observation, including its timestamp and run ID, is removed once. Different scrape timestamps or run IDs remain distinct, even if the ad text has not changed. Equal-time conflicting records remain in history even though the latest-job view chooses one deterministic winner.

Earlier captures without `work_arrangement`, `listed_at_estimate` or `scrape_run_id` are accepted. Missing optional text becomes `null`. Invalid IDs, missing required text, URL/ID mismatches, invalid timestamps and malformed JSON are quarantined in `rejected.jsonl` with their original contents and source location.

## Observation dates and trend tracking

`scraped_at` records when a listing was observed. New captures also carry a `scrape_run_id` matching `run.json.run_id`, so independent runs remain distinguishable even if their timestamps coincide. These dates are separate from the approximate posting date in `listed_at_estimate`.

Every prepared collection now includes full `observations.jsonl` history and a `job-history.jsonl` summary per job with `first_seen_at`, `last_seen_at`, UTC `seen_dates`, `observation_count`, known `scrape_run_count`, `legacy_observation_count` and `search_scopes`. A scope preserves the search path and filters but removes pagination. Old observations retain their dates without inventing run IDs. Counts describe distinct captured records; equal-time conflicts or legacy records are not evidence of extra independent runs.

To study a career field, compare new job IDs and recurring sightings over time using the same query, filters, page/job limits and collection schedule. Repeated sightings indicate continued visibility, while new IDs help distinguish fresh advertisements from long-running ones. Neither metric alone proves that employers are hiring more people. Job IDs do not map automatically to standardized career fields, and reposts can receive new IDs.

**Missing from a scrape does not mean closed.** An ad can move beyond the collected pages or job limit. Retain run reports: breadth `stop_reason` records `job_limit`, `page_limit`, `no_next_page`, `verification_timeout` or `error`. Failed or empty unverified runs must not be counted as zero demand. No automatic closed/expired status or disappearance date is inferred by this pipeline.

**Closing dates are optional depth metadata.** Search cards do not supply a closing date. Depth reads `validThrough` only from matching job metadata; the two live detail pages inspected did not expose it, so their value is `null`. Unrelated banner dates are ignored. Source dates preserve their timezone and date-only precision; observation timestamps use UTC. A published deadline does not prove an ad remained open until that date: SEEK supports early closure ([SEEK closure documentation](https://developer.seek.com/use-cases/job-posting/managing-job-ads/closing-a-job-ad)).

Depth records HTTP 404/410 and explicit unavailable banners as evidence of unavailability at that request. A description may remain visible on an expired ad and is still retained, with the banner reason. `fetched` means a description was obtained, not that a vacancy is open. Missing selectors, failed requests and blocks are failures, never inferred closure. Detail fetches do not advance breadth sighting dates.

## Sorting rules

Breadth and the offline merger accept `--sort`; these sorts have no connection to Kotak's role-fit ranking:

| Mode               | Order                                                    |
| ------------------ | -------------------------------------------------------- |
| `newest` (default) | Estimated listing time, newest first; unknown times last |
| `scraped-at`       | Observation time, newest first                           |
| `title`            | Title, ascending                                         |
| `company`          | Company, ascending; missing values last                  |
| `location`         | Location, ascending; missing values last                 |
| `job-id`           | Numeric job ID, ascending                                |

Text keys use Unicode NFKC normalization and lowercase code-point ordering, independent of the machine's locale. Every tie uses numeric job ID, without assuming IDs encode posting dates.

`listed_at_estimate` derives from `scraped_at` and numeric English labels such as `5m ago`, `12h ago`, `6d ago` or `2 weeks ago`. It is approximate because JobStreet rounds these labels. Unsupported labels produce `null`; the original label is retained. Salary remains displayed text, without currency or pay-period normalization for numeric salary sorting. These sorts organize research records; they do not compute skill demand, relevance or role-fit scores.

For a scrape, `jobs.jsonl` keeps encounter order and `jobs.sorted.jsonl` contains the chosen sorted view of the same selected jobs. `--max-jobs` limits collection before sorting: `newest` orders the captured subset, not the entire site. The offline merger writes its deduplicated, sorted view to `jobs.jsonl`.

## Output

The default breadth destination is `data/jobstreet/<timestamp>-<suffix>/`; depth uses `data/jobstreet/depth/<timestamp>-<suffix>/`. Both are ignored by Git. `--output` selects another **new** directory. Existing directories are refused so concurrent runs cannot mix files or overwrite evidence.

- `jobs.jsonl`: one unique job per line, keyed by `job_id`. Includes title, company, location, salary label, work type, work arrangement, listing age, estimated listing time, summary, original card text, source URL and UTC extraction time. Unavailable optional fields are `null`.
- `jobs.sorted.jsonl`: the scraper's sorted view, also retained on handled failures.
- `observations.jsonl`: prepared collection's full distinct observation history, ordered by scrape time ascending. Use this file for subsequent merges and trend analysis.
- `job-history.jsonl`: prepared collection's first/last-seen dates, counts and query scopes per job, ordered by job ID.
- `run.json`: scraper status, run ID, configured limits and effective result-count target, first/latest reported totals, stop reason, sort mode, HTTP responses, attempts, duplicate/rejection counts, profile ID and error.
- `prepare.json`: offline merge status, input paths, sort mode, latest-job count, observations retained, repeated job observations, exact duplicates removed, rejected rows and error.
- `rejected.jsonl`: invalid rows with raw contents, reason and file/line or page/card location; empty when none were rejected.
- `page-N.html` and `page-N.png`: browser evidence for each visited search page.
- `details.jsonl`: depth's newly requested detail observations, including unavailable and failed attempts. Cached descriptions are not appended again.
- `jobs.enriched.jsonl`: depth's unified view of latest breadth rows, latest successful descriptions and later failure/unavailability evidence, with `fetched`, `reused`, `unavailable`, `failed` or `not_fetched` status. A status describes this run's fetch/reuse result, not current vacancy availability.
- `job-ID.html` and `job-ID.png`: depth browser evidence for each requested listing.
- `page-N-verification.html` / `.png` and `job-ID-verification.html` / `.png`: evidence saved when verification is first detected, before waiting.

Breadth and prepare reports carry `schema_version: 2`; depth reports start at version 1 with `mode: depth`, selected/requested/reused counts, input/cache paths and refresh settings. Legacy breadth captures remain readable. Merging preserves observation history but does not provide automatic synchronization between machines.

Navigation entries record `navigation_kind` (`goto`, `click` or `retry`). Clicked pagination includes the number of wheel notches in `interaction.scroll_notches`; Clearcote handles pointer paths and click timing. Client-side pagination may have `http_status: null` because it produces no new top-level document response; a matching URL and changed listing IDs are required instead of inventing an HTTP 200.

## Waiting for verification

Both modes recognize Cloudflare's `cf-mitigated: challenge` header and known verification-page markers. The scraper keeps the same browser open and waits up to **120 seconds** for verification to clear. Complete any required verification manually in that browser window; the scraper activates the tab and prints the target URL, with the run's profile ID in `run.json`. Collection resumes automatically after a new top-level page response replaces the challenge.

```sh
bun run scrape:jobstreet --max-pages 3 --max-jobs 90 --verification-timeout-ms 300000
```

`--verification-timeout-ms` accepts 0–600000; zero disables waiting. Waiting does not reload the challenge, rotate profiles or consume transient-navigation retries. Cloudflare can return verification pages with HTTP 403 or 429; both get the wait when challenge evidence is present. Ordinary HTTP 403/429 responses without verification markers and HTTP 401 still stop immediately. An unresolved challenge stops with `stop_reason: verification_timeout`, preserves partial data and exits with code 1. The owned profile is cleaned up after the wait ends.

Each affected navigation entry in `run.json` includes `verification`: its `waiting`, `cleared`, `denied`, `timed_out` or `interrupted` status, start/finish times, configured timeout, initial/final HTTP status and Cloudflare Ray ID when supplied. `denied` means verification led to another access-denied response; `interrupted` records an error such as the browser closing during the wait. Successful iframe requests and intermediate redirects do not count as clearance. After clearance, the final page must still pass normal URL and content validation.

## Reliability and failure handling

Runs are bounded to 50 search pages and 1,000 unique jobs, with at least two seconds between pages or detail requests. The default pause is 30–60 seconds, plus scrolling time for pagination. Small defaults remain one page/20 jobs for breadth and 100 jobs for depth. `--retries` permits zero to three additional navigation attempts, default two. Only navigation timeouts, selected connection failures and HTTP 500/502/503/504 responses are retried, with exponential waits starting at `--delay-ms`. Profile creation and other SDK mutations are not automatically retried.

HTTP 401 and ordinary HTTP 403/429 responses stop the run; recognized verification pages get the bounded wait described above. Missing card selectors, an entirely invalid page, repeated pagination URLs, repeated sets of page IDs and off-domain pagination also fail. Challenge pages are never counted as successful scrapes. Search URLs drop fragments, `tracking`, `utm_*` and temporary `__cf_chl_*` parameters and sort the remaining parameters; search filters are preserved.

A malformed card is quarantined while valid cards continue. Success requires at least one saved job and successful profile cleanup; it can still have rejected records, so inspect report counts. An entirely invalid offline input fails with exit code 1. Reports and sorted views use temporary files followed by rename. Raw observations are appended as accepted, preserving earlier results when a later page fails.

Depth continues after individual detail failures, retaining successful records and a `partial` report. Partial and failed depth runs exit with code 1. Access denials and verification timeouts stop the run. Cache-only runs need no browser. Both modes run independently of Hono and Cloudflare Workers and do not feed the app's scoring engine.

## Verification

Run the offline CLI integration checks for cross-file deduplication, retained observation dates, history re-imports, independent run IDs, latest-observation selection, every sort mode, rejected rows and overwrite protection:

```sh
bun test apps/api/src/scrapers/jobstreet
bun run typecheck
```

Browser-backed integration checks are opt-in and launch the Clearcote build. They use routed fixtures for verification handling, pagination input, retries, unavailable ads, isolated failures, rate limits and description reuse:

```powershell
$env:BROWSER_INTEGRATION = '1'
bun test apps/api/src/scrapers/jobstreet/depth.integration.test.ts
bun test apps/api/src/scrapers/jobstreet/verification.integration.test.ts
```

Live tests saved 35 unique breadth jobs across two pages and fetched three full job descriptions. A subsequent depth run reused two descriptions automatically while fetching one new ID. Merging two existing captures produces a latest view of 35 unique jobs while preserving all 40 distinct observations. Browser artifacts stay local and Git-ignored. Reproduce a bounded live check with `bun run scrape:jobstreet --max-jobs 5`, followed by depth against that capture.

## Implementation

- `cli.ts`: command arguments and environment configuration.
- `browser-profile.ts`: adapter to the local `@kotak/browser` profile lifecycle.
- `pipeline.ts`: bounded navigation, retries, card validation, pagination checks and persisted artifacts.
- `depth.ts`: description extraction, cache reuse, dated detail attempts and the unified enriched view.
- `browser.ts`: shared navigation retries, bounded verification waiting and browser evidence.
- `hand.ts`: bounded native scrolling and pointer input for validated pagination links.
- `inputs.ts`: shared validated breadth-file reading.
- `records.ts`: record validation, URL normalization, recency estimates, duplicate winner selection and sorting.
- `prepare.ts`, `prepare-cli.ts`: offline contributor-file merge, retained observation history and date summaries.
- `files.ts`: exclusive output directories and report/view replacement.

The admin API only queues work; the standalone Bun runner owns browser launch and database ingestion. Scraped listings are not currently fed into the role-scoring engine.

## References

- [Clearcote browser](https://github.com/clearcotelabs/clearcote-browser)
- [Clearcote Node SDK](https://github.com/clearcotelabs/clearcote-browser/blob/main/sdk/node/README.md)
- [Playwright persistent context API](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context)
- [Playwright navigation](https://playwright.dev/docs/api/class-page#page-goto)
- [Cloudflare challenge response detection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/)
- [Node file operations](https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath)
- [JobStreet robots directives](https://my.jobstreet.com/robots.txt)

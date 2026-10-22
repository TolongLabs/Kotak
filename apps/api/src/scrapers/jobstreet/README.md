# JobStreet research scraper

Implemented on 22 October 2026. The local Bun pipeline uses Kameleo and Playwright in two modes: **breadth** paginates public Malaysian JobStreet search cards; **depth** enriches saved listings with full descriptions. Depth writes one unified view and reuses saved descriptions by default. An offline command merges dated breadth observations from multiple runs or contributors. Database storage remains deferred.

Contents:

1.  [Run](#run)
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

Install Kameleo using the [official installation guide](https://developer.kameleo.io/getting-started/installation/) and start the Engine. On Windows:

```powershell
& "$env:LOCALAPPDATA\Programs\Kameleo\Kameleo.Engine.exe"
```

From the repository root:

```sh
bun install
bun run scrape:jobstreet --max-jobs 5
bun run scrape:jobstreet --url https://my.jobstreet.com/data-analyst-jobs --max-pages 2 --max-jobs 40 --sort company
bun run scrape:jobstreet --mode breadth --max-pages 50 --max-jobs 1000 --delay-ms 30000 --delay-jitter-ms 30000
bun run scrape:jobstreet --help
```

The Engine defaults to `http://localhost:5050`; set `KAMELEO_ENDPOINT` for another address. Authentication belongs to the Engine, through its desktop login or `PAT` environment variable. Accountless mode is supported by Kameleo, subject to its limits. No credentials are embedded in the scraper.

Verified with Kameleo Engine 5.3.1, SDK 5.2.0 and Playwright Core 1.64.1. Each run creates a fresh desktop Chrome profile, explicitly starts a visible Chroma browser with no `--headless` argument, connects Playwright to its default context, then stops and deletes that profile. The Engine running in the background is separate from browser headless mode. Existing profiles are untouched. Run serially to stay within Kameleo browser quotas. The SDK is pinned to the published 5.2 minor; verify compatibility when changing the Engine version.

Breadth is the default mode, with one page and 20 unique jobs. Opt in to larger runs with `--max-pages` (up to 50) and `--max-jobs` (up to 1,000). A run stops at either limit or the end of pagination. These bounds limit collection; they do not guarantee that many matching jobs exist.

Both modes default to a **30-second base delay plus 0–30 seconds of random variation** between pages/jobs. Configure the base with `--delay-ms` (minimum 2000) and the extra variation with `--delay-jitter-ms` (0–60000). Set variation to zero for a fixed delay. The scraper logs each chosen pause and records `delay_ms`, `delay_jitter_ms` and `browser_mode` in `run.json`. These are configurable test settings; slower pacing does not guarantee that verification will be avoided.

Breadth opens the first search URL, then scrolls toward and clicks the actual validated Next link. `hand.ts` is a self-contained TypeScript adaptation of the wheel notches, curved pointer reach, off-centre aiming and press dwell in TolongLarp's `browser/human.py`; no sibling checkout is required. Scrolling adds time beyond the base pause and is bounded to two minutes. The selected Next control must be visible, preserve the current search path/filters and advance exactly one page; covered or changed links are refused. Both full-page and client-side pagination are supported; each page still needs a valid URL and a new set of listing IDs. First-page navigation, depth URLs and transient retries use `page.goto()`. Verification checkboxes remain manual.

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

Share raw `jobs.jsonl` captures or a prepared collection's `observations.jsonl` manually for now, then run the offline merger. Git ignores `data/jobstreet/`, so pulling the repository does not transfer captured data. This command does not need Kameleo or network access:

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
- `run.json`: scraper status, run ID, limits, stop reason, sort mode, HTTP responses, attempts, duplicate/rejection counts, profile ID and error.
- `prepare.json`: offline merge status, input paths, sort mode, latest-job count, observations retained, repeated job observations, exact duplicates removed, rejected rows and error.
- `rejected.jsonl`: invalid rows with raw contents, reason and file/line or page/card location; empty when none were rejected.
- `page-N.html` and `page-N.png`: browser evidence for each visited search page.
- `details.jsonl`: depth's newly requested detail observations, including unavailable and failed attempts. Cached descriptions are not appended again.
- `jobs.enriched.jsonl`: depth's unified view of latest breadth rows, latest successful descriptions and later failure/unavailability evidence, with `fetched`, `reused`, `unavailable`, `failed` or `not_fetched` status. A status describes this run's fetch/reuse result, not current vacancy availability.
- `job-ID.html` and `job-ID.png`: depth browser evidence for each requested listing.
- `page-N-verification.html` / `.png` and `job-ID-verification.html` / `.png`: evidence saved when verification is first detected, before waiting.

Breadth and prepare reports carry `schema_version: 2`; depth reports start at version 1 with `mode: depth`, selected/requested/reused counts, input/cache paths and refresh settings. Legacy breadth captures remain readable. Merging preserves observation history but does not provide automatic synchronization between machines.

Navigation entries record `navigation_kind` (`goto`, `click` or `retry`). Clicked pagination includes `interaction` counts for wheel notches, pointer moves and press duration. Client-side pagination may have `http_status: null` because it produces no new top-level document response; a matching URL and changed listing IDs are required instead of inventing an HTTP 200.

## Waiting for verification

Both modes recognize Cloudflare's `cf-mitigated: challenge` header and known verification-page markers. The scraper keeps the same Kameleo browser open and waits up to **120 seconds** for verification to clear. If a checkbox appears, complete it in that Kameleo browser window; the scraper activates the tab and prints the target URL, with the run's profile ID in `run.json`. Checkbox completion is a manual step. Collection resumes automatically after a new top-level page response replaces the challenge.

```sh
bun run scrape:jobstreet --max-pages 3 --max-jobs 90 --verification-timeout-ms 300000
```

`--verification-timeout-ms` accepts 0–600000; zero disables waiting. Waiting does not reload the challenge, rotate profiles or consume transient-navigation retries. Cloudflare can return verification pages with HTTP 403 or 429; both get the wait when challenge evidence is present. Ordinary HTTP 403/429 responses without verification markers and HTTP 401 still stop immediately. An unresolved challenge stops with `stop_reason: verification_timeout`, preserves partial data and exits with code 1. The owned profile is cleaned up after the wait ends.

Each affected navigation entry in `run.json` includes `verification`: its `waiting`, `cleared`, `denied`, `timed_out` or `interrupted` status, start/finish times, configured timeout, initial/final HTTP status and Cloudflare Ray ID when supplied. `denied` means verification led to another access-denied response; `interrupted` records an error such as the browser closing during the wait. Successful iframe requests and intermediate redirects do not count as clearance. After clearance, the final page must still pass normal URL and content validation.

## Reliability and failure handling

Runs are bounded to 50 search pages and 1,000 unique jobs, with at least two seconds between pages or detail requests. The default pause is 30–60 seconds, plus scrolling time for pagination. Small defaults remain one page/20 jobs for breadth and 100 jobs for depth. `--retries` permits zero to three additional navigation attempts, default two. Only navigation timeouts, selected connection failures and HTTP 500/502/503/504 responses are retried, with exponential waits starting at `--delay-ms`. Profile creation and other SDK mutations are not automatically retried.

HTTP 401 and ordinary HTTP 403/429 responses stop the run; recognized verification pages get the bounded wait described above. Missing card selectors, an entirely invalid page, repeated pagination URLs, repeated sets of page IDs and off-domain pagination also fail. Challenge pages are never counted as successful scrapes. Search URLs drop fragments, `tracking`, `utm_*` and temporary `__cf_chl_*` parameters and sort the remaining parameters; search filters are preserved.

A malformed card is quarantined while valid cards continue. Success requires at least one saved job and successful profile cleanup; it can still have rejected records, so inspect report counts. An entirely invalid offline input fails with exit code 1. Reports and sorted views use temporary files followed by rename. Raw observations are appended as accepted, preserving earlier results when a later page fails.

Depth continues after individual detail failures, retaining successful records and a `partial` report. Partial and failed depth runs exit with code 1. Access denials and verification timeouts stop the run. Cache-only runs need no Kameleo connection. Both modes run independently of Hono and Cloudflare Workers and do not feed the app's scoring engine.

## Verification

Run the offline CLI integration checks for cross-file deduplication, retained observation dates, history re-imports, independent run IDs, latest-observation selection, every sort mode, rejected rows and overwrite protection:

```sh
bun test apps/api/src/scrapers/jobstreet
bun run typecheck
```

Browser-backed depth integration checks are opt-in and require the Engine. They use routed fixtures for deduplication, JSON-LD dates, retries, unavailable ads, isolated failures, rate limits and description reuse:

```powershell
$env:KAMELEO_INTEGRATION = '1'
bun test apps/api/src/scrapers/jobstreet/depth.integration.test.ts
bun test apps/api/src/scrapers/jobstreet/verification.integration.test.ts
```

Live tests saved 35 unique breadth jobs across two pages and fetched three full job descriptions. A subsequent depth run reused two descriptions automatically while fetching one new ID. Merging two existing captures produces a latest view of 35 unique jobs while preserving all 40 distinct observations. Browser artifacts stay local and Git-ignored. Reproduce a bounded live check with `bun run scrape:jobstreet --max-jobs 5`, followed by depth against that capture.

## Implementation

- `cli.ts`: command arguments and environment configuration.
- `kameleo.ts`: SDK readiness, fingerprint selection, owned profile lifecycle and Playwright connection.
- `pipeline.ts`: bounded navigation, retries, card validation, pagination checks and persisted artifacts.
- `depth.ts`: description extraction, cache reuse, dated detail attempts and the unified enriched view.
- `browser.ts`: shared navigation retries, bounded verification waiting and browser evidence.
- `hand.ts`: bounded native scrolling and pointer input for validated pagination links.
- `inputs.ts`: shared validated breadth-file reading.
- `records.ts`: record validation, URL normalization, recency estimates, duplicate winner selection and sorting.
- `prepare.ts`, `prepare-cli.ts`: offline contributor-file merge, retained observation history and date summaries.
- `files.ts`: exclusive output directories and report/view replacement.

No public API route launches browsers. Scraper database ingestion and integration with the app's scoring engine remain outside this pipeline.

## References

- [Kameleo quickstart](https://developer.kameleo.io/getting-started/quickstart/)
- [Kameleo Playwright integration](https://developer.kameleo.io/integrations/playwright/)
- [Kameleo browser headless mode](https://developer.kameleo.io/tutorials/starting-headless-browsers/)
- [Kameleo configuration](https://developer.kameleo.io/reference/configuration-options/)
- [Kameleo usage limits](https://developer.kameleo.io/reference/usage-limits/)
- [Playwright CDP connection](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)
- [Playwright navigation](https://playwright.dev/docs/api/class-page#page-goto)
- [Cloudflare challenge response detection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/)
- [Node file operations](https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath)
- [JobStreet robots directives](https://my.jobstreet.com/robots.txt)

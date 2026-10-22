# Kotak SDK

`@kotak/sdk` runs Kotak's whole check-up from the data bundle, in the browser, in Bun and in a Cloudflare Worker, and carries a typed client for Kotak's HTTP API. Every level, verdict, ranking and date comes from the rules in `@kotak/shared`; the SDK only composes them, so your code, the web app and Kotak's agents agree for the same answers.

Contents:

1.  [Install](#install)
1.  [Engine](#engine)
    1.  [Load the bundle from a base URL](#load-the-bundle-from-a-base-url)
    1.  [Get the can-do questions](#get-the-can-do-questions)
    1.  [Run a check-up](#run-a-check-up)
    1.  [Compare two snapshots](#compare-two-snapshots)
1.  [API client](#api-client)
    1.  [Available and unavailable results](#available-and-unavailable-results)
    1.  [Client methods](#client-methods)
1.  [Run the examples locally](#run-the-examples-locally)
1.  [See also](#see-also)

## Install

The SDK is a workspace package of this repository, not published to npm. Add it to a workspace package's dependencies and run `bun install` at the root:

```json
{
  "dependencies": {
    "@kotak/sdk": "workspace:*"
  }
}
```

It ships TypeScript source and depends only on `@kotak/shared` and Zod, with no React, DOM or Node built-ins.

## Engine

The examples in this section and the next build on each other; pasted in order into one file, they run with `bun <file>.ts`.

### Load the bundle from a base URL

`createKotak` reads the data bundle through a bundle source. `fetchSource` reads it over HTTP from a site's origin: the live site below, a local server, or a Worker's `ASSETS` binding. Hold one `Kotak` for the life of your process; it keeps every file it read.

```ts
import { createKotak, fetchSource } from '@kotak/sdk'

const BASE_URL = 'https://kotak.tp073654.workers.dev'

const kotak = createKotak({ source: fetchSource({ baseUrl: BASE_URL, fetch }) })

const manifest = await kotak.manifest()
console.log(
  manifest.default_snapshot_id,
  manifest.snapshots.map((snapshot) => snapshot.snapshot_id)
)
```

A missing or invalid bundle file throws a `BundleFileError` naming its path. To read the bundle another way, pass your own `{ read(path) }` source, as [`scripts/sdk-checkup.ts`](/scripts/sdk-checkup.ts) does from disk. A server can mark its source `trusted` to skip the Zod parse of files the build already checked.

### Get the can-do questions

`questions` lists a role's corners in Kotak's asking order, Rising corners first. Each corner has a `can_do` statement to ask first and the follow-up that answer picks.

```ts
const ROLE = '15-1254.00' // Web Developers

const questions = await kotak.questions(ROLE)
for (const corner of questions.corners) console.log(`${corner.verdict} ${corner.name}: ${corner.can_do}`)
```

A role whose `questions_ready` is false has no can-do statements, so `questions` and `checkup` throw for it rather than make up levels. `kotak.role(code)` tells you before you ask.

### Run a check-up

`checkup` turns the answers into levels, verdicts, the ranked roles and a roadmap. Each answer is `{ corner_id, can_do, follow_up }`: `can_do` answers the `can_do` statement, and `follow_up` answers `follow_up.if_yes` after a yes or `follow_up.if_no` after a no. Leave out corners the user didn't answer.

```ts
const answers = questions.corners.map((corner) => ({ corner_id: corner.corner_id, can_do: false, follow_up: true }))

const report = await kotak.checkup({ role_code: ROLE, answers, start_date: '2026-10-26' })

for (const corner of report.corners)
  console.log(
    `${corner.name}: level ${corner.level} (${corner.level_label}), ${corner.verdict_label}. ${corner.reason}`
  )
for (const role of report.roles.slice(0, 3)) console.log(`${role.rank}. ${role.title} ${role.fit_percent}%`)
console.log(`Finish ${report.roadmap.finish_date} at ${report.roadmap.weekly_hours} h a week`)
```

`start_date` is required, because the SDK never reads the clock. The other inputs default to the web app's: snapshot `2026-05`, the `slow` scenario, 4 weekly hours (`null` lets the AI dividend decide) and the `explore` goal. With `goal: 'target'` and a `target_role_code`, the check-up assesses the target role. `report.input` echoes every input used, defaults included, and `CheckupReportSchema` validates a report.

### Compare two snapshots

`whatChanged` diffs the same answers between two snapshots, by default `2026-04` and `2026-05`.

```ts
const changed = await kotak.whatChanged({ role_code: ROLE, answers })

console.log(`${changed.diff.verdict_flips} verdict flips, roadmap reordered: ${changed.diff.roadmap_reordered}`)
for (const corner of changed.diff.corners)
  console.log(`${corner.name}: ${corner.before.label} to ${corner.after.label}`)
```

## API client

`createKotakClient` calls Kotak's HTTP API with typed methods. It checks each request and response with the API's schemas in `@kotak/shared`. `fetch` is optional and defaults to the global one.

```ts
import { createKotakClient } from '@kotak/sdk'

const api = createKotakClient({ baseUrl: BASE_URL })

const health = await api.health()
console.log(health.status === 'available' ? health.data.status : 'API down')
```

### Available and unavailable results

The methods never throw. Each returns `{ status: 'available', data }`, or `{ status: 'unavailable', error? }` on a network error, a non-2xx answer or a response that fails its schema. `error` is the API's `{ code, message }` when the server sent one, or `invalid_request` when the client refused the request before sending it.

```ts
const refused = await api.matchRole({ job_title: '' })
if (refused.status === 'unavailable') console.log(refused.error?.code) // invalid_request
```

### Client methods

`matchRole` finds the O\*NET role for a job title. An official O\*NET title, or an alternate title only one occupation has, is matched by title search, with no AI; other titles, including an alternate title several occupations share, go to Claude when the server has an API key.

```ts
const match = await api.matchRole({ job_title: 'Web Developers' })
if (match.status === 'available') console.log(match.data.occupation?.onet_code, match.data.match_source)
```

`explain` writes two cited sentences per corner and a what-changed summary. Fixed rules have already set every verdict; when Claude is unavailable, the answer is the fixed template and `fallback_reason` says why.

```ts
const explanation = await api.explain({
  snapshot_id: report.input.snapshot_id,
  corners: report.corners.map((corner) => ({
    corner_id: corner.corner_id,
    name: corner.name,
    verdict: corner.verdict,
    user_level: corner.level,
    target_level: corner.target_level,
    sources: corner.sources
  }))
})
if (explanation.status === 'available') console.log(explanation.data.explanations[0]?.sentences.join(' '))
```

`nationalViewSummary` gives the average corner levels of Malaysian check-ups per role, filtered by `onet_role_code` or `occupation_group`. A role shows real averages only from 10 check-ups; otherwise its row is sample data with `is_sample: true`.

```ts
const national = await api.nationalViewSummary({ onet_role_code: ROLE })
if (national.status === 'available')
  for (const group of national.data.groups)
    console.log(group.onet_role_code, group.average_corner_levels, group.is_sample ? 'sample data' : 'real')
```

## Run the examples locally

`bun run build`, then `bun run start` at the repository root serves the bundle and the API at `http://localhost:8787`; set `BASE_URL` to it. Without `ANTHROPIC_API_KEY`, `matchRole` still matches exact titles, and `explain` answers with the fixed template. Without `DATABASE_URL`, `nationalViewSummary` returns sample data with `database_available: false`.

## See also

- [`packages/shared/src/api.ts`](/packages/shared/src/api.ts): the API's request and response schemas.
- [`scripts/sdk-checkup.ts`](/scripts/sdk-checkup.ts): a check-up for each demo role, from the bundle on disk.
- [Issue #184](https://github.com/TolongLabs/sdc-hack/issues/184): the SDK and agent layer spec.

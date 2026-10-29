# Cost card

What one Kotak check-up costs to run, and what 1,000 and 100,000 users cost a month, for section 4 of the final report and the pitch (#380). Token counts were measured on the running API on 29 October 2026, and every price comes from the provider's own pricing page, read the same day.

Contents:

1.  [Cost per check-up and per month](#cost-per-check-up-and-per-month)
1.  [Pitch line](#pitch-line)
1.  [Assumptions](#assumptions)
1.  [What moves the numbers](#what-moves-the-numbers)
1.  [How the numbers were measured](#how-the-numbers-were-measured)
1.  [Prices used](#prices-used)

## Cost per check-up and per month

In US dollars before tax, with one check-up per user a month. The per-check-up column uses the 1,000-user case.

| Running cost                                  | Per check-up |      1,000 users a month |       100,000 users a month | Price source                |
| --------------------------------------------- | -----------: | -----------------------: | --------------------------: | --------------------------- |
| Claude Haiku 5.5: job match                   |       0.0025 |                     2.53 |                       21.24 | [Anthropic]                 |
| Claude Haiku 5.5: explanations                |       0.0017 |                     1.74 |                      173.70 | [Anthropic]                 |
| Claude Haiku 5.5: Ask Kopi, 3 questions       |       0.0166 |                    16.57 |                    1,656.87 | [Anthropic]                 |
| ElevenLabs v4 Turbo: Kopi's voice             |       0.0439 |                    43.92 |                    4,392.00 | [ElevenLabs]                |
| Cloudflare Workers, KV and the Durable Object |            0 |            0 (Free plan) |         5.00 (Paid minimum) | [Workers], [Durable Object] |
| Neon Postgres                                 |            0 |            0 (Free plan) |              19.70 (Launch) | [Neon], [Neon plans]        |
| Weekly data refresh on GitHub Actions         |            0 |                        0 |                           0 | [GitHub Actions]            |
| RunPod batch, run once                        |            0 |                        0 |                           0 | [RunPod], [RunPod billing]  |
| **Total**                                     |    **0.065** | **64.76** (0.065 a user) | **6,268.52** (0.063 a user) |                             |
| Total with Kopi muted                         |        0.021 |     20.84 (0.021 a user) |     1,876.52 (0.019 a user) |                             |

Two costs sit outside the totals because they don't grow with users: the RunPod batch cost US$0.97 to US$1.71 once, and Replit Core costs US$20 a month for a copy that serves no users ([Replit]).

## Pitch line

A full Kotak check-up, three questions to Kopi included, costs about 6.5 US cents, two-thirds of it for Kopi's voice: 100,000 users a month would cost about US$6,300, or about US$1,900 with Kopi muted, and the first 1,000 users run on free hosting tiers.

## Assumptions

1.  **A check-up** is the guest walk recorded in [`scripts/kopi-lines.ts`](/scripts/kopi-lines.ts): start, 12 questions, Radar, Roles, Roadmap, Home and What Changed, plus 3 questions to Ask Kopi. A user does one check-up a month.
1.  **Job match**: one Claude call per check-up, for a typed title with no single exact O\*NET match; an exact title costs nothing. The call sends the 923-occupation list, 20,167 tokens, as a cached system prompt. At 1,000 users, about 33 check-ups a day, Anthropic's 5-minute prompt cache is assumed cold, so each call writes it (US$0.0025). At 100,000 users it is assumed warm, so each call reads it (US$0.0002).
1.  **Explanations**: one call per check-up, measured at 3,862 input and 2,702 output tokens. Kotak's response cache keys on the role, snapshot and the user's levels, so users rarely share an answer; every call is counted as a miss. Each snapshot switch adds a call.
1.  **Ask Kopi**: 3 questions per check-up. Each question measured 2.2 Claude requests, 50,844 input and 877 output tokens on average, and the route caches nothing. No request passed 100,000 prompt tokens (the largest was 74,064), so standard prices apply.
1.  **Kopi's voice** is on by default (`tts_muted: false` in [`apps/web/src/session/store.ts`](/apps/web/src/session/store.ts)). A check-up speaks 22 lines. 5 of them, 223 characters, are the same for everyone and pre-generated, so they cost nothing. The other 17, 1,098 characters, are the role's 12 statements and 5 lines about the user's own result, and outside the sample profile they are spoken live on `eleven_v4_turbo`. The Worker's audio cache lives in one isolate's memory (the Cache API does nothing on `workers.dev`), so no live line is assumed reused across users.
1.  **Cloudflare**: about 31 Worker requests per check-up (22 voice lines, 3 chats, the match, the explanations, the approved job-ad titles and about 3 job-ad market calls); static files are free. At 100,000 users that is about 3.1 million requests a month, over the Free plan's 100,000 a day, so the Paid plan's US$5 minimum applies, and usage stays inside what it includes. Every chat runs in one Durable Object, so its duration can't pass about 330,000 GB-s a month (128 MB for a whole month), inside the 400,000 GB-s included. Claude answers add 2 KV writes per check-up.
1.  **Neon**: the Free plan's 100 CU-hours cover 1,000 users. At 100,000 users the database never idles long enough to scale to zero: 0.25 CU for 730 hours (US$19.35) plus 1 GB of storage (US$0.35) on Launch.
1.  **Weekly data refresh**: about 7 minutes a run (7 minutes 19 seconds on 24 October), 52 runs a year, US$0.19 a month at list price, inside the US$12 a month GitHub includes for a free organization's private repositories, assuming TolongLabs is on GitHub Free. Its sources (Hugging Face, DOSM, O\*NET, the UN SDG API) are free. It is paused for the repository freeze.
1.  **RunPod**: the corner batch ran once, 1,285 seconds over two runs on 22 October ([`data/generated/role-corners-run.json`](/data/generated/role-corners-run.json)). The file doesn't record which GPU served it, so the cost runs from an 80 GB A100 to an 80 GB PRO H100. It reruns only for a new O\*NET release.
1.  **Left out**: the nightly JobStreet scrape runs on a team machine, and its Claude title sorting is admin-only, so neither grows with users. Replit hosts only the proof-of-use copy, which costs US$20 a month while it is kept on Core.

## What moves the numbers

- **Kopi's voice is two-thirds of the cost of a check-up.** Muting Kopi by default, as the comment in `store.ts` says was intended, removes it for users who don't unmute. Pre-generating each role's 12 statement lines once (923 roles, about 638,000 characters, about US$51 on `eleven_v4`) cuts the live voice cost from US$0.044 to US$0.016 a check-up.
- **Tool results make up most of Ask Kopi's input.** A `run_checkup` result is about 17,000 tokens and a `what_changed` result about 68,000. Shorter tool results are the main Claude saving. A long conversation could pass 100,000 prompt tokens, where Claude Haiku 5.5 costs 5 times as much.
- **The rate limit must rise before 100,000 users.** The Claude routes would make about 860,000 requests a month, about 20 a minute on average, against a limit of 30 a minute per route (`CLAUDE_CALLS_PER_MINUTE` in [`apps/api/src/ai/rate-limit.ts`](/apps/api/src/ai/rate-limit.ts)). Ask Kopi would hit it at peaks.
- **More check-ups per user** multiply the Claude and voice rows: two check-ups a month double them.

## How the numbers were measured

On 29 October 2026 the API ran on Bun (`bun apps/api/src/bun.ts`) with an empty response cache and a hook that logged the `usage` of each Claude response. It was sent 5 job titles, the 3 explanation requests in [`scripts/demo-requests.json`](/scripts/demo-requests.json) and 5 Ask Kopi questions about a Web Developers check-up (O\*NET 15-1254.00), one of them a follow-up. That made 19 Claude requests, which cost about US$0.03. The voice characters are the lines recorded from the app's own `/api/tts` requests in `scripts/kopi-lines.ts`, on 22 October. The Cloudflare request counts come from the app's calls in [`apps/web/src/engine/api.ts`](/apps/web/src/engine/api.ts) and [`apps/web/src/components/kopi/voice.ts`](/apps/web/src/components/kopi/voice.ts), not from live traffic.

## Prices used

All read on 29 October 2026, in US dollars:

- **[Anthropic]** (also [claude.com/pricing](https://claude.com/pricing)): Claude Haiku 5.5, for prompts up to 100,000 tokens, US$0.10 input, US$0.125 5-minute cache write, US$0.01 cache read and US$0.50 output per million tokens. Above 100,000 tokens: US$0.50, US$0.625, US$0.05 and US$2.50.
- **[ElevenLabs]**: text to speech is billed per character, at US$0.04 per 1,000 characters on v4 Turbo and US$0.08 on v4. The Free plan includes 20,000 v4 Turbo characters a month, and Pro (US$99) includes 2,475,000.
- **[Workers]** (last updated 2 October 2026): Free, 100,000 requests a day and 10 ms of CPU per request. Paid, a US$5 monthly minimum with 10 million requests (then US$0.30 a million) and 30 million CPU ms (then US$0.02 a million). Static asset requests are free. KV on Free allows 100,000 reads and 1,000 writes a day; Paid includes 10 million reads and 1 million writes a month.
- **[Durable Object]** (last updated 18 October 2026): Free, 100,000 requests and 13,000 GB-s a day. Paid, 1 million requests (then US$0.15 a million) and 400,000 GB-s (then US$12.50 a million). Duration bills the object's 128 MB of memory.
- **[Neon]** and **[Neon plans]**: Free, 100 CU-hours per project a month, scaling to zero after 5 minutes idle. Launch, US$0.106 a CU-hour and US$0.35 a GB-month, with no monthly minimum.
- **[GitHub Actions]**: a Linux 2-core runner costs US$0.006 a minute; a free organization gets US$12 of included use a month for private repositories.
- **[RunPod]** and **[RunPod billing]**: serverless 80 GB PRO (H100) US$4.79 an hour and 80 GB (A100) US$2.72 an hour, billed per second from worker start to stop.
- **[Replit]**: Core US$20 a month (US$18 billed yearly) with US$20 of credits.

[Anthropic]: https://platform.claude.com/docs/en/about-claude/pricing
[ElevenLabs]: https://elevenlabs.io/pricing/api
[Workers]: https://developers.cloudflare.com/workers/platform/pricing/
[Durable Object]: https://developers.cloudflare.com/durable-objects/platform/pricing/
[Neon]: https://neon.com/pricing
[Neon plans]: https://neon.com/docs/introduction/plans
[GitHub Actions]: https://docs.github.com/en/billing/concepts/product-billing/github-actions
[RunPod]: https://www.runpod.io/pricing
[RunPod billing]: https://docs.runpod.io/serverless/pricing
[Replit]: https://replit.com/pricing

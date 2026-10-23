# Kotak technical and tools declaration

Every API, cloud service, AI tool, dataset, model and sponsor resource that Kotak uses, in the order of the organisers' [Technical Tools Declaration template][template]. The team exports it as `SDC2026_T010NG_TechDeclaration.pdf`. Headings carry the template's word limit where it sets one. Where a category does not apply, the answer says "None" or "No", as the template asks.

[template]: /docs/sources/drive.google.com/technical-tools-declaration-template.md

Contents:

1.  [1. Team and project overview](#1-team-and-project-overview)
1.  [2. Architecture & technology stack](#2-architecture--technology-stack)
    1.  [2.1. System architecture overview (200 words max)](#21-system-architecture-overview-200-words-max)
    1.  [2.2. Languages, frameworks & libraries](#22-languages-frameworks--libraries)
1.  [3. APIs & cloud services](#3-apis--cloud-services)
    1.  [3.1. External APIs](#31-external-apis)
    1.  [3.2. Cloud platforms & deployment](#32-cloud-platforms--deployment)
1.  [4. AI tools, models & datasets](#4-ai-tools-models--datasets)
    1.  [4.1. AI models used in the solution](#41-ai-models-used-in-the-solution)
    1.  [4.2. Datasets](#42-datasets)
    1.  [4.3. AI-assisted development tools](#43-ai-assisted-development-tools)
1.  [5. Sponsor-provided resources](#5-sponsor-provided-resources)
1.  [6. Security, privacy & responsible use](#6-security-privacy--responsible-use)
    1.  [6.1. Data handling & privacy (150 words max)](#61-data-handling--privacy-150-words-max)
    1.  [6.2. Known limitations & risks (150 words max)](#62-known-limitations--risks-150-words-max)
1.  [7. Compliance & readiness](#7-compliance--readiness)
1.  [8. Declaration](#8-declaration)

## 1. Team and project overview

- **Team name**: T010NG.
- **Project name**: Kotak.
- **Team leader**: Hee Zi Jie (AlaskanTuna). The leader's email and phone go only in the exported PDF.
- **University affiliations**: Asia Pacific University of Technology & Innovation (APU), University of Reading and University of Sheffield.
- **Live prototype URL**: <https://kotak-alaskxntxna.replit.app>, published on Replit. A mirror runs at <https://kotak.tp073654.workers.dev>.
- **Code repository URL**: the team's public submission repository ([#45]).

[#45]: https://github.com/TolongLabs/Kotak/issues/45

## 2. Architecture & technology stack

### 2.1. System architecture overview (200 words max)

A user opens Kotak in the browser. The React app loads dated JSON snapshots built from O\*NET, the Anthropic Economic Index and DOSM Job Market Insights, and computes every verdict, fit score and roadmap in the browser with fixed rules. Answers stay in the browser's `localStorage`.

The app calls a Hono API on the same origin. The API matches typed job titles and writes cited explanations with Claude Haiku 5.5, then checks each explanation against the rules and falls back to a template if it fails. It sends Kopi's lines to ElevenLabs for speech, and caches both by a hash of the request. Ask Kopi and the MCP endpoint call 7 read-only tools over the same rules; one tool reads anonymous check-up totals and one reads the reviewed JobStreet ads' totals from Neon Postgres.

Before the demo, a RunPod serverless GPU ran Qwen3.8-27B to build each job's 6 skills and 18 questions, which ship inside the snapshots.

GitHub Actions builds and deploys the app and API to Cloudflare Workers on every merge to `main`, and refreshes the data every Saturday. Replit publishes the same code from the team's account. Keys live only in GitHub, Cloudflare and Replit secrets.

The system block diagram is in the [PRD, section 3.1][prd-31].

[prd-31]: /docs/PRD.md#31-conceptual-tech-stack

### 2.2. Languages, frameworks & libraries

| Name & Version                                | Purpose in Project                                         | License                             |
| --------------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| TypeScript 7.0                                | The language of the whole codebase                         | Apache 2.0                          |
| Bun 1.4                                       | Runtime, package manager, test runner and Replit server    | MIT                                 |
| React 19.3                                    | The web app's user interface                               | MIT                                 |
| Vite 8.3                                      | Builds and serves the web app                              | MIT                                 |
| Tailwind CSS 4.3                              | Styling and design tokens                                  | MIT                                 |
| Recharts 3.10                                 | The Future Skills Radar and the roadmap charts             | MIT                                 |
| Lucide React 1.61                             | Icons                                                      | ISC                                 |
| pixi.js 6.5 and pixi-live2d-display 0.4       | Renders Kopi, the Live2D cat                               | MIT                                 |
| Hono 4.13                                     | The API server on Cloudflare Workers and Bun               | MIT                                 |
| Zod 4.6                                       | Validates every request, response and data file            | MIT                                 |
| Anthropic TypeScript SDK 1.1                  | Calls the Claude API                                       | Apache 2.0                          |
| MCP server SDK 2.3                            | Serves Kotak's tools to AI assistants at `/api/mcp`        | Apache 2.0                          |
| Neon serverless driver 1.2                    | Connects the API to Postgres                               | MIT                                 |
| Wrangler 4.151                                | Deploys to Cloudflare Workers                              | MIT or Apache 2.0                   |
| Playwright Core 1.64 and Clearcote 0.60       | Drives the browser for the JobStreet research scraper      | Apache 2.0, BSD-3                   |
| Live2D Cubism Core for Web                    | Runtime that plays Live2D models, loaded from Live2D's CDN | Live2D Proprietary Software License |
| Atkinson Hyperlegible and Shantell Sans fonts | Body, mono and Kopi's handwritten type, from Google Fonts  | SIL Open Font License 1.1           |

## 3. APIs & cloud services

### 3.1. External APIs

| API and Provider               | Purpose in Project                                                | Access Tier             |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------- |
| Claude API, Anthropic          | Matches job titles, explains verdicts and runs Ask Kopi           | Paid                    |
| Text to Speech API, ElevenLabs | Kopi's voice                                                      | Paid                    |
| RunPod Serverless API, RunPod  | The one-time GPU batch that built each job's skills and questions | Sponsor-provided credit |
| Google Fonts, Google           | Serves the app's fonts                                            | Free                    |
| Live2D Cubism CDN, Live2D      | Serves the Cubism Core runtime for Kopi                           | Free                    |

The data sources in section 4.2 are downloaded files, not live APIs: the app never calls them at runtime. API keys are not shown in this document.

### 3.2. Cloud platforms & deployment

| Service & Provider                | Purpose in Project                                                                                        | Plan / Region                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Replit Deployments, Replit        | Publishes the live demo from `main` on the team's own account                                             | Replit Core (sponsor-provided)               |
| Cloudflare Workers, Cloudflare    | The mirror deployment: app, API, KV cache and a Durable Object for MCP and chat                           | Workers Free; global, Durable Object in APAC |
| Neon Postgres, Neon               | Anonymous check-up totals, JobStreet listings, the admins' reviews and matched skills, and admin accounts | Free; `aws-ap-southeast-1`, Postgres 18      |
| RunPod Serverless, RunPod         | The vLLM GPU endpoint for the one-time batch; 0 workers when idle                                         | Sponsor credit; one H100 80 GB GPU           |
| GitHub and GitHub Actions, GitHub | Code hosting, CI, deploys on every merge to `main` and the Saturday data refresh                          | Free                                         |

## 4. AI tools, models & datasets

### 4.1. AI models used in the solution

| Model & Version                                            | Source / Provider             | Usage       | License / Terms                       |
| ---------------------------------------------------------- | ----------------------------- | ----------- | ------------------------------------- |
| Claude Haiku 5.5 (`claude-haiku-5-5`)                      | Anthropic, Claude API         | Pre-trained | Anthropic Commercial Terms of Service |
| ElevenLabs `eleven_v4` and `eleven_v4_turbo`, voice Johari | ElevenLabs                    | Pre-trained | ElevenLabs Terms of Service           |
| Qwen3.8-27B-FP8                                            | Qwen, run on RunPod with vLLM | Pre-trained | Apache 2.0                            |

No model is fine-tuned or self-trained.

### 4.2. Datasets

| Dataset Name                                  | Source / URL                                                                        | Type                        | License                                              | Personal Data?  |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------- | --------------- |
| O\*NET 30.1 Database                          | <https://www.onetcenter.org/database.html>                                          | Public                      | CC BY 4.0                                            | N               |
| Anthropic Economic Index, April and May 2026  | <https://huggingface.co/datasets/Anthropic/EconomicIndex>                           | Public                      | Data CC BY; code MIT                                 | N               |
| DOSM Job Market Insights, Q3 2019 to Q2 2026  | <https://www.dosm.gov.my>                                                           | Public                      | DOSM terms, with source credit                       | N               |
| OpenDOSM skill-related underemployment by age | <https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_age>                           | Public                      | CC BY 4.0; one figure cited                          | N               |
| UN SDG indicator 4.4.1, Malaysia              | <https://unstats.un.org/sdgapi/>                                                    | Public                      | UN terms of use; one baseline cited                  | N               |
| Kotak skills and questions for 923 jobs       | Built from O\*NET by the RunPod batch                                               | Synthetic, from public data | The team's own work                                  | N               |
| JobStreet job listings                        | Collected by the team's scraper from <https://my.jobstreet.com>, reviewed by admins | Self-collected              | JobStreet's terms apply; Kotak publishes totals only | N; job ads only |
| Demo check-up profiles                        | Written by the team                                                                 | Synthetic                   | The team's own work                                  | N               |

MyCOL and Epoch AI are cited as context only; Kotak loads no data from them. Approved JobStreet listings feed the check-up's job-title suggestions, the Job Ads in Malaysia card, the role cards' ad counts and pay, and Kopi's `job_market` tool. They feed no verdict, fit score or roadmap.

### 4.3. AI-assisted development tools

Yes, the team used generative-AI tools.

| Tool & Version                                                                     | Used For                                                  | Extent of Use |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| Claude Code, with Claude models                                                    | Code, reviews, research, documentation and pull requests  | Major         |
| Codex CLI, OpenCode and Antigravity CLI, with GPT, DeepSeek, GLM and Gemini models | Parallel code changes from written briefs                 | Moderate      |
| Claude, GPT and Gemini chat models                                                 | The field simulation and design review in `docs/research` | Minor         |

How the team reviewed, tested and took responsibility for AI-generated output (100 words max):

Every change went through a pull request that ran type-checks and a build in CI before a member merged it. The team checked each feature by running the app in a browser at phone and desktop widths, not by trusting the tool's report. Facts in the app and in these documents link a dated public source. AI-drafted skills carry a visible label in the app until a person reviews them. The team owns every merged line and corrected tool mistakes before merging.

## 5. Sponsor-provided resources

Yes, Kotak uses official SDC sponsor resources.

| Sponsor                   | Resource       | How It Was Used in the Project                                                         |
| ------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Replit                    | Platform, Core | Hosts the live demo, published from `main` on the team's own account                   |
| RunPod                    | Credits        | A serverless H100 ran the batch: 923 jobs, 783 seconds for the full run, about US$1.25 |
| SDC mentors (KrackedDevs) | Mentoring      | One mentor session on 23 October 2026; feedback recorded in [#98]                      |

Was the sponsor resource essential to the core functionality, or could it be replaced? (100 words max)

RunPod was essential to build Kotak's data: it turned O\*NET's tasks into 6 skills and 18 questions for each of 923 jobs, which no person could write by the deadline. The batch runs once, so the live app does not depend on RunPod, and the Claude Message Batches API could replace it. Replit hosts the submitted live demo; the same build also runs on Cloudflare Workers, so the hosting is replaceable.

[#98]: https://github.com/TolongLabs/Kotak/issues/98

## 6. Security, privacy & responsible use

### 6.1. Data handling & privacy (150 words max)

Kotak has no user accounts. A check-up runs in guest mode: the job, goal and answers stay in the browser's `localStorage`, and Settings > Reset All clears them.

The app sends a typed job title to the Claude API for matching, and a role's skill data for explanations. Ask Kopi sends the user's message, and the results of tools run on their check-up, to Claude. Kopi's lines go to ElevenLabs for speech. Neither request carries a name, email or ID. The API caches answers and audio by a hash of the request.

Postgres stores anonymous check-ups as a role code, 6 skill levels, a sample flag and a date, and shows totals only for groups of 10 or more. The research scraper stores public job ads, not personal profiles. Keys live only in host secrets.

### 6.2. Known limitations & risks (150 words max)

- **Hallucination**: Claude only explains verdicts that fixed rules set. A check rejects any explanation that changes a verdict or lacks a dated citation, and a template replaces it.
- **Wrong job match**: the user confirms every AI title match.
- **Unreviewed skills**: an open model drafted each job's skills. A validator rejects tasks from other jobs, and the app labels the skills AI-drafted.
- **Thin trend data**: the Economic Index has two monthly points, so 12-month projections are rough. Every target is labelled an estimate, and thin data shows Unknown.
- **Data bias**: O\*NET describes US jobs, and DOSM counts only online job ads.
- **Single providers and rate limits**: cached answers, templates and text cover Claude or ElevenLabs outages and HTTP 429 or 529 errors. A limit of 30 Claude calls a minute protects the key.

## 7. Compliance & readiness

The leader ticks each box in the PDF after checking it:

- Every API, cloud service, AI tool, model and dataset is declared above.
- Third-party code, data and models follow their licences, with credits in [NOTICE.md][notice].
- No key, password or credential is in the repository, the prototype or this document.
- Generative-AI use is declared in section 4.3 and reviewed by the team.
- Sponsor resources are declared in section 5.
- Judges can open the prototype and the repository from section 1.
- Every field is complete and within its word limit.

[notice]: /NOTICE.md

## 8. Declaration

The team leader signs and dates the declaration in the exported PDF.

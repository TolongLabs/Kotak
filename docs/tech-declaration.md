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
- **Code repository URL**: the team's public submission repository (#45).

## 2. Architecture & technology stack

### 2.1. System architecture overview (200 words max)

A user opens Kotak in English, Malay or Chinese. The React app loads dated JSON snapshots built from O\*NET, the Anthropic Economic Index and DOSM Job Market Insights, and computes every verdict, fit score and roadmap in the browser with fixed rules. A three.js scene stands all 923 jobs by fit. Answers stay in the browser's `localStorage`.

The app calls a Hono API on the same origin. The API matches typed job titles and writes cited explanations with Claude Haiku 5.5, then checks each against the rules, falling back to a template. It also judges uploaded proof of a finished roadmap step with Claude's vision, and keeps only the verdict. Kopi's lines go to ElevenLabs for speech; both are cached by request hash. Ask Kopi and the MCP endpoint call 8 read-only tools over the same rules; two read Neon Postgres totals for skill gaps and job ads.

A RunPod GPU built each job's 6 skills and 18 questions with Qwen3.8-27B, and translated ten jobs into Malay and Chinese. Meta's Muse Spark 1.3 then translated every job title and part of the rest. All of it ships inside the snapshots.

GitHub Actions deploys the app and API to Cloudflare Workers on each merge to `main`, and refreshes data weekly. Replit publishes the same code. Keys live only in GitHub, Cloudflare and Replit secrets.

The system block diagram is in the [PRD, section 3.1][prd-31].

[prd-31]: /docs/PRD.md#31-conceptual-tech-stack

### 2.2. Languages, frameworks & libraries

| Name & Version                                              | Purpose in Project                                                                                            | License                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| TypeScript 7.0                                              | The language of the whole codebase                                                                            | Apache 2.0                             |
| Bun 1.4                                                     | Runtime, package manager, test runner and Replit server                                                       | MIT                                    |
| React 19.3                                                  | The web app's user interface                                                                                  | MIT                                    |
| Vite 8.3                                                    | Builds and serves the web app                                                                                 | MIT                                    |
| Tailwind CSS 4.3                                            | Styling and design tokens                                                                                     | MIT                                    |
| Recharts 3.10                                               | The Future Skills Radar and the roadmap charts                                                                | MIT                                    |
| three 0.186, @react-three/fiber 9.8 and postprocessing 6.39 | Draw the Two Futures 3D space, where every job stands by fit, and its bloom and tone mapping                  | MIT, MIT, Zlib                         |
| Lucide React 1.61                                           | Icons                                                                                                         | ISC                                    |
| pixi.js 6.5 and pixi-live2d-display 0.4                     | Renders Kopi, the Live2D cat                                                                                  | MIT                                    |
| Hono 4.13                                                   | The API server on Cloudflare Workers and Bun                                                                  | MIT                                    |
| Zod 4.6                                                     | Validates every request, response and data file                                                               | MIT                                    |
| Anthropic TypeScript SDK 1.1                                | Calls the Claude API                                                                                          | Apache 2.0                             |
| MCP server SDK 2.3                                          | Serves Kotak's tools to AI assistants at `/api/mcp`                                                           | Apache 2.0                             |
| Neon serverless driver 1.2                                  | Connects the API to Postgres                                                                                  | MIT                                    |
| Wrangler 4.151                                              | Deploys to Cloudflare Workers                                                                                 | MIT or Apache 2.0                      |
| Playwright Core 1.64 and Clearcote 0.60                     | Drives the browser for the JobStreet scraper                                                                  | Apache 2.0, BSD-3                      |
| fflate 0.8 and PGlite 0.5                                   | Unpack the O\*NET and CIP archives and pack the Claude Code skill; an in-process Postgres for the API's tests | MIT, Apache 2.0                        |
| Live2D Cubism Core for Web                                  | Runtime that plays Live2D models, loaded from Live2D's CDN                                                    | Live2D Proprietary Software License    |
| Atkinson Hyperlegible and Shantell Sans fonts               | Body, mono and Kopi's handwritten type, from Google Fonts                                                     | SIL Open Font License 1.1              |
| Playwright 1.64                                             | Films the pitch video's demo takes from a local production build                                              | Apache 2.0                             |
| Remotion 4.0.530                                            | Assembles and renders the pitch video's live-demo segment                                                     | Remotion License, free for individuals |
| ffmpeg 6.1                                                  | Encodes the demo footage and sets its loudness                                                                | LGPL 2.1 or later                      |
| Adobe Premiere Pro                                          | Edits the pitch video: the slides, the narration (slide parts at 1.2× with pitch kept) and the demo segment   | Adobe Creative Cloud subscription      |

## 3. APIs & cloud services

### 3.1. External APIs

| API and Provider               | Purpose in Project                                                                | Access Tier                                                     |
| ------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Claude API, Anthropic          | Matches job titles, explains verdicts, runs Ask Kopi and judges step proof        | Paid                                                            |
| Text to Speech API, ElevenLabs | Kopi's voice                                                                      | Paid                                                            |
| RunPod Serverless API, RunPod  | The two GPU batches: each job's skills and questions, then ten jobs' translations | Sponsor-provided credit                                         |
| Meta Model API, Meta           | The build-time batch that translated job titles, resource titles and explainers   | Paid credit; contributor tier, so Meta may train on the prompts |
| Google Fonts, Google           | Serves the app's fonts                                                            | Free                                                            |
| Live2D Cubism CDN, Live2D      | Serves the Cubism Core runtime for Kopi                                           | Free                                                            |

The data sources in section 4.2 are downloaded files, not live APIs: the app never calls them at runtime. API keys are not shown in this document.

### 3.2. Cloud platforms & deployment

| Service & Provider                | Purpose in Project                                                                                              | Plan / Region                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Replit Deployments, Replit        | Publishes the live demo from `main` on the team's own account                                                   | Replit Core (sponsor-provided)               |
| Cloudflare Workers, Cloudflare    | The mirror deployment: app, API, KV cache and a Durable Object for MCP and chat                                 | Workers Free; global, Durable Object in APAC |
| Neon Postgres, Neon               | The national view's sample rows, JobStreet listings, the admins' reviews and matched skills, and admin accounts | Free; `aws-ap-southeast-1`, Postgres 18      |
| RunPod Serverless, RunPod         | The vLLM GPU endpoint for the two build-time batches; 0 workers when idle                                       | Sponsor credit; one H100 80 GB GPU           |
| GitHub and GitHub Actions, GitHub | Code hosting, CI, deploys on every merge to `main` and the Saturday data refresh                                | Free                                         |

## 4. AI tools, models & datasets

### 4.1. AI models used in the solution

| Model & Version                                            | Source / Provider                                                | Usage       | License / Terms                       |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | ----------- | ------------------------------------- |
| Claude Haiku 5.5 (`claude-haiku-5-5`)                      | Anthropic, Claude API                                            | Pre-trained | Anthropic Commercial Terms of Service |
| ElevenLabs `eleven_v4` and `eleven_v4_turbo`, voice Johari | ElevenLabs                                                       | Pre-trained | ElevenLabs Terms of Service           |
| Qwen3.8-27B-FP8                                            | Qwen, run on RunPod with vLLM                                    | Pre-trained | Apache 2.0                            |
| Muse Spark 1.3 (`muse-spark-1.3-contributor`)              | Meta, Meta Model API                                             | Pre-trained | Meta Model API terms                  |
| GPT-5.6 Luna (`gpt-5.6-luna`)                              | OpenAI on Azure, through the hackathon's KrackedDevs LiteLLM key | Pre-trained | KrackedDevs hackathon key terms       |

No model is fine-tuned or self-trained. Qwen3.8-27B-FP8 ran twice before the demo, both times on RunPod: once to write the skills and questions of 923 jobs, and once to translate ten of those jobs into Malay and Simplified Chinese. Muse Spark 1.3 then translated all 923 job titles, the resource titles of about 375 jobs and the explainers of about 80, in 1,321 requests (about US$0.43), until Meta blocked the key after its content filter refused five prompts. None of these runs happens at run time. GPT-5.6 Luna matched the 2,030 SkillsFuture Singapore roles to O\*NET and linked their skills to the corners of 296 jobs, in 615 requests (about US$0.71); a validator kept every code inside O\*NET and inside each job's own matched roles.

### 4.2. Datasets

| Dataset Name                                                                   | Source / URL                                                                                                                                                                                                                                                                                                                                                               | Type                        | License                                                                            | Personal Data?  |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- | --------------- |
| O\*NET 30.1 Database                                                           | <https://www.onetcenter.org/database.html>                                                                                                                                                                                                                                                                                                                                 | Public                      | CC BY 4.0                                                                          | N               |
| Anthropic Economic Index, April and May 2026                                   | <https://huggingface.co/datasets/Anthropic/EconomicIndex>                                                                                                                                                                                                                                                                                                                  | Public                      | Data CC BY; code MIT                                                               | N               |
| DOSM Job Market Insights, Q3 2019 to Q2 2026                                   | <https://www.dosm.gov.my>                                                                                                                                                                                                                                                                                                                                                  | Public                      | DOSM terms, with source credit                                                     | N               |
| OpenDOSM skill-related underemployment by age                                  | <https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_age>                                                                                                                                                                                                                                                                                                                  | Public                      | CC BY 4.0; one figure cited                                                        | N               |
| UN SDG indicator 4.4.1, Malaysia                                               | <https://unstats.un.org/sdgapi/v1/sdg/Indicator/Data?indicator=4.4.1&areaCode=458>                                                                                                                                                                                                                                                                                         | Public                      | UN terms of use; one baseline cited                                                | N               |
| Kotak skills and questions for 923 jobs                                        | Built from O\*NET by the RunPod batch                                                                                                                                                                                                                                                                                                                                      | Synthetic, from public data | The team's own work                                                                | N               |
| Question explainers and reversed question wording                              | Drafted from the Kotak questions by Gemini (explainers) and DeepSeek (reversed wording); a script checked every line and the team spot-checked samples                                                                                                                                                                                                                     | Synthetic, from public data | The team's own work                                                                | N               |
| What-would-you-do questions for 902 jobs                                       | Written from the Kotak skills and O\*NET tasks by Claude Sonnet and GPT fast, checked by a script and reviewed in samples by Claude Sonnet, GPT coder and Gemini                                                                                                                                                                                                           | Synthetic, from public data | The team's own work                                                                | N               |
| CIP 2020 to SOC 2018 Crosswalk                                                 | <https://nces.ed.gov/ipeds/cipcode/resources.aspx?y=56>                                                                                                                                                                                                                                                                                                                    | Public                      | Public domain (US government work)                                                 | N               |
| Malaysian regulated professions                                                | Each row cites its Act on the Laws of Malaysia site, the regulator's site or, where neither opened, a legal database or news report                                                                                                                                                                                                                                        | Self-collected              | The team's own work; sources cited                                                 | N               |
| JobStreet job listings                                                         | Collected by the team's scraper from <https://my.jobstreet.com>, reviewed by admins                                                                                                                                                                                                                                                                                        | Self-collected              | JobStreet's terms apply; Kotak publishes totals only                               | N; job ads only |
| Malay and Simplified Chinese translations                                      | The app's own text, the SDG target text and the three demo jobs translated with Claude in the team's own sessions; ten more jobs' skills and questions by Qwen3.8-27B on RunPod, one skill by hand; every job title, about 375 jobs' resource titles and 80 jobs' explainers by Muse Spark 1.3, and six titles and 18 resource titles by hand; each checked by a validator | Synthetic, from public data | The team's own work                                                                | N               |
| SDG target tags and their reasons                                              | Each skill's SDG tags judged against the UN target text by Claude Haiku 5.5, then sampled and rechecked by Claude Sonnet 5.5, which also wrote the reasons; the run is in [the SDG retag review](/docs/sdg-retag-review.md)                                                                                                                                                | Synthetic, from public data | The team's own work                                                                | N               |
| ESCO to O*NET-SOC Crosswalk                                                    | <https://www.onetcenter.org/crosswalks/esco/>                                                                                                                                                                                                                                                                                                                              | Public                      | CC BY 4.0; the ESCO classification is the European Commission's                    | N               |
| SkillsFuture Singapore Skills Framework 2.0                                    | <https://jobsandskills.swda.gov.sg/frameworks/skills-frameworks>; matched to O\*NET and linked to Kotak's skills by GPT-5.6 Luna (#464)                                                                                                                                                                                                                                    | Public                      | SWDA terms of use; verbal approval from a SkillsFuture ambassador, 31 October 2026 | N               |
| Demo check-up profiles, and the 20 seeded test profiles behind the Phase 1 KPI | Written by the team; the seeded ones are in [data/test-profiles.json](/data/test-profiles.json)                                                                                                                                                                                                                                                                            | Synthetic                   | The team's own work                                                                | N               |

MyCOL and Epoch AI are cited as context only; Kotak loads no data from them. Approved JobStreet listings feed the check-up's job-title suggestions, the Job Ads in Malaysia card, the role cards' ad counts and pay, and Kopi's `job_market` tool. They feed no verdict, fit score or roadmap.

**What-would-you-do questions.** For 902 of the 923 jobs, the check-up shows a work situation with four options instead of a rating. Each option carries a hidden score from 1 to 4, so the level maths is unchanged. Claude Sonnet (through Antigravity and as native subagents) and GPT fast wrote 12 questions per job from the job's own skills and O\*NET tasks. A script checked every question: four options with scores 1 to 4 once each, option and situation length limits, no giveaway words, the best option not the longest in more than 4 of 12 questions, and task ids from the corner. Reviews by Claude Sonnet, GPT coder and Gemini covered the demo jobs and a sample of the rest, and the team hand-read the demo jobs. The reviewers were stricter than the team, so the file is marked auto-generated. Five jobs that failed the checker and the 16 jobs with fewer than 6 corners keep the rating statements. No AI decides a score at run time.

### 4.3. AI-assisted development tools

Yes, the team used generative-AI tools.

| Tool & Version                                                                                           | Used For                                                  | Extent of Use |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| Claude Code, with Claude models                                                                          | Code, reviews, research and documentation                 | Major         |
| Codex CLI, OpenCode, Antigravity CLI and headless Claude Code, with GPT, DeepSeek, GLM and Gemini models | Parallel code changes from written briefs                 | Moderate      |
| Claude, GPT and Gemini chat models                                                                       | The field simulation and design review in `docs/research` | Minor         |
| OpenAI Whisper, `whisper-1` API                                                                          | Word timings for the pitch video's cuts and captions      | Minor         |

How the team reviewed, tested and took responsibility for AI-generated output (100 words max):

Every change ran type-checks and a build in CI, and a team member reviewed it before it reached the main branch. The team checked each feature by running the app in a browser at phone and desktop widths, not by trusting the tool's report. Facts in the app and in these documents link a dated public source. AI-drafted skills carry a visible label in the app until a person reviews them. The team owns every merged line and corrected tool mistakes before merging.

## 5. Sponsor-provided resources

Yes, Kotak uses official SDC sponsor resources.

| Sponsor                   | Resource           | How It Was Used in the Project                                                                                                                                                                                                                                       |
| ------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replit                    | Platform, Core     | Hosts the live demo, published from `main` on the team's own account                                                                                                                                                                                                 |
| RunPod                    | Credits            | A serverless H100 ran two batches, about US$3.04 of credit in all: the skills and questions of 923 jobs (783 seconds, about US$1.25), then the Malay and Chinese translations of ten jobs (174 requests, 276,636 prompt and 82,652 completion tokens, about US$1.79) |
| SDC mentors (KrackedDevs) | Mentoring          | One mentor session on 23 October 2026                                                                                                                                                                                                                                |
| KrackedDevs               | LiteLLM API credit | Headless coding workers on DeepSeek V4.1 Flash drafted parts of the translation script and the translated screens, about US$1.39 of the team's credit                                                                                                                |

Was the sponsor resource essential to the core functionality, or could it be replaced? (100 words max)

RunPod was essential to build Kotak's data: it turned O\*NET's tasks into 6 skills and 18 questions for each of 923 jobs, which no person could write by the deadline, and it translated ten of them into Malay and Chinese. Both batches run once, so the live app does not depend on RunPod, and the Claude Message Batches API could replace it. Replit hosts the submitted live demo; the same build also runs on Cloudflare Workers, so the hosting is replaceable.

## 6. Security, privacy & responsible use

### 6.1. Data handling & privacy (150 words max)

Kotak follows the seven principles of Malaysia's Personal Data Protection Act 2010 (Act 709, sections 5 to 12) and holds no data that names a user (General, Data Integrity). There are no user accounts; the sign-in page says guest mode keeps the check-up on this device. The job, goals, profile and answers stay in the browser's `localStorage`, and Settings > Reset All deletes them (Notice and Choice, Retention, Access). The app sends a typed job title and a role's skill data to the Claude API, Ask Kopi's messages and check-up tool results to Claude, and Kopi's lines to ElevenLabs; the app adds no name, email or ID, and chats are never cached or logged (Disclosure). An uploaded proof file goes to Claude once to be judged and is never stored or logged; only the verdict stays in the browser. Keys stay in host secrets (Security). Postgres holds the national view as a role code, skill levels and a date, with real totals only for 10 or more check-ups; no screen sends them yet.

### 6.2. Known limitations & risks (150 words max)

- **Hallucination**: Claude only explains verdicts that fixed rules set. A check rejects any explanation that changes a verdict or lacks a dated citation, and a template replaces it.
- **Wrong job match**: the user confirms every AI title match.
- **Unreviewed skills and translations**: an open model drafted each job's skills and the Malay and Chinese text. Validators reject tasks from other jobs and translations that drop a term, and the app labels AI-drafted skills and partly English jobs.
- **Thin trend data**: the Economic Index has two monthly points, so 12-month projections are rough. Every target is labelled an estimate, and thin data shows Unknown.
- **Data bias**: O\*NET describes US jobs, and DOSM counts only online job ads.
- **Single providers and rate limits**: cached answers, templates and text cover Claude or ElevenLabs outages and HTTP 429 or 529 errors. A limit of 30 Claude calls a minute protects the key.
- **Proof judge**: it fails closed on any error and cannot confirm the certificate is the user's own, so the team says so in the Q&A.

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

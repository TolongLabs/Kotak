<a id="readme-top"></a>

<!-- PROJECT LOGO -->

<br />
<div align="center">
  <a href="https://github.com/TolongLabs/Kotak">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="/docs/readme/banner-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="/docs/readme/banner-light.png">
      <img src="/docs/readme/banner-light.png" alt="Kotak banner">
    </picture>
  </a>

  <h3>Kotak</h3>

  <p>
    Kotak shows a Malaysian worker which of their skills are rising or declining with AI, and gives them a dated, cited plan for what to learn next.
    <br />
    <a href="https://kotak-alaskxntxna.replit.app"><strong>Live Demo &rarr;</strong></a>
    &middot;
    <a href="#">Demo Video</a>
    &middot;
    <a href="/docs/demo/deck/kotak-pitch-deck.pptx">Slide Deck</a>
    &middot;
    <a href="https://github.com/TolongLabs/Kotak/issues/new?labels=bug">Report a Bug</a>
    <br />
  </p>

[![TypeScript][typescript-badge]][typescript-url]
[![Bun][bun-badge]][bun-url]
[![React][react-badge]][react-url]
[![Vite][vite-badge]][vite-url]
[![Tailwind CSS][tailwindcss-badge]][tailwindcss-url]
[![Hono][hono-badge]][hono-url]
[![Zod][zod-badge]][zod-url]
[![Claude][claude-badge]][claude-url]
[![Model Context Protocol][modelcontextprotocol-badge]][modelcontextprotocol-url]
[![ElevenLabs][elevenlabs-badge]][elevenlabs-url]
[![Neon][neon-badge]][neon-url]
[![RunPod][runpod-badge]][runpod-url]
[![Replit][replit-badge]][replit-url]
[![Cloudflare Workers][cloudflareworkers-badge]][cloudflareworkers-url]

</div>

<!-- TABLE OF CONTENTS -->

## Table of Contents

<details>
  <summary>Expand</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#screenshots">Screenshots</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#architecture">Architecture</a></li>
        <li><a href="#project-structure">Project Structure</a></li>
        <li><a href="#tech-stack">Tech Stack</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#run-tests">Run Tests</a></li>
      </ul>
    </li>
    <li><a href="#how-we-use-replit">How We Use Replit</a></li>
    <li><a href="#how-we-use-runpod">How We Use RunPod</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#team">Team</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

AI is changing Malaysian jobs faster than training can keep up: 56% of Malaysian professionals use AI tools at work, but only 26% have had formal training (Hays Asia Salary Guide 2025). Workers who wonder what AI means for their job get static skills lists with no dates, no scores and no plan. Without dated evidence, they cannot tell which skills to learn first, and may spend scarce hours on tasks AI is taking over.

Kotak, Malay for box, opens the box on a job. Kopi, a cat counsellor, first asks where the user is now, what they studied and what they want. Someone with no job yet, or no role in mind, gets roles to check first, from their study and what they enjoy. Kopi then asks 12 can-do questions about their job or the role they want, each rated from 1 (Not yet) to 4 (Yes, on my own). Kotak then draws a Future Skills Radar of the job's 6 core skills, ranks matched roles and builds a dated roadmap, in about 3 minutes. Fixed rules over dated public data set every verdict, score and step, so every number cites its source. AI does the language work around those rules: a RunPod GPU batch built each job's skills and questions from its own O\*NET tasks, Claude explains verdicts and matches Malay job titles, and ElevenLabs gives Kopi a voice.

Built for [SDC Hackathon 2026](https://sdchack.my/), Domain 1: Aiversecity Future-Ready Workforce, on SDG 4 (target 4.4), by team T010NG: five students from APU, the University of Reading and the University of Sheffield, led by Hee Zi Jie.

Submission documents: the [proposal](/submission/SDC2026_T010NG_Preliminary.pdf), the [technical declaration](/submission/SDC2026_T010NG_TechDeclaration.pdf) and the [slide deck](/docs/demo/deck/kotak-pitch-deck.pptx), also as a [PDF](/docs/demo/deck/kotak-pitch-deck.pdf). The [technical requirements](/docs/TRD.md), the [data card](/docs/data-card.md), the [algorithm card](/docs/algorithm-card.md) and the [decision log](/docs/DECISIONS.md) explain how it works.

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Screenshots

<table>
  <tr>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/landing.png" alt="Landing" width="100%">
      <br />
      <strong>Landing</strong> · Open the box on your job: a radar, a verdict and its dated source on the first screen.
    </td>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/home.png" alt="Home" width="100%">
      <br />
      <strong>Home</strong> · The next step, the fit for the job, this week's hours, what changed in May and the skills SWOT.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/interests.png" alt="What Do You Enjoy?" width="100%">
      <br />
      <strong>What Do You Enjoy?</strong> · Not sure yet? Pick at least 3 activities, and Kopi matches them to the interests O*NET records for each job.
    </td>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/choose.png" alt="Roles to Check" width="100%">
      <br />
      <strong>Roles to Check</strong> · Roles from your study, your areas and what you enjoy, each saying why it's there. The 12 questions test the one you pick.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/qualification.png" alt="Qualification Needed" width="100%">
      <br />
      <strong>Qualification Needed</strong> · A role Malaysian law restricts shows the route in and its regulator beside your fit, so you can weigh whether the degree is worth it.
    </td>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/tools.png" alt="Tools Employers Name" width="100%">
      <br />
      <strong>Tools Employers Name</strong> · The software in demand in job postings for the role, from O*NET, beside the radar and again on the roadmap.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/changes.png" alt="What Changed" width="100%">
      <br />
      <strong>What Changed</strong> · The Before/After switch shows which verdicts moved when May's Economic Index data arrived.
    </td>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/gaps.png" alt="Gaps" width="100%">
      <br />
      <strong>Gaps</strong> · Each gap explains its verdict and cites the dated Economic Index rows behind it.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/connect.png" alt="Connect Your AI" width="100%">
      <br />
      <strong>Connect Your AI</strong> · The MCP URL and setup for Claude, Claude Code, VS Code and Cursor, plus the check-up skill.
    </td>
    <td width="50%" valign="top" align="left">
      <img src="/docs/readme/screenshots/radar-dark.png" alt="Radar in dark mode" width="100%">
      <br />
      <strong>Dark Mode</strong> · The same radar and SWOT in the dark theme.
    </td>
  </tr>
</table>

<p align="right"><a href="#readme-top">&uarr;</a></p>

### How It Works

A check-up for a web developer with a computer science degree who wants to see where they could go in AI, data and cloud, as the screenshots show it.

1.  **Tell Kopi about you.** Say where you are now (working, studying, graduated and looking, between jobs or returning to work), your highest qualification, your field of study and your years of work.

    <img src="/docs/readme/steps/1-start.png" alt="Start: your situation, study and experience" width="100%">

    Then type your job title in any language, and Kopi matches it to one of 900 O\*NET job profiles. Pick a goal: stay strong in your job, move to up to 3 roles you have in mind, see where you could go in up to 3 areas, or say you're not sure. With no job or no role in mind, Kopi suggests roles to check first, and the questions test the one you pick.

    <img src="/docs/readme/steps/1-goal.png" alt="Start: your work, your goal and the areas to explore" width="100%">

2.  **Answer 12 can-do questions.** Rate each from 1 (Not yet) to 4 (Yes, on my own), with a click or the number keys. Each question tests one of the job's 6 core skills, drafted from the job's own O\*NET tasks.

    <img src="/docs/readme/steps/2-questions.png" alt="Questions" width="100%">

3.  **Read your Future Skills Radar.** Each skill shows your level against the level needed by May 2027, its verdict and its dated sources. The SWOT sorts the skills into strengths, weaknesses, roles within reach and tasks AI can draft. A role Malaysian law restricts, such as law or medicine, also shows the qualification it needs and the route in, beside your fit.

    <img src="/docs/readme/steps/3-radar.png" alt="Radar" width="100%">

4.  **Compare roles.** Up to 6 roles from your targets, your areas, your field of study and O\*NET's related roles, each saying why it's there, with its fit, the maths behind the score, the outlook from DOSM job ads and AI use, and the skills still missing. Kopi highlights your best fit of the Rising roles and says why on the card; pick any card to switch.

    <img src="/docs/readme/steps/4-roles.png" alt="Roles" width="100%">

5.  **Follow your roadmap.** The next 12 weeks of ordered steps for the role you picked, here Data Scientists, each with its hours, one free resource and its SDG targets, plus the software employers name for the role. The week you pass 80% fit moves with your weekly hours, and the plan exports as a PDF.

    <img src="/docs/readme/steps/5-roadmap.png" alt="Roadmap" width="100%">

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Features

- **Skills profile intake** — where you are now, your study and experience, a job title in any language, a goal (stay strong, move to up to 3 roles, explore by area, or not sure) and 12 can-do questions. Without a job or a role in mind, Kotak suggests roles first, and a profession Malaysian law restricts, such as law or medicine, shows the qualification it needs beside the user's fit, to help them decide whether to pursue it.
- **AI-trend signal layer** — dated Anthropic Economic Index snapshots for Malaysia (April and May 2026) and DOSM Job Market Insights, refreshed weekly. A Before/After switch shows what changed when May's data arrived.
- **Future-role matching** — up to 6 roles from the user's targets, areas, field of study and O\*NET's related list, each with a fit score, the maths behind it, the named gaps and why it's there.
- **Malaysian job ads** — for each role, the JobStreet ads Kotak's admins reviewed: active ads, advertised pay in ringgit, where the jobs are, and the tools, languages and AI skills employers ask for. Shown beside the verdicts, which it never sets.
- **Reskilling pathway** — an interactive roadmap with ordered steps, hours, one free resource per step and a finish date that moves with the user's weekly hours.
- **SDG mapping** — every skill carries SDG targets, every job shows the goals its work serves, and the roadmap highlights steps by goal.
- **Handling uncertainty** — every target is labelled an estimate, Split shows slow and fast AI-uptake futures, and Unknown marks thin data.
- **Ask Kopi and MCP** — a chat agent answers through 8 read-only tools over the same rules, and other assistants can use the same tools at `/api/mcp`.

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/docs/readme/architecture-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="/docs/readme/architecture-light.svg">
  <img src="/docs/readme/architecture-light.svg" alt="Kotak architecture">
</picture>

The rules run in the browser. `@kotak/sdk` computes every verdict, score and roadmap step with the [rules](/packages/shared/src/rules/) over a static bundle of dated snapshots, so a check-up needs no server. The Hono API does the language work: Claude matches titles and writes explanations, which a [verifier](/apps/api/src/ai/verifier.ts) checks against the rules' verdict and sources, ElevenLabs speaks Kopi's lines, and Neon Postgres holds the national view, the JobStreet scraper's runs and the reviewed job ads behind the job-ad market. MCP clients reach the same tools at `/api/mcp`. Before deploy, Bun scripts build the bundle from public data, and a RunPod GPU batch drafted each job's skills once. The [PRD](/docs/PRD.md) and the [technical design](/docs/TRD.md) explain each part.

Made with [Archify](https://github.com/tt-a1i/archify) from [`architecture.json`](/docs/readme/architecture.json).

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Project Structure

```text
.
├── apps/
│   ├── api/            # Hono API: title match, explanations, voice, Ask Kopi and MCP
│   └── web/            # React app, served with the static data bundle
├── packages/
│   ├── shared/         # Rules, verdicts, roadmap and Zod schemas
│   ├── sdk/            # Check-up engine shared by the app and the MCP tools
│   ├── agent/          # Ask Kopi's tools and the MCP server
│   └── browser/        # Browser for the JobStreet research scraper
├── plugins/kotak/      # Claude Code plugin with the check-up skill
├── scripts/
│   ├── ingest/         # O*NET, Economic Index and DOSM ingestion
│   ├── corners/        # RunPod batch that drafts each job's skills and questions
│   └── refresh/        # Weekly check for new data snapshots
├── data/
│   ├── onet/           # O*NET 30.1 occupations, tasks and work activities
│   ├── snapshots/      # Dated Economic Index and DOSM snapshots
│   └── generated/      # Each job's AI-drafted skills and questions
├── runpod/             # RunPod endpoint settings and example requests
├── docs/               # PRD, technical design, declaration, research and README images
├── submission/         # Submission template and the Replit and RunPod proofs of use
├── .env.example        # Environment variables
├── .replit             # Replit run configuration
├── wrangler.jsonc      # Cloudflare Workers configuration
├── LICENSE             # Apache License 2.0
├── NOTICE.md           # Third-party credits
└── README.md
```

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Tech Stack

- **Frontend:** TypeScript, [React](https://react.dev/) 19, [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/), [Recharts](https://recharts.org/) and [Live2D](https://www.live2d.com/) for Kopi.
- **Backend:** [Bun](https://bun.sh/), [Hono](https://hono.dev/) and [Zod](https://zod.dev/). The rule engine runs in the browser through `@kotak/sdk`.
- **Database:** [Neon](https://neon.com/) Postgres 18.
- **AI / Compute:** [RunPod](https://www.runpod.io/) serverless GPU (Qwen3.8-27B on vLLM), [Claude](https://www.anthropic.com/claude) Haiku 5.5 and [ElevenLabs](https://elevenlabs.io/).
- **Hosting / Dev:** [Replit](https://replit.com/), [Cloudflare Workers](https://workers.cloudflare.com/) and GitHub Actions.

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- GETTING STARTED -->

## Getting Started

No setup is needed to try Kotak: open the [live demo](https://kotak-alaskxntxna.replit.app), or its [Cloudflare mirror](https://kotak.tp073654.workers.dev). To run your own copy, use Replit or run it locally.

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Prerequisites

- [Bun](https://bun.sh) 1.3 or later, for a local run.
- Optional keys, listed in [`.env.example`](/.env.example):
  - `ANTHROPIC_API_KEY` for job-title matching, explanations and Ask Kopi
  - `ELEVENLABS_API_KEY` for Kopi's voice

The app runs without keys too: explanations fall back to fixed templates, and Kopi's lines show as text.

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Installation

#### Option 1 — Run on Replit (Recommended)

1. Open the [Replit Project](https://replit.com/@alaskxntxna/Kotak), or import this repository via **Create Repl → Import from GitHub**.
2. Open the **Secrets** tab (🔒) and add the variables listed in `.env.example`.
3. Click **Run**. Replit uses the `.replit` file to install, build and start the server on port 5000.

#### Option 2 — Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/TolongLabs/Kotak.git
cd Kotak

# 2. Install dependencies
bun install

# 3. Configure environment variables
cp .env.example .env            # then fill in your values

# 4. Build the data snapshots and the web app
bun run build

# 5. Start the server, then open http://localhost:8787
bun run start
```

<p align="right"><a href="#readme-top">&uarr;</a></p>

### Run Tests

```bash
bun run typecheck
bun test
```

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- REQUIRED BY THE ORGANISER -->

## How We Use Replit

- **Hosting:** Replit publishes Kotak from the `main` branch on the team's own account, at the Live Demo link above.
- **Run configuration:** `.replit` installs with Bun, builds the data and the app, and starts the Hono server on port 5000.
- **Secrets:** API keys and the Neon `DATABASE_URL` are stored in Replit Secrets, never in the code. The admin page at `/admin/sign-in` needs `DATABASE_URL`, and the published app needs it in its deployment secrets too.

📄 Proof of use: [`submission/REPLIT PROOF OF USE.pdf`](/submission/REPLIT%20PROOF%20OF%20USE.pdf)

<p align="right"><a href="#readme-top">&uarr;</a></p>

## How We Use RunPod

- **Workload:** a RunPod serverless GPU ran `Qwen/Qwen3.8-27B-FP8` on vLLM once, before the demo, to group each O\*NET job's own tasks into 6 skills and draft 18 can-do statements for each of 923 jobs. A JSON schema constrains every answer, and a validator rejects any task from another job.
- **Setup:** the stock RunPod vLLM worker, `runpod/worker-v1-vllm:v2.28.0`, on one H100 80 GB GPU, as endpoint `5yjk19uqmrpbp7`, now idle at 0 workers. [`runpod/README.md`](/runpod/README.md) has the endpoint settings.
- **Integration:** [`scripts/corners/run-batch.ts`](/scripts/corners/run-batch.ts) sends the requests with `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID`, and writes the results into the data snapshots that the app ships. The full run took 783 seconds and cost about US$1.25.

Example request:

```bash
curl https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/openai/v1/chat/completions \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3.8-27B-FP8",
    "messages": [{"role": "user", "content": "Name one skill of a graphic designer as JSON."}],
    "temperature": 0,
    "max_tokens": 50,
    "chat_template_kwargs": {"enable_thinking": false},
    "response_format": {"type": "json_schema", "json_schema": {"name": "skill", "schema": {
      "type": "object", "properties": {"skill": {"type": "string"}},
      "required": ["skill"], "additionalProperties": false}}}
  }'
```

📄 Proof of use: [`submission/RUNPOD PROOF OF USE.pdf`](/submission/RUNPOD%20PROOF%20OF%20USE.pdf)

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- ROADMAP -->

## Roadmap

See [open issues](https://github.com/TolongLabs/Kotak/issues) for a full list of proposed features (and known issues).

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- CONTRIBUTING -->

## Team

<a href="https://github.com/TolongLabs/Kotak/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=TolongLabs/Kotak" alt="Kotak team" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- LICENSE -->

## License

See [LICENSE](/LICENSE) for more information.

Third-party data, models, assets and libraries keep their own licences, listed in [NOTICE.md](/NOTICE.md).

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [SDC Hackathon 2026](https://sdchack.my/) — organised by the XMUM AI Club with the XMUM Rotaract Club. Domain 1 is sponsored by Aiversecity, and Replit and RunPod provided credits.
- [O\*NET 30.1](https://www.onetcenter.org/database.html) — the jobs, tasks and work activities, by USDOL/ETA under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex) — the AI-use trend for Malaysia.
- [DOSM Job Market Insights](https://www.dosm.gov.my/) — the job-ad demand signal, from the Department of Statistics Malaysia.
- [Live2D](https://www.live2d.com/) — the Hijiki sample model that became Kopi.
- [NOTICE.md](/NOTICE.md) — every dataset, model, asset and library Kotak uses, with its licence.
- [Archify](https://github.com/tt-a1i/archify)
- [contrib.rocks](https://contrib.rocks)
- [Shields.io](https://shields.io)

<p align="right"><a href="#readme-top">&uarr;</a></p>

<!-- MARKDOWN LINKS & IMAGES -->

[typescript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[bun-badge]: https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white
[bun-url]: https://bun.sh/
[react-badge]: https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black
[react-url]: https://react.dev/
[vite-badge]: https://img.shields.io/badge/Vite-9135FF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vite.dev/
[tailwindcss-badge]: https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[tailwindcss-url]: https://tailwindcss.com/
[hono-badge]: https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white
[hono-url]: https://hono.dev/
[zod-badge]: https://img.shields.io/badge/Zod-408AFF?style=for-the-badge&logo=zod&logoColor=white
[zod-url]: https://zod.dev/
[claude-badge]: https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=claude&logoColor=white
[claude-url]: https://www.anthropic.com/claude
[modelcontextprotocol-badge]: https://img.shields.io/badge/Model_Context_Protocol-000000?style=for-the-badge&logo=modelcontextprotocol&logoColor=white
[modelcontextprotocol-url]: https://modelcontextprotocol.io/
[elevenlabs-badge]: https://img.shields.io/badge/ElevenLabs-000000?style=for-the-badge&logo=elevenlabs&logoColor=white
[elevenlabs-url]: https://elevenlabs.io/
[neon-badge]: https://img.shields.io/badge/Neon-34D59A?style=for-the-badge&logo=neon&logoColor=black
[neon-url]: https://neon.com/
[runpod-badge]: https://img.shields.io/badge/RunPod-673AB7?style=for-the-badge
[runpod-url]: https://www.runpod.io/
[replit-badge]: https://img.shields.io/badge/Replit-F26207?style=for-the-badge&logo=replit&logoColor=white
[replit-url]: https://replit.com/
[cloudflareworkers-badge]: https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white
[cloudflareworkers-url]: https://workers.cloudflare.com/

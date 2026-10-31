# Notices

Kotak, copyright 2026 TolongLabs.

Kotak is licensed under the [Apache License 2.0](LICENSE). It uses the third-party data, models, assets and code below, each under its own licence. The [technical declaration](docs/tech-declaration.md) lists every tool and service in full.

Contents:

1.  [Data](#data)
1.  [Models and services](#models-and-services)
1.  [Kopi's model and fonts](#kopis-model-and-fonts)
1.  [Code](#code)

## Data

- **O\*NET 30.1 Database**: This product includes information from the O\*NET 30.1 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license. O\*NET® is a trademark of USDOL/ETA. T010NG has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.
- **Anthropic Economic Index**: data released under CC BY, code under the MIT License, by Anthropic ([dataset](https://huggingface.co/datasets/Anthropic/EconomicIndex)).
- **DOSM Job Market Insights**: Data source: Department of Statistics Malaysia, used under [DOSM's Terms of Use](https://www.dosm.gov.my/portal-main/article/term-of-use).
- **OpenDOSM**: skill-related underemployment by age, under [CC BY 4.0](https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_age). Kotak cites one figure.
- **UN SDG indicators**: indicator 4.4.1 for Malaysia, from the [UN SDG API](https://unstats.un.org/sdgapi/). Kotak cites one baseline.
- **CIP 2020 to SOC 2018 Crosswalk**: from the U.S. Department of Education, Institute of Education Sciences, National Center for Education Statistics, with the U.S. Bureau of Labor Statistics. A US government work in the public domain. Kotak uses it to link fields of study to occupations.
- **Malaysian regulated professions**: the team's table of professions Malaysian law restricts. Each row cites the pages it rests on: the Act on the Attorney General's Laws of Malaysia site where it could be opened, the regulator's own site, and otherwise a legal database or news report. It is a pointer, not legal advice.
- **JobStreet job ads**: Kotak shows totals from JobStreet Malaysia ads it collected and an admin reviewed: ad counts, advertised pay quartiles overall and by the level of experience an ad asks for, states, work types, and the shares of ads that mention each skill or name each benefit, each cited with its date. It also shows JobStreet's own count of ads for a search, with an estimate of how many of them match a role. It republishes no ad text, job titles or employer names.
- **SkillsFuture Singapore Skills Framework**: Source: SkillsFuture Singapore Skills Framework v2.0, published by the Singapore Workforce Development Agency (SWDA). Used under SWDA's [terms of use](https://jobsandskills.swda.gov.sg/terms-of-use), with verbal approval from a SkillsFuture ambassador on 31 October 2026. Kotak shows its role and skill names and levels beside its own skills; an AI matched them and no person has checked the matches.
- **ESCO to O\*NET-SOC Crosswalk**: from the O\*NET Resource Center, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This service uses the ESCO classification of the European Commission. Kotak uses it to reach ISCO-08 groups.
- **Cited figures**: TalentCorp, MOHE, Hays, the World Bank and ISIS Malaysia figures appear as dated citations only, and TalentCorp MyCOL and Epoch AI are named as context. Kotak does not redistribute their files.

## Models and services

- **Qwen3.8-27B-FP8** by Qwen, under the Apache License 2.0, run on RunPod twice before the demo: once to draft each job's skills and questions, once to translate ten of those jobs into Malay and Simplified Chinese.
- **Claude Haiku 5.5** through the Claude API, under Anthropic's Commercial Terms of Service. Claude Haiku 5.5 and Claude Sonnet 5.5 also tagged each skill's SDG targets and wrote their reasons before the demo.
- **ElevenLabs text to speech**, including the voice Johari, under the ElevenLabs Terms of Service.

## Kopi's model and fonts

- **Live2D Hijiki sample model** (`apps/web/public/kopi/live2d/hijiki/`): © Live2D Inc., used under the [Live2D Free Material License Agreement](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html). The model files stay subject to that agreement, including its limits on redistribution.
- **Live2D Cubism Core for Web**: © Live2D Inc., loaded from Live2D's CDN under the [Live2D Proprietary Software License Agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html). It is not stored in this repository.
- **Fonts**: Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono and Shantell Sans, served by Google Fonts under the [SIL Open Font License 1.1](https://openfontlicense.org/).

## Code

Kotak depends on open-source packages under MIT, ISC, BSD-3-Clause, Zlib and Apache 2.0 licences, including Bun, TypeScript, React, Vite, Tailwind CSS, Recharts, Lucide, pixi.js, pixi-live2d-display, three, @react-three/fiber, postprocessing, Hono, Zod, the Anthropic TypeScript SDK, the MCP server SDK, the Neon serverless driver, Wrangler, Playwright, Clearcote, fflate and PGlite. Each package's licence ships with it in `node_modules`, and `bun.lock` pins every version.

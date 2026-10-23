# Notices

Kotak, copyright 2026 TolongLabs.

Kotak is licensed under the [Apache License 2.0](LICENSE). It uses the third-party data, models, assets and code below, each under its own licence. The [technical declaration](docs/TECH-DECLARATION.md) lists every tool and service in full.

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
- **Cited figures**: TalentCorp, MOHE, the World Bank, JobStreet and MyCOL figures appear as dated citations only. Kotak does not redistribute their files.

## Models and services

- **Qwen3.8-27B-FP8** by Qwen, under the Apache License 2.0, run once on RunPod to draft each job's skills and questions.
- **Claude Haiku 5.5** through the Claude API, under Anthropic's Commercial Terms of Service.
- **ElevenLabs text to speech**, including the voice Johari, under the ElevenLabs Terms of Service.

## Kopi's model and fonts

- **Live2D Hijiki sample model** (`apps/web/public/kopi/live2d/hijiki/`): © Live2D Inc., used under the [Live2D Free Material License Agreement](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html). The model files stay subject to that agreement, including its limits on redistribution.
- **Live2D Cubism Core for Web**: © Live2D Inc., loaded from Live2D's CDN under the [Live2D Proprietary Software License Agreement](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html). It is not stored in this repository.
- **Fonts**: Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono and Shantell Sans, served by Google Fonts under the [SIL Open Font License 1.1](https://openfontlicense.org/).

## Code

Kotak depends on open-source packages under MIT, ISC, BSD-3-Clause and Apache 2.0 licences, including Bun, TypeScript, React, Vite, Tailwind CSS, Recharts, Lucide, pixi.js, pixi-live2d-display, Hono, Zod, the Anthropic TypeScript SDK, the MCP server SDK, the Neon serverless driver, Wrangler, Playwright and Clearcote. Each package's licence ships with it in `node_modules`, and `bun.lock` pins every version.

# Data card

Every dataset Kotak loads, cites or makes, with its vintage, coverage, licence and gaps. Counts come from the committed files in `data/`. The [algorithm card](algorithm-card.md) says what the rules do with them, and the [TRD's data sources](TRD.md#data-sources) give the full detail (#93).

Contents:

1.  [Summary](#summary)
1.  [Loaded datasets](#loaded-datasets)
1.  [Made by the team](#made-by-the-team)
1.  [Live data](#live-data)
1.  [Cited, not loaded](#cited-not-loaded)
1.  [Samples](#samples)
1.  [Known gaps](#known-gaps)
1.  [Attribution](#attribution)

## Summary

- **Snapshot**: the verdicts, fit scores and roadmaps come only from dated files committed to `data/` and built into static JSON by `bun run build:data`. The build fails if a number has no source URL or date.
- **Live**: the national view's totals and the job-ad market are read from Neon Postgres at request time. Neither sets a verdict.
- **Sample**: the national view shows labelled sample rows until a group has 10 real check-ups, and no screen posts check-ups. The demo profiles are written by the team.
- **Personal data**: none. Kotak asks for no name, email or CV, and the national view's table takes only a role code, corner levels and a date.

## Loaded datasets

| Dataset                               | File                                                                                   | Vintage                                                                                     | What's in the file                                                                                                                               | Licence              |
| ------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| O\*NET 30.1                           | `data/onet/occupations.json`, `tasks.json`, `title-index.json`, `work-activities.json` | December 2025                                                                               | 923 occupations with their tasks; 52,606 title-index entries; 37 general, 332 intermediate and 2,087 detailed work activities                    | CC BY 4.0            |
| O\*NET 30.1 preparation and interests | `data/pathways/onet-preparation.json`                                                  | December 2025, retrieved 23 October 2026                                                    | Job Zones; education, training and experience; RIASEC interest scores, for 923 occupations                                                       | CC BY 4.0            |
| O\*NET 30.3 Hot Technologies          | `data/onet/hot-technologies.json`                                                      | May 2026                                                                                    | Software named in job postings, for 904 occupations; the radar and roadmap show the In Demand ones, or the first 12 when none is                 | CC BY 4.0            |
| O\*NET 31.0 Emerging Tasks            | `data/onet/emerging-tasks.json`                                                        | August 2026                                                                                 | New tasks for 245 occupations. No screen reads them yet                                                                                          | CC BY 4.0            |
| Anthropic Economic Index              | `data/snapshots/aei/2026-04.json`, `2026-05.json`                                      | Release 2026-06-26, months April and May 2026, retrieved 22 October 2026 (SHA-256 recorded) | AI usage shares by task, work activity, occupation and major group, for Malaysia, Singapore and the world; the automation and augmentation split | Data CC BY; code MIT |
| DOSM Job Market Insights              | `data/snapshots/dosm-jmi.json`                                                         | Q3 2019 to Q2 2026, 20 releases, retrieved 22 October 2026                                  | Online job offerings by quarter, by 10 major occupation groups, and the top named roles                                                          | DOSM Terms of Use    |
| NCES CIP 2020 to SOC 2018 crosswalk   | `data/pathways/cip-soc.json`                                                           | 30 April 2020, retrieved 23 October 2026                                                    | 5,723 links from US programmes of study to occupations                                                                                           | Public domain        |
| ESCO to O\*NET-SOC 2019 crosswalk     | In `data/onet/occupations.json` (`isco08`)                                             | Retrieved 22 October 2026                                                                   | ISCO-08 groups for 922 of the 923 occupations, which pick the DOSM major-group series for a role                                                 | CC BY 4.0            |

Where Malaysian Economic Index rows are missing or suppressed, the engine borrows from the layer above or from the global rows and labels the borrowed value. A suppressed cell is stored as `null`, never `0`.

## Made by the team

| Dataset                         | File                                       | How it was made                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skill corners and questions     | `data/generated/role-corners.json`         | One RunPod batch on 22 October 2026 with Qwen3.8-27B-FP8 grouped each job's own O\*NET tasks into skill corners and drafted the can-do statements. 923 jobs: 907 with 6 corners, 16 with fewer. 97.9% of candidate task links assigned. A validator rejected any task from another job. All 923 are labelled "auto-generated"; the hand review of the demo roles is #104 |
| Fields of study                 | `data/pathways/fields-of-study.json`       | 55 Malaysian fields of study, plus Other, each mapped by hand to CIP 2020 code prefixes                                                                                                                                                                                                                                                                                  |
| Interest areas                  | `data/pathways/career-areas.json`          | 22 areas: 5 hand-picked digital areas and 17 by SOC major group                                                                                                                                                                                                                                                                                                          |
| Malaysian regulated professions | `data/pathways/regulated-professions.json` | 42 professions over 132 O\*NET codes, accessed 23 October 2026. Each row cites its Act on the Laws of Malaysia site, the regulator's site or, where neither opened, a legal database or news report. A pointer, not legal advice                                                                                                                                         |
| MASCO 2020 codes                | In `data/onet/occupations.json`            | 4-digit codes for 25 of the 923 occupations, attached by hand where the title and code align; the other 898 carry `masco_unmatched: true` and reach DOSM through ISCO-08                                                                                                                                                                                                 |
| Demo roles                      | `data/demo-roles.json`                     | 3 roles whose May 2026 data flips at least one verdict. The build fails if one stops flipping                                                                                                                                                                                                                                                                            |
| SDG target reasons              | `data/sdg-reasons.json`                    | 58 SDG targets: 40 from skill tags, 18 from the radar's job chips. Each has its UN text, from the UN SDG API on 29 October 2026, and a one-line reason. Claude drafted the reasons for #391 and an AI review checked them; no person has, so they're labelled auto-generated ([review](sdg-reasons-review.md)). The build fails if a shown target has no reason          |

## Live data

- **National view** (`national_checkups` on Neon): `POST /api/national-view/checkups` stores a role code, 1 to 6 corner levels and a date, but no screen calls it, so the table holds the labelled sample rows. The summary, from `GET /api/national-view/summary` and the `national_skill_gaps` tool in Ask Kopi and MCP clients, shows real averages only for a role with 10 or more real check-ups. The app has had no National View screen since #167.
- **JobStreet Malaysia job ads**: the team's scraper collects JobStreet search results nightly from 22 October 2026, and an admin approves each ad under one O\*NET occupation. Only approved ads count. Kotak shows ad counts, advertised pay quartiles overall and by the level of experience an ad asks for, states, work types, and the shares of ads that mention each skill or name each benefit, each with its date. It also shows JobStreet's own count of ads for a search and an estimate of how many match the role, and never an ad's text, title or employer. The figures sit beside the verdicts and set none; #275 tracks a demand rule once there are enough weeks.

## Cited, not loaded

These appear as dated citations only. Kotak stores none of their data.

- **OpenDOSM** `lfs_qtr_sru_age`: two Q2 2026 figures on skill-related underemployment of tertiary-educated workers, 35.2% overall (in the PRD and the proposal) and 74.3% of 15 to 24-year-olds (on the landing page) (CC BY 4.0).
- **UN SDG API**: Malaysia's indicator 4.4.1 baseline.
- **MOHE Graduate Tracer Study 2025** and the **JobStreet Hiring Report 2025**: one figure each on the landing page.
- **TalentCorp MyCOL** and **Epoch AI**: listed as context only.
- **Hays, TalentCorp, the World Bank and ISIS Malaysia**: national figures in the pitch deck, each with its source.

DOSM Quarterly Employment Statistics, the other OpenDOSM series and the GitHub Innovation Graph were planned and are not loaded. The [TRD lists each with its issue](TRD.md#dropped-and-not-loaded).

## Samples

- **National view seed rows**: at least 10 labelled rows per occupation group, re-seeded on each deploy with `is_sample = true`. They never count toward a group's 10 real check-ups. The summary marks a seed-backed role `is_sample: true`, and the `national_skill_gaps` tool labels its count "sample rows, not real check-ups".
- **Demo profiles**: the persona in the pitch and the demo video are written by the team and labelled as samples. They are not user research.

## Known gaps

- **No Malaysian skill-level demand series exists.** Each corner takes its role's demand direction, so corners differ through their AI data, not their demand.
- **The Economic Index measures Claude usage, not jobs.** Kotak calls it an AI usage signal. It hides small cells, so many Malaysian occupations borrow from a higher layer, labelled.
- **Two monthly points** drive each 12-month projection, so every projection is labelled an estimate. Fewer than two points gives Unknown.
- **O\*NET is a US taxonomy.** Malaysian titles reach it through title matching, which the user confirms, and the MASCO match is partial.
- **No sector layer.** Layer 1 of the hierarchy has no loaded source, and the engine says so.
- **US norms.** Job Zones, education and experience come from US workers, and the app labels them so. The CIP to SOC crosswalk links US programmes to occupations; NCES says it "is not a record of the occupational outcomes of postsecondary instructional program completers", so the app says a field "leads here".
- **Regulated professions** change. The table was checked on 23 October 2026, and the app tells users to confirm with the regulator.
- **JobStreet** covers one job board from 22 October 2026 only. A missing scrape is not zero demand.
- **The batch is unreviewed.** Every role's corners are "auto-generated" until a person checks them, and the app shows the label.

## Attribution

The credit lines, as the data files and [`NOTICE.md`](/NOTICE.md) carry them:

- **O\*NET**: "This page includes information from the O\*NET 30.1 Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the CC BY 4.0 license. O\*NET® is a trademark of USDOL/ETA." With the modification notice: "TolongLabs has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications."
- **ESCO to O\*NET-SOC crosswalk**: from the O\*NET Resource Center, under CC BY 4.0. "This service uses the ESCO classification of the European Commission."
- **Anthropic Economic Index**: data released under CC BY, code under the MIT License, by Anthropic.
- **DOSM Job Market Insights**: "Data source: Department of Statistics Malaysia", used under DOSM's Terms of Use and the Government Open Data Terms of Use 1.0.
- **CIP 2020 to SOC 2018 Crosswalk**: U.S. Department of Education, Institute of Education Sciences, National Center for Education Statistics, with the U.S. Bureau of Labor Statistics. Public domain.
- **OpenDOSM**: CC BY 4.0, with the dataset linked where each figure is cited.
- **Live2D Hijiki sample model**: © Live2D Inc., under the Live2D Free Material License Agreement, including its limits on redistribution.

[`NOTICE.md`](/NOTICE.md) has the full list. Each file's `meta` block carries its source name, URL, vintage date, licence and credit, and the app cites every figure with them.

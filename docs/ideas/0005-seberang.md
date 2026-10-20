# Seberang

Seberang, Malay for "across" as in across the Causeway, shows a Malaysian worker how people in the same occupation already use AI in Singapore, the US and Selangor, as a preview of their own next year, and turns the difference into a plan. Its forecasts come from observed adoption elsewhere rather than from a slider of adjectives. It ranks fifth as a product, and its scenario engine lives on inside [Dividen](0001-dividen.md); see the [ranking](0000-ranking.md).

Contents:

1.  [User and moment](#user-and-moment)
1.  [How it works](#how-it-works)
1.  [The six must-haves](#the-six-must-haves)
1.  [Why it stands out](#why-it-stands-out)
1.  [Why people would use it](#why-people-would-use-it)
1.  [Live demo for the preliminary](#live-demo-for-the-preliminary)
1.  [Build plan to 25 October](#build-plan-to-25-october)
1.  [Hardest risk and fallback](#hardest-risk-and-fallback)
1.  [Scores](#scores)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## User and moment

- **Primary user**: a working adult outside the AI-heavy Klang Valley, such as an accounts executive in Johor or a production planner in Penang, who has read that AI will change their job and wants to know what changes and what to learn first.
- **Second user**: a state or national talent agency, such as TalentCorp or a state economic planning unit, deciding where to run reskilling programmes.
- **Why now**: in May 2026 Singapore's AI usage per working-age person was about 6.7 times Malaysia's (index values 5.81 and 0.87), and Selangor and Kuala Lumpur together made up 71% of Malaysia's usage ([Anthropic Economic Index][aei]). The near future of many Malaysian jobs is already visible next door and two states over.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex

## How it works

1.  **Pick a job.** The user picks or describes their occupation and state; free text in English or Malay maps to an O\*NET occupation.
2.  **See the preview.** For that occupation, Seberang compares which tasks people use AI for, and how, in Malaysia, Singapore, the US and worldwide, from the index's country rows for the same months. Tasks already common with AI abroad but not yet here are flagged as "arriving".
3.  **Choose a future.** Three scenarios: Malaysia keeps its own pattern; it converges on the worldwide pattern; it converges on Singapore's. Each is labelled an estimate.
4.  **Match.** Roles are ranked by skill and task overlap with the user's job, and by how they fare under the chosen scenario, with emerging or in-demand flags from O\*NET, MyCOL or MyMahir where a hand-checked match exists. The score's parts are shown.
5.  **Plan.** Free modules with real durations from the Microsoft Learn catalogue cover the gap, starting with the skills needed to work alongside AI on the "arriving" tasks.
6.  **Track record.** A backtest panel checks whether Singapore's pattern in an earlier release resembled Malaysia's in a later one, and shows the result whatever it is.

## The six must-haves

| Must-have             | How Seberang meets it                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Skills profile intake | Occupation, state and a short skills questionnaire, with sample profiles                                             |
| AI-trend signal layer | Dated index snapshots by country and state, refreshed by a script that checks for new releases                       |
| Future-role matching  | Ranked roles with a broken-down score and the missing skills named                                                   |
| Reskilling pathway    | Ordered free modules with durations and a finish date                                                                |
| SDG mapping           | Roles and skills tagged to targets 4.4, 8.2 and 8.5; the state view adds 10.2, on inclusion, for the regional divide |
| Handling uncertainty  | Three convergence scenarios built from observed data, plus a backtest of how well the method has done                |

## Why it stands out

The rubric says originality can come from "how scenarios are modelled". In our [field simulation][field] every scenario was a fast, base and slow toggle, and no idea in either pass grounded its scenarios in observed adoption. Seberang's scenarios are other places' present, which a judge can check.

The product around that engine is less distinct. One of our two checkers matched Seberang to eight task-exposure ideas, because the user still sees what AI takes next, then adjacent roles, then a plan; only the signal differs. That is why the engine is worth more inside Dividen than on its own.

[field]: /docs/research/field-simulation.md

## Why people would use it

- **A concrete preview beats a risk score.** "Accountants in Singapore already use AI for these three tasks" is easier to act on than "62% exposed".
- **It changes with each release**, and users who follow an occupation get the new preview.
- **Agencies get a regional view** of where AI use is concentrated, to place programmes outside the Klang Valley.

## Live demo for the preliminary

Pick "Bookkeeping, accounting and auditing clerks" in Johor. Switch the comparison from Malaysia to Singapore, and the "arriving" tasks, the role ranking and the plan change; switch the snapshot from April to May 2026, and they change again, with source and date shown. That is the trend layer feeding the role matching.

## Build plan to 25 October

1.  **21 October**: filter the index to `MYS`, `SGP`, `USA`, `GLOBAL` and the Malaysian states, both months; load O\*NET 31.0; one RunPod GPU job embeds O\*NET occupations and tasks with an open multilingual model.
2.  **22 October**: preview comparison and scenario logic; match score and gap.
3.  **23 October**: pathway, SDG tags from the UN SDG API, state view, and the backtest on the older releases; mentor session.
4.  **24 October**: deploy on a Replit Reserved VM, RunPod proof, PRD, declaration, video.
5.  **25 October, before 7:59 AM**: submit and check every link.

## Hardest risk and fallback

- **Countries differ for reasons other than time**: Singapore's economy and Claude's market share differ from Malaysia's. Compare within an occupation, never country totals, present convergence as a scenario rather than a prediction, and show the backtest.
- **Small samples are suppressed**: Malaysia's automation and augmentation split exists only for 20 occupation groups, and only 7 Malaysian states are published. Fall back to the group or the national row, and say so on screen.
- **The index measures Claude usage, not jobs.** Label it an "AI usage signal" everywhere.

## Scores

Scores out of 5, from round 9 (ours) and the round 10 panel, three other Claude models judging blind in persona: Claude Sonnet 5.5 as the sponsor, Claude Fable 5.1 as a government official and Claude Haiku 5.5 as a technical mentor. The [ranking](0000-ranking.md#scoring-matrix) explains the method.

| Criterion            | Weight | Ours | Sponsor judge | Government judge | Technical judge |
| -------------------- | ------ | ---- | ------------- | ---------------- | --------------- |
| Innovation           | 30%    | 4    | 4             | 4                | 4               |
| Problem-solution fit | 25%    | 4    | 4             | 4                | 2               |
| Feasibility          | 25%    | 4    | 4             | 4                | 4               |
| Clarity              | 20%    | 5    | 4             | 4                | 3               |
| Actual use           |        | 3    | 3             | 3                | 2               |

- **Rubric**: 84 from us and 75.3 from the panel, 79.7 on average.
- **Uniqueness**: 2: one checker matched it to eight task-exposure ideas, since only its signal differs.
- **Composite**: 70.3, rank 5 of 5 finalists. All three judges picked Dividen as the winner.

What the judges attacked, and the fix we adopt:

- **Claude users aren't Malaysian workers** (government judge). The index counts Claude usage, so the 71% Klang Valley share and the "arriving" tasks describe Claude's users, not employers' needs. Cross-check arriving tasks against MyMahir's demand data before ranking roles.
- **The intake isn't personal** (technical and government judges). Add a task checklist mapped to O\*NET so overlap is the person's, not the occupation's.
- **Individuals have little reason to return** (sponsor judge). Lead with the talent-agency view as the recurring user, and report the backtest honestly, including where it fails.
- **Anyone can ask Claude for the comparison**: the Economic Index has been a Claude connector since 22 July 2026 ([X inspiration](/docs/research/x-inspiration.md#what-people-already-use)). That is why it ranks last as a product and lives on as Dividen's scenario engine.

## Open questions

- Does the backtest hold? If Singapore's past doesn't resemble Malaysia's present, the scenarios need a different anchor, such as the worldwide row.
- Would agencies accept a Claude-only usage signal, or does the state view need a second source?

## See also

- [Idea ranking](0000-ranking.md)
- [Field simulation](/docs/research/field-simulation.md)
- [Trend and skills data](/docs/research/trend-data.md)

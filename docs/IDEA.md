# Idea

Our SDC Hackathon 2026 Domain 1 entry is Kotak. It shows any Malaysian worker which of their skills are rising or declining with AI, and what to do next. This page records what we chose, how we built it and which document holds the detail; the full solution design is in [0007-kotak.md][kotak].

Contents:

1.  [The idea in brief](#the-idea-in-brief)
1.  [How the idea was built](#how-the-idea-was-built)
1.  [Where the detail lives](#where-the-detail-lives)
1.  [Ideas we compared](#ideas-we-compared)
1.  [See also](#see-also)

[kotak]: /docs/ideas/0007-kotak.md

## The idea in brief

- **User**: a working adult in Malaysia, in any industry, who wants to stay strong in their role, move to a role they have in mind, or find where they could go ([users][k-users]).
- **Flow**: the user picks a job, a goal and an impact area. A cat counsellor asks 12 yes/no can-do questions. Kotak draws the user's 6 skill corners against what the role will need in 12 months, ranks the roles they fit and builds a roadmap of free steps with a finish date ([product flow][k-flow]).
- **Engine**: dated snapshots from the Anthropic Economic Index, DOSM, MyCOL and O\*NET feed a four-layer hierarchy. Fixed rules set every verdict, target, fit score and ranking ([engine][k-engine]).
- **Core rule**: data decides, the AI explains. AI writes corner names, questions and explanations, but never sets a score or a verdict ([where AI works][k-ai]).
- **Government side**: an anonymous national view of the rising skills Malaysian workers lack most, with totals only for groups of 10 or more ([users][k-users]).
- **Live demo**: one button switches the Economic Index snapshot from April to May 2026, and the radar, verdicts, role ranking and roadmap update ([live demo][k-demo]).

[k-users]: /docs/ideas/0007-kotak.md#users
[k-flow]: /docs/ideas/0007-kotak.md#product-flow
[k-engine]: /docs/ideas/0007-kotak.md#engine
[k-ai]: /docs/ideas/0007-kotak.md#where-ai-works-and-where-rules-decide
[k-demo]: /docs/ideas/0007-kotak.md#must-haves-and-the-live-demo

## How the idea was built

| Step               | Result                                                 | Where                               |
| ------------------ | ------------------------------------------------------ | ----------------------------------- |
| 1. Solution design | Locked on 22 October 2026                              | [0007-kotak.md][kotak]              |
| 2. Tech stack      | Bun, React, Hono, Zod, Postgres, Claude API and RunPod | [TRD](TRD.md)                       |
| 3. Visual design   | Design system and mockups in Figma                     | [DESIGN](DESIGN.md), [Figma][figma] |
| 4. Build issues    | #26 to #105, in milestones M1 to M5                    | [GitHub issues][issues]             |

[figma]: https://www.figma.com/design/XumA0GuVqzPE3TyhWo0y6B/Kotak-%C2%B7-Design-System---Mockups?node-id=2-67
[issues]: https://github.com/TolongLabs/sdc-hack/issues

## Where the detail lives

| Document              | Holds                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| [BRIEF](BRIEF.md)     | The hackathon's rules, deadlines, deliverables and judging                |
| [CONTEXT](CONTEXT.md) | What wins marks, who judges, and the trend and skills data                |
| IDEA                  | This page: the chosen idea and how it was built                           |
| [PRODUCT](PRODUCT.md) | Users, purpose, brand personality and design principles                   |
| [DESIGN](DESIGN.md)   | The visual design system and the Figma file                               |
| [PRD](PRD.md)         | Product requirements, in the organisers' preliminary proposal template    |
| [TRD](TRD.md)         | Technical requirements: architecture, data, engine rules, APIs and deploy |

## Ideas we compared

- The [20 October ranking](/docs/ideas/0000-ranking.md) compared five ideas and recommended [Dividen](/docs/ideas/0001-dividen.md). The others were [Tanding](/docs/ideas/0002-tanding.md), [Baki](/docs/ideas/0003-baki.md), [Cermin](/docs/ideas/0004-cermin.md) and [Seberang](/docs/ideas/0005-seberang.md).
- The [first Kotak](/docs/ideas/0006-kotak.md) served Malaysian graduates aiming at junior tech roles. The [Kotak roast](/docs/research/kotak-roast.md) and the 21 October team meeting widened it to workers in any industry.
- Kotak keeps two parts of Dividen: the AI dividend that sets weekly learning hours, and the slow and fast scenarios ([decisions][k-decisions]).

[k-decisions]: /docs/ideas/0007-kotak.md#decisions-so-far

## See also

- [Open issues][issues], where pending work and open questions live
- [Issue #24](https://github.com/TolongLabs/sdc-hack/issues/24), choosing a product from the ranking
- [Domain 1 problem statement](/docs/sources/drive.google.com/domain-1-aiversecity.md)

# Algorithm card

How Kotak turns a user's answers and dated data into verdicts, targets, fit scores, ranked roles and a roadmap, and where AI is and isn't allowed. The rules live in `packages/shared/src/rules/` and `packages/shared/src/pathways/`, and `@kotak/sdk` runs the same code in the browser, on Bun and on the Worker. The [data card](data-card.md) covers the inputs, and the [TRD's engine section](TRD.md#engine) has the full detail ([#93]).

[#93]: https://github.com/TolongLabs/Kotak/issues/93

Contents:

1.  [Core rule](#core-rule)
1.  [Inputs and fallbacks](#inputs-and-fallbacks)
1.  [Levels from answers](#levels-from-answers)
1.  [Verdicts](#verdicts)
1.  [Projections and targets](#projections-and-targets)
1.  [Fit score](#fit-score)
1.  [Roles to suggest and rank](#roles-to-suggest-and-rank)
1.  [Access to a role](#access-to-a-role)
1.  [Roadmap](#roadmap)
1.  [What changed](#what-changed)
1.  [Where AI is used](#where-ai-is-used)
1.  [Guardrails](#guardrails)

## Core rule

The data decides; the AI explains. Fixed rules over dated, sourced data set every level, verdict, target, fit score, role rank and roadmap position. No engine function calls a model, and no model output can change a number.

## Inputs and fallbacks

Each corner of a role gets three inputs:

1.  **AI use on the corner**, from the Anthropic Economic Index. The finest level published wins: task, then work activity, then detailed occupation, then major group, Malaysia first, then global. Any borrowed value carries a label saying where it came from.
2.  **How AI is used**: mostly augmentation or mostly automation, from the Economic Index collaboration split, at work-activity level, then major group, then global.
3.  **Demand for the role**: the role's own count where DOSM Job Market Insights names it among a quarter's top roles; else its major group's Job Market Insights series; else Unknown. The direction comes from the quarter-on-quarter and year-on-year changes.

## Levels from answers

The user rates 12 can-do statements from 1 (Not yet) to 4 (Yes, on my own): a basic and an advanced statement for each of 6 corners. Five slots carry reversed wording once a corner has it, and those ratings count as 5 minus the rating.

```text
corner level = (basic rating + advanced rating − 2) ÷ 2      0 to 3, in steps of 0.5
```

Levels are self-reported, and the radar says so.

## Verdicts

| AI use on the corner | How AI is used | Demand | Verdict                     |
| -------------------- | -------------- | ------ | --------------------------- |
| Rising               | Augmentation   | Any    | Rising: AI helps it scale   |
| Rising               | Automation     | Any    | Declining because of AI     |
| Not rising           | Any            | Up     | Rising: AI can't do it yet  |
| Not rising           | Any            | Flat   | Steady                      |
| Not rising           | Any            | Down   | Declining for other reasons |

- AI use is rising when its projected 12-month change is more than 5%, relative to the latest value.
- **Unknown**: fewer than two dated points, or a missing input the row needs. The app always shows it.
- **Split**: the slow and fast scenarios give different rows, or demand sources point opposite ways and that changes the row. A Split corner shows both futures.

## Projections and targets

- **Slow scenario**: a least-squares line through the dated points, run 12 months past the latest data month.
- **Fast scenario**: Malaysia moves halfway to Singapore's usage index (May 2026: 0.87 for Malaysia, 5.81 for Singapore). Growing use grows that many times faster; shrinking use shrinks that many times slower, so the fast scenario never flips a shrinking corner.
- Every projected value is labelled an estimate.

```text
target       = clamp(2.0 + ai_effect + demand_effect, 1.0, 3.0)
ai_effect    = ± growth ÷ (growth + 0.5)      + for augmentation, − for automation, 0 when use isn't growing
demand_effect = +0.5 up, 0 flat or Unknown, −0.5 down
```

The radar's dashed line draws the target, so a new snapshot or the scenario toggle moves it.

## Fit score

```text
fit = Σ min(your level, target) ÷ Σ target × 100
```

The Roles page shows the sum behind every score. A matched role reuses the 12 answers where its corners share work with the answered ones: the same intermediate work activity first ("estimated from your answers"), then the same broad one ("rough estimate"), else level 0 ("not asked yet"). Across each job's 3 most related O\*NET roles, the first rule covers a median 44% of a matched role's task links, and the first two a median 73%.

## Roles to suggest and rank

The intake asks where the user is, their highest qualification, field of study, years of work, job and goal. Each reason a role is in front of the user adds a fixed weight:

| Reason                                                          | Weight                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| A target role the user named                                    | 10                                                        |
| In an interest area the user picked                             | 3, plus up to 1.5 for an area's core roles                |
| The user's field of study leads here (NCES crosswalk)           | 3, plus 1 when also in a picked area                      |
| The "not sure" activity picks match the role's O\*NET interests | up to 4: the correlation, floored at 0, × 4               |
| On O\*NET's related list for the user's job                     | 1                                                         |
| A manager or supervisor role for a user without the years       | −2                                                        |
| A role well below the user's qualification                      | a penalty                                                 |
| The role's outlook, added once its data loads                   | +2 Rising, +1 Steady, +0.5 Split, 0 Unknown, −1 Declining |

A qualification the user doesn't hold takes nothing away. The check-up ranks up to 18 of these roles beside the job's related list, and Roles That Fit shows 6, the user's own choices first. Each card says why it's there.

The highlighted card is the one the details and the roadmap follow. Until the user picks, it is their target role, else their best fit of the Rising roles that aren't their job, else their best fit, and the card says why in bold.

## Access to a role

A fixed rule says what a role needs. It informs and never blocks: no role is hidden or ranked lower for a missing qualification.

1.  **A Malaysian regulated profession**: open to someone already in the job; else "Registration Steps Left" when the user's field and level qualify, "Qualification Needed" when they don't, and "Licence Required" when Kotak can't tell. Each shows the route in, the regulator and its sources, beside the user's fit.
2.  **Managers and first-line supervisors**: "Needs Experience" when the user's years fall below what US workers report, and at least 2.
3.  **"Degree Usually Needed"**: when the median education US workers report is a diploma or above and the user's is lower.

## Roadmap

```text
gap   = target − your level, for each corner below its target
weeks = total hours ÷ weekly hours
```

- **Order**: Rising gaps first, largest first; then Steady, Split and Unknown; Declining last, tagged "less important by 2027".
- **Steps**: each is the next can-do statement, with an AI-drafted hour estimate and one free resource. A partial step earns no projected level gain.
- **Weekly hours**: the default is one hour in five of the time AI could save the user on declining corners, from 1 to 10 hours, and the user can change it.
- **Window**: the page shows the next 12 weeks and the week fit passes 80%; the hours left after Week 12 are listed.

## What changed

`diffSnapshots` compares two snapshots for the same answers: each corner's AI use, target, verdict and roadmap rank, and each matched role's fit, with the old and new values and the dated source. Switching from April to May 2026 recomputes everything in the browser.

## Where AI is used

| Task                                                     | Model                                  | When                   |
| -------------------------------------------------------- | -------------------------------------- | ---------------------- |
| Group each job's tasks into corners and draft questions  | Qwen3.8-27B-FP8 on a RunPod GPU        | Once, before the demo  |
| Match a local or Malay job title to an O\*NET occupation | Claude Haiku 5.5; the user confirms it | Live, cached           |
| Explain a verdict and the What Changed summary           | Claude Haiku 5.5                       | Live, cached, verified |
| Answer questions in Ask Kopi, by calling Kotak's tools   | Claude Haiku 5.5                       | Live                   |
| Sort a scraped batch's listing titles for admin review   | Claude Haiku 5.5; an admin approves    | Live, admin only       |
| Kopi's voice                                             | ElevenLabs                             | Pre-generated and live |

## Guardrails

- **Batch validator**: rejects any corner that cites a task from another occupation.
- **Explanation verifier**: rejects or strips text that changes a verdict label or drops a dated citation, and requires an Economic Index citation where AI use sets the verdict. On failure, a fixed template answers.
- **Read-only tools**: Ask Kopi and outside assistants (through `/api/mcp`) get only Kotak's tools, which compute every number with the engine. One agent rules text tells them to quote tool results and cite sources, and Kopi's chat fills in the user's own answers so the model can't retype them.
- **No sampling settings**: Claude Haiku 5.5 rejects non-default `temperature`, so repeatable answers come from the response cache and the verifier.
- **Schemas everywhere**: every route validates its request and response, and every data file is Zod-checked at build time.
- **Fallbacks**: a failed or overloaded Claude call serves a cached, labelled answer or the template; failed speech falls back to text.

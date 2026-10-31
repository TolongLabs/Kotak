# Judge Q&A cheat sheet

One sentence per answer, then where to show it. Every number comes from the [algorithm card](/docs/algorithm-card.md); the wider drill is the final plan's [questions to drill](/docs/analyses/final-plan.md#questions-to-drill).

Contents:

1.  [The engine](#the-engine)
1.  [Trust](#trust)
1.  [Data and tools](#data-and-tools)
1.  [Numbers to know](#numbers-to-know)

## The engine

| Question                                 | One-sentence answer                                                                                                                                                                                       | Show                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| "How do you get a skill level?"          | Each skill area has a basic and an advanced question rated 1 to 4, and the level is (basic + advanced − 2) ÷ 2, so 0 to 3; a what-would-you-do answer stores its option's hidden score (#415).            | Radar                     |
| "How is a verdict set?"                  | A fixed table: if AI use on the skill is projected to rise more than 5% in 12 months, augmentation makes it Rising and automation Declining; otherwise job-ad demand decides Rising, Steady or Declining. | Radar, Why Kopi Says This |
| "What if there isn't enough data?"       | Fewer than two dated points, or a missing input, gives Unknown, and the app always shows it.                                                                                                              | Radar                     |
| "Where does the target come from?"       | It starts at 2, AI growth moves it up for augmentation or down for automation by less than 1, demand adds 0.5 or takes 0.5, and it stays between 1 and 3.                                                 | Radar's dashed line       |
| "How is the fit score computed?"         | The sum of your level capped at each target, divided by the sum of the targets, times 100, and the Roles page shows the sum.                                                                              | Roles                     |
| "Why this roadmap order?"                | Rising gaps first, largest first, then Steady, Split and Unknown, and Declining last; weeks are the total hours divided by your weekly hours.                                                             | Roadmap                   |
| "Why is my plan longer than a friend's?" | Your situation, years of work and qualification multiply each step's hours by one factor between 0.80 and 1.30, a stated estimate, and returners get a 4-hour refresher first.                            | Roadmap, See the Maths    |

## Trust

| Question                                | One-sentence answer                                                                                                                                                                           | Show                                                                                                                                                                                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Why do rules decide, not the LLM?"     | So the same answers always give the same result, every number has a dated source, and anyone can check it by hand; no engine function calls a model, and no model output can change a number. | How It Works                                                                                                                                                                                                                                                                                                     |
| "What does the AI do, then?"            | It matched job titles, grouped each job's tasks into 6 skills before the demo, explains verdicts, and answers in Ask Kopi using only Kotak's own tools.                                       | Ask Kopi                                                                                                                                                                                                                                                                                                         |
| "How do you stop made-up courses?"      | The data check rejects any unchecked resource that isn't a labelled search link, so a model can't slip in a course, and the demo roles' 18 courses are checked by hand (#369).                | Roadmap, Step Details                                                                                                                                                                                                                                                                                            |
| "How do you stop made-up explanations?" | A verifier rejects text that changes a verdict or drops a dated citation, and a fixed template answers instead.                                                                               | Why Kopi Says This                                                                                                                                                                                                                                                                                               |
| "Is it fair?"                           | The rules have no field for name, gender, race, religion or age, and a paired-profile test (#379) checks that verdicts and fit stay the same when only the profile changes.                   | `bun test packages/sdk/src/fairness.test.ts`: "Fairness: 30 paired profiles on 3 demo roles: verdicts and each role's fit identical in 30 of 30; ranking differs by design (seniority and qualification rules) in 6; pace differs by design in 30; name, gender, race, religion and age are rejected as inputs." |
| "What about personal data?"             | There are no user accounts, the check-up stays in the browser until Reset All deletes it, and requests to Claude and ElevenLabs carry no name, email or ID (tech declaration 6.1).            | Settings                                                                                                                                                                                                                                                                                                         |

## Data and tools

| Question                                         | One-sentence answer                                                                                                                                                                                                | Show                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| "What happens when May's data replaces April's?" | Loading May 2026 recomputes every target, verdict, fit score and roadmap step in the browser, and What Changed lists each old and new value with its dated source.                                                 | What Changed             |
| "Where do Replit and RunPod come in?"            | A RunPod GPU ran Qwen3.8-27B before the demo, once to build each job's 6 skills and once to translate 10 more jobs into BM and Chinese; Replit publishes the live demo, with a Cloudflare Workers mirror.          | Tech declaration 2.1     |
| "English only?"                                  | No: English, Bahasa Malaysia and Chinese, one tap in the top bar; every job title and the demo jobs are fully translated, and a job still partly in English says so.                                               | Top bar, EN / BM / 中文  |
| "What if a source goes down?"                    | Both months ship inside the app, so the demo needs no live feed; a new month reaches the site only through a weekly pull request that is validated and approved by a person, and the top bar shows the data month. | Top bar, "Data May 2026" |
| "So fast just multiplies everything by 3.84?"    | For growing AI use, yes: fast moves Malaysia halfway to Singapore, (0.87 + ½ × (5.81 − 0.87)) ÷ 0.87 = 3.84 on May 2026 data, and shrinking use shrinks 3.84 times slower.                                         | Radar, a Split skill     |
| "Where does AI use come from?"                   | The Anthropic Economic Index, at the finest level published, Malaysia first, and any borrowed value says where it came from.                                                                                       | Radar, All Sources       |

## Numbers to know

- 923 jobs, 6 skill areas each, 12 questions per check-up.
- 902 jobs ask what-would-you-do questions (#415); the rest ask the 1 to 4 statements.
- Rising means a projected 12-month rise in AI use of more than 5%.
- The fast future moves Malaysia halfway to Singapore's AI use index (May 2026: 0.87 and 5.81), a multiplier of 3.84 (`packages/shared/src/rules/verdicts.ts`).
- The roadmap headline is the week fit passes 80%.

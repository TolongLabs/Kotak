# Kotak roast

How [Kotak](/docs/ideas/0006-kotak.md) holds up when experts attack it, and what would reinforce it before the team decides tonight. On 21 October 2026, six Antigravity workers (gemini-4-argon, high effort) each played one expert: a Kuala Lumpur talent acquisition lead, a TalentCorp policy officer, an Aiversecity judge, a senior full-stack and machine-learning engineer, a final-year computer science student, and a Malaysian technology lawyer. Each read the idea, the [hiring-bar evidence](/docs/research/hiring-bar-evidence.md), the Domain 1 problem statement and the [brief](/docs/BRIEF.md), then wrote 7 or 8 attacks, 43 in all. The personas are AI models, not real experts, so their scores show where the idea is weak, not what judges will give. Their raw roasts are in [kotak-roast/](/docs/research/kotak-roast/).

Contents:

1.  [Verdict](#verdict)
1.  [Scores](#scores)
1.  [Attacks by theme](#attacks-by-theme)
1.  [Smaller attacks](#smaller-attacks)
1.  [Proposed reinforcements](#proposed-reinforcements)
1.  [Reinforced demo](#reinforced-demo)
1.  [What to keep](#what-to-keep)
1.  [Claims checked](#claims-checked)
1.  [See also](#see-also)

## Verdict

The core holds; the build and the demo don't yet. All six experts keep the same three ideas: rules decide and the AI explains, honest Settled, Split or Unknown verdicts, and the What changed note. All six attack the same two things: the demo flips a verdict with a sample card the team wrote, and the build is too big for about two working days. Of the eight attack themes below, Kotak as written partly answers four and doesn't answer the other four. Every theme has a fix, and most fixes are cuts or rewiring rather than new features.

## Scores

Each expert scored 1 to 5.

| Expert                    | Innovation | Live demo | Feasibility |
| ------------------------- | ---------- | --------- | ----------- |
| Talent acquisition lead   | 3          | 2         | 2           |
| TalentCorp policy officer | 2          | 2         | 2           |
| Aiversecity judge         | 3          | 2         | 2           |
| Senior engineer           | 3          | 2         | 2           |
| Computer science student  | 3          | 2         | 2           |
| Technology lawyer         | 2          | 3         | 2           |
| **Average**               | **2.7**    | **2.2**   | **2.0**     |

## Attacks by theme

| #   | Attack                                                                                               | Raised by | Kotak today                                                                                          | Fix                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The demo moves a verdict with a sample card the team wrote, so it looks rigged                       | 6 of 6    | Partly: samples are labelled, but the key moment is still invented                                   | Run the moment on real evidence only: a real public hiring page or a real card                                                                     |
| 2   | Too much to build in about two working days                                                          | 6 of 6    | Partly: a cut line exists, but it keeps the review screen and leaves the companion and Akinator open | Cut the separate review screen, scheduled scraping, CV upload, the Akinator intake and the Live2D runtime                                          |
| 3   | RunPod and the approval step never appear in the demo                                                | 5 of 6    | No: the demo publishes a form, so the GPU step stays hidden                                          | Make extraction the demo moment: paste a real page, the RunPod model extracts it with quotes highlighted, one click approves                       |
| 4   | US O\*NET skills and Claude usage stand in for Malaysian job demand                                  | 5 of 6    | Partly: the Economic Index is labelled as usage, but role skills come from O\*NET                    | Role names and skills from MyCOL and MyMahir for 8 to 10 roles; O\*NET only as a labelled fallback; the Economic Index as a dated AI-usage outlook |
| 5   | Interview rules move role rankings: "AI tools allowed in the take-home" makes AI engineer rise       | 4 of 6    | No: interview format says nothing about which role fits                                              | Interview-format verdicts change the plan, so a Split gives two plans; only skill evidence changes role scores                                     |
| 6   | Employers won't publish cards: candidates game tests, HR must sign off, anyone can pose as a company | 4 of 6    | Partly: the doc names the empty start, but leaves naming open                                        | Cards describe the format, not the questions; anonymous by sector and size by default; named only with consent and a work email                    |
| 7   | The employer comparison and government index carry the 70% and 30% of the pitch but aren't built     | 2 of 6    | No: both exist only in the deck                                                                      | Build one market view, the box tallied across employers, which serves both                                                                         |
| 8   | SDG tags are decorative                                                                              | 2 of 6    | No: every step gets target 4.4 or 8.5                                                                | Let the SDG change a choice: the student picks an impact area, and the plan's proof project changes                                                |

## Smaller attacks

Each came from one expert.

- **Judges test alone, so shared demo state breaks** (engineer). The brief confirms that preliminary judges set the project up themselves ([brief](/docs/BRIEF.md#repository-requirements)). Fix: keep demo changes per visitor, add a Reset button, and cache the demo source's extraction so a RunPod cold start can't stall it.
- **Two sources can't settle a national question** (TalentCorp). Fix: show the count in every verdict, such as "Split: 1 employer yes, 1 no".
- **Stack, models and score formula are still undecided** (engineer). The Technical and Tools Declaration must name them. Fix: lock them tonight.
- **No course dataset behind the plan** (judge). Fix: a small cited list of real free courses and HRD Corp or MDEC programmes for the demo roles' gaps.
- **CV upload invites real personal data** (lawyer). The brief allows CV upload but asks for "sample profiles in place of real CVs" ([brief](/docs/BRIEF.md#our-challenge)). Fix: sample profiles only, and say so on screen.

## Proposed reinforcements

AlaskanTuna accepted all five on 21 October, and [Kotak](/docs/ideas/0006-kotak.md) now carries them. The team still decides tonight:

1.  **Real evidence only in the demo.** Answers 1 and 3. The presenter pastes a real public Malaysian hiring page or a real card into an evidence drawer; the RunPod model extracts the stages, the AI rule, the proof valued and the skills, each with its quote highlighted; one click approves it. No sample employers anywhere in the demo.
1.  **Split the two effects.** Answers 4 and 5. Interview-format verdicts change the plan, so two futures are two plans, such as "if algorithm tests stay" and "if AI-assisted tests spread". Skill evidence changes role scores. The Economic Index shows each role's AI-usage outlook, dated and labelled an estimate.
1.  **Collect 5 to 10 real cards before Sunday.** Answers 1, 6 and 7. A two-minute form goes to mentors and the team's contacts. Cards stay anonymous by sector and size unless the person consents to naming. Each card unlocks the market view, which doubles as the government index. The pitch can then say how many real cards came in during the hackathon.
1.  **Cut to one flow.** Answers 2. Drop the separate review screen, scheduled scraping, CV upload, the Akinator intake and the Live2D runtime. If the team wants a companion, use a few static cat poses we own instead (see [claims checked](#claims-checked)).
1.  **Make the SDG link change a choice.** Answers 8. The student picks an impact area, such as health, energy or digital inclusion, and the plan's proof-building project changes to match.

## Reinforced demo

1.  Load a sample student: final-year computer science, Python and React, two hackathons. The box shows a question as Unknown or one-sided.
1.  Paste a real public hiring page, or open a real card, in the evidence drawer. The RunPod model extracts it, with each quote highlighted.
1.  Click Approve. The verdict moves, with its count, and What changed cites the source and its date.
1.  The plan splits into two futures where employers disagree. Roles re-rank only if the source listed skills.

This needs at least one real source on each side of one question. Today the team has one: Grab's engineering hiring page, which keeps live coding. A real card from a mentor or contact would supply the other side.

## What to keep

- **Rules decide; the AI reads and explains.** All six kept it.
- **Settled, Split or Unknown verdicts, with two futures from each Split.** All six kept it.
- **The What changed note.** Five of six kept it.

## Claims checked

The coordinator checked these on 21 October 2026:

- **Live2D licence (lawyer's attack): confirmed.** The [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html) says "the Customer may not Redistribute all or part of the Material to third party" (clause 4.1.1). It defines Redistribute to include putting the material "into a server for third parties with access via the Internet" (clause 1.10), and it bars sublicensing (clause 4.1.5). Committing the Tororo and Hijiki files to our public Apache 2.0 repository would breach it. Our decision page also serves the model files from claude.ai, with Live2D's copyright notice; that is closer to normal web use, but clause 1.10 is broad.
- **Apache 2.0 licence, Replit and RunPod rules: confirmed.** The repository needs an Apache 2.0 `LICENSE`. Replit is compulsory. RunPod is required for any GPU work, and the safe reading is to run one real GPU step on RunPod and keep its proof ([brief](/docs/BRIEF.md#rules-that-can-cost-us)). So "compulsory RunPod" in the lawyer's roast is our safe reading, not a stated rule.
- **No live external feed before judging: confirmed from our own evidence.** OpenDOSM's next update is 11 November 2026 ([hiring-bar evidence](/docs/research/hiring-bar-evidence.md#updatable-feeds)), so new evidence during the hackathon can only come from pages and cards.
- **Not checked, persona estimates:** a 20 to 60 second RunPod cold start, 8 to 12 hours to integrate Live2D, 30 verified employers as a minimum sample, and about 48 hours of build time.

## See also

- [Kotak](/docs/ideas/0006-kotak.md)
- [Hiring-bar evidence](/docs/research/hiring-bar-evidence.md)
- [CareerSphere and PivotPath teardown](/docs/research/winner-teardowns.md)
- [Raw roasts](/docs/research/kotak-roast/)

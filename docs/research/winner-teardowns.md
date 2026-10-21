# CareerSphere and PivotPath teardown

A closer look at the two past winners nearest to Domain 1, extending their entries in [comparable winners](/docs/research/comparable-winners.md). On 21 October 2026, two Codex workers (gpt-6-luna, max effort) researched one project each, and the coordinator re-read each project's public repository the same day. "Checked" marks a claim the coordinator re-read at its source; "worker" marks one only a worker read.

Contents:

1.  [What changes for us](#what-changes-for-us)
1.  [CareerSphere](#careersphere)
1.  [PivotPath](#pivotpath)
1.  [Corrections to earlier notes](#corrections-to-earlier-notes)
1.  [Unverified](#unverified)
1.  [See also](#see-also)

## What changes for us

- **PivotPath won without grounded scores.** Its server asks Claude for each path's match score and automation risk, and no code computes them (checked). Kotak's "rules decide" is a real difference from it, not parity.
- **CareerSphere won on process as much as product.** Its repository keeps a decision log, data and algorithm cards, failure cases and an AI-collaboration log, and the team says judging split evenly between product and process (worker). SDC's preliminary judges also set up and read our repository, so a decision log and a data card are cheap marks.
- **Copy CareerSphere's AI boundary and its demo fix.** Its algorithm card says "The data decides; the AI interprets", and lets the model only "parse profile text, route between allowlisted tools, and explain computed JSON" (checked). When results wobbled between runs, the team set `temperature=0` on profile parsing (checked).
- **Winners' live data was thinner than their pages say.** CareerSphere's algorithm card says "Jobs are still mock/cached fallback rows", while its data card calls a cached snapshot of about 88,000 postings the default (checked). Its courses covered 8 of 2,318 framework skills until a fix on 22 June (checked). Kotak should say plainly what is live, cached or sample.
- **Neither handles uncertainty or Malaysia.** Neither shows Split or Unknown states, more than one future, or Malaysian data (worker; matches [comparable winners](/docs/research/comparable-winners.md#closest-overlaps-with-domain-1)).

## CareerSphere

| Aspect       | Finding                                                                                                                                                                                                         | Status                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Event        | PyCon Singapore 2026 hackathon, #1 in the single ranking; hackathon 19 to 24 June, conference 19 to 21 June ([results](https://pycon.sg/hackathon_entries/results.html))                                        | Worker                          |
| Team         | Rohan Kulshrestha (NTU) and Kieran Ho (NUS)                                                                                                                                                                     | Worker                          |
| Flow         | Paste career text or upload a résumé, optionally add LinkedIn; state a goal; wait 60 to 90 seconds; explore a 3D role sphere; review ready-now and reachable roles, gaps, courses and jobs, each with a "why"   | Worker                          |
| Data         | SkillsFuture Skills Framework (2,030 roles, 43,916 role-skill rows), 25,342 SkillsFuture courses and MyCareersFuture postings ([data card](https://github.com/rohanz/careersphere/blob/main/docs/data_card.md)) | Worker; course count checked    |
| Role fit     | Deterministic, and changed during the event: from 0.7 × relevance + 0.3 × framework coverage to relevance + 0.2 × coverage ([decision log](https://github.com/rohanz/careersphere/blob/main/DECISIONS.md))      | Checked                         |
| Gap priority | 0.35 closeability + 0.25 reuse across roles + 0.25 market demand + 0.15 official future signal ([algorithm card](https://github.com/rohanz/careersphere/blob/main/docs/algorithm_card.md))                      | Checked                         |
| AI           | gpt-5.4-nano parses, routes among allowlisted tools and explains computed results; text-embedding-3-small matches skills                                                                                        | Boundary checked; models worker |
| Stack        | Python 3.11, FastAPI, DuckDB and MotherDuck, React with react-three-fiber, Google Cloud Run                                                                                                                     | Worker                          |
| Judging      | Process and Product, Data Integrity, User Focus and Execution; no per-team scores published ([hackathon page](https://pycon.sg/hackathon.html))                                                                 | Worker                          |
| Live demo    | A Cloud Run link from the results page; it timed out when the worker opened it on 21 October                                                                                                                    | Worker                          |

## PivotPath

| Aspect  | Finding                                                                                                                                                                                                                                                        | Status                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Event   | Claude Hackathon x UVicHacks 2026, Track 3: Economic Empowerment and Education, a one-day event on 21 March 2026; Devpost marks it "Winner First Place" ([submission](https://devpost.com/software/pivot-path))                                                | Worker; Devpost blocked the coordinator |
| Users   | Workers facing automation with little time or money to retrain, such as retail clerks and truck drivers, plus a student track                                                                                                                                  | Worker                                  |
| Flow    | Pick student or professional; optionally add a résumé, GitHub or LinkedIn text; take a RIASEC interest test; set time, budget and location limits; get paths, milestones, job-search links and a coaching chat                                                 | Worker                                  |
| Data    | Live O\*NET web-service calls for wages, Job Zone, Bright Outlook and skills, with default credentials `guest:guest` ([server](https://github.com/G-I-Dev-P/pivotpath/blob/main/server/index.js)); those returned HTTP 401 when the worker tried on 21 October | Calls checked; 401 worker               |
| Scores  | Claude generates match score, automation risk, salary, demand trend and timeline; the prompt sets rules such as "NEVER recommend paths with automation risk above 50"; it asks for 3 paths, then "Generate EXACTLY 5"                                          | Checked                                 |
| Courses | No course catalogue; Claude suggests free resources                                                                                                                                                                                                            | Worker                                  |
| Model   | `claude-sonnet-4-20250514` through the Anthropic SDK, on Node and Express with React 18                                                                                                                                                                        | Model checked                           |
| Judging | Technical Execution 30, Impact Potential 25, Ethical Alignment 25, Presentation 20; no PivotPath-specific comment                                                                                                                                              | Worker                                  |
| Team    | Devpost and two LinkedIn posts name different people                                                                                                                                                                                                           | Worker                                  |

## Corrections to earlier notes

- **PivotPath's automation risk comes from Claude, not O\*NET.** O\*NET supplies wages, Job Zone, Bright Outlook and skills. [CONTEXT.md](/docs/CONTEXT.md#comparable-winners) and [comparable winners](/docs/research/comparable-winners.md#pivotpath) said "O\*NET automation risk"; both now say it is generated by Claude.
- **CareerSphere's 88,000 postings were a cached snapshot, and its records conflict on what judges saw.** Both notes said "live"; both now say "cached".

## Unverified

- What CareerSphere's judges saw: live postings, the cached snapshot or mock rows, and the React or the plain HTML interface.
- Whether PivotPath's deployed app had working O\*NET credentials, or fell back to ungrounded output.
- Exact judging weights behind either win; neither organiser published per-team scores or comments.

## See also

- [Comparable winners](/docs/research/comparable-winners.md)
- [Kotak roast](/docs/research/kotak-roast.md)
- [Context](/docs/CONTEXT.md)

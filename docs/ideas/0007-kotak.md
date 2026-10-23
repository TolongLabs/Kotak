# Kotak

Kotak shows any Malaysian worker which of their skills are rising or declining with AI, and what to do next. A cat counsellor asks 12 yes/no questions, draws the user's skills against the role's future needs and builds a roadmap from dated, sourced data. Status: solution design locked on 22 October 2026; the [idea page](/docs/IDEA.md) tracks the later steps (tech stack, visual design, build issues). It supersedes the [first Kotak](0006-kotak.md), which stays as history.

Contents:

1.  [Why Kotak](#why-kotak)
1.  [Users](#users)
1.  [Product flow](#product-flow)
1.  [Engine](#engine)
    1.  [Layered hierarchy](#layered-hierarchy)
    1.  [Verdict rules](#verdict-rules)
    1.  [Live extras](#live-extras)
1.  [Universal roles pipeline](#universal-roles-pipeline)
1.  [Scoring rules](#scoring-rules)
1.  [Where AI works and where rules decide](#where-ai-works-and-where-rules-decide)
1.  [Mascot](#mascot)
1.  [Must-haves and the live demo](#must-haves-and-the-live-demo)
1.  [Non-goals and anti-goals](#non-goals-and-anti-goals)
1.  [Constraints](#constraints)
1.  [Decisions so far](#decisions-so-far)
    1.  [Calls Claude made](#calls-claude-made)
1.  [Left to the builder](#left-to-the-builder)
1.  [See also](#see-also)

## Why Kotak

- **Three keywords**: the problem statement asks us to track AI advancement, predict which skills and jobs will emerge or decline, and generate personalised reskilling pathways ([problem statement][d1-ps]). The engine covers the first two; the product covers the third.
- **A crowded user**: 17 of the 75 ideas in our [field simulation][field] serve this same worker. Uniqueness must come from the mechanism: Akinator-style questions, a hexagon built from the job's own tasks, and verdicts that visible rules set from dated data.
- **The name**: Kotak is Malay for box. Schrödinger's cat is alive and dead until someone opens the box. Each skill is rising and declining until the data opens the box, and the cat opens it.

[d1-ps]: /docs/sources/drive.google.com/domain-1-aiversecity.md#the-problem-statement
[field]: /docs/research/field-simulation.md

## Users

- **Main user: an individual worker in any industry.** The team meeting on 21 October named three types:
  1.  **Stay strong**: keep their current job safe.
  2.  **Pivot with a target**: move to a role they have in mind.
  3.  **Pivot without a target**: ask where they could go.
- **Government side**: a live, anonymous national view of which rising skills Malaysian workers lack most, for TalentCorp or HRD Corp. Jin Siang suggested it at 00:45:11. Each finished check-up stores only the role code, the 6 corner levels and the date in Postgres: Replit's database if we publish there, Neon otherwise. Totals show only for groups of 10 or more, and labelled sample rows fill the view until real ones arrive. It answers the organisers' call to target "a mix of businesses and government" ([briefing chat][chat]).

[chat]: /docs/sources/opening-briefing/chat.md

## Product flow

The user reaches a roadmap in about 3 minutes. The examples are made up.

1.  **Start.** The user picks a current job, a goal (one of the three types) and an impact area, such as health or education. A user who picks "pivot with a target" also picks the target job. Aiman, a front-end developer in Kuala Lumpur, picks "show me where I could go" and health.
2.  **12 yes/no questions.** The cat asks 2 can-do questions for each of the 6 corners of the user's current role, or of the target role for "pivot with a target", rising corners first. Each corner has a basic, a working and an advanced statement. The cat asks the working one first; yes leads to the advanced one, no to the basic one. Example: "Have you reviewed and fixed AI-written code before merging it?"
3.  **Future Skills Radar.** A hexagon of the 6 corners. The red line is the level the role will need in 12 months. The white line is the user's answers, labelled "self-reported". Each corner shows its verdict, reason and dated sources. A toggle switches between the slow and fast scenarios, and the red line moves.
4.  **Matched roles.** Three ranked roles, each with a fit score, its maths and named gaps. For "stay strong", this becomes "Your job's future": the current role, then 2 backup roles. Farah, a graphic designer in Penang, sees the current role first, then motion designer and UX designer. Matched roles reuse the 12 answers wherever their corners overlap the answered ones, labelled as estimates. When the user picks a role, the cat asks about its unanswered corners, so the chosen role is fully covered.
5.  **Roadmap.** Each milestone is the next can-do statement, done for real, with a time estimate and one free resource: a guide, a video, a community or an HRD Corp-claimable programme. Rising gaps come first; declining gaps are tagged "less important by 2027". Weekly hours start from part of the time AI could save the user on declining tasks, the AI dividend from [Dividen][dividen], and the user can edit them. Total hours divided by weekly hours gives a finish date. The practice project follows the impact area, and every corner and role has at least one SDG tag. The user ticks a milestone when they can honestly say yes to it, which raises that corner's level.
6.  **What changed.** When new trend data arrives, the app shows what moved and why. Example: "Testing AI output moved from Split to Rising, so it moved up your roadmap."

[dividen]: /docs/ideas/0001-dividen.md

## Engine

The engine tracks AI advancement and predicts what will rise or fall. Rules decide every verdict, and every number shows its source and date.

### Layered hierarchy

Hee Zi Jie proposed this at 01:21:15 of the meeting. Each layer has its own signal, and the engine collects only the layers above the user's role.

| Layer               | Signal                                             | Sources                                                                                                                                              |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Sector           | Where money goes                                   | DOSM Employment Statistics: vacancies by sector, quarterly since Q1 2015; Bursa sector indexes as context                                            |
| 2. Occupation group | Job data with history; Malaysia's automation split | DOSM Job Market Insights: online job offerings by major occupation group, quarterly since Q3 2019; [Economic Index][aei] Malaysia rows for 20 groups |
| 3. Role             | AI exposure, shortages, demand                     | Economic Index usage, Malaysia rows for 198 to 243 occupations; MyCOL editions; roles named in Job Market Insights                                   |
| 4. Skill            | What employers ask for                             | [O\*NET][onet] tasks; pasted job ads; Economic Index work-activity rows                                                                              |

- **Fallback**: when a layer has no Malaysian data, the engine borrows from the layer above, or uses global data, and labels it.
- **Known gap**: until skill-level demand history exists, each corner takes its role's demand direction, so corners differ through their AI data, not their demand.
- **Demand fallback**, in order: the role's own count, where [DOSM Job Market Insights][dosm-jmi] names it among a quarter's top roles; the role's presence across MyCOL editions, 2015/16 to 2024/25; its occupation group's Job Market Insights series; otherwise Unknown, which adds nothing to the target. The releases are PDFs under DOSM copyright, so we cite each figure with its quarter.
- **Research, 22 October**: [official sources](/docs/research/demand-official.md), [published and job-board data](/docs/research/demand-published.md) and [skill signals](/docs/research/demand-skills.md). No open Malaysian series tracks demand for individual skills, which is why corners differ through their AI data.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[dosm-jmi]: https://www.dosm.gov.my/portal-main/release-content/big-data-analytics-job-market-insights-q22026
[onet]: https://www.onetcenter.org/database.html

### Verdict rules

Each corner gets three inputs from dated snapshots:

1.  **AI use on the corner**: the Economic Index usage share for the corner's tasks, at the finest level published (task, then work activity, then occupation), Malaysia first, then global, labelled. It counts as rising when its projected 12-month change is more than 5%.
1.  **How AI is used on it**: mostly augmentation (people work with AI) or mostly automation (AI does the work), from the Economic Index collaboration split.
1.  **Demand for the role**: up, flat or down, from the demand fallback above.

| AI use on the corner | How AI is used | Demand | Verdict                     |
| -------------------- | -------------- | ------ | --------------------------- |
| Rising               | Augmentation   | Any    | Rising: AI helps it scale   |
| Rising               | Automation     | Any    | Declining because of AI     |
| Not rising           | Any            | Up     | Rising: AI can't do it yet  |
| Not rising           | Any            | Flat   | Steady                      |
| Not rising           | Any            | Down   | Declining for other reasons |

- **Split** covers corners where the two scenarios give different verdicts, or where sources point opposite ways. A Split corner shows both futures.
- **Unknown** means fewer than two dated points. The app always shows it.
- **Projection**: each trend runs 12 months ahead. Slow keeps Malaysia's current pace of AI use; fast moves Malaysia halfway to Singapore's level, which raises every corner's projected AI-use growth. kymil4's [Seberang notes][seberang] give May 2026 usage indexes of 5.81 for Singapore and 0.87 for Malaysia; [issue #50](https://github.com/TolongLabs/Kotak/issues/50) re-checks both. Every projection is labelled an estimate.
- **AI advancement**: the Economic Index is the main signal. One dated line from [Epoch AI][epoch] adds what frontier models can now do.

[seberang]: /docs/ideas/0005-seberang.md
[epoch]: https://epoch.ai/data

### Live extras

- **JobStreet: collected from 22 October.** The team scrapes JobStreet Malaysia's search results itself. An admin approves each batch's ads against an O\*NET occupation, and the approved ads show what employers advertise for a role, beside the verdicts (#271). DOSM's Job Market Insights stays the demand series behind the verdicts.
- **Pasted job ads.** A user pastes a public ad. Claude pulls out its skills, and code keeps only quotes that appear word for word in the ad, highlighted. The user sees their gap against that ad. The skills stay in that visitor's view and change no one else's verdicts; shared evidence would need a person to approve each ad, which the prototype skips.

## Universal roles pipeline

Kotak works for any job. The demo shows 2 or 3 cases.

1.  **Find the job.** O\*NET 30.1 covers about 900 occupations under about 56,500 alternate titles. For Malay or local titles, AI suggests the closest occupation and the user confirms it.
2.  **Build the corners.** O\*NET groups each job's core tasks into 332 intermediate work activities; 843 of 893 jobs have 6 or more groups. An AI step names the groups and merges them into 6 skills. It may only group the job's own tasks. A job with fewer groups adds supplemental tasks or shows fewer corners.
3.  **Write the questions.** AI drafts the three can-do statements per corner from the same tasks.
4.  **Run it once.** Steps 2 and 3 run as one batch for all jobs before the demo, for example on RunPod, so every job loads instantly.
5.  **Label quality.** Unchecked jobs show "auto-generated". People check the demo cases by hand.

The raw groups are uneven: for graphic designers, 10 of 17 core tasks fall into one group, and one group is "Operate industrial processing or production equipment". Matched and backup roles come from O\*NET's related-occupations list, ranked by fit score. O\*NET data needs its fixed CC BY 4.0 credit line ([trend data notes][trend]).

[trend]: /docs/research/trend-data.md

## Scoring rules

- **Level, 0 to 3 per corner**: yes to the working statement, then the advanced one gives 3 for yes or 2 for no. No to the working statement, then the basic one gives 1 for yes or 0 for no.
- **Target level**, a number from 1.0 to 3.0 per corner in the chosen scenario: 2, plus an AI effect of up to 1 that grows with the corner's projected AI-use growth (added for augmentation, subtracted for automation), plus 0.5 if demand is up or minus 0.5 if it is down, capped at 1.0 and 3.0. The red line draws this number, so every new snapshot and the scenario toggle move it. The verdict labels still come from the table above.
- **Fit score**: the sum over the corners of the lower of user level and target level, divided by the sum of target levels, as a percentage. Tapping the score shows the maths.
- **Levels on a matched role**, for the widest coverage the answers allow, tried in order:
  1.  The same intermediate work activity as an answered corner, weighted by shared task links, labelled "estimated from your answers".
  2.  The same broad work activity, labelled "rough estimate".
  3.  Otherwise "not asked yet", counted as 0 until the user picks the role and answers its questions.

  Across each job's 3 most related O\*NET roles, the first rule covers a median 44% of a matched role's task links, and the first two together a median 73% (lower quartile 57%).

- **Gap**: a corner where the user is below target. Its size is target minus user level.
- **Roadmap order**: rising gaps first, largest first; then Steady, Split and Unknown; declining last.

## Where AI works and where rules decide

- **Rules decide** question order, levels, verdicts, targets, fit scores, role ranking, roadmap order, finish dates and the "What changed" list.
- **AI writes** corner names, can-do statements, SDG tags and milestone time estimates in the batch, plus the explanations the cat reads, local title matches and skills from pasted ads.
- **AI never sets a score or a verdict**, following CareerSphere's rule, "the data decides; the AI interprets" ([winner teardowns][teardowns]).

[teardowns]: /docs/research/winner-teardowns.md

## Mascot

The counsellor is a cat. It asks the questions the way Akinator's genie does, opens the box on each verdict, reads the explanations and reacts in "What changed". The team keeps Live2D's sample models, Tororo and Hijiki, in the repo and credits them, a risk it accepted on 22 October. The [Free Material License][l2d] says "the Customer may not Redistribute all or part of the Material to third party" (clause 4.1.1). The [handbook][handbook] requires declaring third-party materials (6.3.3) and an Apache 2.0 repo (10.2).

[l2d]: https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html
[handbook]: /docs/sources/drive.google.com/participant-handbook.md

## Must-haves and the live demo

| Must-have ([brief][d1-must])    | Where Kotak covers it                                                    |
| ------------------------------- | ------------------------------------------------------------------------ |
| Skills profile intake           | Steps 1 and 2: job, goal, impact area and 12 can-do questions            |
| AI-trend signal layer           | The engine's dated snapshots and refresh script, and step 6              |
| Future-role matching            | Step 4: ranked roles, fit score with its maths, named gaps               |
| Personalised reskilling pathway | Step 5: ordered milestones, time estimates, free resources, finish date  |
| SDG mapping                     | Step 5: tags on every corner and role; impact area sets the project      |
| Handling uncertainty            | Step 3: two scenarios, Split verdicts with both futures, estimate labels |

**Live demo moment**: open 2 or 3 hand-checked cases, then press one button that switches the Economic Index snapshot from April to May 2026. The red line moves, corners that cross a threshold change verdict, fit scores and the role ranking update, the roadmap reorders and the cat says what changed. Pick demo cases where the real May data flips at least one verdict. The rubric names this as the feature to show: "the trend signal layer feeding role matching" ([rubric][d1-rubric]).

[d1-must]: /docs/sources/drive.google.com/domain-1-aiversecity.md#4-must-have-features
[d1-rubric]: /docs/sources/drive.google.com/domain-1-aiversecity.md#8-marking-rubric--preliminary-round

## Non-goals and anti-goals

- **Non-goals**: real CVs or personal data; the planted-mistake test, dropped on 22 October for time; expert or head-of-department input; social-media sentiment; training content; the first Kotak's employer hiring cards.
- **Anti-goals**, failures even if the app works: AI decides a score or verdict; an invented statistic; a claim without its source and date.

## Constraints

- **Deadline**: 7:59:59 AM, Sunday 25 October 2026 ([deadlines][deadlines]).
- **People**: 2 or 3 builders, mostly on Saturday. sdp-hack is due 11:59 PM Friday, Js Chew is in Jakarta, and Jin Siang has meetings Thursday and Friday.
- **Required tools**: Replit, where the organisers now accept use at any stage, and RunPod for any GPU work.
- **Repo and data**: a public Apache 2.0 repo, and synthetic profiles only.

[deadlines]: /docs/BRIEF.md#deadlines

## Decisions so far

The team, on 21 October:

- Individual workers as the user, because company needs vary too much by sector.
- The flow: onboarding, tailored questions, a sourced analysis, then a roadmap.
- The output: Jin Siang's hexagon, Js Chew's milestones to tick and free resources.
- Advisory but sourced suggestions: the app suggests and the user decides.
- A working prototype on Replit and RunPod, about 80% complete.
- Ruled out: our own AI benchmark, training people, expert input and social-media sentiment.

Hee Zi Jie, on 22 October:

- Can-do questions instead of the planted-mistake test, because they are simpler to demo and need no moderation.
- Universal roles with a few hand-checked demo cases, because Kotak must work in any industry.
- Action milestones with any free resource, because the gap is the point.
- The name Kotak, for a product personality rather than a generic exam platform.
- The layered hierarchy, and the Economic Index with Epoch AI as context.
- JobStreet ads only after an admin approves them, as context beside the verdicts rather than inside them.
- Matched roles get the widest coverage the answers allow, then questions for the chosen role's unanswered corners.
- Live AI calls through the Claude API, with Claude Opus 5.5.
- A live, anonymous national view backed by Postgres, instead of sample data.
- Borrowed: rules decide and AI explains, "What changed", the cat, reading pasted ads and the government view from the first Kotak; the AI dividend and the two scenarios from Dividen.
- The Live2D cat mascot.

### Calls Claude made

Defaults the team can overturn:

- A projected change of more than 5% counts as a move.
- The verdict table and the 1.0 to 3.0 target formula, revised on 22 October. The builder check found that the first version gave every corner the same target and kept the red line still when the data changed.
- The demand fallback order.
- Slow keeps Malaysia's pace; fast moves halfway to Singapore's.
- Pasted ads stay in the visitor's view, with no approval queue.
- The order of the matched-role levels, and their weighting by shared task links.
- O\*NET codes as the backbone, with related occupations for backup roles.
- The fit-score formula above.
- AI drafts SDG tags and time estimates in the batch.
- The national view stores no names, IDs or free text, shows totals only for groups of 10 or more, and starts with labelled sample rows.
- This file's place in /docs/ideas.

## Left to the builder

- **Left to the builder**: snapshot storage and refresh schedule; the exact projection formula within the defaults; the search-link format for resources on unchecked jobs; copy, animation and the cat's poses.

## See also

- [First Kotak](0006-kotak.md), [Dividen](0001-dividen.md) and [Seberang](0005-seberang.md)
- [Trend and skills data][trend] and the [field simulation][field]
- [Winner teardowns][teardowns], [graduate employability](/docs/research/graduate-employability.md), [career centres](/docs/research/career-centres.md), [hiring-bar evidence](/docs/research/hiring-bar-evidence.md) and the [Kotak roast](/docs/research/kotak-roast.md)
- [Brief](/docs/BRIEF.md), [context](/docs/CONTEXT.md) and the [Domain 1 problem statement](/docs/sources/drive.google.com/domain-1-aiversecity.md)

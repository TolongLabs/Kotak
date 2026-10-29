# Finalists analysis

Where Kotak stands against the 14 other Domain 1 finalists, and what that means for the last two days before the final on 1 November 2026. It summarises the scouting report prepended to each rival's README under [`docs/sources/finalists/`](/docs/sources/finalists/README.md), written on 29 October 2026 from the repositories as cloned on 28 October. Rivals keep building until the freeze, so treat every number here as a floor for them.

Contents:

1.  [Our goal](#our-goal)
1.  [How to read the scores](#how-to-read-the-scores)
1.  [Leaderboard](#leaderboard)
1.  [Threat tiers](#threat-tiers)
1.  [The must-haves across the field](#the-must-haves-across-the-field)
1.  [What is now table stakes](#what-is-now-table-stakes)
1.  [Where Kotak leads](#where-kotak-leads)
1.  [Where rivals are exposed](#where-rivals-are-exposed)
1.  [Kotak against the bar](#kotak-against-the-bar)
1.  [Strategy for the final](#strategy-for-the-final)
1.  [Chill Chill, up close](#chill-chill-up-close)
1.  [Method and limits](#method-and-limits)

## Our goal

Set by the team on 29 October 2026:

- **Target**: 80 or more on the final rubric, a top-3 place at minimum, aiming for gold.
- **The pitch carries the score.** 10 minutes, then 5 of questions ([participant handbook 6.7.3](/docs/sources/drive.google.com/participant-handbook.md#67-pitching-session)), with each 30 seconds over costing a point. As in the preliminary demo, the live demo sits in the middle of the pitch, so every refinement must earn its place in those minutes.
- **Wow factor matters.** Past hackathons say a memorable moment wins rooms, so the pitch and demo must be exceptional, not just complete.
- **Mentor panel**: one 15-minute session before several Domain 1 mentors in A3#512 on 31 October, booked from 9 AM to 1 PM ([final round page](/docs/sources/sdchack.my/team-portal.md#offline-mentoring-session)). Treat it as a full dress rehearsal.
- **Credits**: only the KrackedDevs keys (5 × US$20) are new for the final; Replit and RunPod credits were given in the preliminary round. The team already has ample AI build credit ([brief](/docs/BRIEF.md#support-and-contacts)).

## How to read the scores

Each rival was scored by a separate Muse Spark 1.3 worker that read the repository's code, data, tests and submission PDFs, and probed the live deployment where it could. Scores use the [preliminary rubric](/docs/sources/drive.google.com/domain-1-aiversecity.md#8-marking-rubric--preliminary-round) and the [final rubric](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#11-marking-rubric--final-round), 1 to 10 per criterion, weighted to /100, on a scale where 5 is an average finalist and 8 is clearly top 3.

- **Snapshot**: the final-rubric score if the team demoed the 28 October repository as it is.
- **Ceiling**: the worker's estimate of where the team lands by 1 November, assuming it closes its cheapest gaps. With AI coding tools and Saturday's mentor panel, assume every team reaches its ceiling.
- Different workers scored different teams, so differences of 2 or 3 points are noise. The tiers matter more than the ranks.

## Leaderboard

Sorted by ceiling. "Switch" is whether the product has an on-screen scenario switch, and whether flipping it re-ranks roles.

| Team                  | Product        | Prelim | Final snapshot | Ceiling | Switch                   | Threat | Report                                                                           |
| --------------------- | -------------- | ------ | -------------- | ------- | ------------------------ | ------ | -------------------------------------------------------------------------------- |
| ASEA                  | Path.AI        | 88     | 76.5           | 84–86   | Yes, re-ranks            | High   | [asea](/docs/sources/finalists/asea/README.md)                                   |
| Pecel Lele            | Adept          | 80.5   | 72             | ~80     | Yes, re-ranks            | High   | [pecel-lele](/docs/sources/finalists/pecel-lele/README.md)                       |
| Hands Off Our Rights  | Future Skills  | 84.5   | 74             | 78–80   | Yes, re-ranks            | High   | [hands-off-our-rights](/docs/sources/finalists/hands-off-our-rights/README.md)   |
| #slaynergy            | Jobbery        | 82     | 72.5           | 78–80   | Yes, dates move          | High   | [slaynergy](/docs/sources/finalists/slaynergy/README.md)                         |
| XH-Cat                | FutureReady MY | 77     | 67.5           | 76–80   | Yes, ranking never moves | High   | [xh-cat](/docs/sources/finalists/xh-cat/README.md)                               |
| Qart.ai               | Qart.ai        | 80     | 69.5           | ~78     | Yes, re-ranks            | High   | [qart-ai](/docs/sources/finalists/qart-ai/README.md)                             |
| Hoo Lee Sheet         | Laluan         | 74.5   | 68.5           | 75–79   | Yes, re-ranks            | High   | [hoo-lee-sheet](/docs/sources/finalists/hoo-lee-sheet/README.md)                 |
| Hokkien Mee Is Purple | Varity         | 74.5   | 64.5           | 73–76   | Yes, ranking never moves | Medium | [hokkien-mee-is-purple](/docs/sources/finalists/hokkien-mee-is-purple/README.md) |
| Xeno Force            | ArcTalent      | 77.5   | 67             | 72–75   | Yes, re-ranks            | High   | [xeno-force](/docs/sources/finalists/xeno-force/README.md)                       |
| Claypot Chicken Rice  | Jobee          | 75     | 66             | ~74     | Yes, re-ranks            | Medium | [claypot-chicken-rice](/docs/sources/finalists/claypot-chicken-rice/README.md)   |
| NoBugPls              | AiversePulse   | 77.5   | 65             | ~72     | Yes, side-by-side table  | High   | [nobugpls](/docs/sources/finalists/nobugpls/README.md)                           |
| Ctrl CV               | Future Skills  | 72     | 62             | ~70     | Yes, re-ranks            | Medium | [ctrl-cv](/docs/sources/finalists/ctrl-cv/README.md)                             |
| Chill Chill           | KerjayaKu      | 67.5   | 55             | 63–67   | None                     | Medium | [chill-chill](/docs/sources/finalists/chill-chill/README.md)                     |
| Dsaise                | EcoLingo       | 29.5   | 27             | 35–40   | None                     | Low    | [dsaise](/docs/sources/finalists/dsaise/README.md)                               |

**The bar for top 3 is about 80 on the final rubric**, and ASEA alone could reach the mid-80s.

## Threat tiers

1.  **Top contender: ASEA's Path.AI.** The only rival with all 6 must-haves live-ready and the highest ceiling. Live at pathai.lol with a 19-month "time machine" over its trend data, user-adjustable score weights, explanations with numbered sources and a number guard, three-language UI, free built-in courses with certificates, and a jobs, universities and funding step. Weak spots: a US and tech-heavy trend feed (Hacker News hiring posts), only 166 Malaysian on-site postings, and a tech declaration that describes an older stack than the one it runs.
1.  **Close pack, ceilings 76 to 80: Pecel Lele, Hands Off Our Rights, #slaynergy, XH-Cat, Qart.ai, Hoo Lee Sheet.** Each has a complete live journey with a working scenario switch and verified courses, and most have a second language or fairness tests. Each also has one gap a judge can find: see [where rivals are exposed](#where-rivals-are-exposed).
1.  **Credible, ceilings 70 to 76: Hokkien Mee Is Purple, Xeno Force, Claypot Chicken Rice, NoBugPls, Ctrl CV.** Strong in parts, but held back by narrow role coverage (6 to 9 roles), US or European data, simulated trends or a scenario switch that changes nothing.
1.  **Outside the race: Chill Chill and Dsaise.** Chill Chill will own the room's attention but misses must-have 6 entirely; see [up close](#chill-chill-up-close). Dsaise built an SDG quiz app that misses 5 of 6 must-haves.

## The must-haves across the field

Counts are of the 14 rivals, from each report's must-have table.

| Must-have                          | Live-ready | Partial | Missing | Note                                                                                                 |
| ---------------------------------- | ---------- | ------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 1. Skills profile intake           | 13         | 0       | 1       | Most take a CV upload with word-for-word quote checks                                                |
| 2. AI-trend signal layer           | 7          | 6       | 1       | The commonest weak point: frozen fixtures, simulated series, or refreshes that never moved a ranking |
| 3. Future-role matching            | 12         | 1       | 1       | Decomposable weighted scores everywhere; "why this score" is answerable for nearly everyone          |
| 4. Personalised reskilling pathway | 7          | 6       | 1       | Partials come from courses that are portal links, placeholders or uncovered skills                   |
| 5. SDG mapping                     | 10         | 4       | 0       | Several now re-rank roles by the user's chosen goal                                                  |
| 6. Handling uncertainty            | 10         | 2       | 2       | 12 of 14 have an on-screen switch; 10 of those re-rank roles                                         |

## What is now table stakes

These no longer set a team apart, because most of the top half already ships them. Missing one costs marks; having one earns little.

- **An on-screen scenario switch that re-ranks roles**: 10 of 14. Kotak does not have one ([TRD](/docs/TRD.md#projections-and-scenarios)).
- **Checked, dated courses**: ASEA, Hands Off Our Rights, Hoo Lee Sheet (198 courses), Pecel Lele (98), #slaynergy (97), Hokkien (77), Qart.ai, XH-Cat and Xeno Force all link to pages they checked. Most of Kotak's resources are unverified search links.
- **A second UI language**: ASEA, Chill Chill, Pecel Lele, #slaynergy (four languages, tested) and Xeno Force ship English, Malay and Chinese; Hoo Lee Sheet and Qart.ai ship Malay. Kotak is English only.
- **Fairness checks**: #slaynergy (a live Trust page), Pecel Lele (counterfactual tests) and Qart.ai (paired profiles) test for bias. Kotak has none and no PDPA write-up.
- **An employer or team view**: NoBugPls (HR console), Pecel Lele (organisation mode), Xeno Force (SME heatmap) and ASEA (HR heatmap). Kotak has none.

## Where Kotak leads

Every report's "where we beat them" list repeats the same advantages. These are hard to copy in two days, even with AI tools, because they take data, time or people:

1.  **Reviewed Malaysian job ads with ringgit pay beside the verdicts.** No rival has them. The nearest are ASEA's 166 Malaysian postings, Hoo Lee Sheet's JobStreet salary ranges and Chill Chill's 564 scraped ads with 94.7% missing salaries.
1.  **Breadth: about 923 O\*NET jobs and a job title in any language.** Rivals cover 6 (Xeno Force), 8 (Claypot), 9 (Qart.ai, Hokkien), 26 (Hands Off), 40 (Hoo Lee Sheet), 63 (ASEA) or 89 (#slaynergy) roles.
1.  **A real data change, shown.** Our Before/After switch shows what moved when May's data arrived. Pecel Lele's live data is a frozen fixture, #slaynergy's refresh has never processed a real release, Ctrl CV's series are simulated, and XH-Cat's and Hokkien's rankings cannot move when data changes.
1.  **Malaysian trend data.** The Economic Index for Malaysia and DOSM job ads, where several rivals lean on US (Claypot, Hokkien, Pecel Lele's BLS baseline) or European (Xeno Force, NoBugPls) data.
1.  **The guardrail and the platform.** The check that rejects any explanation that changes a verdict, Ask Kopi, and the same rules open over MCP. Only NoBugPls has anything comparable.

The roadmap's finish week that moves with weekly hours, the PDF export and the 12 can-do questions also beat most rivals' intake and pacing.

## Where rivals are exposed

What a judge's live checks would find, per the reports. Our demo should pass each of these checks visibly, without naming any rival.

- **"Change the trend data now"**: XH-Cat's and Hokkien's rankings cannot move by construction; Pecel Lele's live trends are a frozen fixture after a failed first refresh; #slaynergy cannot show a genuinely new release before DOSM's on 17 November; Ctrl CV's trends are simulated; Chill Chill's live site serves reference data labelled `demo: true`.
- **"Is this course real?"**: Ctrl CV's links are mostly the e-LATiH homepage; #slaynergy falls back to 20-hour e-LATiH placeholders; Qart.ai has 10 required skills with no course; Hands Off Our Rights covers only 26 of 186 skills with a free course; Claypot's pathway has no time estimates at all.
- **"Why this score?"**: Claypot shows no per-component breakdown on screen; #slaynergy's +12 SDG bonus can outweigh outlook gaps.
- **Speed and staging**: Hands Off Our Rights' skills test takes about 25 minutes; Hoo Lee Sheet's demo CVs are matched by hash to precomputed results; #slaynergy has demo auto-pass buttons that could look staged.
- **Declarations**: ASEA's and Ctrl CV's tech declarations describe a different stack from the one they run.

## Kotak against the bar

Kotak was not scored by a worker, so this is a provisional estimate on the same scale, by the agent that wrote this summary. Score Kotak with the same worker brief before relying on it.

| Criterion               | Weight | As of 29 Oct | After the priorities below | What moves it                                                                                  |
| ----------------------- | ------ | ------------ | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Innovation & Creativity | 25%    | 7            | 8                          | Malaysian ads, breadth and the guardrail, said plainly; scenario changing the SDG contribution |
| Technical Execution     | 25%    | 6            | 7.5                        | Scenario switch; checked courses on the demo roles; change test under a minute                 |
| Impact & Feasibility    | 20%    | 5            | 7                          | KPI counter output, cost per user, PDPA and a fairness test                                    |
| Problem-Solution Fit    | 15%    | 4.5 (capped) | 8                          | Must-have 6 shown live lifts the cap                                                           |
| Presentation & Pitch    | 10%    | 6            | 7.5                        | Rehearsed story, two of us answering                                                           |
| Design & UX             | 5%     | 7            | 7.5                        | Readable scenario and source labels                                                            |
| **Total**               |        | **about 59** | **about 76**               |                                                                                                |

As it stands, Kotak would land in the bottom half, mostly because the missing scenario switch caps Problem-Solution Fit. With the first five priorities done it reaches the close pack. Top 3 then depends on making our leads count in the demo and the pitch, where the weighting is heaviest.

## Strategy for the final

In order of marks per hour. Each names the criterion it serves.

1.  **Ship the scenario switch, and make it re-rank.** A toggle on the radar, roles and roadmap screens between "Malaysia's pace" and "fast", labelled as estimates. The engine already computes both futures (`neededSlow` and `neededFast`); the screens hard-code `DEFAULT_SCENARIO` (`apps/web/src/views/RadarView.tsx`, `RoadmapView.tsx`), and `ScenarioSwitch.tsx` exists only in the dev gallery. Check that flipping it moves the role ranking and the roadmap's finish week, not just labels, because two rivals fail exactly there. Then go one step further than anyone: let the scenario change the path's SDG contribution, which no rival does. _Problem-Solution Fit, Technical Execution, Innovation._
1.  **Make the change test our best minute.** Rehearse swapping the April and May snapshots until it takes under a minute, pointing at a verdict, a gap and a role rank that move, each with its source and date. Most rivals struggle with this check; we have the cleanest story. _Technical Execution, Innovation._
1.  **Check the courses on every demo role.** Replace search links with checked pages for the roles in the demo path, label the rest plainly as search suggestions, and call a course HRD Corp-claimable only where HRD Corp or the provider says so. _Technical Execution, Impact._
1.  **Fill the impact section with numbers.** Build the KPI counter (20 seeded profiles reaching a sourced roadmap in under 3 minutes) and paste its output into report section 4.1; add cost per user per month, a PDPA paragraph, and a paired-profile fairness test like Qart.ai's. All are cheap; together they are most of the 20% Impact criterion. _Impact & Feasibility._
1.  **Lead the pitch with what only we have.** Open on the reviewed Malaysian job ads with ringgit pay, the 923-job breadth and the real data change. Name the existing tools (MyMahir, MYFutureJobs, JobStreet, LinkedIn) and say what ours adds. _Innovation, Pitch._
1.  **Add Malay to the main journey if time allows.** Seven rivals have a second language; it earns credit under Impact and Design. Translate the check-up, radar, roles and roadmap screens and have a native speaker review them. Skip it before the first five.
1.  **Present the employer view as the next step.** Four rivals already have one. Don't build a thin version in two days; describe it honestly as the roadmap, since misrepresenting what the product does is barred.
1.  **Re-scan the rivals on the night of 31 October.** Re-clone the public repositories and re-run the same fan-out (about US$0.50 and 30 minutes) to see what they added. Use it to adjust the pitch, not the build.

## Chill Chill, up close

The 3D world is the biggest wow factor in the field, and it is real: KerjayaKu at [xmum-hackfinal.replit.app](https://xmum-hackfinal.replit.app/) lets the user walk an island, meet mentor NPCs, get matched to a career and raise a career pet by logging learning, in English, Chinese and Malay, with DeepSeek behind the mentors. The matching maths and SDG mapping are genuine.

It is not a top-3 threat on the rubric, because the rubric scores the six must-haves, not spectacle, and Design & UX is only 5%:

- **No scenarios at all.** The only "scenario" strings in the repository are inside scraped LinkedIn pages, so must-have 6 is missing and Problem-Solution Fit is capped.
- **Demo data on the live site.** The deployed trend endpoint returns `demo: true`, with the crawler on fallback, so the change test fails live.
- **Generic resources.** One documentation link or open textbook per skill, no HRD Corp entries.
- **Scraping risk.** Its trend sample comes from scraping LinkedIn and Indeed, whose terms may forbid it.

The worker could not render WebGL, so it judged the in-world journey from the code (`CareerWorld.js`, `CareerUI.js`, `CareerTour.js`). Its ceiling is 63 to 67 if it adds a scenario switch and wires its 564-ad sample into the live site. What to learn from it: a memorable demo moment matters, and our equivalent is the change test done crisply.

## Method and limits

- **Who wrote the reports**: 14 headless Claude Code runs on Meta's `muse-spark-1.3-contributor` at `xhigh` effort, one per team, each in its own copy of the repository, for about US$0.49 in total. Each prepended its report to the team's README between `kotak-scouting` markers, leaving the original README byte-for-byte intact below.
- **What was checked**: code, data, tests and PDFs, plus HTTP probes of every live deployment that had a URL. Spot checks confirmed Chill Chill's missing scenario code, #slaynergy's three futures (`futures-def.ts`) and ASEA's live site.
- **What was not**: no worker watched a demo video or saw a pitch, so every Presentation score is a guess; most could not click through signed-in flows or run test suites; WebGL and some image-only PDFs were unreadable.
- **One correction**: the Hoo Lee Sheet report lists the team leader's email and phone in its PDFs as a rule risk. It isn't one; the report template asks for them.
- **Bias**: the briefs described Kotak and its known weaknesses, so "threat to Kotak" judgments lean towards our weak spots. The scores themselves follow the rubric wording.

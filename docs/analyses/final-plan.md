# Final plan

How Team T010NG turns Kotak into a top-3 finish at the Domain 1 final on 1 November 2026: what we build first, how the 10-minute pitch runs, the moment we want judges to remember, and the questions we drill. It builds on the [finalists analysis](/docs/analyses/finalists/README.md), whose strategy it doesn't repeat, and on DrxgClanPC's [pitch skeleton](/docs/demo/final-pitch.md) (#361), and changes only what earns marks.

Contents:

1.  [The bet](#the-bet)
1.  [Score path to 80](#score-path-to-80)
1.  [Build priorities](#build-priorities)
1.  [Run of show](#run-of-show)
1.  [The demo path](#the-demo-path)
1.  [The moment judges remember](#the-moment-judges-remember)
1.  [Questions to drill](#questions-to-drill)
1.  [Schedule to the freeze](#schedule-to-the-freeze)
1.  [Rules that keep us lean](#rules-that-keep-us-lean)
1.  [Roast](#roast)
1.  [See also](#see-also)

## The bet

- **Judges score the six stages they watch, live.** A stage that is missing or only described caps Problem-Solution Fit ([brief](/docs/BRIEF.md#our-challenge)). Twelve of 14 rivals already show an AI-futures switch, and Kotak does not. So the first job is to ship must-have 6, and the second is to make all six stages easy to tick.
- **Our edge is proof, and the 3D space makes it visible.** The team is building a 3D spatial space. Chill Chill already has a 3D world, on demo data, so 3D alone is not new in this field. Ours draws only the engine's sourced numbers, so when the data or the AI future changes, the space moves. Under it sits what rivals cannot copy in two days: reviewed Malaysian job ads with ringgit pay, 923 jobs from a title in any language, and a plan that updates when a new month of real data arrives, with a source and a date on every number.
- **The pitch carries the score.** The demo gets 5 of the 10 minutes. The rest of the pitch is numbers, not adjectives.

Two words, used the same way everywhere, in issues, on screen and on stage: **AI futures** are must-have 6, slow and fast AI uptake. **What-would-you-do questions** are the check-up items. Never call the check-up items "scenarios" in front of judges, because the rubric uses that word for futures.

## Score path to 80

The [analysis](/docs/analyses/finalists/README.md#where-kotak-stands) puts Kotak at 61 today and 77 after its first five steps, so the last 3 or 4 points have to come from the pitch and from proof shown live. This plan spends them on four things: each of the six stages named aloud as we reach it (Problem-Solution Fit), the change test done on a judge's word (Technical Execution), measured impact numbers rather than promises (Impact & Feasibility), and three timed runs before the mentor panel, with two voices and two answerers (Presentation & Pitch). These are targets, not predictions.

## Build priorities

In order. Nothing lower starts until everything above it is done or owned. Status is from GitHub on 30 October, 2:30 PM.

| #   | Item                                                                                                                                                                                                      | Criterion                          | Issue                                    | Done by                       | Status                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AI-futures switch on Radar, Roles, Roadmap and the job page, feeding the 3D space, labelled estimates. Stretch: plan to the fractional target, so the path's hours and SDG contribution follow the future | Problem fit, Technical, Innovation | #389                                     | 30 Oct, 11:59 PM              | Switch done in #426, without the stretch; it feeds no 3D space yet                                                                                                                                        |
| 3D  | The 3D spatial space, on a parallel track (below)                                                                                                                                                         | Innovation, Design                 | To file (kymil4)                         | Gate: 31 Oct, after the panel | Not started: no issue, branch or code                                                                                                                                                                     |
| 2   | Checked courses on every demo role                                                                                                                                                                        | Technical, Impact                  | #369                                     | 30 Oct, 11:59 PM              | Draft PR #419                                                                                                                                                                                             |
| 3   | A one-line reason for each SDG target, and the path's total by target                                                                                                                                     | Problem fit, Innovation            | #391                                     | 30 Oct, 11:59 PM              | Done in #405, fixed in #413 and #414                                                                                                                                                                      |
| 4   | Impact proof: run the KPI counter, a paired-profile fairness test and a PDPA paragraph. The [cost card](/docs/cost-card.md) is done (#380)                                                                | Impact                             | #378, #379, #381                         | 30 Oct, 11:59 PM              | #379 and #381 in open PRs #422 and #418; #378 has no PR                                                                                                                                                   |
| 5   | Demo survival: a local build, cached Kopi answers, a public Replit copy and the backup video                                                                                                              | Technical                          | #386, #387; rest to check (kotak-dev-27) | 31 Oct, 11 PM                 | #387 closed and the link is public, but the Replit copy predates #426 and needs a republish from AlaskanTuna's account; #386 open; the local build and cached Kopi answers still have no issue            |
| 6   | Every final deliverable owned, the declaration checked against the code, then the commit port                                                                                                             | Eligibility                        | #376, #382 to #387                       | 1 Nov, 7:59:59 AM             | All owned. #376's replay script merged in #427, and its dry run replayed with no conflicts; #383's PRD section merged in #425, its PDF not yet exported; #382, #384, #385 and #386 open; #387 as in row 5 |
| 7   | Open polish PRs (#361 to #365): merge or park                                                                                                                                                             | Design                             | #355 to #359                             | 30 Oct, 11:59 PM              | Done: all five merged on 29 October                                                                                                                                                                       |
| —   | English, Bahasa Malaysia and Chinese behind one switch; an employer view: not built, named in the pitch as a next step                                                                                    | Impact, Design                     | #431                                     | 31 Oct, 11 PM                 | Languages in review, with the demo roles' questions translated and other jobs' questions in English; a native speaker checks the Malay and Chinese; employer view not built                               |

DrxgClanPC's what-would-you-do questions (#415) merged on 30 October, in English, Bahasa Malaysia and Chinese: 902 of 923 jobs ask them, so D2's line, "We ask what you would do", holds for every demo role. The other 21 jobs keep the can-do statements, worded for experienced users since #301.

Why the engine fix: kotak-dev-27 ran the engine for Aina on 29 October. Flipping to fast moves 3 of her 6 targets by 0.1 to 0.15 and swaps roles from rank 5 down, but her roadmap stays the same: 8 steps, 636.5 hours at her Working pace of 0.95 (#356), finish 22 January 2028. The roadmap plans each skill up to the next whole level (`packages/shared/src/rules/roadmap.ts`), so small target moves never change the hours; across all 923 jobs, total hours change for none. Planning to the fractional target makes every target move show in the hours, and so in the path's SDG contribution, which is counted in hours. With "Stay strong in my job", her current role stays first ([TRD](/docs/TRD.md#levels-on-matched-roles)), so the demo points at the radar, not the role order. Re-run the 923-job sweep after the fix, and agree the roadmap change with DrxgClanPC first, because #363 and #364 touch the same screen. kotak-dev-27 estimates the fix adds about 12 hours to Aina's full plan. The roast then showed that her roadmap's headline, "80% Fit by Week 34", stays put in both futures even after the fix, because the extra hours land after week 34 (`apps/web/src/views/RoadmapView.tsx`). So the fix earns the SDG claim, not a moving headline, and it is a stretch. #426 shipped the switch without it, so the fix is not built. Aina cannot carry must-have 6 alone; the 3D space below carries it, and Aina's small shift is said plainly, because a small, honest shift beats an inflated one.

**The 3D space.** The team decided to build it, and kymil4 owns it. Its job in the pitch is to make the change visible: it draws the engine's own numbers, so when May replaces April or the AI future flips, the space moves. Our proposal: plot all 923 jobs, with fit for the user's answers on one axis and AI-use growth on a log axis labelled an estimate, and mark Aina's job. The check-up ranks only her role and its related roles (`packages/sdk/src/checkup.ts`), so the space needs the sweep's fit for every job. In kotak-dev-27's sweep, flipping the future moves 753 of the 923 jobs by at least 1 fit point, up to 15, while Aina's moves by 1, so the market visibly shifts around her. Three conditions keep it from costing marks. Every number in it also shows in 2D, one key away. It follows [DESIGN.md](/docs/DESIGN.md). And it passes a gate on 31 October after the mentor panel: smooth on the pitch laptop over HDMI, no crash on reload, and the same numbers as 2D. If it fails the gate, it stays in the product and the pitch runs in 2D, because a stalled 3D scene on stage costs more than it earns. #369 moved to DrxgClanPC on 29 October to free kymil4 for it. #391 is done and #387 moved to AlaskanTuna, whose Replit account hosts the copy, so kymil4 has no other open issue. On 30 October the space has no issue, branch or code yet, so it has one day to reach its gate.

## Run of show

Scripted to 9:15, which leaves 45 seconds for a live check or a slow page. Changes from the skeleton: we open on Aina, not on us; the demo starts 40 seconds sooner and gets 5 minutes; impact becomes numbers; and "what changed since the preliminary" drops to 20 seconds.

| Time      | Beat                                                                                                                                                                                                                        | On screen              | Marks                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------- |
| 0:00–0:20 | Aina's moment: user, payer and moment in one breath (below)                                                                                                                                                                 | Slide: Aina            | Pitch, Problem fit     |
| 0:20–0:50 | Two numbers, each with its source on the slide, and the honest line "not yet, rather than not ever"                                                                                                                         | Slide                  | Problem fit            |
| 0:50–1:10 | Kotak in one breath: the box opens into Aina's 3D space (our call), then "Data decides. AI explains."                                                                                                                       | 3D space, or the slide | Innovation             |
| 1:10–6:10 | Live demo: [the demo path](#the-demo-path)                                                                                                                                                                                  | App                    | Technical, Problem fit |
| 6:10–6:50 | How it works: a weekly check, switched off since 24 October, finds new releases and opens a pull request a person approves; fixed rules decide; Claude explains, and a check rejects any explanation that changes a verdict | One diagram            | Technical              |
| 6:50–7:20 | Why Kotak: MyMahir, MYFutureJobs, LinkedIn and e-LATiH, then what only we do                                                                                                                                                | One grid               | Innovation             |
| 7:20–8:30 | Impact in numbers: the KPI result, the cost card's pitch line, the free share of a path, channel and payer, PDPA, fairness test                                                                                             | Two slides             | Impact                 |
| 8:30–8:50 | What changed since the preliminary: three changes, each tied to judge or mentor feedback                                                                                                                                    | One slide              | Technical              |
| 8:50–9:15 | Close: echo Aina, the ask, the QR codes                                                                                                                                                                                     | Slide                  | Pitch                  |

The opening, about 40 words: "Meet Aina, a sample web developer in KL. This week her company rolled out AI coding tools. Her manager has HRD Corp levy money and one question: which skill should she learn first? Nobody can answer that today. Kotak can."

Two voices: DrxgClanPC talks and faces the judges, and a second teammate drives the laptop, so no one narrates clicks. This is our call; confirm the driver as a team.

If we run long, cut in this order: what changed since the preliminary, the grid's detail, then the SDG step-picking. Never cut a stage.

## The demo path

One sample persona, Aina (Working, Web Developers, "Stay strong in my job", 10 hours a week), through the guide's six stages in one session. The presenter names each stage aloud: "Stage 3 of 6: matching." Each line is a result, not a click.

Decided on 29 October: the demo opens on Aina, not on "type your own job". A persona is common practice in a live demo, because it lets the room step into the target user's shoes, and the guide's demo journey expects one synthetic user. "Your own job" waits for questions.

| Step | Time | Stage          | Show                                                                                                                                                                       | Line                                                                                                                                                  |
| ---- | ---- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1   | 0:25 | 1 Intake       | Check-up start; type the job title in Malay (check it maps first)                                                                                                          | "Any job title, in any language: 923 jobs."                                                                                                           |
| D2   | 0:30 | 1 Intake       | What-would-you-do questions, answered with keys 1 to 4                                                                                                                     | "We ask what you would do, not how good you think you are."                                                                                           |
| D3   | 0:40 | 2 Trend signal | Radar: verdicts with source and date, the red "needed by" line, the job-ads card with ringgit pay                                                                          | Read one source and its date aloud.                                                                                                                   |
| D4   | 0:35 | 3 Matching     | Your Job's Future, then See the Maths                                                                                                                                      | "Why this score, and what would raise it."                                                                                                            |
| D5   | 0:40 | 4 Pathway      | Roadmap: ordered steps, hours, finish week, funding route; open one course                                                                                                 | "Every course on this path is a real page."                                                                                                           |
| D6   | 0:25 | 5 SDG          | Tags with a reason on skills and roles; the path's contribution                                                                                                            | Say what Aina would lose without the tag.                                                                                                             |
| D7   | 0:35 | 6 Uncertainty  | Flip from slow to fast in the 3D space: hundreds of jobs shift, Aina's barely moves. 2D fallback: her radar (two targets rise, one falls), then one fast-moving job's page | "If AI moves faster, the market moves. For Aina, two targets rise and one falls, each by 0.1 to 0.15 of a level: the skills she needs barely change." |
| D8   | 0:50 | Change test    | Ask a judge to say when, then load May over April: April's six Unknowns get their first dated verdicts, and her plan reorders                                              | Pause. "Same answers. New month. With one month, Kotak said Unknown: it won't guess."                                                                 |

That is 4:40 of beats and 20 seconds for page loads. If the 3D space passed its gate, D7 and D8 run in it: the space moves when the judge says when, and again when the future flips, while each number stays readable in 2D.

## The moment judges remember

"Same answers. New month." The guide says judges may ask us to change the trend data. We offer before they ask: "You may ask us to change the trend data. Let's do it now. Say when." A judge says when, and the driver loads May over April. With April alone, all six of Aina's skills read Unknown, because a trend needs two dated points (`packages/shared/src/rules/verdicts.ts`). With May, each gets its first verdict, with its source and date, and her plan reorders. We say exactly that: Kotak would rather say Unknown than guess. Then the fast AI future moves the market around her. Two things move a career plan, new data and the future, and Kotak shows both, with sources.

Never say "the market moved". No newer Economic Index release exists: on 29 October the latest was the 26 June 2026 release, with April and May only, and the March 2026 release is a one-week sample in another format, too thin to mix in (kotak-dev-27 checked). So the change test stays Unknown to verdict, framed as above.

Why it works: the 3D space gives the room something to watch, and the judge's own word proves nothing is staged. That matters to a panel of mostly business leaders, because the guide's common mistakes include "pre-recorded or hard-coded output presented as live" ([brief](/docs/BRIEF.md#judging)). If no judge answers, the driver clicks anyway. If the live site is down, the local build carries the same two snapshots. If the 3D space stalls, the driver goes back to 2D with one key and carries on.

Held for questions, not the 10 minutes: "Want to see your own job?" Any judge's job title opens its radar in seconds.

## Questions to drill

The skeleton's [questions to expect](/docs/demo/final-pitch.md#questions-to-expect) cover the guide's six, and the analysis's [step 7](/docs/analyses/finalists/README.md#strategy-for-the-final) names three the field invites. Answer these, each in one sentence, then show the proof. First answerers are our guess from who built what; confirm them as a team.

| Question                                                 | One-sentence answer                                                                                                                                                                             | Proof               | First answerer |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------- |
| "Where is the AI, if rules decide?"                      | AI reads, writes and explains: it drafted skills for 923 jobs and writes the questions, but it never decides a career                                                                           | How-it-works slide  | kymil4         |
| "Is the Economic Index a job signal?"                    | No, it is an AI-usage signal and is labelled so; DOSM job ads carry demand                                                                                                                      | Radar source labels | chaosiris      |
| "JobStreet's terms forbid scraping. How do you get ads?" | The decision in #277, worded by its owner before the panel                                                                                                                                      | Job-ads card        | chaosiris      |
| "Why no CV upload?"                                      | Kotak asks what you can do, not what your CV claims, and keeps no CV, sign-up or demographic fields, so nothing protected can reach a verdict                                                   | Check-up            | AlaskanTuna    |
| "Which languages does it speak?"                         | English, Bahasa Malaysia and Chinese, behind the EN, BM and 中文 switch. The demo roles' questions are translated; other jobs keep English questions under a translated interface               | Top bar             | AlaskanTuna    |
| "Who pays, and would a business adopt it?"               | Employers that pay the HRD Corp levy, at a test price of RM5 per worker per month; today they get each worker's plan, and the employer view is the next step                                    | Impact slide        | AlaskanTuna    |
| "How is this different from MyMahir?"                    | MyMahir lists roles and skills; we add a scored gap, a timed plan, two AI futures and SDG targets, all dated                                                                                    | Grid slide          | AlaskanTuna    |
| "Is it fair?"                                            | The rules never see a name, gender or race, and the paired-profile test (#379) shows results differ only where answers or pace do                                                               | Test output         | kymil4         |
| "What if a source goes down?"                            | The app keeps the last good snapshot and shows its date (verify before drilling)                                                                                                                | Radar date          | DrxgClanPC     |
| "Why only two futures?"                                  | They are two explicit parameters, labelled estimates; a third future is one more parameter                                                                                                      | See the Maths       | DrxgClanPC     |
| "So fast just multiplies everything by 3.84?"            | Growing AI use, yes; shrinking use shrinks 3.84 times slower. One explicit parameter from real data, Malaysia halfway to Singapore's AI use per head, the same for every job, as the guide asks | See the Maths       | DrxgClanPC     |
| "Is the 3D space just for show?"                         | No: every shape is a number from the engine, and the same number, with its source, is one key away in 2D                                                                                        | The 2D key          | kymil4         |
| "What changed in the job market between April and May?"  | We don't claim it changed: with April alone Kotak says Unknown, because a trend needs two dated points, and May made the trend visible                                                          | What Changed        | chaosiris      |
| "Do the job ads change the plan?"                        | No: the reviewed ads show today's Malaysian market in ringgit beside each verdict; job-ad demand data moves the targets                                                                         | Radar               | chaosiris      |

Drill: every teammate answers every question once, aloud, in under 15 seconds, before the mentor panel.

## Schedule to the freeze

| When                         | What                                                                                                                     | Who                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| Thu 29 Oct, night            | Plan agreed after the roast; owners of #355 to #359 settled                                                              | AlaskanTuna             |
| Fri 30 Oct                   | Build priorities 1 to 4; at 10 PM, the first timed full run, recorded                                                    | Builders, then the team |
| Sat 31 Oct, 9 AM sharp       | Book the mentor panel                                                                                                    | AlaskanTuna             |
| Sat 31 Oct, 10:30 AM to 1 PM | Two timed runs                                                                                                           | Team                    |
| Sat 31 Oct, panel slot       | Full dress rehearsal, 10 minutes plus 5 of questions; ask what they would challenge                                      | Team                    |
| Sat 31 Oct, after the panel  | 3D gate; fix only what the mentors flagged; freeze the demo path at 11 PM; record the backup video (#386); rival re-scan | Team, kotak-dev-27      |
| Sun 1 Nov, about 12 AM       | Commit port, per the #376 runbook                                                                                        | AlaskanTuna             |
| Sun 1 Nov, 7:59:59 AM        | Repository freeze                                                                                                        | —                       |
| Sun 1 Nov, from 8 AM         | One run on the room's projector if allowed; watch Discord for our slot                                                   | Team                    |

Status on 30 October, 2:30 PM: #355 to #359 are closed, but the review points in #410 still wait on team calls, so the plan is not yet agreed.

## Rules that keep us lean

Overthinking is the main risk now, so:

- One persona, one path. No second demo user.
- The 3D space is the only new spectacle. Chill Chill's 3D world is the field's biggest wow, yet its ceiling is 63 to 67, because the rubric pays for the six stages ([analysis](/docs/analyses/finalists/README.md#chill-chill-up-close)). Ours must carry the stages, not replace them.
- No new feature after 30 Oct, 11:59 PM, except fixes to the AI-futures switch, and the 3D space up to its gate.
- No new slide after the mentor panel, except fixes the panel asks for.
- A roast point changes this plan only if it costs marks and its fix fits the schedule.
- If a choice takes more than 10 minutes to discuss, the presenter decides.

## Roast

One Codex expert (`gpt-6-astra`, max effort) roasted this plan on 29 October. It hit its 40-minute limit while ranking its findings, so these come from its log, and each was checked against the code before it changed anything here.

| #   | Attack                                                                                                     | Verdict              | What changed                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | The change test's six flips are Unknown to verdict: April alone has one dated point, and a trend needs two | True                 | D8 and the moment now say so plainly; no newer Economic Index release exists to make it a market change (checked 29 October) |
| 2   | Aina's headline, "80% Fit by Week 34", stays put in both futures, even after the #389 fix                  | True                 | The 3D space carries must-have 6; the fix became a stretch                                                                   |
| 3   | The fast future raises two of Aina's targets and lowers one, not three                                     | True                 | D7 fixed                                                                                                                     |
| 4   | A person must adopt each new Economic Index release; the refresh is not automatic                          | True, and a strength | How it works now says a weekly check opens a pull request that a person approves                                             |
| 5   | The job-ad cards do not drive recommendations                                                              | True                 | A Q&A answer says what they are: evidence beside each verdict                                                                |
| 6   | The SDG control only highlights steps                                                                      | Partly               | Picking steps by goal is the user acting on the tag, which the SDG test asks for; #391 adds reasons and the path's total     |
| 7   | What does an employer get for RM5?                                                                         | Fair                 | The answer now says: each worker's plan today, the employer view next                                                        |

What held: the bet itself, proof over spectacle, Malaysian breadth and honest estimates, drew no attack. What broke: two demo beats claimed more than the engine does. Both now say only what is true, and must-have 6 leans on the 3D space, so its gate on 31 October matters more.

## See also

- [Finalists analysis](/docs/analyses/finalists/README.md) and the [brief's judging section](/docs/BRIEF.md#judging)
- [Pitch skeleton](/docs/demo/final-pitch.md) (#361) and the [cost card](/docs/cost-card.md)
- [Domain 1 finalist guide](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md), sections 4 and 11 to 13

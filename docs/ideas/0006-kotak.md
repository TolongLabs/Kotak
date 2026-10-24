# Kotak

Kotak, Malay for box, opens the box that Malaysian AI-native graduates keep guessing at: what employers now test for junior tech roles. Students get dated, cited verdicts on what employers want, where they fit and what to do next. Hiring leads publish what they actually test and see how their bar compares, and government sees the combined picture. It comes from a brainstorm on 21 October 2026 built on AlaskanTuna's own experience as a computer science student, and is written up so the team can compare it with the [20 October ranking](0000-ranking.md) and lock an idea tonight. Six simulated experts attacked the first version the same evening; this version carries the five reinforcements AlaskanTuna accepted from that [roast](/docs/research/kotak-roast.md). Kotak is a working name.

Contents:

1.  [User and moment](#user-and-moment)
1.  [Goals and limits](#goals-and-limits)
1.  [How it works](#how-it-works)
1.  [Evidence and data](#evidence-and-data)
1.  [The six must-haves](#the-six-must-haves)
1.  [Why it stands out](#why-it-stands-out)
1.  [Live demo for the preliminary](#live-demo-for-the-preliminary)
1.  [Build plan to 25 October](#build-plan-to-25-october)
1.  [Hardest risk and fallback](#hardest-risk-and-fallback)
1.  [Late ideas](#late-ideas)
1.  [Against the 20 October shortlist](#against-the-20-october-shortlist)
1.  [Deciding tonight](#deciding-tonight)
1.  [Decisions so far](#decisions-so-far)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## User and moment

- **Primary user**: a Malaysian computer science student or fresh graduate who works AI-native and must decide how to spend the next few months: LeetCode, hackathons, a startup or a portfolio. Nobody tells them what employers still want; AlaskanTuna called it a Schrödinger's box. Today they piece the answer together from LinkedIn, X, Reddit, Facebook and talks at events and career fairs, so the loudest opinion wins.
- **Business user, 70% of the pitch**: the hiring lead or engineering manager who designs a company's junior hiring process, the people students meet at career fairs. They can't see what other Malaysian employers test either. Publishing a card shows them how their bar compares.
- **Government user, 30% of the pitch**: TalentCorp and the Ministry of Higher Education, who steer graduate programmes and MyMahir.
- **Why now**: graduates find work, but often below their skill level. In Q2 2026, 74.3% of employed tertiary-educated 15–24-year-olds worked in semi-skilled or low-skilled jobs. Employers say they want AI skills, and 65% of Malaysian leaders would rather hire a less experienced candidate who has them, but no Malaysian source says how employers test for them ([hiring-bar evidence][hbe]).

[hbe]: /docs/research/hiring-bar-evidence.md

## Goals and limits

- **Goals**: a student gets from profile to verdicts, ranked roles and a dated plan in minutes, one decision per step. Every claim shows its source and date, and every verdict shows how many sources it rests on. A hiring lead publishes their bar in two minutes. New evidence visibly changes verdicts and plans, and new skill evidence re-ranks roles.
- **Non-goals**: a job board or applications, real recruitment integrations, course content, payments, scheduled scraping of any site, CV upload in the pilot, fields beyond tech in the first version (design and law come later), and countries beyond Malaysia.
- **Anti-goals**, which would mean failure even if the app works: an open chatbot that answers anything; any invented employer, job, course or statistic, including sample employers in the demo; the AI deciding a verdict; the app making the career choice instead of the student.

## How it works

The student flow goes step by step, so each screen asks for one decision:

1.  **You**: course, skills, proof (projects, hackathons, internships) and target roles, by form. The pilot uses sample profiles only, never real CVs.
2.  **The box**: a fixed list of hiring-bar questions, such as "Are LeetCode-style tests still the gate?" and "Are AI tools allowed in interviews?". Each gets a verdict of Settled, Split or Unknown with its count, such as "Split: 1 employer yes, 1 no", and its evidence one tap away. A market line shows the latest official underemployment figure.
3.  **Your roles**: ranked roles, each with a skill-fit score out of 100, its reasons ("6 of 7 skills employers list") and the gap. Only skill evidence moves these scores. Each role also shows its AI-usage outlook from the Economic Index, dated and labelled an estimate.
4.  **Your plan**: ordered steps with time estimates, mixing real free courses with proof-building steps such as shipping a project or entering a hackathon. Interview-format verdicts shape the plan: where a verdict is Split, the student sees two plans, such as "if algorithm tests stay" and "if AI-assisted tests spread", each labelled an estimate. The student also picks an impact area, such as health, energy or digital inclusion, and the plan's proof-building project changes to match.

When new evidence arrives, a **What changed** note shows which verdict moved and its new count, how the plan changed, and whether the roles re-ranked.

The box asks six questions, agreed on 21 October. Questions 2 to 4 are about interview format, so they change the plan; questions 1, 5 and 6 are market context.

1.  Do employers want AI skills from juniors? Settled at launch by three surveys.
2.  Are LeetCode-style tests still how you get hired? Unknown at launch, with Grab's page as one yes; real cards decide it.
3.  Are AI tools allowed in interviews and take-home tests? Unknown at launch.
4.  Does a portfolio or hackathon record count more than a degree or GPA? Unknown at launch.
5.  Are entry-level tech roles shrinking in Malaysia? Unknown, with underemployment shown as context.
6.  Which tech roles are in short supply? Settled by MyCOL.

The hiring lead's side has three steps: **declare** the junior hiring bar in two minutes (interview stages, AI rules, the proof they value and the skills they list), **see** the market view of how it compares, and **publish** a dated hiring-bar card to link from job ads. A card describes the format, not the questions, so candidates can't game the test; Grab already publishes its stages. Cards are anonymous by sector and size by default, such as "Malaysian fintech, 200 to 1,000 staff", and name the company only with consent and a verified work email. The government view is the same market view, rolled together with official data into a Malaysian hiring-bar index.

**Rules decide; the AI reads and explains.** Verdicts, scores and plan order come from fixed rules, so the same evidence always gives the same result. An open-weights model on RunPod turns pasted source text into structured evidence (who said it, where, when and what) and quotes the line behind each field. Nothing counts until a person approves it, with one click in the same evidence drawer. The AI also phrases each result in plain words, but it can't add a job, course or statistic that isn't in the data.

## Evidence and data

AlaskanTuna's trust rule is "statistics from major industry leaders, cited and grounded with trustworthy sources". So evidence has three tiers:

1.  **Counts most**: statistics from official or major sources, and an employer's own published hiring bar.
2.  **Counts less**: named statements by leaders at major companies, quoted with a link.
3.  **Shown, never counted**: Reddit, X and Facebook chatter, displayed beside the verdict as "what people say".

Malaysian evidence is thin ([hiring-bar evidence][hbe]). Official data on graduate underemployment and four employer surveys on AI skills exist, but nothing on interview formats, AI use in interviews, or portfolios versus degrees. Those verdicts start as Unknown, which is honest, and real cards fill them in.

**Verdict rules** (proposed): only Malaysian evidence in tiers 1 and 2 counts, and global evidence shows as context. A question is Settled when at least two counted sources agree, or when one official statistic answers it directly. It is Split when counted sources disagree, and Unknown otherwise. Every verdict shows its count. Grab's regional engineering hiring page counts, as an employer's own description of its process.

**Real evidence only.** The demo uses no sample employers. It starts from the checked Malaysian figures, Grab's page and 5 to 10 real cards from mentors and the team's contacts, collected by 24 October through a two-minute form. Each visitor's changes stay in their own browser, and a Reset button restores the starting state, because preliminary judges set up and test the project alone ([brief](/docs/BRIEF.md#repository-requirements)).

**Roles and skills** (proposed): 8 to 10 computer science roles with skill lists from MyCOL and TalentCorp's skills mapping, which lists AI engineer as an emerging role, copied by hand with source and date. O\*NET 31.0 (CC BY 4.0) fills gaps only as a labelled fallback, marked "adapted from O\*NET 31.0" on each adapted role ([trend data][trend]). Employers' own skill lists, from cards and pasted pages, add to these.

**Courses** (proposed): a small cited list of real free courses and HRD Corp or MDEC programmes for the demo roles' gaps.

[trend]: /docs/research/trend-data.md#occupation-and-skills-taxonomies

Updatable feeds:

- **OpenDOSM** skill-related underemployment by age: quarterly, CC BY 4.0, no key, next update 11 November 2026.
- **Anthropic Economic Index** Malaysia rows, as dated snapshots with a refresh script ([context][ctx-data]). The change between two snapshots sets each role's AI-usage outlook: whether AI use in that occupation is rising, and how much of it is automation rather than augmentation. AlaskanTuna chose this on 21 October, because predictions need reliable data, not vibes and overheard news. The outlook is shown beside each role, not added to its fit score.
- **Hiring-bar cards**, dated the moment an employer publishes one.
- **Public employer pages**, pasted in by a person, never scraped. A page becomes evidence only after a person approves the extraction.

OpenDOSM doesn't update before the preliminary closes, so new evidence during the hackathon comes from cards and pasted pages.

[ctx-data]: /docs/CONTEXT.md#trend-and-skills-data

## The six must-haves

| Must-have             | How Kotak meets it                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Skills profile intake | Step 1: a form, with sample profiles only                                                                                   |
| AI-trend signal layer | Cards and pasted pages read by a RunPod model, plus OpenDOSM and Economic Index snapshots, each with source and date        |
| Future-role matching  | Step 3: ranked roles with a skill-fit score, its reasons, a named gap and an AI-usage outlook                               |
| Reskilling pathway    | Step 4: ordered steps with time estimates, from a cited course list and proof-building work                                 |
| SDG mapping           | Step 4: the student picks an impact area, and the plan's project changes to match, tagged with its SDG target               |
| Handling uncertainty  | Settled, Split or Unknown verdicts with their counts; each Split gives two plans, and every outlook is labelled an estimate |

## Why it stands out

- **The mechanism is new.** In the [field simulation][field], 9 of 75 rival ideas target students and graduates, so the user alone won't set Kotak apart. None of the nine clusters weighs employer evidence into verdicts, and none grounds its scenarios in real disagreement between employers.
- **It creates the missing Malaysian statistic** instead of waiting for one. Each hiring-bar card is a data point nobody publishes today, and the pitch can say how many real cards came in during the hackathon.
- **It goes past the closest winners.** PivotPath's match scores and automation risk come from Claude, and CareerSphere scored with fixed rules but showed one answer ([teardown][teardown]). Kotak scores with rules, shows its counts, and turns disagreement into two plans.
- **The team is the user.** Comparable winners often come from the founders' own lives ([context][ctx-winners]).
- **It answers the organisers' two warnings**: it isn't "upload a CV and ask a chatbot", because rules decide, and it isn't a mock-up, because the loop runs end to end on real evidence.

[field]: /docs/research/field-simulation.md
[teardown]: /docs/research/winner-teardowns.md
[ctx-winners]: /docs/CONTEXT.md#comparable-winners

## Live demo for the preliminary

1.  Load a sample student: final-year computer science, Python and React, two hackathons. Step 2 shows "Are LeetCode-style tests still the gate?" as Unknown, with one real card that says no.
2.  Open the evidence drawer and paste Grab's real engineering hiring page. The RunPod model extracts the stages, the AI rule, the proof valued and the skills, and highlights each quote, such as "1–2 coding questions in real-time".
3.  Click Approve. The verdict moves to "Split: 1 yes, 1 no", and What changed cites the page and its date.
4.  The plan splits into two: "if algorithm tests stay" puts data-structure practice first, and "if take-homes spread" puts a shipped project first. The roles stay put, because interview format says nothing about fit.

That is the "trend signal layer feeding the role matching" the organisers asked to see ([brief][brief]). The demo needs at least one real source on each side of one question. Today the team has one, Grab's page, so the card form must bring in at least one real "no" by 24 October. The demo source's extraction is cached, so a RunPod cold start can't stall a judge.

[brief]: /docs/BRIEF.md#our-challenge

## Build plan to 25 October

The team also has sdp-hack due on Friday 23 October at 11:59 PM, so Friday stays light and the work runs in two tracks, build and docs. Who takes each track, and for how many hours, is the first item for tonight.

1.  **21 October, tonight**: lock the idea; lock the stack, both models and the score formula, because the Technical and Tools Declaration names them; create the new repository with an Apache 2.0 licence; book a mentor before every remaining slot's 24-hour cutoff passes on 22 October; send the two-minute card form to mentors and contacts.
2.  **22 October**: build: evidence schema, seed evidence (the checked Malaysian figures, Grab's page, the role skill lists and the course list), verdict rules with counts, the OpenDOSM fetch with a dated cache, Economic Index outlook snapshots for the demo roles, the RunPod extraction step with a cached fallback, and student steps 1 and 2. Docs: PRD draft and declaration.
3.  **23 October**: sdp-hack day. Student steps 3 and 4 if anyone has time; chase card replies.
4.  **24 October**: build: What changed, the evidence drawer with Approve, the hiring lead's declare and publish steps, the market view, per-visitor state with Reset, the Replit deploy, and the Replit and RunPod proof. Docs: deck, video, a decision log and a data card.
5.  **25 October, before 7:59 AM**: submit, then open every link in an incognito window.

**Cut line** (proposed): the live link has the four student steps with form intake, the box with counts, What changed, the evidence drawer with RunPod extraction and Approve, the hiring lead's declare and publish steps, and the market view. Out of the build: a separate review screen, scheduled scraping, CV upload, the Akinator intake and the Live2D companion. When time runs short, the student flow and the evidence drawer win, because they carry all six must-haves and the demo, and the market view moves to the deck.

Proposed RunPod step: an open-weights model on RunPod Serverless extracts evidence from pasted text and quotes each field, the "text to decisions" pattern from Runpod's 21 October workshop. Warm the endpoint before recording. Proposed Replit setup: a Reserved VM, so the demo never sleeps ([context][ctx-marks]).

The decision log and data card follow CareerSphere, whose team says process was half its judging ([teardown][teardown]).

[ctx-marks]: /docs/CONTEXT.md#what-wins-marks

## Hardest risk and fallback

- **Thin Malaysian data means many Unknown verdicts.** Present Unknown, with its count, as the honest answer and the reason Kotak exists, and label global evidence as global.
- **Too few real cards by Sunday.** The demo needs one real source on each side of one question. If the card form brings no "no", find a real Malaysian hiring page that describes a take-home instead of live coding, and use it in its place.
- **Employers fear gaming or exposure.** A card describes the format, not the questions, and stays anonymous unless the employer opts in.
- **The AI misreads a source.** Each extracted field shows its quote, nothing counts before Approve, and every verdict links to its sources.
- **The Economic Index measures Claude usage, not jobs.** Label it an AI-usage outlook, show both snapshot dates, keep it out of the fit score, and present every outlook as an estimate.

## Late ideas

AlaskanTuna's late ideas from the session, decided after the roast:

- **Akinator-style intake**: cut from the build. A form is faster to build and to demo.
- **Web scraping for evidence**: cut. A person pastes public pages into the evidence drawer instead, which also keeps clear of sites whose terms forbid scraping, such as LinkedIn and JobStreet.
- **Personalised AI suggestions**: kept. The AI phrases each verdict, role and plan step for the student, while rules still decide the content.
- **A companion counsellor**: the Live2D runtime is cut. Live2D's Free Material License bars redistributing its sample models (clause 4.1.1) and sublicensing them (clause 4.1.5), so Tororo and Hijiki can't go into our public Apache 2.0 repository. If the team wants a companion, it uses a few static cat poses we generate and own, and only if time remains.

## Against the 20 October shortlist

kymil4's [ranking](0000-ranking.md) was produced by AI models without team review, so this compares rather than scores.

| Idea                         | Primary user                                    | Its edge over Kotak                                            | Its weak spot                                                          |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Dividen](0001-dividen.md)   | HR or L&D lead after an AI rollout              | A clear business buyer; every number from data already checked | The hours are AI estimates, not measurements; the pledge is unenforced |
| [Tanding](0002-tanding.md)   | L&D lead running an "AI at work" session        | The panel's only unanimous 5 for innovation                    | Feasibility averaged 2.3 of 5; tasks and rubrics are slow to write     |
| [Baki](0003-baki.md)         | Head of customer service with an AI support bot | A concrete business moment                                     | Synthetic bot logs can look like invented evidence                     |
| [Cermin](0004-cermin.md)     | A professional who uses AI without training     | A novel intake: the user's own AI chat history                 | Classification errors, and people are wary of uploading chats          |
| [Seberang](0005-seberang.md) | A working adult outside the Klang Valley        | Scenarios from observed adoption elsewhere                     | Lowest uniqueness; its engine already lives inside Dividen             |

Kotak's edge over all five: the team lived the problem, and it produces new Malaysian data rather than only reading existing data. Its weak spots: thin Malaysian evidence, and an employer side that starts with only the cards the team can collect by Sunday.

## Deciding tonight

The point of this round is human judgement, so score before discussing:

1.  Each member reads this page and the top of [Dividen](0001-dividen.md), about 10 minutes.
2.  Each scores both ideas alone, 1 to 5, on the four rubric criteria (innovation 30%, problem-solution fit 25%, feasibility 25%, clarity 20%), plus "would I use it or buy it?".
3.  Share the scores, discuss the biggest gaps between people, then rescore once.
4.  Lock the higher total, or a merge, before midnight, and record it on issue #24, which blocks the build.

This follows the method the team used for sdp-hack: people think and score alone first, because one chatbot makes everyone's ideas alike.

## Decisions so far

AlaskanTuna's choices in the 21 October brainstorm, not yet agreed by the team:

- Malaysia only, computer science first.
- One streamlined flow, step by step.
- The trust rule and evidence tiers, with verdicts instead of percentages.
- A fixed list of questions, with rules deciding and the AI reading and explaining, because free-form questions give unpredictable results.
- Business 70% and government 30%, with hiring leads and engineering managers as the business user.
- The hiring lead's declare and publish flow, and the government index.
- The six questions in the box.
- The Economic Index sets each role's outlook, because predictions need reliable data.
- After the [roast](/docs/research/kotak-roast.md), all five reinforcements:
  1.  Real evidence only in the demo, extracted live on RunPod and approved with one click.
  2.  Interview-format verdicts change the plan, so a Split gives two plans; only skill evidence changes role scores.
  3.  Collect 5 to 10 real cards before Sunday, anonymous by default, with a market view that doubles as the government index.
  4.  One flow, without a separate review screen, scheduled scraping, CV upload, the Akinator intake or the Live2D runtime.
  5.  An SDG choice that changes the plan's project.

Proposed but not yet agreed: the name, the verdict rules, MyCOL and TalentCorp skill lists with O\*NET as fallback, the RunPod and Replit setup, the build plan, the cut line and the demo script.

Left to the builder: the stack, the visual design, the exact score formula, which open model runs on RunPod, and which model writes explanations. Lock these tonight, because the declaration must name them.

## Open questions

- Is Kotak the name? Kotak Mahindra is also a well-known Indian bank.
- Who sends the card form tonight, and to which mentors and contacts?
- Which mentor gets the business case: Adam Alias bin Amin or Muhaimin bin Juhairi, both of KrackedDevs?
- Which impact areas does step 4 offer, and which SDG target does each map to?
- How much of TalentCorp's skills mapping is public per role?

## See also

- [Kotak roast](/docs/research/kotak-roast.md) and [CareerSphere and PivotPath teardown](/docs/research/winner-teardowns.md)
- [Hiring-bar evidence](/docs/research/hiring-bar-evidence.md)
- [Idea ranking](0000-ranking.md) and [Dividen](0001-dividen.md)
- [Brief](/docs/BRIEF.md) and [context](/docs/CONTEXT.md)

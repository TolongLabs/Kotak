# Dividen

Dividen, Malay for dividend, takes the hours AI tools give back to a team and turns a pledged share of them into each person's reskilling plan. It is for the HR or L&D lead who has just rolled out an AI assistant and must answer two questions at once: what did the licences return, and does the saved time mean fewer jobs? It ranks first of our ideas, and all three judges on our panel picked it; see the [ranking](0000-ranking.md).

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

- **Primary user**: the L&D or HR lead at a Malaysian company of a few hundred staff, in the quarter after it rolls out Copilot, ChatGPT Enterprise or Claude. Leadership asks what the spend returned; staff ask whether the time AI saves will be used to cut them.
- **Second user**: each employee, who sees their own dividend, chooses a target role and owns the plan.
- **Why now**: in Malaysia "56% of professionals already use AI tools at work, yet only 26% have received formal training" ([domain file][d1-bg]). Lack of time has been employees' top obstacle to training for three years running, and half of HR managers say workloads leave little room for it ([TalentLMS 2026][talentlms]). The same report argues "AI should save time for better learning, not fewer people". Dividen makes that a plan with numbers.

[d1-bg]: /docs/sources/drive.google.com/domain-1-aiversecity.md#1-background
[talentlms]: https://www.talentlms.com/research/learning-development-report-2026

## How it works

1.  **Roster in.** HR loads a roster of job titles, a synthetic sample for the demo, and each employee confirms their weekly task mix from their occupation's O\*NET task list, in their own words if they like.
2.  **Workers choose.** Each employee marks which of their tasks they want AI to take and which they want to keep. Stanford's WORKBank survey found workers want AI on fewer tasks than it can already do ([paper][workbank]), so the dividend comes only from tasks people hand over.
3.  **Dividend out.** For each occupation the [Anthropic Economic Index][aei] estimates how long a task takes a person without AI (hours) and with AI (minutes), and how much AI use is automation rather than augmentation ([metric definitions][aei-docs]). Dividen turns the handed-over tasks into an estimated range of hours returned per person per week, shows the formula, and lets HR replace the estimate with measured time.
4.  **Pledge.** HR pledges a share of the dividend to learning, one hour in five by default. That becomes each person's weekly learning budget.
5.  **Match.** Each employee sees future roles ranked by an explainable score: task and skill overlap with their current role, plus whether the target is flagged as emerging or in demand by O\*NET, or by MyCOL or TalentCorp's MyMahir where a hand-checked match exists. Every gap names the missing skill.
6.  **Plan.** The pathway fills the weekly budget with free modules whose durations come from the Microsoft Learn catalogue, so the plan has a finish date, not just a list. Each step ends in a small piece of real work, because in Anthropic's study developers who learned a new library with AI scored 17% lower on a quiz than those who coded by hand, while those who also asked it conceptual questions scored well ([skill formation][skillform]).
7.  **Report.** The company view shows hours returned, hours pledged, tasks redesigned and skills shown, and how each skill and role maps to SDG targets. It never counts tokens or logins: Amazon shut down an internal AI-usage leaderboard after staff gamed it ([HR tech report][kirorank]).

## The six must-haves

| Must-have             | How Dividen meets it                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Skills profile intake | Roster plus a task questionnaire per person, including which tasks they want AI to take, with sample profiles          |
| AI-trend signal layer | Dated Economic Index snapshots with a refresh script; source and date on every number                                  |
| Future-role matching  | Ranked roles with the score broken down into overlap and demand signals, and a named skills gap                        |
| Reskilling pathway    | Ordered free modules with real durations, scheduled into the pledged hours                                             |
| SDG mapping           | Every role and skill tagged to targets; the pledge converts 8.2 productivity gains into 4.4 skills, in hours           |
| Handling uncertainty  | Adoption scenarios from observed data: Malaysia's current AI usage per capita, and Singapore's, about 6.7 times higher |

The adoption scenarios use the index's usage-per-capita figures for May 2026: 0.87 for Malaysia and 5.81 for Singapore, where 1.0 is usage proportional to working-age population. This is the cross-country engine from [Seberang](0005-seberang.md), used here as Dividen's scenarios. Each output is labelled an estimate, and HR and employees make every decision.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[aei-docs]: https://huggingface.co/datasets/Anthropic/EconomicIndex/raw/main/release_2026_06_26/data_documentation.md

## Why it stands out

The most crowded idea in our [field simulation][field] is an HR redeployment planner, 16 of 75 ideas, which frames AI as a headcount and levy problem. Dividen frames it as time that already exists and gives that time back to people. No idea in either simulation pass proposed that; one of our two checkers matched it to two HR planners on its user, not its mechanism. It also answers the sponsor's mission, AI that "serves humanity — not replaces it", with a measurable commitment rather than a slogan ([context][ctx-people]).

[field]: /docs/research/field-simulation.md
[ctx-people]: /docs/CONTEXT.md#the-event-and-its-people
[workbank]: https://arxiv.org/abs/2506.06576
[skillform]: https://www.anthropic.com/research/AI-assistance-coding-skills
[kirorank]: https://www.hcamag.com/us/specialization/hr-technology/amazon-shuts-down-ai-leaderboard-after-tokenmaxxing/577189

## Why people would use it

- **HR comes back every quarter**, because AI spend is reviewed every quarter and the dividend report is the answer.
- **Employees get protected time**, which removes the top reason they don't learn.
- **The numbers move** with each Economic Index release and each measured usage report, so the plan re-plans itself, an optional feature the domain file lists.

## Live demo for the preliminary

Open a seeded sample company with six roles, such as accounts clerk and customer service representative. Switch the trend snapshot from April to May 2026, and the dividend, the role ranking and the plan's finish dates move, with the source and date beside each. Switch the scenario from Malaysia's pace to Singapore's, and the timelines move again. That is the "trend signal layer feeding the role matching" the organisers asked to see ([brief][brief]).

[brief]: /docs/BRIEF.md#our-challenge

## Build plan to 25 October

1.  **21 October**: new repository; filter the index to `MYS`, `SGP` and `GLOBAL` snapshots; load O\*NET 31.0 tasks and skills; one RunPod GPU job embeds all 18,838 O\*NET task statements with an open multilingual model, so tasks typed in English or Malay map to O\*NET.
2.  **22 October**: dividend formula, match score and gap, with the breakdown shown.
3.  **23 October**: pathway from the Microsoft Learn catalogue, SDG tags from the UN SDG API, company report; mentor session on the business case.
4.  **24 October**: deploy on a Replit Reserved VM, record RunPod proof, write the PRD and declaration, record the video.
5.  **25 October, before 7:59 AM**: submit, then open every link in an incognito window.

## Hardest risk and fallback

- **The time estimates are the model's estimates per conversation, not measured productivity.** Show them as ranges with the formula, call them estimates, and let HR override them with measured data.
- **The index uses US SOC occupations, and Malaysian labels need a hand-checked crosswalk.** Flag unmatched roles rather than guess ([trend data notes][trend]).
- **A company could pocket the hours.** The pledge is a public commitment in the report, not an enforcement mechanism; say so.

[trend]: /docs/research/trend-data.md#occupation-and-skills-taxonomies

## Scores

Scores out of 5, from round 9 (ours) and the round 10 panel, three other Claude models judging blind in persona: Claude Sonnet 5.5 as the sponsor, Claude Fable 5.1 as a government official and Claude Haiku 5.5 as a technical mentor. The [ranking](0000-ranking.md#scoring-matrix) explains the method.

| Criterion            | Weight | Ours | Sponsor judge | Government judge | Technical judge |
| -------------------- | ------ | ---- | ------------- | ---------------- | --------------- |
| Innovation           | 30%    | 5    | 4             | 4                | 4               |
| Problem-solution fit | 25%    | 4    | 5             | 5                | 4               |
| Feasibility          | 25%    | 5    | 4             | 4                | 3               |
| Clarity              | 20%    | 5    | 5             | 4                | 4               |
| Actual use           |        | 4    | 4             | 4                | 3               |

- **Rubric**: 95 from us and 83.0 from the panel, 89.0 on average.
- **Uniqueness**: 4: one checker matched it to two HR planners on its user, not its mechanism.
- **Composite**: 85.8, rank 1 of 5 finalists. All three judges picked Dividen as the winner.

What the judges attacked, and the fix we adopt:

- **The hours look measured but are estimated** (all three judges). Show the dividend as a conservative band with its formula, and require one measured baseline from HR before any hours figure appears in the company report.
- **The pledge is unenforced** (sponsor judge). Add a pledged-versus-completed learning hours view, so the report shows follow-through, not intent.
- **Small teams expose individuals** (technical judge). Show HR only aggregates above a minimum group size.
- **The SDG link per role is thin** (technical judge). Tag every ranked role and skill with its target, not just the company total.

## Open questions

- What default pledge share would an HR lead accept: one hour in five, or one in ten?
- Would HRD Corp accept pledged learning hours as evidence for any scheme, or is that only a talking point?
- Which AI tool admin reports, such as Microsoft 365 Copilot usage reports, give per-role hours we could import later?

## See also

- [Idea ranking](0000-ranking.md)
- [Field simulation](/docs/research/field-simulation.md)
- [Trend and skills data](/docs/research/trend-data.md)
- [Context](/docs/CONTEXT.md) and [brief](/docs/BRIEF.md)

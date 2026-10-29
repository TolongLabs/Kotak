# SDC Hackathon 2026 context

The background our [brief] leaves out: who is behind Domain 1 and judges it, what the other finalists and comparable winners built, what earns marks, and which data and products already exist in this space. It informs product and pitch choices for the final and isn't a glossary; the brief, and the organisers' sources above it, still govern the rules. External sources were accessed on 20 October 2026, and the organisers' sources and the finalists' repositories on 28 and 29 October. This file can go once the grand final ends on 1 November.

Contents:

1.  [What this means for us](#what-this-means-for-us)
1.  [The event and its people](#the-event-and-its-people)
1.  [The other finalists](#the-other-finalists)
1.  [Comparable winners](#comparable-winners)
1.  [What wins marks](#what-wins-marks)
1.  [The domain landscape](#the-domain-landscape)
    1.  [Prior art and white space](#prior-art-and-white-space)
    1.  [Trend and skills data](#trend-and-skills-data)
    1.  [SDG mapping](#sdg-mapping)
    1.  [Learning resources](#learning-resources)
1.  [Unverified claims](#unverified-claims)
1.  [See also](#see-also)

## What this means for us

Recommendations, not decisions: the team decides. They are for the final, judged live on the [final rubric](/docs/BRIEF.md#judging). After the brief's eligibility checks, they run roughly in order of marks per hour, and each names the criterion it serves and the section with the evidence. Nothing under [unverified claims](#unverified-claims) goes into the report's impact section or the deck, because false information can mean disqualification ([Terms and Conditions 11][tc11]).

1.  **Rehearse the change test until it takes under a minute.** Judges may say "Please change the trend data now" and watch what moves ([finalist guide 12][fg12]). Swap the April and May 2026 Economic Index snapshots with the demo switcher and point at a score, a gap and a verdict that change, each with its source and date. The guide also wants "a refresh possible during the demo" ([section 6][fg6]); ours is a weekly GitHub Action that opens a commit or pull request ([data refresh](/docs/TRD.md#data-refresh)), so show how a new release reaches the screen and what happens when a source is down. Qart.ai refreshes daily, Pecel Lele and XH-Cat weekly and Slaynergy on use, so a refresh alone won't stand out; showing what moved, and why, can. _Technical Execution, Innovation_ ([other finalists](#the-other-finalists); [data](#trend-and-skills-data)).
2.  **Bring back a scenario switch: it is our biggest gap.** Must-have 6 and the last demo stage need at least two scenarios that judges can switch between, with recommendations that shift and are labelled as estimates, driven by explicit parameters such as the speed of AI adoption ([finalist guide 4][fg4]; [section 5][fg5]; [section 6][fg6]). A must-have that is missing or only described caps Problem-Solution Fit. The engine already computes a slow and a fast future for every corner, but the screens show only the slow one, with Split where the two disagree, and have had no switch since #167 ([projections and scenarios](/docs/TRD.md#projections-and-scenarios)). Check that switching moves the ranking or the roadmap, not only the labels: one rival's fast scenario leaves its ranking unchanged. _Problem-Solution Fit, Technical Execution_ ([other finalists](#the-other-finalists)).
3.  **Build the KPI counter, then paste its output into section 4.1.** Our Phase 1 target was 20 seeded test profiles reaching a sourced roadmap in under 3 minutes with no uncited recommendation, plus a snapshot swap that changes a verdict on every hand-checked demo role ([our preliminary PDF][prelim], section 4). Neither the 20 profiles nor a counter is in the repository yet. The code or log output is optional but earns bonus marks under Impact, Technical Execution and Innovation at once ([report template 4.1][fr41]). _Impact & Feasibility_.
4.  **Answer the feasibility questions with numbers**: who we reach first and through which channel; how often the data refreshes and what model calls, hosting and data cost per user or per month; how much of a pathway is free; how the PDPA would protect profiles; and how we check recommendations for bias ([finalist guide 8][fg8]). Our technical docs cover neither the PDPA nor bias yet, and all four of the strongest rivals ship fairness tests. The guide also credits English, Bahasa Malaysia and Chinese and low-bandwidth use ([section 7][fg7]); Kotak is English-only, and most rivals have all three. _Impact & Feasibility_ ([other finalists](#the-other-finalists)).
5.  **Say the user, payer and moment the team chose, the same way everywhere**: software and digital workers at an employer that pays the HRD Corp levy, in the week it rolls out AI coding tools (issue #279). Word it the same in the report's section 2, on the first slide and in the pitch's first 15 seconds. It suits the organisers' "businesses and government", Aiversecity's stated focus on businesses and a panel of mostly business judges. The employer team view earns credit under Innovation and Impact ([finalist guide 7][fg7]), but it isn't built, so present it as the next step unless it works live, since misrepresenting what the solution does is barred ([Terms and Conditions 6.1.5][tc615]). Four rivals already show a working HR or organisation view. _Innovation, Pitch_ ([people](#the-event-and-its-people); [other finalists](#the-other-finalists)).
6.  **Show what few others have, by name.** The rubric asks us to name the job sites and course platforms that exist and show what makes ours different ([final rubric][fg11]): compare with MyMahir, MYFutureJobs, JobStreet and LinkedIn's Career Explorer, and with e-LATiH and Coursera. Most finalists already score in code and let the model only explain, so say that in one line and spend the time on the rest: one engine over 923 O\*NET jobs, reviewed Malaysian job ads for each role beside the verdicts, the check that rejects any explanation that changes a verdict, and the same rules open to the user's own assistant through MCP. Expect a question on JobStreet's terms, which forbid scraping ([Avoid](#trend-and-skills-data)). _Innovation_ ([other finalists](#the-other-finalists); [prior art](#prior-art-and-white-space)).
7.  **Pass the SDG test: would the user lose anything without the tag?** Tie every tag to a target with a one-line reason, add the tags up into the path's contribution, and let the user act on them, for example by picking steps by goal ([finalist guide 6][fg6]; [final rubric][fg11]). The domain's targets are 4.3, 4.4, 8.2 and 8.5, and the UN SDG API returns their official text and Malaysia's figures for indicator 4.4.1, on ICT skills. Pecel Lele already rolls the contribution up to an organisation and a region, and Xeno Force to an SME workspace; we found no rival showing a scenario change it. _Problem-Solution Fit, Innovation_ ([SDG mapping](#sdg-mapping); [other finalists](#the-other-finalists)).
8.  **Keep the demo on roles with checked courses.** Judges may check that a course is real, and "courses that do not exist" isn't enough ([finalist guide 5][fg5]). All 11,040 resources Kotak generated for its 923 jobs are unverified search links (`data/generated/role-corners.json`), and checked courses exist only for the sample profile, so steer judges there or label search links plainly. Call a course "HRD Corp-claimable" only where HRD Corp or the provider's own page says so; we found no working public list of claimable programmes. Pecel Lele flags 10 from providers' pages and Hoo Lee Sheet 3. Microsoft Learn's catalogue gives real durations for the time estimates. _Technical Execution, Impact & Feasibility_ ([learning resources](#learning-resources); [other finalists](#the-other-finalists)).
9.  **Cite each Malaysian figure with its source, date and scope**, because they aren't one series: about 600,000 workers needing reskilling (October 2024, and the domain file's figure), about 697,000 jobs at risk without upskilling (the HR Minister, June 2026, as reported by Bernama), and TalentCorp's 620,000 workers projected to be significantly affected. Anchor the role list in MyMahir, TalentCorp's Impact Study and MyCOL. _Impact & Feasibility, Pitch_ ([people](#the-event-and-its-people)).
10. **Make the demo survive the room.** We present from our own laptop over campus Wi-Fi, and the guide wants a backup, an offline build or a recording ([how judging works][fg-judging]). Load the dated snapshots and anything heavy before arriving, since multi-gigabyte downloads on campus aren't allowed ([participant handbook 6.6][ph66]). Keep seeded profiles behind one click and cached, labelled answers for when the model API is overloaded. The live site runs on Cloudflare Workers, deployed by GitHub Actions, and Replit keeps a hand-published copy for the proof of use ([technical requirements](/docs/TRD.md#environments)); check that copy is public, since the publish panel in the Replit workshop read "Invite only" ([Replit workshop slide 47][w2-publish]). _Technical Execution_ ([marks](#what-wins-marks)).
11. **Pitch mostly in the product, and let at least two of us answer.** The handbook gives 10 minutes and 5 of questions, though the finalist guide says the limit "will be confirmed by the organizers"; each 30 seconds over costs a point, and the rubric wants more than one teammate answering and honesty that predictions are estimates ([brief](/docs/BRIEF.md#judging)). Drill the guide's six questions to one sentence each ([finalist guide 12][fg12]), and record the backup video in our own voices. _Pitch, Design & UX_ ([marks](#what-wins-marks)).
12. **Book the mentor panel at 9 AM on 31 October and pitch it in full.** Booking opens for every team at once and closes at 1 PM, and the 15-minute session is before several Domain 1 mentors at once ([final round page][tp-mentoring]), so treat it as a dress rehearsal and ask what they would challenge. _Pitch_ ([people](#the-event-and-its-people)).

[tc11]: /docs/sources/sdchack.my/terms-and-conditions.md#11-cheating--misconduct
[tc615]: /docs/sources/sdchack.my/terms-and-conditions.md#61-general-submission-requirements
[fg4]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#4-the-final-demo-journey
[fg5]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#5-must-have-features-final-standard
[fg6]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#6-technical-expectations
[fg7]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#7-good-to-have-features-optional
[fg8]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#8-impact--evidence
[fg11]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#11-marking-rubric--final-round
[fg12]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#12-prepare-for-qa
[fg-judging]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#how-judging-works
[prelim]: /submission/SDC2026_T010NG_Preliminary.pdf
[fr41]: /docs/sources/drive.google.com/final-report-template.md#41-mathematical-proof--code-logic-snippet
[ph66]: /docs/sources/drive.google.com/participant-handbook.md#66-final-round-physical-hackathon
[w2-publish]: /docs/sources/workshop-2-replit/slides.md#slide-47-publishing-the-app

## The event and its people

- **No track record to copy.** SDC 2026 is the first dedicated hackathon circuit at XMUM ([overview]), and searches found no earlier SDC, XMUM AI Club or XMUM-hosted hackathon. Asked what separates a winning submission, the organisers said to target "what our domain sponsors have expected from you" ([transcript], 01:11:02).
- **The judges are mostly business leaders, and our sponsor's CEO is one of them.** By 28 October the website named 26 judges, without saying which sit on Domain 1's panel. They include Aiversecity's CEO, Gordan Vong; Alpha Red's CEO and Head of Solutions; two from KrackedDevs, an AI engineer and its head of business development; ChangeMaker's founder and co-founder; the chairmen of the AI Business Chamber, PIKOM and TAFA Holding; Sime Darby Property's general manager for technology and innovation; three staff from Futurum Academy; and staff from OpenAI, BNSF Railway and US Bank ([mentors and judges][judges]). Expect questions about who pays and whether a business could adopt it, as much as about the code.
- **Aiversecity says it builds human-centred AI for people and businesses.** Its one-page site states its mission "to help people, businesses, and societies design AI that serves humanity — not replaces it" ([Aiversecity][aiv]). It is the title sponsor and runs the ORION AI Youth Leaders network, which may offer members "career and internship matching with companies in Aiversecity's business network" ([participant handbook 13][ph13]). Its CEO's LinkedIn profile lists Gordan Vong as founder and CEO since January 2026 ([profile][gordan-vong]); no Aiversecity page names a legal entity, products or customers, and its terms and privacy pages are marked as drafts ([terms][aiv-terms]). Its representative closed her remarks with "put people first" ([transcript], 00:18:01). Orion AI Youth Community's founder, Lesley Mong, is also a judge ([mentors and judges][judges]).
- **The mentors lean to business and building.** The website lists 17: four from KrackedDevs, ChangeMaker's two founders, three Binance interns, the CEOs of Alpha Red and Intrinsic SEA, Mastercard's Head of AI Incubator, Asia Pacific, and others from Intel, Western Digital, Saichuang Weilai, Izwan & Partners and the ASEAN CXO Association ([mentors and judges][judges]). Our online session, on 23 October, was with Ravenna Chen Yaohui of Intrinsic SEA ([team portal][tp-mentorship]), and her feedback was on business strategy rather than technology (issue #279). The offline session on 31 October is a panel of several Domain 1 mentors at once ([final round page][tp-mentoring]).
- **The workshop speakers who judge or mentor want grounded AI with a human in the loop.** Alpha Red is Domain 2's sponsor, and no source says whether its judges sit on our panel. Its CEO, KC Cheah, a judge and mentor, pitching Orbyte: "a chatbot alone isn't the answer… General-purpose AI is fluent, but it may not know the business" ([Alpha Red workshop][w1], 00:30:44). Its Head of Solutions, Cheong Nan Feng, a judge, on payments: "we can't trust the LLM to perform everything", so put "some kind of human review" before high-stakes steps (00:18:36). KrackedDevs' Fadli Khalid, a mentor: "You stay the owner", deciding the goal and testing the result while "The AI helps with speed" ([KrackedDevs slide 12][w5-owner]), and "This is how you improve your app: give it to people, let people give feedback" ([KrackedDevs workshop][w5], 00:19:58).
- **The Malaysian figures differ in scope.** In October 2024 the HR Minister said about 600,000 workers in 10 sectors needed reskilling within three to five years ([Bernama, October 2024][bernama-600k]). In June 2026 his successor cited a TalentCorp study finding about 697,000 jobs "at risk of being affected by technological advancements and the green economy" if workers don't upskill ([Bernama, June 2026][bernama-697k]), and about 120 roles "identified as increasingly important" ([Malay Mail][mm-697k]). Neither the 697,000 nor the 120 appears in the Hansard record of his oral answer or in any TalentCorp release; TalentCorp's January 2026 figure was about 685,000 ([TalentCorp release][tc-685k]). TalentCorp's Impact Study says about 620,000 workers, 18% of the workforce in the sectors it analysed, are "projected to be significantly affected". It names around 60 emerging roles, and career pathways and 864 skills for 84 highly impacted roles; phase 2 is in progress ([TalentCorp][tc-impact]).
- **Judges may know the government platforms.** MyMahir lists TalentCorp's in-demand and emerging roles with their skills ([MyMahir][mymahir]). MyCOL 2024/2025, the critical occupations list, is published only as PDFs ([MyCOL][mycol]). HRD Corp lets employers claim up to 100% of approved training and runs e-LATiH, a learning portal with free courses ([HRD Corp][hrdcorp]). PERKESO's MYFutureJobs matches jobseekers with employers ([MYFutureJobs][mfj]).
- **The nearest Malaysian precedent set a production bar.** Talentbank's Tech Hackathon, "Build Asia's Career OS with AI", crowned its first cohort's winners on 22 August 2026, and its page sets a "Production-ready only" standard, with an adoption pool "Awarded only for exceptional work". It names the winners but not what they built ([Talentbank][talentbank]). Our sponsor judges may ask the same question: could they adopt what we build?

[overview]: /docs/sources/sdchack.my/overview.md#what-is-sdc
[aiv]: https://aiversecity.com/
[gordan-vong]: https://www.linkedin.com/in/gordanvong
[aiv-terms]: https://aiversecity.com/terms
[ph13]: /docs/sources/drive.google.com/participant-handbook.md#13-aiversecity-orion-ai-youth-leaders-sponsor-community
[judges]: /docs/sources/sdchack.my/overview.md#mentors-and-judges
[tp-mentorship]: /docs/sources/sdchack.my/team-portal.md#mentorship-session
[tp-mentoring]: /docs/sources/sdchack.my/team-portal.md#offline-mentoring-session
[w1]: /docs/sources/workshop-1-alphared/transcript.md
[w5-owner]: /docs/sources/workshop-5-krackeddevs/slides.md#slide-12-the-files-are-the-truth-not-the-chat
[w5]: /docs/sources/workshop-5-krackeddevs/transcript.md
[bernama-600k]: https://www.bernama.com/en/news.php?id=2350085
[bernama-697k]: https://bernama.com/en/general/news.php?id=2572379
[mm-697k]: https://www.malaymail.com/news/malaysia/2026/06/24/malaysia-records-42807-job-losses-as-697000-roles-at-risk-from-ai-without-urgent-upskilling-says-hr-minister/224963
[tc-685k]: https://www.talentcorp.com.my/resources/press-releases/talentcorp-drives-national-ai-readiness-as-rm110-million-jelajah-ai-mymahir-expands-nationwide/
[tc-impact]: https://www.talentcorp.com.my/impact-study/
[hrdcorp]: https://hrdcorp.gov.my/
[talentbank]: https://www.techhackathon.com/

## The other finalists

The 14 other Domain 1 finalists' repositories, as cloned on 28 and 29 October ([finalist repositories][fin]). They can keep building until 1 November, so treat this as a floor. Paths below are under that folder.

The four strongest builds:

- **#slaynergy, Jobbery**: a deadline-based plan for fresh graduates and workers, with PERKESO advisors as a second user. Its trend layer draws on DOSM and OpenDOSM job data, Epoch AI, the Economic Index, ILO and O\*NET, and re-checks when the app is used, daily or hourly around DOSM release days (`slaynergy/src/src/lib/server/refresh.ts`), with a "what changed and why" panel when a release moves a plan. A fixed weighted score; three adoption scenarios at 0.6, 1 and 1.6 times, weighted by how well each predicted past releases; target-level SDG tags that re-rank jobs when a user picks a goal; a 16-state job map; English, Malay, Chinese and Tamil; and fairness tests ([README](/docs/sources/finalists/slaynergy/README.md)).
- **ASEA, Path.AI**: Malaysian working adults in highly exposed jobs, plus students, HR and career centres. Trends come from 36 months of Hacker News hiring posts and OpenAlex research counts, refreshed on demand. Users can reweight the score, model explanations are rejected if they hold a number not in the fact sheet, and a CV skill must quote the CV word for word. Pace scenarios at half, one and two times, 155 courses with 53 of its own, an HR heatmap of a fictional team, and three languages ([README](/docs/sources/finalists/asea/README.md)).
- **Pecel Lele, Adept**: individuals plus an organisation mode for HR, advisers and TVET centres, with a skills-gap heatmap. arXiv papers embedded on RunPod, with a weekly refresh workflow; a time- and budget-limited plan over 98 courses, 10 flagged HRD Corp-claimable from providers' pages, rebuilt on a newer snapshot for the user to accept; and the deepest SDG evidence in the field, 226 role and skill links to targets, each with a reason, strength, URL and quote, added up for a person, an organisation or a region (`pecel-lele/src/data/seed/sdg/`). Its labour baseline is US BLS data ([README](/docs/sources/finalists/pecel-lele/README.md)).
- **Qart.ai**: deliberately narrow, Malaysian finance shared-services workers and graduates. Seven sources, among them OpenDOSM, DOSM Job Market Insights, the Economic Index, O\*NET and MyCOL, collected daily by a Replit Scheduled deployment. It shows history without projecting trends, because "no trend method beat a simple 'no change' forecast" in its backtest; labels every number observed, assumption or estimate; and publishes a RunPod evaluation of Malay job-title matching ([README](/docs/sources/finalists/qart-ai/README.md); [evaluation](/docs/sources/finalists/qart-ai/docs/RUNPOD_EVAL.md)).

Further back: Hoo Lee Sheet's Laluan has the largest course catalogue, 198 courses with 22 from e-LATiH, three marked HRD Corp-claimable, plus 13 government programmes with eligibility, and scenarios taken from WEF's Four Futures ([courses](/docs/sources/finalists/hoo-lee-sheet/data/courses.csv)). Hokkien Mee Is Purple's Varity serves Malaysian developers from 48,508 Hacker News hiring posts. NoBugPls' AiversePulse adds HR consoles, blind résumé review and a voice mock interview. XH-Cat crawled 1,814 MASCO occupations and refreshes weekly, but tags goals, not targets ([SDG data](/docs/sources/finalists/xh-cat/data/sdg.json)). Hands Off Our Rights, Claypot Chicken Rice and Xeno Force cover 6 to 26 roles; Hands Off Our Rights shows each role's rank range across three scenarios and which recommendations moved after an update, and Xeno Force's default trend data is synthetic. Chill Chill builds a 3D game world, Ctrl CV's copy lacks the app its README describes, and Dsaise's EcoLingo is an SDG learning prototype for UM students, labelled "WIX2002 Project Management · Team 2" ([prototype](/docs/sources/finalists/dsaise/index.html)).

What most of them already do, so it won't stand out on its own: a weighted match score computed by code, with the model limited to reading CVs or wording results; two or three preset scenarios applied as one multiplier; the Economic Index, O\*NET, ILO exposure, arXiv, Hacker News or OpenDOSM as sources; hand-picked Microsoft Learn, Coursera and OpenLearn courses; target-level SDG tags, mostly 4.4 and 8.5; and English, Malay and Chinese, fairness tests and Replit hosting.

Less rare than it looks: a refresh that runs by itself, at Qart.ai, Pecel Lele, XH-Cat and Slaynergy; re-planning or a "what changed" view after new data, at Qart.ai, Pecel Lele, Slaynergy and Hands Off Our Rights; SDG roll-ups beyond one person, at Pecel Lele and Xeno Force; and scenarios beyond a toggle, such as Slaynergy's weighted futures, Claypot's slider and Qart.ai's sensitivity check.

What few or none do:

- **Reviewed Malaysian job ads per role**: ASEA lists postings per role, but only 166 of its 19,481 are Malaysian on-site ones; Hoo Lee Sheet uses JobStreet salary ranges, and Hokkien's Malaysian snapshot is empty.
- **HRD Corp claimability checked against HRD Corp itself**: Pecel Lele flags 10 from providers' pages, and Hoo Lee Sheet marks 3.
- **A scenario that changes the SDG contribution**: none found.
- **Voice**: only NoBugPls.

[fin]: /docs/sources/finalists/README.md

## Comparable winners

SDC has no past winners, so these come from comparable competitions. Each placing is confirmed by the organiser or a Devpost winner badge. Eight entries judged on other rubrics are a small sample that only shows the survivors, so read the patterns as hints, not laws.

| Project                           | Event and placing                                                                                                   | Why it matters to us                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PivotPath]                       | Claude Hackathon x UVicHacks 2026, first place                                                                      | Closest overlap: five paths ranked by match, Claude-generated automation risk and demand trend, each with a free-course plan                      |
| [CareerSphere]                    | PyCon Singapore 2026, first overall ([results][pycon-results])                                                      | Fit scored against Singapore's official skills framework and a cached snapshot of about 88,000 postings; "the data decides and the AI interprets" |
| [Hunar]                           | Smart India Hackathon 2024, a nodal-centre joint winner ([results][sih-results]); the team's post names the project | Trending skills, job forecasts and skill gaps, voice-first in three languages                                                                     |
| [Jobiri]                          | EUvsVirus 2020, challenge winner                                                                                    | AI career advisor for job seekers and for public employment services                                                                              |
| [GetWage]                         | Google Solution Challenge 2022, Top 10                                                                              | Daily-wage work for people hit by unemployment, tagged SDGs 1, 4 and 8                                                                            |
| [XPRIZE Rapid Reskilling][xprize] | XPRIZE 2020–23, grand prize unclaimed                                                                               | Judged on training time, placement and retention; no team placed 5,000 workers                                                                    |
| [Argus]                           | Imagine Cup 2025, world champion                                                                                    | Born of the founders' grandparents' low vision; judged on AI use, inclusive design and viability                                                  |
| [MamaMate]                        | ITU AI for Good Innovation Factory 2025                                                                             | Offline for rural mothers; ITU praised its "bold yet deeply grounded approach"                                                                    |

The closest published SDG rubric is the Google Solution Challenge 2024's: 25 points for impact, covering the chosen SDG targets, three pieces of real-user feedback and metrics, and 25 for technology, including "an actual working application (not a mockup)" ([archived timeline][gsc-2024]).

What the winners share:

- A narrow user with a vivid need, often from the founders' own lives, such as PivotPath's retail clerks and truck drivers, for whom a bootcamp's fee is "a wall".
- Official data in the loop. PivotPath grounds its model in O\*NET data, and CareerSphere's team scored deterministically after finding that "features where the LLM decides felt like thin chatbot wrappers".
- Scores users can audit, and an action on every gap: a course, a posting or a plan. [PyCon Singapore][pycon] asked for "actionable pathways instead of overwhelming skill sets".
- A deployed, working demo, and outcomes measured rather than promised.
- Inclusion designed in: offline, voice-first or multilingual.

PivotPath and CareerSphere already have explainable scores, gaps and course plans, so those alone won't stand out. Neither shows more than one scenario, maps roles or skills to SDG targets, or tracks AI advancement continuously (PivotPath's trend is O\*NET's static outlook), and neither uses Malaysian data. Among the [other finalists](#the-other-finalists), though, several scenarios, target-level SDG tags and some Malaysian data are common.

[PivotPath]: https://devpost.com/software/pivot-path
[CareerSphere]: https://www.rohanjk.xyz/projects/careersphere
[Hunar]: https://www.linkedin.com/posts/shrynsjn_smartindiahackathon2024-hackathonwinners-activity-7274090331585859585-z-e7
[Jobiri]: https://devpost.com/software/jobiri-the-first-ai-based-digital-career-advisor
[GetWage]: https://developers.googleblog.com/2022/07/top-10-winners-demo-Day-2022.html
[xprize]: https://www.xprize.org/news/xprize-announces-conclusion-of-rapid-reskilling-competition
[Argus]: https://techcommunity.microsoft.com/blog/studentdeveloperblog/announcing-the-2025-imagine-cup-world-champion/4414342
[MamaMate]: https://aiforgood.itu.int/mamamate-wins-again-this-time-at-the-ai-for-good-innovation-factory-grand-finale-2025/
[gsc-2024]: http://web.archive.org/web/20240926112720/https://developers.google.com/community/gdsc-solution-challenge/timeline
[pycon]: https://pycon.sg/hackathon.html
[pycon-results]: https://pycon.sg/hackathon_entries/results.html
[sih-results]: https://www.sih.gov.in/sih2024/sih2024-grand-finale-result

## What wins marks

Practices from judging guides, accelerators and model providers, beyond the brief's rules:

- **Judges skim.** MLH budgets 4 minutes a project, 2 of them for the demo ([MLH][mlh-plan]). Devpost's judges check the requirements, the video and the product, not always in that order, and mark down teams that "over-indexed on one particular criteria" ([Devpost judges][dp-judges]). Put the six must-haves at the top of the README and on an early slide.
- **Go narrow, concrete and timely.** Build "something a small number of people want a large amount" ([Paul Graham][pg]), answer "why now?" ([Sequoia]), and use nouns rather than buzzwords ([Y Combinator][yc-pitch]).
- **Demo the resolution.** "Skip mundane flows such as creating user credentials" and show the problem being solved ([Devpost demo][dp-demo]).
- **Script the video and deck.** Say what the app does in the first few seconds ([Devpost video][dp-video]); budget each segment and never speed up the audio ([Devpost tips][dp-tips]); put one idea on each slide, and prefer a list of steps to a screenshot ([Y Combinator deck][yc-deck]); fix YouTube's automatic captions, which can misrepresent speech ([YouTube][yt-captions]); and rehearse in front of honest critics ([Y Combinator Demo Day][yc-dd]).
- **Write the README for a stranger**: what it does, why it's useful, how to start and where to get help ([GitHub][gh-readme]). "Ambiguity is a red flag, and also projects that lack detail and code" ([Devpost judges][dp-judges]), so link the matcher and the citation check from the README.
- **Ground the model.** Anthropic's citations "are guaranteed to contain valid pointers to the provided documents" ([citations][a-cite]). Let the model say "I don't know", restrict it to the documents given, and have it retract any claim it can't quote ([hallucinations][a-halluc]). Test on cases that mirror real use ([evals][a-evals]), for example 20 sample profiles with zero uncited recommendations as the bar.
- **Keep the demo up.** Replit's Autoscale drops to "as low as zero" servers when idle, and then "the first request after scaling to zero can take a few seconds"; a Reserved VM "never sleeps" ([Replit][replit]; [FAQ][replit-faq]). The cheapest current Reserved VM costs $0.0208 an hour ([pricing][replit-pricing]), and a production database still suspends after 5 idle minutes ([billing][replit-billing]). The Claude API returns `529 overloaded_error` when it is "temporarily overloaded" ([errors][a-errors]).
- **Quote impact exactly.** Use the official target and indicator text, and a baseline from the official series ([UN SDG API][sdg-api]).
- **Drill the questions.** "What inspired your project?", "What tools did you use, and why?" and "What challenges did you solve, and how?" ([ETHGlobal][eth]). Answer each in one sentence first.

[mlh-plan]: https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
[dp-judges]: https://info.devpost.com/blog/hackathon-judging-tips
[pg]: https://paulgraham.com/startupideas.html
[Sequoia]: https://sequoiacap.com/article/writing-a-business-plan/
[yc-pitch]: https://www.ycombinator.com/library/6q-how-to-pitch-your-startup
[dp-demo]: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
[dp-video]: https://help.devpost.com/article/84-video-making-best-practices
[dp-tips]: https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
[yc-deck]: https://www.ycombinator.com/blog/how-to-design-a-better-pitch-deck
[yt-captions]: https://support.google.com/youtube/answer/6373554
[yc-dd]: https://www.ycombinator.com/blog/guide-to-demo-day-pitches/
[gh-readme]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
[a-cite]: https://platform.claude.com/docs/en/build-with-claude/citations
[a-halluc]: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
[a-evals]: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
[replit]: https://docs.replit.com/cloud-services/deployments/autoscale-deployments
[replit-faq]: https://docs.replit.com/help/deployment-and-publishing
[replit-pricing]: https://docs.replit.com/billing/aug-cloud-billing-updates
[replit-billing]: https://docs.replit.com/billing/about-usage-based-billing
[a-errors]: https://platform.claude.com/docs/en/api/errors
[eth]: https://ethglobal.com/events/ethonline2026/info/details

## The domain landscape

What already exists, what data we can legally use, and where the gaps are.

### Prior art and white space

- **MyMahir** (TalentCorp): a role and skill explorer with In-Demand and Emerging tags that matches a user's top skills to roles and suggests upskilling and training, plus an AI Readiness Index for organisations. It shows no numeric score, time estimates, scenarios or SDG tags ([MyMahir][mymahir]; [user guide][mymahir-guide]).
- **MYFutureJobs** (PERKESO): "AI-driven skill-based job matching", with no explanation of how it works, plus counselling ([MYFutureJobs][mfj]).
- **HRD Corp e-LATiH and e-TRiS**: rails for courses and grants, with no matching ([e-LATiH][elatih]).
- **Singapore's Jobs-Skills Portal**: the strongest regional benchmark. Its 369 role profiles flag "high-growth" skills from job postings, but it covers only Singapore, with no personal score, scenarios or SDGs ([Job-Skills Profile][swda]).
- **LinkedIn Career Explorer**: a 0–100 skills-similarity score for each career move, with "Skills You'll Need". It is the best precedent for an explainable score, but has no trends, courses, scenarios or SDGs ([Career Explorer][li-ce]).
- **Lightcast Career Coach, Coursera Skills Tracks and Google Career Certificates**: sold to institutions or tied to one catalogue, with no scenarios or SDG links ([Lightcast]; [Coursera][coursera]; [Google][google-certs]).

None of them combines AI-trend scenarios, SDG target tags and a timed Malaysian pathway. No Malaysian tool we checked joins MyMahir-style role data to a scored gap and a timed path through e-LATiH or HRD Corp-funded training.

[elatih]: https://elatih.hrdcorp.gov.my/about-us
[swda]: https://jobsandskills.swda.gov.sg/data-and-tools/dashboards/job-skills-profile
[li-ce]: https://linkedin.github.io/career-explorer/
[Lightcast]: https://lightcast.io/solutions/software/career-coach
[coursera]: https://www.coursera.org/business/skill-tracks
[mymahir-guide]: https://www.mymahir.my/assets/document/MyMahir_User_Guide_v1.pdf

### Trend and skills data

The trend layer must be updatable and dated, so feeds and versioned datasets come first:

| Source                          | What it gives us                                                                                                               | Access                                     | Licence                                           | Latest                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------- | --------------------------------------- |
| [Anthropic Economic Index][aei] | Monthly AI-usage shares for 198 to 243 Malaysian occupations, and an automation or augmentation split for 20 occupation groups | Hugging Face, no key; 219 MB file          | Data CC BY, code MIT                              | 26 Jun 2026 release, April and May 2026 |
| [O\*NET 31.0][onet]             | About 900 occupations with skills, Hot Technologies, Emerging Tasks and, through the API only, Bright Outlook                  | Bulk download, no key; API with a free key | CC BY 4.0, fixed credit line                      | August 2026; quarterly                  |
| [arXiv API][arxiv]              | The newest cs.AI and cs.LG papers                                                                                              | No key; one request every 3 seconds        | Metadata CC0                                      | Live                                    |
| [OpenDOSM][dosm]                | Monthly labour force; annual wages by occupation group                                                                         | CSV, or an API at 4 requests a minute      | CC BY 4.0                                         | August 2026                             |
| [ESCO v1.2.1][esco]             | Occupations and skills mapped to ISCO-08, in many languages                                                                    | API, no key                                | Free reuse with acknowledgement ([FAQ][esco-faq]) | December 2025                           |

- **Citable but not feeds**, as they are PDFs or figures only: the ILO's generative AI exposure index ([2025 update][ilo-exposure]), the World Bank and ISIS Malaysia study, which scores 484 Malaysian occupations and finds 28% of the workforce "highly exposed" ([September 2025][wb-isis]), the WEF Future of Jobs Report 2025, under CC BY-NC-ND 4.0 unless marked otherwise ([WEF][wef]; [licence][wef-licence]), [MyCOL][mycol], and MASCO 2020, Malaysia's occupation classification, which is a PDF under the HR Ministry's copyright, so ask before publishing a parsed copy ([MASCO][masco]).
- **Avoid**: Lightcast's free tier is only for nonprofits and public-good projects, subject to approval, and allows 50 skill-extraction calls a month ([Lightcast access][lightcast-api]). Adzuna's API doesn't cover Malaysia ([Adzuna spec][adzuna-spec]). Singapore's Skills Framework data may be downloaded for analysis ([SWDA FAQ][swda-faq]) but not republished without SWDA's written permission ([SWDA terms][swda-terms]). JobStreet's and LinkedIn's terms forbid scraping ([JobStreet terms][jobstreet]; [LinkedIn agreement][linkedin-ua]). On 23 October 2026 the team decided to collect JobStreet ads anyway and to publish only totals from ads an admin approved (#277).
- **A minimal stack**: O\*NET as the skills backbone, two Economic Index snapshots as the main trend signal, and arXiv as the live feed. The usage data joins on O\*NET codes. For Malaysian labels, O\*NET's and BLS's crosswalks reach ISCO-08 ([O\*NET crosswalks][onet-xwalk]; [BLS][bls-isco]), but no published table links ISCO-08 to MASCO 2020. Only about 300 of MASCO's 490 unit groups match ISCO-08 by code and title, so that step must be checked by hand and unmatched roles flagged ([trend data notes][notes-trend]).
- **Risks and fallbacks**: the index has no announced release schedule, is too big to load live, and measures Claude usage rather than jobs, so label it an "AI usage signal". Commit filtered, dated snapshots with their source URL, add a `bun` script that checks for new releases, and cache each arXiv pull with its timestamp.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[onet]: https://www.onetcenter.org/database.html
[arxiv]: https://info.arxiv.org/help/api/tou.html
[dosm]: https://developer.data.gov.my/static-api/opendosm
[esco]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
[esco-faq]: https://esco.ec.europa.eu/en/about-esco/faq?page=2&search=
[ilo-exposure]: https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure
[wb-isis]: https://documents1.worldbank.org/curated/en/099092325013010451/pdf/P181093-2e5b89c5-f3be-43b3-868c-8890b74bef21.pdf
[wef]: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
[wef-licence]: https://www.weforum.org/about/licence-terms-on-the-use-of-forum-publications-and-materials
[masco]: https://jtksm.mohr.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf
[lightcast-api]: https://docs.lightcast.io/lightcast-api/docs/api-access
[jobstreet]: https://www.jobstreet.com.my/terms
[linkedin-ua]: https://www.linkedin.com/legal/user-agreement
[bls-isco]: https://www.bls.gov/soc/soccrosswalks.htm
[onet-xwalk]: https://www.onetcenter.org/crosswalks.html
[notes-trend]: /docs/research/trend-data.md#occupation-and-skills-taxonomies
[adzuna-spec]: https://developer.adzuna.com/swagger/spec/test2.json
[swda-terms]: https://jobsandskills.swda.gov.sg/terms-of-use
[swda-faq]: https://jobsandskills.swda.gov.sg/engage-us/faqs

### SDG mapping

- **The UN SDG API** needs no key and returns the official text of every goal, target and indicator, plus Malaysia's values for indicator 4.4.1, on ICT skills, for 2015 and 2017 to 2024 ([UN SDG API][sdg-api]).
- **ESCO's green and digital skill collections**, the digital one with 1,201 concepts, come with the rest of ESCO's data ([ESCO datasets][esco-data]). Linking green labels to environmental targets would be our own mapping, documented as such.
- **The ILO's green jobs definition** counts a job as green only if it is in the environmental sector and "meets the requirements of decent work" ([ILO guidelines][ilo-green]), which gives a two-part test for an SDG 8.5 tag.
- **The Aurora SDG queries** are the only open, target-level set, under CC BY 4.0, but are written for Scopus search and need translating ([Aurora]).
- **The OSDG Community Dataset**, under CC BY 4.0, has volunteer-validated texts labelled by goal, not target, for training or testing a classifier ([OSDG]).
- No official crosswalk from occupations or skills to SDGs turned up, at goal or target level.

[esco-data]: https://esco.ec.europa.eu/en/structure-esco-downloadable-datasets
[ilo-green]: https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@dgreports/@stat/documents/normativeinstrument/wcms_230736.pdf
[Aurora]: https://aurora-network-global.github.io/sdg-queries/
[OSDG]: https://zenodo.org/records/11441197

### Learning resources

- **Microsoft Learn's catalogue API** needs no key and gives each module's duration in minutes. Microsoft says it "will continue to function through June 2026, but it is planned for deprecation"; it still answered on 20 October, and the successor needs authentication and app onboarding ([Microsoft Learn][ms-learn]).
- **Coursera** documents no catalogue API ([Coursera affiliates][coursera-aff]); an undocumented one returns workloads but could change without notice. **edX's** public API leads with test courses from 2015 and 2016 ([edX API][edx]). Both risk dead or stale links.
- **freeCodeCamp** is free, with hour estimates on its catalogue courses but not on its certifications ([freeCodeCamp]). **Google Career Certificates** state "3-6 mos" at "under 10 hours" a week ([Google][google-certs]).
- **HRD Corp** sets the rules for claimable courses, such as at least 4 hours and an application in e-TRiS before training starts, but its "List of Training Programmes" link leads nowhere ([claimable courses][hrd-claimable]).

[ms-learn]: https://learn.microsoft.com/en-us/training/support/catalog-api
[coursera-aff]: https://www.coursera.org/about/affiliates
[edx]: https://courses.edx.org/api/courses/v1/courses/
[freeCodeCamp]: https://www.freecodecamp.org/learn
[hrd-claimable]: https://hrdcorp.gov.my/hrdcorp-claimable-courses

## Unverified claims

Issue #20 checked every open claim against primary sources, and the findings above reflect it; the [research notes](/docs/research/) hold the evidence. These still have no primary source, so cite them only as described, or not at all:

- The 697,000 jobs and about 120 emerging roles of June 2026: press-reported only. If used, attribute them to the minister as reported by Bernama or Malay Mail, never to TalentCorp data.
- Aiversecity's legal entity, products and customers: no Aiversecity page or profile names them, and SSM's paid registry wasn't searched.
- That Hunar is the project of team Access Denied, the SIH 2024 joint winner: only the team's own post links the two.

## See also

- [Our brief][brief]: the challenge, deadlines, deliverables, rubric and rules
- [Domain 1 finalist guide](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md), with the final rubric, and the [preliminary problem statement](/docs/sources/drive.google.com/domain-1-aiversecity.md)
- [Finalist repositories](/docs/sources/finalists/README.md), the other Domain 1 finalists' code
- [Opening briefing transcript][transcript], with the organisers' answers on judging
- [Team portal](/docs/sources/sdchack.my/team-portal.md), with the final round page, and the website's [mentors and judges](/docs/sources/sdchack.my/overview.md#mentors-and-judges)
- Workshop write-ups by [Alpha Red](/docs/sources/workshop-1-alphared/transcript.md), [Replit](/docs/sources/workshop-2-replit/transcript.md), [RunPod](/docs/sources/workshop-3-runpod/transcript.md) and [KrackedDevs](/docs/sources/workshop-5-krackeddevs/transcript.md)
- [Research notes](/docs/research/), with the cited findings behind this file: [lineage and local context](/docs/research/lineage-and-local.md), [comparable winners](/docs/research/comparable-winners.md), [best practices](/docs/research/best-practices.md), [trend data](/docs/research/trend-data.md), and [prior art, SDG mapping and courses](/docs/research/prior-art-sdg-courses.md)

[brief]: /docs/BRIEF.md
[transcript]: /docs/sources/opening-briefing/transcript.md
[mymahir]: https://www.mymahir.my/
[mfj]: https://myfuturejobs.gov.my/
[sdg-api]: https://unstats.un.org/sdgapi/swagger/
[mycol]: https://www.talentcorp.com.my/mycol/
[google-certs]: https://grow.google/certificates/

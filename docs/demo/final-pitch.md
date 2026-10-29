# Final pitch

Status: the newer [final plan](/docs/analyses/final-plan.md) changes this skeleton, and wins where the two differ.

The skeleton for Kotak's live final pitch on 1 November 2026: what to say, in what order, for how long, and what to show. DrxgClanPC pitches; every teammate answers questions. The rules come from the [participant handbook](/docs/sources/drive.google.com/participant-handbook.md) (6.6.4 and 6.7) and the [Domain 1 finalist guide](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md) (sections 4, 5 and 11 to 13).

Contents:

1.  [The slot](#the-slot)
1.  [Run of show](#run-of-show)
1.  [Live demo](#live-demo)
1.  [Problem data](#problem-data)
1.  [Who answers what](#who-answers-what)
1.  [Questions to expect](#questions-to-expect)
1.  [Do not say](#do-not-say)
1.  [Pitch-day checklist](#pitch-day-checklist)
1.  [Where this came from](#where-this-came-from)

## The slot

- 10 minutes of pitch and 5 minutes of Q&A, in A4#113 or A5#119 (handbook [6.7.3][pitching]). Each 30 seconds over the limit costs 1 point ([6.7.4][pitching]). The finalist guides say the organisers will confirm the time.
- Our own laptop, with HDMI or a USB-C to HDMI adapter (6.7.6). Slides in `.pptx` (6.7.5).
- A live demo is required; bring a backup (6.6.4.4, finalist guide section 11).
- Target finish: 9:30, which leaves 30 seconds for a slow day. Rehearse slowly.

The one idea the whole pitch carries: **Data decides. AI explains.** Open on a person, prove it live, and close by echoing the opening.

[pitching]: /docs/sources/drive.google.com/participant-handbook.md#67-pitching-session

## Run of show

Word counts assume about 130 words a minute. The marks are the finalist guide's [rubric](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#11-marking-rubric--final-round). The slides follow the [preliminary deck](deck/kotak-pitch-deck.pptx), updated.

| #   | Time      | Section                             | Words | Marks it serves           |
| --- | --------- | ----------------------------------- | ----- | ------------------------- |
| 1   | 0:00–0:35 | Who we are, and why "Kotak"         | 75    | Pitch 10%                 |
| 2   | 0:35–1:30 | Problem: a person, then the numbers | 120   | Problem fit 15%           |
| 3   | 1:30–1:50 | Solution in one breath              | 45    | Problem fit               |
| 4   | 1:50–6:20 | Live demo                           | 450   | Technical 25%, Innovation |
| 5   | 6:20–7:05 | How it works                        | 100   | Technical 25%             |
| 6   | 7:05–7:35 | Why Kotak, not the others           | 65    | Innovation 25%            |
| 7   | 7:35–8:35 | Impact and feasibility              | 130   | Impact 20%                |
| 8   | 8:35–9:05 | What changed since the preliminary  | 65    | Technical                 |
| 9   | 9:05–9:30 | Close: echo the opening             | 55    | Pitch 10%                 |

1.  **Who we are.** "Hi, we're Team T010NG from TolongLabs. Tolong is Malay for help. We built Kotak, Malay for box. Two boxes gave it its name. Schrödinger's cat: until you open the box, you can't know what's inside. That's how AI feels about your job today: unknown. And Pandora's box: when everything else flew out, hope stayed inside. So we're here to open the box." Kopi, our cat, is the one in the box.
1.  **Problem.** Start with Aina, a _sample_ persona: a web developer in KL whose firm is rolling out AI coding tools, and whose manager asks which training to fund. Then the numbers from [Problem data](#problem-data): last year brought 74,841 loss-of-employment applications, and 38,953 people lost their jobs in the first five months of this year. Is AI behind it? "Not yet, rather than not ever." Employers here expect 41% of core skills to change by 2030. The money to retrain is there: Budget 2026 funds 3 million HRD Corp training opportunities (RM3 billion). What is missing is knowing which skill to learn first.
1.  **Solution.** A short check-up, [12 "what would you do" questions][questions], then a dated, cited plan paced to you, with hours, free steps and a funding route. "Data decides. AI explains." Hand over: "Let's do Aina's check-up, live."
1.  **Live demo.** See [Live demo](#live-demo). Talk about results, not clicks.
1.  **How it works.** Dated public data, refreshed through a pull request a person approves ([O\*NET 30.1][datasets], the Anthropic Economic Index rows for Malaysia, DOSM Job Market Insights). Fixed rules in the browser set every verdict, score and step. Claude explains, and a check throws out any explanation that changes a verdict or lacks a dated source. RunPod drafted skills for [923 jobs][made]; Gemini wrote plain-English explainers for the check-up statements it marked vague. Deployed on Cloudflare Workers and Replit.
1.  **Why Kotak.** Name the real alternatives (MyMahir, LinkedIn Career Explorer, HRD Corp e-LATiH), then the five things only Kotak does together: dated AI trends, the maths shown, a timed plan paced to the person, a funding route, and an MCP door for other AIs.
1.  **Impact and feasibility.** Who we reach and how; what keeping the data fresh costs; how personal data stays safe (answers stay in the browser; the national view keeps only role, levels and date, for groups of [10 or more][privacy]); the result against the Phase 1 baseline, with proof. Who pays: free for workers; employers RM5 per worker per month. For a worker paid over RM5,000 a month, that is under a tenth of the 1% levy an employer in HRD Corp's mandatory category pays on wages ([HRD Corp FAQ](https://hrdcorp.gov.my/faq)). These are prices to test, not contracts. The Phase 1 baseline numbers are still to fill in.
1.  **What changed since the preliminary.** "What would you do" questions instead of self-ratings, a roadmap paced to the person, and the clearer screens. Tie each to judge or mentor feedback.
1.  **Close.** "Aina doesn't need another course list. She needs to know where to start. Every job is a closed box right now: unknown. Kotak opens it, and what's left inside is hope: a plan with dates. Data decides. AI explains. We're Team T010NG from TolongLabs. Thank you." Hold 3 seconds on the QR codes for the live link and the repository.

[made]: /docs/data-card.md#made-by-the-team

## Live demo

The finalist guide ([section 4](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#4-the-final-demo-journey)) says judges watch one made-up user move through all six stages in one live session, and may interrupt with live checks. Use Aina: Working, Web Developers, "Stay strong in my job", 10 hours a week.

| Step | Time | Stage                       | Show                                                                                                                                          | Line to land                                                                                                          |
| ---- | ---- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D1   | 0:30 | Profile intake              | Check-up start: situation, qualification, years, job title, goal                                                                              | "These answers set your pace, not just your job."                                                                     |
| D2   | 0:30 | What-would-you-do questions | Kopi asks "what would you do"; answer with [keys 1 to 4][questions]; the choice turns pink                                                    | "No right-looking answer: the options are shuffled and scored hidden."                                                |
| D3   | 0:35 | Future Skills Radar         | [6 skills][skills] with rising or declining verdicts, each with a source name and date; the job ads card                                      | Read one source and its date out loud.                                                                                |
| D4   | 0:35 | Ranked roles                | Your Job's Future, then See the Maths                                                                                                         | Why this score, and what would raise it.                                                                              |
| D5   | 0:35 | Reskilling pathway          | Roadmap: ordered steps, hours, a free resource each, finish week, funding card, pace note                                                     | "A returner gets a refresher first and more weeks; it's in the maths."                                                |
| D6   | 0:20 | SDG mapping                 | SDG tags with a reason on skills and roles; steps highlighted by goal                                                                         | Say what the user would lose without the tag.                                                                         |
| D7   | 0:25 | Uncertainty                 | Switch between the slow and fast AI-uptake futures; "estimate" labels; "Unknown" for thin data                                                | "Two futures, both labelled estimates."                                                                               |
| D8   | 0:40 | The change test             | What Changed: load [May 2026 over April 2026][datasets]; April's six Unknowns get their [first dated verdicts][moment], and the plan reorders | Slow down: "Same answers. New month. With one month, Kotak said Unknown: it won't guess." Never say the market moved. |
| —    | 0:20 | Page loads                  | Allowance for slow pages across the steps                                                                                                     | —                                                                                                                     |

D1 to D8 take 4:10, and with 20 seconds for page loads the demo fills its 4:30 slot.

Not shipped yet (each issue open on 29 October), so check these before rehearsing: D1's pace and D5's refresher and pace note (#356), D2's what-would-you-do questions (#353 writes them, #354 shows them), D6's SDG reasons (#391) and D7's switch between AI futures (#389).

If a judge asks to change the trend data, D8 is the button; consider inviting them to press it.

[skills]: /docs/PRD.md#22-the-proposed-ai-solution-300-words-max
[moment]: /docs/analyses/final-plan.md#the-moment-judges-remember

## Problem data

Every number below was opened at its source on 29 October 2026.

| Number                                                                                                          | Source                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 74,841 loss-of-employment applications under the Employment Insurance System, 2025                              | Human Resources Minister Ramanan, [Scoop, 13 January 2026][scoop-2025]                 |
| 38,953 lost their jobs from January to May 2026, most aged 25 to 39                                             | [The Star, 15 June 2026][star-2026]                                                    |
| AI is not behind the job losses "not yet, rather than not ever"                                                 | [Khazanah Research Institute, 28 September 2026][kri]                                  |
| Employers in Malaysia expect 41% of core skills to change by 2030 (39% globally)                                | [WEF Future of Jobs Report 2025][wef], Malaysia profile, PDF pages 168–169             |
| Of every 100 workers in Malaysia, 56 need training by 2030, and 11 are unlikely to get it                       | Same WEF profile                                                                       |
| 79% of Malaysian professionals expect AI to change their roles                                                  | Jobstreet's Decoding Global Talent 2024, cited in [The Star, 21 January 2025][star-79] |
| 3 million HRD Corp training opportunities (RM3 billion), especially in high-tech, digital and energy transition | [Budget 2026 touchpoints][budget], page 20                                             |
| 52,607 applications for unemployment benefits by 16 July 2026, under the Employment Insurance System            | [SAYS, 20 July 2026][says]                                                             |
| Professionals, managers, executives and technicians made up 51% of 2026's retrenchments to mid-July             | Same SAYS article                                                                      |

Not confirmed on 29 October, so left out until someone opens the source:

- The preliminary video's "this time, it's the office". The minister's own article says most 2025 losses were in manufacturing, construction and wholesale, so do not lean on it without a checked source.
- TalentCorp's 620,000 jobs at high risk in 10 sectors (November 2024) and the Auditor-General's HRD Corp levy figures: both pages blocked the check.

[scoop-2025]: https://www.scoop.my/opinion/282361/strengthening-graduate-employability-and-labour-market-alignment-in-malaysia-ramanan-ramakrishnan/
[star-2026]: https://www.thestar.com.my/news/nation/2026/06/15/ministry-expands-job-skill-support
[kri]: https://krinstitute.org/publications/why-ai-is-not-yet-behind-malaysias-job-losses
[wef]: https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf
[star-79]: https://www.thestar.com.my/news/nation/2025/01/21/fresh-graduates-face-employment-challenges-as-ai-takes-over
[budget]: https://belanjawan.mof.gov.my/pdf/belanjawan2026/ucapan/touchpoint-budget-en.pdf
[says]: https://says.com/my/news/2026-is-on-track-to-be-malaysias-worst-year-for-retrenchments-since-the-pandemic

## Who answers what

Any judge may ask any member about any part, AI-written code included ([handbook 8.5.7](/docs/sources/sdchack.my/handbook.md#85-use-of-ai-tools-in-development)), so everyone must be able to explain the scoring rules. Each area still has one person who answers first. The names below are suggestions from who built what, and match the first answerers in the final plan's [questions to drill](/docs/analyses/final-plan.md#questions-to-drill); confirm them as a team.

| Area                                                         | Answers first | Backup |
| ------------------------------------------------------------ | ------------- | ------ |
| Scoring rules, fit maths, pace rule, the demo                | DrxgClanPC    | TBD    |
| Trend data, JobStreet ads, refresh and its cost              | chaosiris     | TBD    |
| AI: RunPod batch, question writing, Claude explanations, MCP | kymil4        | TBD    |
| Product, design, Kopi, who it is for                         | AlaskanTuna   | TBD    |
| Business model, who pays                                     | AlaskanTuna   | TBD    |
| Impact numbers, SDG                                          | TBD           | TBD    |

Answer style (from the Mortar pitch): short answers, say "we", and say what kind of answer it is: "evidence", "our assumption" or "what the prototype does". If you don't know, say so and say how we would find out.

## Questions to expect

From the finalist guide (section 12), with answer seeds:

- **"Change the trend data now. What should change?"** What Changed: switch April to May. Verdicts, fit and plan order move; the user's answers stay the same.
- **"Is this course or number real?"** Every verdict shows its source and date. Check the demo job's roadmap links before the pitch.
- **"Why this score, and what would raise it?"** Open See the Maths. The first roadmap step raises fit most per hour.
- **"How do you keep the data current, and what does it cost?"** A [GitHub Actions check](/.github/workflows/refresh-data.yml) runs every Saturday, rebuilds the snapshots and opens a pull request that a person approves; it never pushes to main. It has been switched off since 24 October for the repository freeze. The refresh costs about US$0.19 a month at list price; a full check-up costs about 7 US cents, or US$71.80 a month at 1,000 users ([cost card](/docs/cost-card.md#cost-per-check-up-and-per-month)).
- **"What if AI moves faster or slower?"** The slow and fast futures, labelled estimates; "Unknown" where data is thin.
- **"How do you stop it inventing a job or a course?"** Fixed rules decide every verdict, score and order. Jobs come from the [O\*NET list of 923][datasets]. A check throws out any explanation that changes a verdict or lacks a dated source.
- **"Why what-would-you-do questions?"** Self-ratings drift: people say yes to what sounds like their job, and pick the safe middle. Each question asks what you would do; the options are shuffled and their scores hidden.
- **"Where does the pace come from?"** A stated rule from three check-up answers (situation, years of work, qualification), bounded and shown in See the Maths, labelled an estimate. It changes hours and the finish week, never the verdicts.
- **"Personal data?"** Answers stay in the browser as a guest session. The national view stores only a role code, 6 levels and a date, and shows totals only for groups of [10 or more][privacy].

## Do not say

- That AI caused the job losses. The Human Resources Minister told Parliament in June that the data does not support AI as the driver of this year's retrenchments, and the research says "not yet" ([KRI](https://krinstitute.org/publications/why-ai-is-not-yet-behind-malaysias-job-losses)).
- That Aina is a real user. She is a sample persona. National skill-gap rows are sample data.
- That prices are agreed. They are prices to test.
- "guarantee", "AI decides", "will replace you", "certified", "real user".
- That anything recorded or hard-coded is live (finalist guide section 13).

## Pitch-day checklist

Before the slot:

- HDMI cable or adapter; the `.pptx` opens on this laptop.
- The operating system's animation effects are on (on Windows: Settings > Accessibility > Visual effects). With them off, Kotak follows reduced motion and hides Kopi's reaction.
- Notifications off, extra tabs closed, browser zoom 125%.
- A fresh guest session (clear the site data), with Aina's answers on a card.
- The live link open, a local build ready as the offline backup, and the backup video link in a tab.
- Test Kopi's AI and voice an hour before.
- Optional: printed QR cards for the live link and the repository, one per judge.

If it goes wrong on stage:

- Wi-Fi or the live site fails: switch to the local build and keep talking.
- Kopi's AI is slow: the verdict still shows with its fixed template; say so and carry on.
- Everything fails: play the backup video at the demo step only, and say it is a recording.
- Running long: cut the comparison grid detail first, then the MCP mention.

## Where this came from

- The [preliminary video script](kotak-director-script.md): the order, the lines and the claim guardrails.
- TolongLabs' MyTakziah finals pitch (September 2026): open with the human story, one simple national number, cut to the slow speaking rate, one silent hand-off, QR cards for judges.
- The Layak pitch deck: tie the team name to the problem, a named reference user, "grounded, not guessed".
- The Mortar pitch: the Q&A answer style and the list of claims never to make.
- The Safe Edge research on Malaysian judges: proof it works, proof it pays, fit with local institutions.

[questions]: /docs/TRD.md#question-order-and-levels
[datasets]: /docs/data-card.md#loaded-datasets
[privacy]: /docs/TRD.md#privacy-summary

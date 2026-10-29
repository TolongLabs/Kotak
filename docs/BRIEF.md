# SDC Hackathon 2026 brief

What our team, T010NG, must build and submit for the Domain 1 final of SDC Hackathon 2026, by when, and which rules can cost us points or our place. It condenses the organisers' documents in [`docs/sources/`](/docs/sources/), as captured from 19 to 29 October 2026, and cites each point. Where sources disagree it takes the stricter rule. The sources, and above them the [Terms and Conditions][tc], win over this brief ([slide 13]).

Contents:

1.  [Our challenge](#our-challenge)
1.  [Deadlines](#deadlines)
1.  [Final deliverables](#final-deliverables)
    1.  [Repository requirements](#repository-requirements)
    1.  [How to submit](#how-to-submit)
1.  [Judging](#judging)
1.  [Rules that can cost us](#rules-that-can-cost-us)
1.  [At the venue](#at-the-venue)
1.  [Support and contacts](#support-and-contacts)
1.  [See also](#see-also)

[tc]: /docs/sources/sdchack.my/terms-and-conditions.md
[slide 13]: /docs/sources/opening-briefing/slides.md#slide-13-contest-protocol-agenda

## Our challenge

SDC (Sustainably Developing Code) is a two-week hybrid AI hackathon on the UN Sustainable Development Goals, run by the XMUM AI Club with the XMUM Rotaract Club ([overview]). We were one of 123 teams in Domain 1, sponsored by Aiversecity ([slide 63]), and are one of its 15 finalists, "Listed alphabetically — not a ranking" ([finalists]). Its [problem statement][d1]:

> How might we build an AI-powered solution that continuously tracks AI advancement to predict which skills and jobs will emerge or decline, matches today’s workforce and tomorrow’s talent to the right future roles, and generates personalised reskilling pathways, while showing how each role and skill connects to the 17 UN Sustainable Development Goals?

The final keeps the problem statement but judges the complete product, running live, against a new rubric, and the preliminary score doesn't carry forward ([finalist guide 3][fg3]). Judges expect to watch one synthetic user move through six stages in a single live session ([section 4][fg4]). Each stage is a must-have, and one that is missing or only described caps the Problem-Solution Fit score ([section 5][fg5]):

1.  **Skills profile intake** by CV upload, form or questionnaire, with the captured skills driving the matching. A single hard-coded demo user isn't enough.
2.  **AI-trend signal layer** fed by at least one updatable source, with its name and date on screen, and results that change when the data changes. Judges may ask us to change the trend data during the demo.
3.  **Future-role matching**: ranked roles, each with an explainable match score, its reasons and a skills gap. Expect "why this score, and what would raise it?"
4.  **Personalised reskilling pathway**: ordered steps with time estimates, through real free or low-cost resources such as online courses or HRD Corp-claimable programmes. Judges may check that a course is real.
5.  **SDG mapping**: every role and skill tagged to at least one SDG with a reason, and the chosen path's contribution shown.
6.  **Handling uncertainty**: at least two scenarios, such as moderate and fast AI disruption, with recommendations that shift between them, labelled as estimates.

Under Technical Execution, judges probe what sits behind them: each snapshot stored with its fetch date and a refresh possible during the demo; a decomposable score, such as skill overlap weighted by trend momentum; recommendations built from our own sourced tables, saying so when no source exists; scenarios driven by explicit parameters, not hand-written alternatives; a one-line reason for every SDG link, added up into the path's contribution; no crash on a thin profile, an unknown skill or a dead source, falling back to the last good snapshot; and a deployed app with an organised repository and steady commits ([section 6][fg6]). The preliminary rules still hold: public, open or synthetic data only; name any language model used; every recommendation cites a source; the system never invents jobs, courses or statistics; humans make the career decisions; and full course content, payment systems and real recruitment integrations are out of scope ([section 9][fg9]; [preliminary guide 6][d1-rules]).

Optional features earn credit inside the criteria but never make up for a missing must-have: an employer or HR view with a workforce skills-gap heatmap, automatic re-planning when the trend data changes, English, Bahasa Malaysia and Chinese, low-bandwidth and mobile design, progress tracking, fairness checks, and an SDG view for a person, a company or a region ([section 7][fg7]). At the briefing the organisers said Domain 1 must target "a mix of businesses and government" ([transcript], 01:21:52), and the finalist guide names career centres, TVET providers and HR teams as channels ([section 8][fg8]).

Each domain pays RM 8,000, from RM 3,000 for the champion to RM 150 for each finalist outside the top five ([prizes]).

[overview]: /docs/sources/sdchack.my/overview.md
[slide 63]: /docs/sources/opening-briefing/slides.md#slide-63-domain-assignment-lists
[finalists]: /docs/sources/sdchack.my/finalists.md#domain-1---aiversecity
[d1]: /docs/sources/drive.google.com/domain-1-aiversecity.md
[fg3]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#3-what-changes-at-the-final
[fg4]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#4-the-final-demo-journey
[fg5]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#5-must-have-features-final-standard
[fg6]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#6-technical-expectations
[fg7]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#7-good-to-have-features-optional
[fg8]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#8-impact--evidence
[fg9]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#9-rules-and-boundaries
[d1-rules]: /docs/sources/drive.google.com/domain-1-aiversecity.md#6-rules-and-boundaries
[transcript]: /docs/sources/opening-briefing/transcript.md
[prizes]: /docs/sources/sdchack.my/overview.md#prizes

## Deadlines

All times are MYT (UTC+8).

| When                  | What                                                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28 Oct, 8:32 PM       | Finalists announced ([Discord][disc-finalists])                                                                                                                                                                                                                                        |
| **29 Oct, 12 PM**     | **Confirm attendance with the attendance form and visitor pass; missing it counts as withdrawal** ([Terms and Conditions 8.2][tc82]). Also the last time to register a car ([participant handbook 6.6.11][ph66]) and to give notice of not attending ([official handbook 4.3.6][hb43]) |
| 28–30 Oct             | Upgrade round, online ([participant handbook 6.5][ph65])                                                                                                                                                                                                                               |
| 31 Oct, 8 AM          | Registration at XMUM, then the opening briefing at 9:30 AM and hacking from 10:30 AM ([participant handbook 7.2][ph72])                                                                                                                                                                |
| 31 Oct, 9 AM to 1 PM  | Booking for the offline mentoring session; sessions run from 1:35 PM ([final round page][tp-mentoring])                                                                                                                                                                                |
| **1 Nov, 7:59:59 AM** | **Final submission closes and the repository freezes** ([participant handbook 6.6.3][ph66]); the portal says 8 AM ([finalist submission][tp-final])                                                                                                                                    |
| 1 Nov, 9:40 AM        | Pitching in two parallel domain tracks until 3:40 PM, with lunch from 12:40 to 1:40 PM ([participant handbook 7.2][ph72])                                                                                                                                                              |
| 1 Nov, 4 PM           | Closing ceremony and results, until 6:30 PM ([participant handbook 7.2][ph72])                                                                                                                                                                                                         |

The sprint runs under 23 hours, from 9:30 AM on 31 October, though the report template calls it "the 48-hour physical sprint" and the website says 24 hours ([known conflicts][conflicts]). Plan for 7:59:59 AM on 1 November.

[disc-finalists]: /docs/sources/discord.com/announcements.md#finalists-announced
[tc82]: /docs/sources/sdchack.my/terms-and-conditions.md#82-finalist-confirmation
[ph66]: /docs/sources/drive.google.com/participant-handbook.md#66-final-round-physical-hackathon
[hb43]: /docs/sources/sdchack.my/handbook.md#43-commitment-fee-and-refund-policy
[ph65]: /docs/sources/drive.google.com/participant-handbook.md#65-phase-2-online-upgrading-round
[ph72]: /docs/sources/drive.google.com/participant-handbook.md#72-final-phase-rundown
[tp-mentoring]: /docs/sources/sdchack.my/team-portal.md#offline-mentoring-session
[tp-final]: /docs/sources/sdchack.my/team-portal.md#finalist-submission
[conflicts]: /docs/sources/drive.google.com/README.md#conflicts-between-sources

## Final deliverables

The sources disagree on what the final takes. The portal asks only for the repository link ([finalist submission][tp-final]), the report template asks for the report "together with your pitch deck and a working deployment link" ([report template][fr]), and the participant handbook lists seven items ([participant handbook 6.6.4][ph66]). The Drive tour asks for new copies of both templates ([tour], 1:28). This brief takes all of them. No source says where the files go, so keep them in the repository's `submission/` folder, as in the preliminary round ([known conflicts][conflicts]):

| #   | Item                          | What it must be                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 2 final report          | The [report template][fr] as one PDF, `SDC2026_T010NG_Final.pdf`, with every field filled, the IP declaration and the leader's signature. Section 2 takes at most 250 words, 3.2 at most 300 and 5 at most 250. It covers the handbook's final solution report: features, architecture, SDG impact and how the build evolved ([participant handbook 6.6.4.3][ph66]).                                                                                                                                                                     |
| 2   | Updated PRD                   | What changed since the preliminary submission and why, based on judge and mentor feedback ([participant handbook 6.6.4.1][ph66]). No template exists. Section 3.2 of the report asks a similar question, but the handbook lists this item separately, so add a short updated PRD as well.                                                                                                                                                                                                                                                |
| 3   | Technical & Tools Declaration | The [finalist copy][td-final] as one PDF under the same name, `SDC2026_T010NG_TechDeclaration.pdf`, replacing the preliminary copy. Complete every section again, adding what we took up since the preliminary, such as the KrackedDevs keys, with the Replit and RunPod proof of use ([participant handbook 6.6.4.2][ph66]; [participant handbook 10][ph10]). "No" or "None", never blank, no keys in the document, and the leader's signature. Word limits: 2.1 at most 200, 4.3 and 5 at most 100 each, 6.1 and 6.2 at most 150 each. |
| 4   | Pitch deck                    | Problem, solution, technical implementation, SDG relevance, impact, feasibility and the demo ([participant handbook 6.6.4.6][ph66]). The handbook wants `.pptx` ([participant handbook 6.7.5][ph67]) and the report checklist a flattened PDF ([report template 6][fr6]), so submit both, and check the deck opens on our laptop before the slot.                                                                                                                                                                                        |
| 5   | Live demo                     | A working deployment link, with any files, accounts or test credentials the demo needs ([participant handbook 6.6.4.7][ph66]), and a backup, an offline build or a recording, in case the connection fails ([how judging works][fg-judging]).                                                                                                                                                                                                                                                                                            |
| 6   | Backup pitch video            | A pre-recorded demo on YouTube, played only if the live demo can't go ahead ([participant handbook 6.6.4.4][ph66]).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 7   | GitHub repository             | The preliminary repository, improved and public. See [repository requirements](#repository-requirements).                                                                                                                                                                                                                                                                                                                                                                                                                                |

A valid submission has every required file, every link accessible, every declaration complete and arrives on time ([Terms and Conditions 6.5][tc65]). It needs a working prototype, a functional user interface and a live pitch, and is incomplete if any one is missing ([official handbook 7.4.3][hb74]). Content that "exaggerates, fabricates, or misrepresents" what the solution can do is barred ([Terms and Conditions 6.1.5][tc61]).

[fr]: /docs/sources/drive.google.com/final-report-template.md#cover-and-submission-rules
[tour]: /docs/sources/drive.google.com/finalist-drive-tour.md#transcript
[td-final]: /docs/sources/drive.google.com/technical-tools-declaration-template.md#finalist-copy
[ph10]: /docs/sources/drive.google.com/participant-handbook.md#10-submission-guideline
[ph67]: /docs/sources/drive.google.com/participant-handbook.md#67-pitching-session
[fr6]: /docs/sources/drive.google.com/final-report-template.md#6-final-submission-checklist
[fg-judging]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#how-judging-works
[tc65]: /docs/sources/sdchack.my/terms-and-conditions.md#65-valid-submission
[tc61]: /docs/sources/sdchack.my/terms-and-conditions.md#61-general-submission-requirements
[hb74]: /docs/sources/sdchack.my/handbook.md#74-scope-and-constraints

### Repository requirements

- **The same repository**: "Don't start a new repository; keep improving the one from your preliminary round" ([tour], 1:28), which for us is [TolongLabs/Kotak](https://github.com/TolongLabs/Kotak), created on 24 October. The preliminary freeze holds "Unless otherwise instructed by the Organiser" ([Terms and Conditions 6.6][tc66]), and we read the tour as that instruction. The 25 October closure notice called any later commit "immediate disqualification" ([Discord][disc-closed]), so confirm in `#ask-the-organizers` before the first push.
- **Visibility**: private while hacking ([participant handbook 6.1.2][ph61]), public when we submit, which the portal checks ([finalist submission][tp-final]), and public until judging ends; a private link may affect our eligibility ([participant handbook 10][ph10]). The repository was private on 29 October.
- **Commit history**: incremental updates "throughout the official live hacking window" ([report template 6][fr6]). A near-complete codebase pushed in one large commit shortly before the deadline "will result in disqualification" if it looks pre-built, where the preliminary rule said "may" ([participant handbook 6.6.4.5][ph66]). No source defines the window; the upgrade round runs online from 28 October ([participant handbook 6.5][ph65]) and the sprint from 9:30 AM on 31 October ([participant handbook 6.6.1][ph66]), so commit steadily through both rather than land the upgrade in one push at the venue.
- **README**: clean and well documented, with installation instructions ([report template 6][fr6]). The preliminary list still applies: team name, domain, the demo and video links, run steps, structure, and how we used Replit and RunPod ([slide 35]; [sample repository][gh]).
- **Licence**: a `LICENSE` file with the Apache License 2.0 ([participant handbook 10][ph10]).
- **Secrets**: no API keys or passwords in the repository; keep the KrackedDevs and RunPod keys in environment variables ([participant handbook 6.1.6][ph61]; [credits guide][credits]).
- **Collaborators**: add the committee's GitHub accounts before the deadline ([participant handbook 6.6.4.5][ph66]). No source names them, and the briefing said "if required" ([transcript], 00:51:46), so ask the organisers which accounts, if any.
- **Freeze**: no commits, fixes or changes of any kind after the deadline. The organiser inspects repository activity afterwards ([Terms and Conditions 6.6][tc66]), and a commit after the deadline means deductions or disqualification ([slide 50]).

[tc66]: /docs/sources/sdchack.my/terms-and-conditions.md#66-repository-freeze
[ph61]: /docs/sources/drive.google.com/participant-handbook.md#61-pre-event-preparation-requirements
[slide 35]: /docs/sources/opening-briefing/slides.md#slide-35-repo-step-what-the-readme-must-include
[gh]: /docs/sources/drive.google.com/github-submission-template.md#readme-template
[credits]: /docs/sources/drive.google.com/finalist-credits-guide.md
[disc-closed]: /docs/sources/discord.com/announcements.md#preliminary-round-closed

### How to submit

The team leader submits ([official handbook 4.2][hb42]) on the [final round page][tp-final-page], which is "separate from your preliminary submission, which stays as it was" ([finalist submission][tp-final]):

1.  Sign in at [sdchack.my](https://sdchack.my/) with the team leader's account and open **Book mentoring & submit**.
2.  Paste the public repository URL. The page checks that it is public.
3.  Tick the checkbox: "Our project integrates our API Premium sponsor's technology — mandatory for both rounds. Submissions without it are disqualified."
4.  Submit. Resubmitting is allowed until 1 November, 8 AM.

No source names the API Premium sponsor. The briefing called Alpha Red, RunPod, Replit and KrackedDevs "tech premium sponsors" ([transcript], 00:22:05 to 00:28:34), and a false tick would misrepresent the solution ([Terms and Conditions 6.1.5][tc61]).

The page takes only the GitHub link, so every other item has to be reachable from the repository. As the briefing advised for the preliminary, submit early, then open every link in an incognito window ([slide 47]).

[hb42]: /docs/sources/sdchack.my/handbook.md#42-team-eligibility
[tp-final-page]: /docs/sources/sdchack.my/team-portal.md#final-round-page
[slide 47]: /docs/sources/opening-briefing/slides.md#slide-47-deadline

## Judging

The [final rubric][fg11] scores each criterion from 1 to 10 and multiplies it by its weight:

- **Innovation & Creativity, 25%**: trend tracking that keeps updating, explains itself and shows uncertainty, with SDG links that change a user's choices. Name the job sites and course platforms that exist and show what makes ours different; "Not a fixed list, a basic course recommender or a CV chatbot."
- **Technical Execution, 25%**: the full journey running live. It passes the change test, spot-checked jobs, courses and numbers are real, and it is "Mostly a real pipeline rather than mocked", deployed, with organised code.
- **Impact & Feasibility, 20%**: who we would reach and how, how the trend data stays fresh and what that costs, free or low-cost learning such as HRD Corp, protected personal data, and SDG impact measured against our Phase 1 baseline. Fairness checks, more languages and low-data design earn credit.
- **Problem-Solution Fit, 15%**: every part of the problem statement answered and all six must-haves shown live. The SDG test: "if the tag were removed, would the user lose anything?" AI helps people decide and never makes hiring decisions.
- **Presentation & Pitch, 10%**: a clear story from "who I am now" to "where I could be", honest that predictions are estimates and about data limits, within time, with more than one teammate answering.
- **Design & UX, 5%**: a first-time user gets from profile to ranked roles and a learning plan in minutes, without being told how. "Judged on the product, not the slides."

What else decides the score:

- **Live checks**: judges may change the trend data, verify a job, course or number, or ask why a score is what it is ([how judging works][fg-judging]). The guide's sample questions add how we keep the data current and what it costs, what happens if AI moves faster or slower, and how we stop the system inventing a job or a course ([section 12][fg12]).
- **Impact evidence**: section 4 of the report feeds the Impact, Technical Execution and Innovation scores, and "Vague claims or missing verification will weaken your score" ([report template 4][fr4]). The cover says "Unsupported claims will not be credited" and points to section 3 for the evidence ([report template][fr]), so put evidence in both 3.2 and 4. It compares results with our Phase 1 KPI, the sourced-roadmap rate, and its Phase 2 target: all 20 seeded test profiles reach a sourced roadmap in under 3 minutes with no uncited recommendation, and the April-to-May 2026 snapshot swap changes at least one verdict on every hand-checked demo role ([our preliminary PDF][prelim], section 4). The guide also asks for reach, refresh frequency, cost per user or per month, the free share of a pathway, PDPA protection and bias checks ([section 8][fg8]). The proof in section 4.1 is optional but earns bonus marks, and must reflect what we built ([report template 4.1][fr41]).
- **Time**: a 10-minute pitch and 5 minutes of questions in the handbook ([participant handbook 6.7.3][ph67]), though the finalist guide says the limit "will be confirmed by the organizers". Each 30 seconds over costs 1 point ([participant handbook 6.7.4][ph67]).
- **Common mistakes**: fixed trend lists, a model inventing jobs, courses or numbers, one prediction shown as certain, SDG tags that change nothing, and pre-recorded or hard-coded output presented as live ([section 13][fg13]).
- **Ties** go to the higher sub-score in this order: Technical Execution, Problem-Solution Fit, Impact & Feasibility, Innovation & Creativity, Presentation & Pitch, then Design & UX ([participant handbook 6.8.3][ph68]).
- **Verification**: judges review documents, inspect code, run demos and interview teams ([Terms and Conditions 7.3][tc73]), and before the awards the organiser may disqualify a team for any violation "regardless of its judging score" ([Terms and Conditions 7.5][tc75]). No appeal or re-evaluation is entertained ([Terms and Conditions 7.4][tc74]).

[fg11]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#11-marking-rubric--final-round
[fg12]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#12-prepare-for-qa
[fg13]: /docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md#13-common-mistakes
[fr4]: /docs/sources/drive.google.com/final-report-template.md#4-environmental--sdg-impact-verification
[fr41]: /docs/sources/drive.google.com/final-report-template.md#41-mathematical-proof--code-logic-snippet
[prelim]: /submission/SDC2026_T010NG_Preliminary.pdf
[ph68]: /docs/sources/drive.google.com/participant-handbook.md#68-judging-and-results
[tc73]: /docs/sources/sdchack.my/terms-and-conditions.md#73-evaluation-process
[tc75]: /docs/sources/sdchack.my/terms-and-conditions.md#75-verification-before-awarding
[tc74]: /docs/sources/sdchack.my/terms-and-conditions.md#74-judges-decision

## Rules that can cost us

Penalties run from a warning through deductions, cancelled finalist status and disqualification to a ban from future editions ([slide 50]).

- **Replit is compulsory**: it must be part of the solution ([participant handbook 9][ph9]), and teams that don't redeem and use it "won't be eligible for judging" ([Discord][disc-replit]). Proof, from our own account, is a live Replit deployment URL, a project link with its history, or finished credit ([participant handbook 10][ph10]). In the Replit workshop the publish panel read "Invite only" ([Replit workshop slide 47][w2-publish]), so check the deployment is public before judging.
- **RunPod for any GPU work**: training, fine-tuning or GPU inference must run on RunPod ([participant handbook 9][ph9]), proved by a screenshot of the Pod ID or endpoint URL, the GPU type and the runtime ([participant handbook 10][ph10]).
- **Declare everything**: every API, model, dataset and AI tool, because undeclared use can mean deductions or disqualification ([slide 29]; [finalist guide 9][fg9]). Declaring AI tools doesn't lower the score ([declaration template 4.3][td43]).
- **AI as an assistant**: the idea must be ours, unedited wholesale AI output isn't acceptable, and any member can be asked about any part, AI-assisted parts included ([slide 29]).
- **Built during the hackathon**: pre-built projects, or ones entered elsewhere, aren't eligible. Small pre-existing code such as login modules or utilities is allowed as supporting parts only ([slide 30]; [Terms and Conditions 5.3 and 5.4][tc54]). The report asks again about pre-existing work and third-party code, with "No change from Phase 1 declaration" as an option ([report template 7][fr7]). The official handbook wanted pre-existing work declared at registration and approved ([official handbook 8.2][hb82]), so reuse little and declare all of it.
- **Our own work, honestly described**: only registered members build. Mentors advise but never build, write documentation or decide for us ([participant handbook 11.4][ph114]), and outsourcing is "strictly prohibited" ([Terms and Conditions 5.10][tc510]). Plagiarism or false information means immediate disqualification ([Terms and Conditions 11][tc11]).
- **No real personal data**: use public, open or self-collected data and credit the sources ([slide 51]), and say how personal data would be protected under the PDPA ([finalist guide 8][fg8]).
- **All of us, at every compulsory activity**: attendance is mandatory for finalist teams, all members are expected, and the organiser decides whether a team with an absent member stays eligible ([Terms and Conditions 4.6 and 8.3][tc83]). Compulsory activities include registration, briefings, mentoring, technical inspections, checkpoint reviews, pitching and the award ceremony; an unauthorised absence can be penalised ([Terms and Conditions 14.2][tc142]).
- **Discord is official**: "I didn't see it" isn't accepted for a missed announcement ([slide 51]), so keep its notifications on ([Terms and Conditions 8.2][tc82]).
- **Late is never**: a late submission isn't accepted ([Terms and Conditions 6.4][tc64]).
- **Deposit**: the RM 25 deposit comes back only for a valid, complete preliminary submission, and is forfeited by a finalist that doesn't attend without notice before 29 October, 12 PM ([official handbook 4.3.6][hb43]), or by a team that didn't redeem and use Replit ([Discord][disc-replit]). The organiser may also withhold it from a team that is disqualified or misses a participation requirement ([Terms and Conditions 3.4.3][tc34]).

[slide 50]: /docs/sources/opening-briefing/slides.md#slide-50-penalties
[ph9]: /docs/sources/drive.google.com/participant-handbook.md#9-official-tools-and-resources
[disc-replit]: /docs/sources/discord.com/announcements.md#replit-core-access
[w2-publish]: /docs/sources/workshop-2-replit/slides.md#slide-47-publishing-the-app
[slide 51]: /docs/sources/opening-briefing/slides.md#slide-51-faqs
[td43]: /docs/sources/drive.google.com/technical-tools-declaration-template.md#43-ai-assisted-development-tools
[slide 29]: /docs/sources/opening-briefing/slides.md#slide-29-ai-usage-policy
[slide 30]: /docs/sources/opening-briefing/slides.md#slide-30-academic-integrity
[tc54]: /docs/sources/sdchack.my/terms-and-conditions.md#54-pre-existing-code
[fr7]: /docs/sources/drive.google.com/final-report-template.md#7-ip--originality-declaration
[ph114]: /docs/sources/drive.google.com/participant-handbook.md#114-what-mentor-cannot-do
[tc510]: /docs/sources/sdchack.my/terms-and-conditions.md#510-external-assistance
[tc11]: /docs/sources/sdchack.my/terms-and-conditions.md#11-cheating--misconduct
[tc83]: /docs/sources/sdchack.my/terms-and-conditions.md#83-physical-attendance
[tc142]: /docs/sources/sdchack.my/terms-and-conditions.md#142-attendance-and-participation
[tc64]: /docs/sources/sdchack.my/terms-and-conditions.md#64-late-submission
[hb82]: /docs/sources/sdchack.my/handbook.md#82-use-of-pre-existing-code-and-materials
[tc34]: /docs/sources/sdchack.my/terms-and-conditions.md#34-deposit-refund

## At the venue

The final runs at Xiamen University Malaysia ([participant handbook 5][ph5]):

| Activity               | Room                                           |
| ---------------------- | ---------------------------------------------- |
| Briefing               | A4#G07                                         |
| Hacking                | A3#506, A3#508, A3#509, A3#511, A3#517, A3#518 |
| Mentoring and sleeping | A3#512 and A3#505                              |
| Pitching               | A4#113 and A5#119                              |
| Ceremony               | A1, Tan Hua Choon Auditorium                   |
| Meals                  | A3, ground floor                               |

- **Bring**: our own laptops, which must drive HDMI directly or through an adapter such as USB-C to HDMI, with chargers, multi-plug adapters, backup equipment and signed-in accounts ([participant handbook 6.1][ph61]; [participant handbook 6.7][ph67]), plus an extension cord, a sleeping bag or blanket, a jacket, clothes, toiletries and towels ([participant handbook 15.12][ph1512]). Bring student ID and wear the event badge at all times ([Terms and Conditions 14.1 and 14.3][tc14]).
- **Download first**: models, datasets and other heavy resources must be ready before we arrive, because heavy scraping and multi-gigabyte downloads on the campus Wi-Fi aren't allowed ([participant handbook 6.6.7][ph66]).
- **Getting there**: enter by the Southern or Eastern Gate and park in the A3 basement, with the car registered by 29 October, 12 PM ([participant handbook 6.6][ph66]). The Finalist Drive's directory videos show the routes, the prayer room on A3's fifth floor and the showers in B1 ([directory videos][tour-dir]).
- **Pitch day**: pitch preparation runs from 8 AM on 1 November on A3's sixth floor ([participant handbook 7.2][ph72]), and the organisers assign the pitching order ([Terms and Conditions 4.7][tc47]), so watch Discord for our slot. Wear smart casual or formal clothes for the pitch and the ceremony ([participant handbook 15.18][ph1518]).
- **Help**: a help desk on A3's fifth floor, alongside Discord ([participant handbook 8][ph8]).
- **Overnight**: follow the sleeping and quiet-hours rules, and bring no alcohol, weapons or other prohibited items ([Terms and Conditions 14][tc14]). The organisers aren't liable for lost or damaged belongings ([participant handbook 6.6.8][ph66]).

[ph5]: /docs/sources/drive.google.com/participant-handbook.md#5-venue
[ph1512]: /docs/sources/drive.google.com/participant-handbook.md#1512-what-should-participants-bring-for-the-physical-final-phase
[tc47]: /docs/sources/sdchack.my/terms-and-conditions.md#47-pitching-session
[ph1518]: /docs/sources/drive.google.com/participant-handbook.md#1518-is-there-a-dress-code-for-the-event
[tc14]: /docs/sources/sdchack.my/terms-and-conditions.md#14-physical-final-round
[tour-dir]: /docs/sources/drive.google.com/finalist-drive-tour.md#directory-videos
[ph8]: /docs/sources/drive.google.com/participant-handbook.md#8-physical-help-desk

## Support and contacts

- **Mentors**: our online session was with Ravenna Chen Yaohui, CEO of Intrinsic SEA, on 23 October ([team portal][tp-mentorship]). At the final, each team gets one 15-minute session in A3#512, presenting to a panel of several Domain 1 mentors. Booking opens for every team at 9 AM on 31 October and closes at 1 PM sharp, first come, first served, with a slot for every team ([final round page][tp-mentoring]). The slots run to 6:50 PM, past the rundown's 6:30 PM dinner break ([known conflicts][conflicts]). Mentors give feedback only ([participant handbook 11.4][ph114]).
- **Discord** is the official channel. Use `#ask-the-organizers` for general questions, `#ask-tech` for platform problems and `#open-ticket` for a private channel ([slide 56]; [slide 57]; [slide 58]).
- **Formal questions**: the official Discord or [sdc.xmumhack@gmail.com](mailto:sdc.xmumhack@gmail.com) ([slide 51]).
- **Credits**: up to US$225 for each finalist team ([credits guide][credits]):
  - **Replit**: US$100 in credits or a Pro plan. Redeem it with the promo code, then switch off auto-reload and cancel auto-renewal straight away, so nothing is charged to the card ([Replit][credits-replit]).
  - **RunPod**: US$25 for the team. Stop pods after each session, because a stopped pod's disk still bills, and running pods stop when the credit runs out ([RunPod][credits-runpod]). Serverless bills from worker start, model load included ([RunPod workshop slide 19][w3-billing]). The credit also covers the GLM-5.3 public endpoint ([Discord][disc-glm]).
  - **KrackedDevs**: US$100 as five personal US$20 keys for any OpenAI-compatible tool. Every teammate must join the guild and RSVP to the event to get one, and the budget doesn't reset ([KrackedDevs][credits-kd]).

[tp-mentorship]: /docs/sources/sdchack.my/team-portal.md#mentorship-session
[slide 56]: /docs/sources/opening-briefing/slides.md#slide-56-discord-tour-announcements
[slide 57]: /docs/sources/opening-briefing/slides.md#slide-57-discord-tour-ask-tech
[slide 58]: /docs/sources/opening-briefing/slides.md#slide-58-discord-tour-open-a-ticket
[credits-replit]: /docs/sources/drive.google.com/finalist-credits-guide.md#1-replit
[credits-runpod]: /docs/sources/drive.google.com/finalist-credits-guide.md#2-runpod
[w3-billing]: /docs/sources/workshop-3-runpod/slides.md#slide-19-you-pay-from-worker-start-including-model-load
[disc-glm]: /docs/sources/discord.com/announcements.md#glm-53-on-runpod
[credits-kd]: /docs/sources/drive.google.com/finalist-credits-guide.md#3-krackeddevs

## See also

- [Domain 1 finalist guide](/docs/sources/drive.google.com/domain-1-aiversecity-finalist-guide.md) and the [preliminary problem statement](/docs/sources/drive.google.com/domain-1-aiversecity.md)
- [Phase 2 report template](/docs/sources/drive.google.com/final-report-template.md) and the [Technical Tools Declaration template](/docs/sources/drive.google.com/technical-tools-declaration-template.md)
- [Participant and finalist Drive sources](/docs/sources/drive.google.com/README.md), with the known conflicts between sources
- [Team portal](/docs/sources/sdchack.my/team-portal.md), with the final round page, and the [finalists](/docs/sources/sdchack.my/finalists.md)
- [Participant handbook](/docs/sources/drive.google.com/participant-handbook.md), [official handbook](/docs/sources/sdchack.my/handbook.md) and [Terms and Conditions](/docs/sources/sdchack.my/terms-and-conditions.md)
- [Opening briefing slides](/docs/sources/opening-briefing/slides.md), [transcript](/docs/sources/opening-briefing/transcript.md) and [chat](/docs/sources/opening-briefing/chat.md)
- Workshop write-ups: [Alpha Red](/docs/sources/workshop-1-alphared/transcript.md), [Replit](/docs/sources/workshop-2-replit/transcript.md), [RunPod](/docs/sources/workshop-3-runpod/transcript.md), [Favoriot](/docs/sources/workshop-4-favoriot/transcript.md) and [KrackedDevs](/docs/sources/workshop-5-krackeddevs/transcript.md)

# SDC Hackathon 2026 brief

What our team must build and submit for Domain 1 of SDC Hackathon 2026, by when, and which rules can cost us points or our place. It condenses the organisers' documents in [`docs/sources/`](/docs/sources/), as captured on 19 and 20 October 2026, and cites each point. Where sources disagree it takes the stricter rule. The sources, and above them the [Terms and Conditions][tc], win over this brief ([slide 13]).

Contents:

1.  [Our challenge](#our-challenge)
1.  [Deadlines](#deadlines)
1.  [Preliminary deliverables](#preliminary-deliverables)
    1.  [Repository requirements](#repository-requirements)
    1.  [How to submit](#how-to-submit)
1.  [Judging](#judging)
1.  [Rules that can cost us](#rules-that-can-cost-us)
1.  [Support and contacts](#support-and-contacts)
1.  [See also](#see-also)

[tc]: /docs/sources/sdchack.my/terms-and-conditions.md
[slide 13]: /docs/sources/opening-briefing/slides.md#slide-13-contest-protocol-agenda

## Our challenge

SDC (Sustainably Developing Code) is a two-week hybrid AI hackathon on the UN Sustainable Development Goals, run by the XMUM AI Club with the XMUM Rotaract Club ([overview]). We are one of 123 teams in Domain 1, sponsored by Aiversecity ([slide 63]). Its [problem statement][d1]:

> How might we build an AI-powered solution that continuously tracks AI advancement to predict which skills and jobs will emerge or decline, matches today’s workforce and tomorrow’s talent to the right future roles, and generates personalised reskilling pathways, while showing how each role and skill connects to the 17 UN Sustainable Development Goals?

The [domain file][d1] has the target users, the user journey and the optional features. The final product needs all six must-haves, and the preliminary proposal explains how each will be delivered ([section 4][d1-must]):

1.  **Skills profile intake** by CV upload, form or questionnaire, with sample profiles in place of real CVs.
2.  **AI-trend signal layer** fed by at least one updatable source of AI and job-market trends, showing the source and its date. Hard-coded lists alone don't count.
3.  **Future-role matching** with an explainable match score and a clear skills gap.
4.  **Personalised reskilling pathway**: an ordered plan with time estimates, using free or low-cost resources.
5.  **SDG mapping** of every role and skill to at least one SDG.
6.  **Handling uncertainty** with more than one future scenario, and predictions labelled as estimates.

Across all six: public, open or synthetic data only; name any language model used; every recommendation cites a source; the system never invents jobs, courses or statistics; humans make the career decisions ([section 6][d1-rules]). Aiversecity's picture of success adds that the output "visibly changes when the trend data changes" and the SDG link is "meaningful rather than decorative" ([section 7][d1-success]).

The preliminary demo must show the most important feature running live, for Domain 1 "the trend signal layer feeding the role matching system" ([briefing transcript][transcript], 00:41:22). Asked about the audience, the organisers said Domain 1 must target "a mix of businesses and government" ([transcript], 01:21:52), though the domain file's users also include individuals: working adults, fresh graduates and career switchers ([section 2][d1-users]).

[overview]: /docs/sources/sdchack.my/overview.md
[slide 63]: /docs/sources/opening-briefing/slides.md#slide-63-domain-assignment-lists
[d1]: /docs/sources/drive.google.com/domain-1-aiversecity.md
[d1-must]: /docs/sources/drive.google.com/domain-1-aiversecity.md#4-must-have-features
[d1-rules]: /docs/sources/drive.google.com/domain-1-aiversecity.md#6-rules-and-boundaries
[d1-success]: /docs/sources/drive.google.com/domain-1-aiversecity.md#7-what-success-looks-like
[transcript]: /docs/sources/opening-briefing/transcript.md
[d1-users]: /docs/sources/drive.google.com/domain-1-aiversecity.md#2-who-you-are-building-for

## Deadlines

All times are MYT (UTC+8).

| When                   | What                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 21–23 Oct              | Mentor session windows ([team portal][tp-mentors])                                                                           |
| **25 Oct, 7:59:59 AM** | **Preliminary submission closes and the repository freezes** ([slide 47])                                                    |
| 25 Oct                 | Mentor booking closes ([team portal][tp-mentors])                                                                            |
| 28 Oct, 8 PM           | Up to 15 finalists per domain announced ([slide 47]; [Terms and Conditions 4.4][tc44])                                       |
| 29 Oct, 12 PM          | Finalists confirm attendance; missing it counts as withdrawal ([Terms and Conditions 8.2][tc82])                             |
| 28–30 Oct              | Upgrade round, online, finalists only ([slide 11])                                                                           |
| 31 Oct – 1 Nov         | Grand final at XMUM, Sepang: a 24-hour hackathon, then a 10-minute pitch and 5 minutes of questions ([slide 11]; [slide 49]) |

The website and the submission page say 25 October, 11:59 PM, but the briefing slides and the participant handbook say 7:59:59 AM, the morning of Sunday 25 October: "Not Sunday night, not midnight" ([slide 47]; [known conflicts][conflicts]). Plan for the morning.

[tp-mentors]: /docs/sources/sdchack.my/team-portal.md#mentor-booking
[slide 47]: /docs/sources/opening-briefing/slides.md#slide-47-deadline
[tc44]: /docs/sources/sdchack.my/terms-and-conditions.md#44-finalist-selection
[tc82]: /docs/sources/sdchack.my/terms-and-conditions.md#82-finalist-confirmation
[slide 11]: /docs/sources/opening-briefing/slides.md#slide-11-event-timeline
[slide 49]: /docs/sources/opening-briefing/slides.md#slide-49-presentation-format
[conflicts]: /docs/sources/drive.google.com/README.md#conflicts-between-sources

## Preliminary deliverables

Six items, one official submission per team ([slide 45]; [participant handbook 6.3.5][ph63]):

| #   | Item                          | What it must be                                                                                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Product Requirement Doc       | The [Submission Template][st] as one PDF, `SDC2026_TeamName_Preliminary.pdf`, with every field filled, including the IP and originality declaration and the leader's signature. Section 2.1 takes at most 250 words, 2.2 at most 300 and 3.2 at most 200. Incomplete submissions may not be eligible for review.                                                              |
| 2   | Pitch deck                    | Problem, solution, technical approach and expected impact, telling the same story as the video. The organisers asked for PPTX ([transcript], 01:14:47).                                                                                                                                                                                                                       |
| 3   | Live prototype link           | A deployed link or accessible build that judges can use. A video or static mock-up doesn't count.                                                                                                                                                                                                                                                                             |
| 4   | Technical & Tools Declaration | The [declaration template][td] as one PDF, `SDC2026_TeamName_TechDeclaration.pdf`, listing every API, cloud service, AI tool, dataset, model, sponsor resource and piece of pre-existing code, with its compliance checklist and the leader's signature. "No" or "None", never blank. Word limits: 2.1 at most 200, 4.3 and 5 at most 100 each, 6.1 and 6.2 at most 150 each. |
| 5   | GitHub repository link        | Public, and reflecting what we demo. See [repository requirements](#repository-requirements).                                                                                                                                                                                                                                                                                 |
| 6   | Pitching video                | 5–7 minutes on YouTube, public rather than unlisted, with the prototype demo inside ([slide 49]; [transcript], 01:17:22). Each 30 seconds over costs 1 point ([slide 50]).                                                                                                                                                                                                    |

A valid submission is complete: "Every file there, every link opens, every declaration done" ([slide 47]). One without a working prototype, a functional UI and a pitch is incomplete, which "can lead to negative marking or disqualification" ([slide 27]; [transcript], 00:39:13).

[slide 45]: /docs/sources/opening-briefing/slides.md#slide-45-preliminary-submission
[ph63]: /docs/sources/drive.google.com/participant-handbook.md#63-phase-1-online-preliminary-round
[st]: /docs/sources/drive.google.com/submission-template.md#cover-page-and-submission-rules
[td]: /docs/sources/drive.google.com/technical-tools-declaration-template.md#cover-page-and-submission-rules
[slide 50]: /docs/sources/opening-briefing/slides.md#slide-50-penalties
[slide 27]: /docs/sources/opening-briefing/slides.md#slide-27-rules-for-both-domains

### Repository requirements

- **A fresh repository**: create it after 19 October, 8 PM, and don't recycle an older one without the organiser's prior written approval ([Terms and Conditions 5.5][tc55]). This repository was created on 9 October. We keep it and ask the organiser for that written approval ([issue #260](https://github.com/TolongLabs/Kotak/issues/260)); [issue #45](https://github.com/TolongLabs/Kotak/issues/45) holds the fallback move.
- **Visibility**: private while building, public before submitting ([slide 46]), and public until judging ends ([participant handbook 10][ph10]).
- **Licence**: a `LICENSE` file with the Apache License 2.0 ([participant handbook 10][ph10]; [licence tutorials][vt-licence]).
- **README**: team name, domain, the demo and pitch video links, how to run the project, its structure, and how we used Replit and RunPod ([slide 35]). The README template adds the SDG track and the deck ([slide 42]; [sample repository][gh]). Preliminary judges set the project up themselves, so the run steps matter ([transcript], 01:14:47).
- **`submission/` folder**: the Submission Template PDF and the Replit and RunPod proof of use, also as PDFs ([transcript], 00:47:18; [sample file tree][gh-tree]).
- **Commit history**: genuine and continuous. A near-complete codebase landing in one big commit gets reviewed and may be disqualified as pre-built ([slide 46]; [participant handbook 6.3.5][ph63]).
- **Secrets**: no API keys or passwords in the repository ([slide 46]).
- **Collaborators**: add the committee's GitHub accounts ([slide 46]), which no source names yet ([issue #18](https://github.com/TolongLabs/Kotak/issues/18)).
- **Freeze**: no commits of any kind after the deadline ([Terms and Conditions 6.6][tc66]). The briefing called a commit after 8 AM on 25 October "immediate disqualification" ([transcript], 00:53:54).

[tc55]: /docs/sources/sdchack.my/terms-and-conditions.md#55-github-repository-requirements
[slide 46]: /docs/sources/opening-briefing/slides.md#slide-46-tools-and-github-rules
[ph10]: /docs/sources/drive.google.com/participant-handbook.md#10-submission-guideline
[vt-licence]: /docs/sources/drive.google.com/video-tutorials.md#apache-20-licence-tutorial-a-direct
[slide 35]: /docs/sources/opening-briefing/slides.md#slide-35-repo-step-what-the-readme-must-include
[slide 42]: /docs/sources/opening-briefing/slides.md#slide-42-repo-step-fill-in-the-readme
[gh]: /docs/sources/drive.google.com/github-submission-template.md#readme-template
[gh-tree]: /docs/sources/drive.google.com/github-submission-template.md#file-tree
[tc66]: /docs/sources/sdchack.my/terms-and-conditions.md#66-repository-freeze

### How to submit

The team leader submits the deliverables ([official handbook 4.2][hb42]) on the [submission page][tp-submit] ([summary submission video][vt-submit]):

1.  Sign in at [sdchack.my](https://sdchack.my/) with the team leader's account.
2.  Open **Go to submission** and paste the public repository URL. The page checks that it is public.
3.  Tick the checkbox: "Our project integrates our API Premium sponsor's technology — mandatory for both rounds. Submissions without it are disqualified."
4.  Submit. Resubmitting is allowed until the deadline.

The page takes only the GitHub link, so the other five items have to be reachable from the repository. Submit early, then open every link in an incognito window ([slide 47]).

[hb42]: /docs/sources/sdchack.my/handbook.md#42-team-eligibility
[tp-submit]: /docs/sources/sdchack.my/team-portal.md#submission-page
[vt-submit]: /docs/sources/drive.google.com/video-tutorials.md#summary-submission

## Judging

The [preliminary rubric][d1-rubric], with what judges look for in Domain 1:

- **Innovation & Creativity, 30%**: a specific user and moment of need, and more than "upload a CV and ask a chatbot for jobs".
- **Problem-Solution Fit, 25%**: the whole chain from tracking AI advancement to the SDG connection, with all six must-haves explained and humans in charge.
- **Feasibility of Build, 25%**: the most important feature working live and backed by the repository, with the hardest risk named and a fallback.
- **Clarity of Proposal, 20%**: problem, then approach, then expected outcome, clear to a cold listener and within the format and length limits.

The briefing named both Feasibility, because judges don't want a mock-up, and Innovation, because teams over-depend on AI, as "where many teams shall lose marks" ([transcript], 00:41:22 and 01:11:02).

- **Impact numbers**: section 4 of the Submission Template (SDG sub-target, baseline, KPI and Phase 2 target, with citations) feeds the Innovation and Feasibility scores, and vague or unsupported projections "may weaken your case" ([template section 4][st4]).
- **Verification**: judges review documents, inspect code, run demos and interview teams ([Terms and Conditions 7.3][tc73]). Any member can be asked about any part, AI-assisted parts included ([slide 29]).
- **After the round**: the preliminary score doesn't carry forward, and the final uses a different rubric ([rubric][d1-rubric]). No appeal or re-evaluation is entertained ([Terms and Conditions 7.4][tc74]).

[d1-rubric]: /docs/sources/drive.google.com/domain-1-aiversecity.md#8-marking-rubric--preliminary-round
[st4]: /docs/sources/drive.google.com/submission-template.md#4-preliminary-environmental--sdg-impact-framework
[tc73]: /docs/sources/sdchack.my/terms-and-conditions.md#73-evaluation-process
[slide 29]: /docs/sources/opening-briefing/slides.md#slide-29-ai-usage-policy
[tc74]: /docs/sources/sdchack.my/terms-and-conditions.md#74-judges-decision

## Rules that can cost us

Penalties run from a warning through deductions, cancelled finalist status and disqualification to a ban from future editions ([slide 50]).

- **Replit is compulsory**: it must be part of the solution ([participant handbook 9][ph9]). Proof, from our own account, is a live Replit deployment URL, a project link with its history, or finished credit ([participant handbook 10][ph10]). Missing proof means deductions or ineligibility ([slide 50]).
- **RunPod for any GPU work**: training, fine-tuning or GPU inference must run on RunPod ([participant handbook 9][ph9]), proved by a screenshot of the Pod ID or endpoint URL, the GPU type and the runtime ([participant handbook 10][ph10]).
- **Declare everything**: any other language, framework or AI tool is allowed if declared, and declaring AI tools doesn't lower the score ([slide 51]; [declaration template 4.3][td43]). Undeclared use can mean deductions or disqualification ([slide 29]).
- **AI as an assistant**: the idea must be ours, unedited wholesale AI output isn't acceptable, and a team that can't explain a core feature may be flagged ([slide 29]).
- **Built during the hackathon**: pre-built projects, or ones entered elsewhere, aren't eligible. Small pre-existing code such as login modules or utilities is allowed as supporting parts only; the core idea and major features must be new ([slide 30]; [Terms and Conditions 5.3 and 5.4][tc54]). The official handbook wanted pre-existing work declared at registration, now closed ([official handbook 8.2][hb82]), so the safe course is to reuse little and declare all of it.
- **Our own work, honestly described**: only registered members build, mentors advise but never build, and outsourcing is "strictly prohibited" ([slide 30]; [Terms and Conditions 5.10][tc510]). Exaggerating or fabricating capabilities is itself a violation ([slide 30]), and plagiarism or false information means immediate disqualification ([Terms and Conditions 11][tc11]).
- **No real personal data**: use public, open or self-collected data and credit the sources ([slide 51]).
- **Discord is official**: "I didn't see it" isn't accepted for a missed announcement ([slide 51]).
- **Late is never**: a late submission isn't accepted ([slide 50]).
- **Deposit**: the RM 25 deposit comes back only for a valid, complete submission. A finalist that doesn't show, without 48 hours' notice, forfeits it ([slide 50]).

[ph9]: /docs/sources/drive.google.com/participant-handbook.md#9-official-tools-and-resources
[slide 51]: /docs/sources/opening-briefing/slides.md#slide-51-faqs
[td43]: /docs/sources/drive.google.com/technical-tools-declaration-template.md#43-ai-assisted-development-tools
[slide 30]: /docs/sources/opening-briefing/slides.md#slide-30-academic-integrity
[tc54]: /docs/sources/sdchack.my/terms-and-conditions.md#54-pre-existing-code
[hb82]: /docs/sources/sdchack.my/handbook.md#82-use-of-pre-existing-code-and-materials
[tc510]: /docs/sources/sdchack.my/terms-and-conditions.md#510-external-assistance
[tc11]: /docs/sources/sdchack.my/terms-and-conditions.md#11-cheating--misconduct

## Support and contacts

- **Mentors**: one 15-minute Zoom session per team, booked on the [team portal][tp-mentors] at least 24 hours ahead, first come, first served ([booking rules][disc-mentor]). The six mentors and their windows, which end on Friday 23 October, are listed there ([mentors][tp-mentor-list]). Mentors give feedback only, and outside mentors are off limits ([transcript], 01:17:22). Our booking is [issue #96](https://github.com/TolongLabs/Kotak/issues/96).
- **Discord** is the official channel and every member must join ([participant handbook 15.2][ph152]). Use `#ask-the-organizers` for general questions, `#ask-tech` for platform problems and `#open-ticket` for a private channel ([slide 56]; [slide 57]; [slide 58]).
- **Formal questions**: the official Discord or [sdc.xmumhack@gmail.com](mailto:sdc.xmumhack@gmail.com) ([slide 51]).
- **Credits**: Replit Core (worth US$20) for each participant and US$25 of RunPod credit per team ([participant handbook 9][ph9]). The team portal issues RunPod vouchers per participant; at capture only the leader's had arrived ([team portal][tp-runpod]). The portal also shows the Replit Core code; redeem it with the organisers' guide, which turns off auto-reload to avoid charges ([team portal][tp-replit]; [guide][replit-guide]). On 22 October the code had expired and a refresh was pending with Replit; [issue #99](https://github.com/TolongLabs/Kotak/issues/99) tracks it, with the free Starter app as the fallback.

[disc-mentor]: /docs/sources/discord.com/announcements.md#mentorship-booking-rules
[tp-mentor-list]: /docs/sources/sdchack.my/team-portal.md#mentors
[ph152]: /docs/sources/drive.google.com/participant-handbook.md#152-is-joining-the-discord-server-compulsory
[slide 56]: /docs/sources/opening-briefing/slides.md#slide-56-discord-tour-announcements
[slide 57]: /docs/sources/opening-briefing/slides.md#slide-57-discord-tour-ask-tech
[slide 58]: /docs/sources/opening-briefing/slides.md#slide-58-discord-tour-open-a-ticket
[tp-runpod]: /docs/sources/sdchack.my/team-portal.md#runpod-vouchers
[tp-replit]: /docs/sources/sdchack.my/team-portal.md#replit-core
[replit-guide]: /docs/sources/docs.google.com/replit-core-subscription-guide.md

## See also

- [Domain 1 problem statement and rubric](/docs/sources/drive.google.com/domain-1-aiversecity.md)
- [Participant Drive sources](/docs/sources/drive.google.com/README.md), with the known conflicts between sources
- [Opening briefing slides](/docs/sources/opening-briefing/slides.md), [transcript](/docs/sources/opening-briefing/transcript.md) and [chat](/docs/sources/opening-briefing/chat.md)
- [Participant handbook](/docs/sources/drive.google.com/participant-handbook.md), [official handbook](/docs/sources/sdchack.my/handbook.md) and [Terms and Conditions](/docs/sources/sdchack.my/terms-and-conditions.md)
- [Team portal](/docs/sources/sdchack.my/team-portal.md)

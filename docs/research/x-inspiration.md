# X inspiration for Domain 1

What people on X used, wanted and complained about around careers, reskilling and AI's effect on work from June 2025 to October 2026, gathered on 20 October 2026 to find ideas unlike the "CV upload, LLM, role list, roadmap, SDG badges" entry most of Domain 1's 123 teams will probably build. Posts show what people say and react to, not facts: a figure in a post is the poster's claim unless the text says we checked it at the source. It adds to [CONTEXT.md](/docs/CONTEXT.md), which covers prior art, data and comparable winners.

Contents:

1.  [Method](#method)
1.  [What people already use](#what-people-already-use)
1.  [Unmet needs and complaints](#unmet-needs-and-complaints)
1.  [What made recent products stick](#what-made-recent-products-stick)
1.  [The sameness baseline](#the-sameness-baseline)
1.  [Malaysia and SEA signals](#malaysia-and-sea-signals)
1.  [Interaction patterns worth borrowing](#interaction-patterns-worth-borrowing)
1.  [Seeds for our ideation](#seeds-for-our-ideation)
1.  [See also](#see-also)

## Method

- **Tool**: a script drives x.com search in headless Chromium with a logged-in session and records the posts X returns. Each search loaded the Top tab and scrolled once, giving about 20 to 45 posts; 50 searches returned 1,156 unique posts.
- **Pacing**: searches ran 25 to 35 seconds apart, inside the 50 search requests per 15 minutes that [twikit documents][twikit]. None hit a rate limit, and three attempts that failed before reaching X were rerun.
- **Filters**: mostly `since:2025-06-01`, a `min_faves:` floor between 20 and 3,000, and `lang:en`, except in the Malay and Indonesian searches.
- **Limits**: Top ranks by engagement and personalisation, not relevance, so broad `OR` queries pulled in crypto, sport and politics; one scroll misses the long tail, and replies weren't read. Engagement is as captured, written likes/views: 6.9k/475k is 6,900 likes and 475,000 views. Engagement bait, such as near-identical "BREAKING: Claude can now…" prompt threads, satire written as fictional executives (@gothburz) and unverifiable anecdotes (@Kalshi_Finance, which isn't Kalshi), counts only as a signal of what resonates.
- **Checked at source**: the figures we lean on, in Anthropic's [labour-market report][anthropic-labor] and [Economic Index connector][connector-news], [karpathy.ai/jobs][karpathy-jobs], the [career-ops repository][careerops-repo], the [WORKBank paper][workbank], Anthropic's [skill-formation study][skillform], OpenAI's [GDPval paper][gdpval] and Amazon's [KiroRank shutdown][kirorank], as reported from the Financial Times.
- **Queries**, as run, by theme:
  1.  Usage and workflows (7):
      - `"career" ("AI took my job" OR "laid off because of AI") min_faves:500 since:2025-06-01 lang:en`
      - `("career switch" OR "career change" OR "pivot my career" OR "changed careers") (Claude OR ChatGPT OR AI) min_faves:300 since:2025-06-01 lang:en`
      - `"career coach" (AI OR ChatGPT OR Claude) min_faves:200 since:2025-06-01 lang:en`
      - `("job hunting" OR "job search" OR "job application") ("AI agent" OR agents OR Claude OR "auto apply") min_faves:500 since:2025-06-01 lang:en`
      - `("laid off" OR "lost my job" OR "replaced me") ("because of AI" OR "replaced by AI" OR "AI replaced" OR "due to AI") min_faves:300 since:2025-06-01 lang:en`
      - `("what should I learn" OR "what skills should" OR "skills to learn" OR "learn in 2026") AI min_faves:1000 since:2025-06-01 lang:en`
      - `(ChatGPT OR Claude OR LLM) ("career advice" OR "career path" OR "career plan") min_faves:200 since:2025-06-01 lang:en`
  1.  Viral products and exposure tools (8):
      - `from:karpathy (jobs OR occupations OR exposure OR careers OR employment) since:2025-06-01`
      - `("Economic Index" OR "Anthropic Economic") min_faves:100 since:2025-06-01`
      - `("AI-proof" OR "AI proof" OR "AI-resistant") (jobs OR careers OR skills OR career) min_faves:300 since:2025-06-01 lang:en`
      - `("will AI replace" OR "will AI take my job" OR "AI exposure" OR "automation risk") (built OR tool OR site OR check OR score) min_faves:200 since:2025-06-01 lang:en`
      - `("roadmap.sh" OR "learning roadmap" OR "career roadmap") min_faves:200 since:2025-06-01 lang:en`
      - `("career simulator" OR "job simulation" OR "simulate the job" OR "day in the life") (AI OR app OR game) min_faves:200 since:2025-06-01 lang:en`
      - `("mock interview" OR "interview practice" OR "AI interviewer" OR "interview coach") min_faves:300 since:2025-06-01 lang:en`
      - `("went viral" OR "users in" OR "MRR" OR "launched") (career OR jobs OR resume OR "job seekers") (AI OR app) min_faves:1000 since:2025-06-01 lang:en`
  1.  Complaints (5):
      - `("LinkedIn Learning" OR Coursera OR Udemy) (useless OR "nobody cares" OR "waste of" OR certificates) min_faves:300 since:2025-06-01 lang:en`
      - `("tutorial hell" OR "generic roadmap" OR "roadmaps are" OR "courses are useless") min_faves:300 since:2025-06-01 lang:en`
      - `("ghost jobs" OR "applied to 500" OR "applied to 1000" OR "job market is broken" OR "ATS rejected") min_faves:2000 since:2025-06-01 lang:en`
      - `(Duolingo OR streaks OR "daily practice") (learning OR skill) (AI OR app) min_faves:2000 since:2025-06-01 lang:en`
      - `("AI training" OR upskilling OR "AI workshop") (employees OR staff OR company) ("nobody uses" OR "didn't work" OR waste OR useless OR "checkbox") min_faves:200 since:2025-06-01 lang:en`
  1.  HR, L&D and workforce planning (10):
      - `(reskilling OR upskilling OR reskill) (AI) (workers OR workforce OR employees) min_faves:300 since:2025-06-01 lang:en`
      - `"skills gap" min_faves:100 since:2025-06-01 lang:en`
      - `("skills-based hiring" OR "skills based hiring" OR "skills-based organization" OR "skills taxonomy") min_faves:20 since:2025-01-01 lang:en`
      - `("workforce planning" OR "headcount planning" OR "internal mobility") AI min_faves:50 since:2025-01-01 lang:en`
      - `("L&D" OR "learning and development" OR "corporate training") AI min_faves:100 since:2025-06-01 lang:en`
      - `("AI fluency" OR "AI adoption" OR "AI-first") (employees OR "performance review" OR workforce OR memo) min_faves:1000 since:2025-06-01 lang:en`
      - `(tasks OR "task-level") ("AI exposure" OR automate OR automation) (occupations OR "which jobs") min_faves:500 since:2025-06-01 lang:en`
      - `("entry-level" OR "junior roles" OR "new grads" OR "first job") AI (jobs OR hiring) (disappearing OR gone OR collapse OR "no longer") min_faves:3000 since:2025-06-01 lang:en`
      - `(HR OR CHRO OR "people team") (AI) (reskill OR "what to train" OR "skills inventory" OR "don't know what skills") min_faves:100 since:2025-06-01 lang:en`
      - `(government OR ministry OR policymakers) (AI) (jobs OR workforce) (reskilling OR "labor market" OR "labour market") (data OR dashboard OR tracker) min_faves:300 since:2025-06-01 lang:en`
  1.  Sameness baseline and this event (4):
      - `hackathon (career OR resume OR "job matching" OR reskilling OR upskilling) (won OR winner OR "first place" OR built) min_faves:30 since:2025-06-01 lang:en`
      - `hackathon (judge OR judging OR judges) ("wrapper" OR "same idea" OR "every team" OR "all the projects" OR "chatbot") min_faves:100 since:2025-06-01 lang:en`
      - `hackathon ("vibe coded" OR "vibe coding" OR "Claude Code" OR Lovable OR Cursor) (judges OR winners OR "every project" OR same) min_faves:300 since:2025-06-01 lang:en`
      - `(sdchack OR "SDC hackathon" OR "SDC 2026" OR Aiversecity OR XMUM)`, Latest tab
  1.  Malaysia and SEA (8):
      - `Malaysia (AI) (jobs OR retrenchment OR upskilling OR reskilling OR workers) min_faves:50 since:2025-06-01`
      - `(TalentCorp OR MyMahir OR "HRD Corp" OR HRDCorp OR PERKESO OR MYFutureJobs OR "Jelajah AI") since:2025-06-01`
      - `(e-hailing OR p-hailing OR Grab OR "gig workers") Malaysia (AI OR skills OR income OR future) min_faves:20 since:2025-06-01`
      - `(AI) (kerja OR pekerjaan) (hilang OR ganti OR diganti OR "masa depan" OR skill) min_faves:100 since:2025-06-01`
      - `(SkillsFuture OR Singapore OR Indonesia OR Philippines OR Vietnam) (AI) (jobs OR reskilling OR upskilling OR workers) min_faves:300 since:2025-06-01`
      - `(TVET OR "vocational training" OR "trade school" OR "trades") (AI OR "AI-proof") min_faves:500 since:2025-06-01 lang:en`
      - `AI (kerja OR kerjaya OR skill OR pekerjaan) lang:ms min_faves:50 since:2025-06-01`
      - `AI ("buang kerja" OR "kena buang" OR majikan OR "hilang kerja" OR VSS OR "kerja kilang") min_faves:20 since:2025-06-01`
  1.  Interaction patterns (8):
      - `(WhatsApp OR Telegram) (bot OR agent) (jobs OR career OR learning OR tutor OR coach) min_faves:200 since:2025-06-01 lang:en`
      - `("voice agent" OR "voice mode" OR "voice-first" OR "talk to") (coach OR career OR tutor OR learning) AI min_faves:500 since:2025-06-01 lang:en`
      - `("browser extension" OR "Chrome extension") (job OR jobs OR LinkedIn OR resume) min_faves:200 since:2025-06-01 lang:en`
      - `(MCP OR "Claude skill" OR "Claude Skills") (resume OR career OR jobs OR "job search" OR learning) min_faves:200 since:2025-06-01 lang:en`
      - `(Kalshi OR Polymarket OR Metaculus OR "prediction market") (jobs OR unemployment OR "white collar" OR automation) AI min_faves:200 since:2025-06-01 lang:en`
      - `("hours saved" OR "time saved" OR "track how" OR "tracked how") (AI OR Claude OR ChatGPT) (tasks OR work OR job) min_faves:500 since:2025-06-01 lang:en`
      - `(leaderboard OR "token usage" OR "AI usage") (employees OR engineers OR company OR team) (performance OR review OR ranking) min_faves:1000 since:2025-06-01 lang:en`
      - `("future self" OR "future you" OR "ten years from now" OR "year 2030") (AI OR simulation OR chat OR career) min_faves:1000 since:2025-06-01 lang:en`

[twikit]: https://github.com/d60/twikit/blob/main/ratelimits.md

## What people already use

- **Prompt packs for CVs and job search.** The most-shared format by far: dozens of near-identical threads promise interview calls from Claude prompts ([@riyazz_ai][x-riyazz], 3 Mar 2026, 8.8k/1.9M; [@alex_prompter][x-alexprompter], 21 Jan 2026, 2.3k/345k). In Indonesia, a prompt that has AI turn your background into a "competency map dan roadmap belajar" drew 7k/213k ([@kelas_writing][x-kelas], 13 Jul 2026), and a recipe for an ATS-friendly CV from free Claude drew 2.1k/77k ([@dizcorvus][x-dizcorvus], 23 Apr 2026). The baseline entry's core output is already a copy-paste prompt.
- **Job-search agents people run themselves.** A Claude Code system that "scored 700+ job applications and actually got him a job" drew 27.6k/5.8M ([@Hesamation][x-careerops], 5 Apr 2026). Its repository, career-ops, had 75.7k stars and 14.1k forks on 20 October, and its description ends "you press Submit" ([repository][careerops-repo]). A geophysicist's pipeline has "A second AI agent" review the first, and "The whole thing is a folder of markdown files" ([@heynavtoor][x-mads], 3 Jun 2026, 4.5k/468k). JustHireMe sells "explainable fit" against tools that "rank opportunities like a black box" ([@Vasu_Devs][x-justhireme], 5 May 2026, 3.3k/413k).
- **Exposure maps and checkers.** Karpathy's treemap of 342 US occupations, each scored 0 to 10 for AI exposure by an LLM, drew 11.9k/3.6M on the post announcing it ([@_kaitodev][x-karpathyjobs], 14 Mar 2026) and was re-run on Canadian data within a day ([@reuvengorsht][x-canada], 15 Mar 2026, 291/42k). A bare "will AI take my job? check now" link drew 4.6k/6.1M ([@0x45o][x-0x45o], 30 Oct 2025).
- **The Economic Index inside Claude.** Since 22 July 2026 anyone can ask Claude about the Index, and "the answers draw directly from the Index data" ([@claudeai][x-connector], 12.4k/2.5M; confirmed by [Anthropic][connector-news]).
- **Benchmarks of real work.** OpenAI's GDPval, which grades models on tasks written by professionals in 44 occupations, drew 4.6k/1.8M ([@OpenAI][x-gdpval], 25 Sep 2025), and its 220-task gold set is public ([paper][gdpval]). CONTEXT.md lists usage data but no capability benchmark, and pairing the two would show what AI can do beside what people use it for.
- **Self-audits.** One method lists your weekly tasks, the skill each needs and whether AI can do it ([@BoringBiz_][x-audit], 8 Feb 2026, 490/69k); asking Claude which tech tracks are dead ends by 2030 drew 788/766k ([@thetripathi58][x-tripathi], 26 Apr 2026).
- **Free courses from AI labs**, such as Anthropic's ([@RoundtableSpace][x-anthropic-courses], 5 Apr 2026, 8.6k/3.4M), and courses "taught BY the AI IN the tools" ([@carlvellotti][x-carl], 29 Dec 2025, 752/96k).

[x-riyazz]: https://x.com/riyazz_ai/status/2028804145772397042
[x-alexprompter]: https://x.com/alex_prompter/status/2013862612371742895
[x-kelas]: https://x.com/kelas_writing/status/2076518962075185411
[x-dizcorvus]: https://x.com/dizcorvus/status/2047266420447150452
[x-justhireme]: https://x.com/Vasu_Devs/status/2051770363986825224
[x-gdpval]: https://x.com/OpenAI/status/1971249374077518226
[x-tripathi]: https://x.com/thetripathi58/status/2048475010810188186
[x-anthropic-courses]: https://x.com/RoundtableSpace/status/2040772692866183308

## Unmet needs and complaints

- **No one can say what to learn.** "What exactly is the career advice for an 18-year-old right now?" ([@zuess05][x-zuess], 16 Apr 2026, 6.9k/475k). Gen Z's version: "every skill you learn gets outdated" and "your parents’ advice stops working in real-time" ([@0xratnakar][x-ratnakar], 30 Jan 2026, 23k/706k).
- **The first rung is breaking, but the evidence is contested.** A Harvard student hears from alumni that "entry-level roles are basically gone" ([@zarazhangrui][x-zara], 6 Nov 2025, 21.5k/2.6M). Anthropic measured a 14% drop in the job-finding rate of 22- to 25-year-olds in exposed occupations, which it calls "just barely statistically significant" ([report][anthropic-labor]). Yet a study of 21,559 firms reportedly finds entry-level headcount up 12% at heavy AI adopters ([@DavidSacks][x-sacks], 30 Jun 2026, 2.6k/581k; unverified). People need scenarios, not verdicts.
- **Getting back in, not only reskilling.** "The problem is that they won't find jobs again easily" ([@ravihanda][x-ravihanda], 25 Sep 2026, 781/52k).
- **Distrust of listings.** Applying to 500 jobs for two interviews drew 73.5k/1.1M ([@KangusB3][x-kangus], 1 Jun 2026), and "approximately 30%" of postings being fake drew 13.5k/4.6M ([@MorePerfectUS][x-ghost], 18 Nov 2025; claim). A role recommendation that can't show the role is real inherits that distrust.
- **Exposure scores read as fate.** Karpathy says the score "has no baring on what actually happens to these occupations, which has to do with demand elasticity and a lot more" ([@karpathy][x-karpathy-caveat], 15 Mar 2026, 147/15k), and his page says "A high score does not predict the job will disappear" ([karpathy.ai/jobs][karpathy-jobs]). His radiology post makes the same point through Jevons paradox ([@karpathy][x-radiology], 25 Sep 2025, 8.5k/2.3M).
- **Learning products that optimise for engagement.** Duolingo "isn't an education app, it's a mobile game" ([@fchollet][x-fchollet], 10 Jul 2025, 5.9k/510k), and one user quit with a streak of over 1,100 days ([@iChuloo][x-ichuloo], 11 Sep 2026, 6.9k/764k). Udemy's co-founder: "the biggest names don’t actually care if you learn anything" ([@gaganbiyani][x-gagan], 24 Oct 2025, 4.5k/556k).
- **AI help can block learning.** Anthropic found that developers learning a new library with AI scored 17% lower on a quiz, while those who asked it conceptual questions scored 65% or more ([@Hesamation][x-skillform], 8 Mar 2026, 4k/382k; checked at [Anthropic][skillform]).
- **Adoption theatre at work.** Amazon shut down KiroRank, an employee-built leaderboard of AI use, after staff ran agents on needless tasks to climb it ([@Pirat_Nation][x-kirorank], 30 May 2026, 2.3k/85k; [confirmed][kirorank]), and a complaint about firms that "judge engineers by token usage" drew 5.4k/201k ([@arpit_bhayani][x-arpit], 29 May 2026). Junior bankers spend about half their time in AI tools while seniors "give absolutely no guidance" ([@BoringBiz_][x-juniors], 2 Oct 2026, 838/75k).
- **Workforce planning can't see tasks drift.** "A job title may stay the same even when the work attached to it changes" ([@antgrasso][x-antgrasso], 17 Aug 2026, 118/5k). IKEA reportedly studied the 43% of queries its bot couldn't resolve, found demand for design advice, and reskilled service staff to give it ([@briansolis][x-ikea], 31 Mar 2026, 2.2k/416k; claim). Stanford's WORKBank survey found that workers want AI on fewer tasks than it can already do ([@AIinPublic][x-workbank], 24 Apr 2026, 497/56k; [paper][workbank]).
- **Gap**: the searches for HR practitioners' pain and for failed corporate training returned nothing usable. L&D managers don't seem to talk shop on X.

[x-zuess]: https://x.com/zuess05/status/2044758680449749270
[x-ratnakar]: https://x.com/0xratnakar/status/2017137316436070615
[x-ravihanda]: https://x.com/ravihanda/status/2103384173675528538

## What made recent products stick

| Product                            | Hook                                         | Channel                            | Recurring trigger                                                         |
| ---------------------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| [career-ops][x-careerops]          | One person's result: a job after 700+ scores | X post, then a forkable repo       | Every new posting it scans                                                |
| [karpathy.ai/jobs][x-karpathyjobs] | Your job as one number, from a famous name   | X, then [national forks][x-canada] | None; a one-off                                                           |
| ["Will AI take my job?"][x-0x45o]  | One question, one input                      | A bare link on X                   | None                                                                      |
| [Index connector][x-connector]     | Data answers in the chat you already use     | Claude's connector directory       | Whenever you ask                                                          |
| [OpenClaw][x-openclaw]             | A personal agent you text                    | WhatsApp and Telegram              | It messages you on a schedule                                             |
| [jobanxiety.ai][x-jobanxiety]      | 800+ jobs created by AI, tracked             | Weekly newsletter                  | Every week                                                                |
| Duolingo                           | Streaks                                      | Phone notifications                | Daily, though [critics](#unmet-needs-and-complaints) say it doesn't teach |

- **One input, one personal answer**, which travels: the 6.1M-view checker asked for nothing more, and the US treemap had a Canadian fork within a day.
- **A named person's result**, as with career-ops and the hackathon winners [below](#the-sameness-baseline), sells better than a feature list.
- **Living where people already are**, in Claude's chat or WhatsApp. OpenClaw's creator reportedly "connected Claude’s API to WhatsApp in an hour", and the post claims 194,000 stars in three months ([@aakashgupta][x-openclaw], 15 Feb 2026, 9.2k/1.2M).
- **Retention from an outside event**, such as a new posting, a weekly digest or a data release, rather than from streaks.
- **Familiar gestures and small tools**: a swipe-to-apply app ([@BoluAbiodun1][x-swipe], 10 Oct 2025, 3.3k/108k), and an extension that "removes the AI slop from my linkedin feed" ([@awwstn][x-slop], 22 Apr 2026, 37k/621k).

[x-openclaw]: https://x.com/aakashgupta/status/2023158499413463268
[x-swipe]: https://x.com/BoluAbiodun1/status/1976628546371190904
[x-slop]: https://x.com/awwstn/status/2047025078597267519

## The sameness baseline

What most teams will likely ship: paste or upload a CV, an LLM extracts skills, a list of "future roles" with match percentages, a course roadmap, SDG badges, a radar chart and a chat box. X suggests each piece is now a commodity:

- The core output is a free prompt, as [above](#what-people-already-use), and learning-roadmap images are routine engagement bait, often gated behind "Comment PDF".
- An exposure map is a weekend build, and "we use Anthropic's data" stopped being distinctive when the Index became a one-click connector.
- Generic model output converges: "everyone gets the same 10 answers", one builder wrote, before getting different ones by reading 5,137 open freelance jobs ([@paonx_eth][x-paonx], 5 Oct 2026, 769/52k).

What wins instead, according to X:

- **Domain insiders.** Four of the five winners of Anthropic's February Claude Code hackathon weren't software engineers: an attorney, a cardiologist, a musician and a roads-systems worker ([@zeroxkyle][x-cc-winners], 22 Feb 2026, 3k/406k). "someone in the trades with deep domain expertise and Claude Code will run circles around your generic software" ([@toddsaunders][x-trades-cc], 18 Mar 2026, 7.3k/1M).
- **An earned insight.** "Not "AI for X." A genuine edge that came from living inside a problem" ([@garrytan][x-garry], 24 May 2026, 3.3k/762k).
- **A simple, real problem explained well**, which beat a complex build at one student hackathon ([@vedantdotrpm][x-vedant], 14 Dec 2025, 1.1k/109k).
- **Gaps**: no post mentions this event, since the searches for sdchack, Aiversecity and XMUM found only unrelated "SDC 2026" events, and no judge wrote about career-track wrappers.

[x-paonx]: https://x.com/paonx_eth/status/2107101851590041631
[x-cc-winners]: https://x.com/zeroxkyle/status/2025398536712716332
[x-trades-cc]: https://x.com/toddsaunders/status/2034243420147859716
[x-garry]: https://x.com/garrytan/status/2058457353859834142
[x-vedant]: https://x.com/vedantdotrpm/status/2000280904263184870

## Malaysia and SEA signals

- **Our mentors' community wants producers.** A KrackedDevs organiser moved back to help build "Malaysia's AI Builders Hub", "Turning Malaysians from consumers into producers" ([@masterofnone][x-kracked], 17 Jul 2026, 2.1k/924k), and says over a million Malaysians finished the government's AI untuk Rakyat course in six months ([thread][x-kracked-rakyat], 323/29k; claim). Because Malaysia consumes models rather than making them, one builder expects "Harness Engineering jobs" within a year or two ([@azwan_][x-azwan], 18 Jun 2026, 217/29k).
- **Who pays depends on status.** For a funded AWS course, PERKESO's SIP covers retrenched workers in full and employed ones claim through the HRD Corp levy ([@reviewbyyasmin][x-yasmin], 12 Jun 2026, 13/3k). HRD Corp's management suspensions ([@malaysiakini][x-hrd-suspend], 21 Feb 2026) and calls for a forensic probe ([@TI_Malaysia][x-ti], 8 Feb 2026) dent trust, though both drew little engagement.
- **The state's reach is in person and at prompt level.** One Jelajah AI MyMahir session drew 700 people in Damansara ([@GobindSinghDeo][x-jelajah], 14 Aug 2026, 13/2k). PERKESO says its employment insurance scheme helped 117,733 jobseekers into work by 14 August ([@malaymail][x-eis], 18 Oct 2026).
- **Gig work as a holding pattern.** A 65-year-old went back to e-hailing after RM400,000 of EPF savings ran out ([@SinarOnline][x-sinar], 30 Jun 2026, 173/44k), and an Indonesian visitor found KL's Grab drivers mostly pensioners ([@ventableu][x-ventableu], 11 Jan 2026, 2.2k/61k). From talks with an e-hailing association: "Gig economy bukan career path melainkan platform side income" ([@alif_haidar][x-alif], 21 Oct 2025, 32/3k).
- **Malay anxiety is about pay and squeeze, not apocalypse.** "AI tak tidur. AI tak cuti. AI tak demand gaji naik." ([@Pelabur_Bijak][x-pelabur], 3 Jun 2025, 1.6k/216k). Workers see roles shrunk and work added, and "Ramai cuma kekal bekerja dalam sistem yang makin kacau" ([@tokcin70][x-tokcin], 4 Apr 2026, 45/4k).
- **SEA's new entry jobs are AI data work.** Indonesian threads list LLM evaluation, AI training and data annotation as beginner remote work ([@bimnttsion][x-bimnttsion], 12 Aug 2026, 1.2k/24k; [@L10NLEE][x-outlier], 10 Sep 2026, 2.4k/77k). Philippine outsourcing reportedly grew 20% to 1.9 million workers since ChatGPT, partly by training models and supervising agents ([@TrungTPhan][x-ph-bpo], 9 Aug 2026, 2.8k/855k; claim). The conditions of data work are contested ([@_KarenHao][x-karenhao], 8 May 2026, 601/66k), which matters for any SDG 8.5 tag.
- **Trades are a bottleneck for AI itself.** The US needs 500,000 new electricians this decade, the "#1 thing slowing data center expansion" according to Microsoft's Brad Smith ([@JasonrShuman][x-electricians], 16 Mar 2026, 12.5k/1.7M; claim). A parallel for Johor's data centres is our inference, not X's.
- **Gaps**: the `lang:ms` search returned nothing, and Malay-word searches mostly surfaced Indonesian posts. Malaysian career talk seems to happen elsewhere, probably on TikTok, Threads, Facebook and LinkedIn.

[x-kracked]: https://x.com/masterofnone/status/2077976506668601350
[x-kracked-rakyat]: https://x.com/masterofnone/status/2077976537199182080
[x-azwan]: https://x.com/azwan_/status/2067628056634867867
[x-hrd-suspend]: https://x.com/malaysiakini/status/2025084622183481592
[x-ti]: https://x.com/TI_Malaysia/status/2020368973796372542
[x-jelajah]: https://x.com/GobindSinghDeo/status/2088061774281261220
[x-eis]: https://x.com/malaymail/status/2111917318137610505
[x-ventableu]: https://x.com/ventableu/status/2010362038695145741
[x-pelabur]: https://x.com/Pelabur_Bijak/status/1929898962548601018
[x-outlier]: https://x.com/L10NLEE/status/2098029819548291111

## Interaction patterns worth borrowing

- **An agent in a chat app, on a schedule.** NanoClaw "Connects to WhatsApp, has memory, scheduled jobs" ([@rohanpaul_ai][x-nanoclaw], 21 Feb 2026, 1.9k/156k), and Claude itself now has Telegram integration and cron jobs ([@BentoBoiNFT][x-claude-cron], 20 Mar 2026, 655/99k). A personal AI system "prepares your morning briefing while you sleep" ([@DeRonin_][x-morning], 11 May 2026, 2.8k/617k).
- **A profile the user owns as plain text**, as in the markdown-folder pipeline: "Not a service you pay for. A workflow you own." ([@heynavtoor][x-mads]). Its step 4, a second agent critiquing the first, suits an explainable match.
- **Services that agents can call.** "No MCP server means you're invisible to the fastest growing buyer on the internet" ([@gregisenberg][x-gregmcp], 13 May 2026, 2.5k/579k), and the Economic Index connector is the precedent in our domain.
- **Learning in the real tool or situation.** Courses run inside the tool on realistic files ([@carlvellotti][x-carl]), Google's Learn Your Way rebuilds a textbook around the learner's interests ([@alex_verem][x-learnyourway], 22 Sep 2025, 8.8k/904k), and a polyglot's first tip is "'situational' learning" ([@alojoh][x-alojoh], 1 Sep 2025, 37.7k/3.1M).
- **Voice interviews.** In a study of 70,000 Philippine applicants, those interviewed by an AI voice agent got more offers and stayed longer, and almost eight in ten preferred it ([@gregisenberg][x-ph-interview], 31 Aug 2025, 673/104k; claim). The user who quit Duolingo built a voice tutor instead ([@iChuloo][x-ichuloo]).
- **A good future made concrete**: a short film follows "one day in the life of an AI auditor in 2035" ([@HopeExistential][x-hope], 24 Jun 2026, 660/282k).
- **Gap**: prediction-market searches surfaced only trading-bot hype ([@Argona0x][x-polymarket], 20 Dec 2025, 10.4k/1.9M), so no usable jobs signal.

[x-claude-cron]: https://x.com/BentoBoiNFT/status/2034974100381192437
[x-morning]: https://x.com/DeRonin_/status/2053874586765152727
[x-learnyourway]: https://x.com/alex_verem/status/1970078106427039838
[x-polymarket]: https://x.com/Argona0x/status/2002391129870803306

## Seeds for our ideation

Starting points for ideation, not decisions, each with the posts behind it.

1.  **Weekly task diary on WhatsApp**: workers list what they did each week, matched to O\*NET tasks and dated usage data, so the profile tracks how a job drifts instead of freezing a CV ([@BoringBiz_][x-audit]; [@antgrasso][x-antgrasso]; [@rohanpaul_ai][x-nanoclaw]).
1.  **"What changed for you this week"**: each new Index release, benchmark result or model sends users a dated diff for their role, the recurring trigger that also passes Aiversecity's "visibly changes" test ([@Hesamation][x-careerops]; [@howdymary][x-jobanxiety]; [@claudeai][x-connector]).
1.  **Want-versus-can map for a team**: staff rate which tasks they want automated, overlaid on observed AI usage, so HR sees what to automate, what to protect and where to reskill ([@AIinPublic][x-workbank]; [@tokcin70][x-tokcin]).
1.  **Exposure-is-not-fate scenarios**: scenarios vary demand as well as capability, putting radiology-style growth beside transcription-style decline, with Karpathy's caveat on screen ([@karpathy][x-karpathy-caveat]; [@karpathy][x-radiology]; [@DavidSacks][x-sacks] against [@zarazhangrui][x-zara]).
1.  **Unresolved-cases miner**: cluster what a firm's bot or ticket queue can't resolve, from synthetic logs in the demo, to propose new roles for displaced staff ([@briansolis][x-ikea]).
1.  **Synthetic apprenticeship**: for firms that stopped hiring juniors, a ladder of the tasks juniors used to learn on, set and graded by a senior ([@zarazhangrui][x-zara]; [@BoringBiz_][x-juniors]).
1.  **An adoption ledger that can't be tokenmaxxed**: HR tracks tasks redesigned and skills shown per team, never tokens or logins ([@Pirat_Nation][x-kirorank]; [@arpit_bhayani][x-arpit]).
1.  **Steps that refuse to do it for you**: each step ends in a small artifact made in the real tool and checked by a monthly work sample rather than a streak, with an AI tutor that answers only conceptual questions ([@Hesamation][x-skillform]; [@carlvellotti][x-carl]; [@fchollet][x-fchollet]; [@iChuloo][x-ichuloo]; [@gaganbiyani][x-gagan]).
1.  **Funding-route resolver**: each step says who pays for this user, such as PERKESO's SIP if retrenched or the HRD Corp levy if employed, without calling any course claimable ([@reviewbyyasmin][x-yasmin]).
1.  **Gig-to-ladder by voice note in Malay**: a driver answers one question a day between rides, building a skills record that maps to TVET routes into roles such as data-centre technician ([@alif_haidar][x-alif]; [@SinarOnline][x-sinar]; [@JasonrShuman][x-electricians]).
1.  **Role reality check**: before suggesting a role, show dated evidence from official Malaysian sources that it exists, and say when the evidence is thin ([@KangusB3][x-kangus]; [@MorePerfectUS][x-ghost]).
1.  **AI data-work radar**: track entry roles such as LLM evaluator and annotator that taxonomies miss, testing each against the ILO's decent-work condition before tagging SDG 8.5 ([@bimnttsion][x-bimnttsion]; [@TrungTPhan][x-ph-bpo]; [@_KarenHao][x-karenhao]).
1.  **A career file the user's own agent can read**: dated plain-text files, or an MCP server, that the user's assistant can query and update ([@heynavtoor][x-mads]; [@gregisenberg][x-gregmcp]).
1.  **A Malaysian exposure treemap as the front door**: one input, one dated answer per occupation group, caveats on screen, then a hand-off to the deeper tool ([@_kaitodev][x-karpathyjobs]; [@reuvengorsht][x-canada]; [@0x45o][x-0x45o]).
1.  **A day in 2030, rehearsed by voice**: role-play a workday in the future version of the user's role, built from a scenario's task split, as a voice interview in Malay or English ([@HopeExistential][x-hope]; [@alojoh][x-alojoh]; [@gregisenberg][x-ph-interview]).

## See also

- [CONTEXT.md](/docs/CONTEXT.md), with the prior art, data and white space this note builds on, and the [brief](/docs/BRIEF.md)
- [Comparable winners](/docs/research/comparable-winners.md) and [trend data](/docs/research/trend-data.md)
- The [Economic Index connector][connector-news], a new way into data CONTEXT.md already uses, and [GDPval][gdpval], a capability benchmark it doesn't list

[anthropic-labor]: https://www.anthropic.com/research/labor-market-impacts
[connector-news]: https://www.anthropic.com/news/anthropic-economic-index-connector
[karpathy-jobs]: https://karpathy.ai/jobs
[careerops-repo]: https://github.com/santifer/career-ops
[workbank]: https://arxiv.org/abs/2506.06576
[skillform]: https://www.anthropic.com/research/AI-assistance-coding-skills
[gdpval]: https://arxiv.org/abs/2510.04374
[kirorank]: https://www.hcamag.com/us/specialization/hr-technology/amazon-shuts-down-ai-leaderboard-after-tokenmaxxing/577189
[x-careerops]: https://x.com/Hesamation/status/2040820834428658008
[x-mads]: https://x.com/heynavtoor/status/2062168254416814163
[x-karpathyjobs]: https://x.com/_kaitodev/status/2032927164883153402
[x-canada]: https://x.com/reuvengorsht/status/2033317566622412910
[x-0x45o]: https://x.com/0x45o/status/1983875089704575441
[x-connector]: https://x.com/claudeai/status/2079979809606664564
[x-audit]: https://x.com/BoringBiz_/status/2020556485038633132
[x-carl]: https://x.com/carlvellotti/status/2005664125830222098
[x-zara]: https://x.com/zarazhangrui/status/1986511743561179363
[x-sacks]: https://x.com/DavidSacks/status/2071919757209502205
[x-kangus]: https://x.com/KangusB3/status/2061251543957987408
[x-ghost]: https://x.com/MorePerfectUS/status/1990862889712800115
[x-karpathy-caveat]: https://x.com/karpathy/status/2033298710101393488
[x-radiology]: https://x.com/karpathy/status/1971220449515516391
[x-fchollet]: https://x.com/fchollet/status/1943404043050565907
[x-ichuloo]: https://x.com/iChuloo/status/2098542263596925338
[x-gagan]: https://x.com/gaganbiyani/status/1981736889234452619
[x-skillform]: https://x.com/Hesamation/status/2030733379558347239
[x-kirorank]: https://x.com/Pirat_Nation/status/2060618209733362132
[x-arpit]: https://x.com/arpit_bhayani/status/2060284423795560609
[x-juniors]: https://x.com/BoringBiz_/status/2105832677886611862
[x-antgrasso]: https://x.com/antgrasso/status/2089337106959106519
[x-ikea]: https://x.com/briansolis/status/2038999983928885421
[x-workbank]: https://x.com/AIinPublic/status/2047616644609114175
[x-jobanxiety]: https://x.com/howdymary/status/2038697392229564569
[x-yasmin]: https://x.com/reviewbyyasmin/status/2065256035611193491
[x-sinar]: https://x.com/SinarOnline/status/2071775730737041659
[x-alif]: https://x.com/alif_haidar/status/1980610121437966696
[x-tokcin]: https://x.com/tokcin70/status/2040329413217390647
[x-bimnttsion]: https://x.com/bimnttsion/status/2087532348124369010
[x-ph-bpo]: https://x.com/TrungTPhan/status/2086441068246229133
[x-karenhao]: https://x.com/_KarenHao/status/2052775070419095658
[x-electricians]: https://x.com/JasonrShuman/status/2033521455997001871
[x-nanoclaw]: https://x.com/rohanpaul_ai/status/2025267989952831958
[x-gregmcp]: https://x.com/gregisenberg/status/2054584280848769413
[x-alojoh]: https://x.com/alojoh/status/1962414007240786282
[x-ph-interview]: https://x.com/gregisenberg/status/1962147866413035812
[x-hope]: https://x.com/HopeExistential/status/2069768141958152556

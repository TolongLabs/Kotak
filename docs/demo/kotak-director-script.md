# Kotak video director script

The script for the Kotak pitching video: a narrated pitch deck with a three-minute live demo of the working app in the middle. One narrator, a team member, reads every `VOICEOVER` block, at 1.0× speed. The team records the app with OBS Studio and edits the video in Adobe Premiere Pro; [`video.md`](/docs/demo/video.md) owns the recording and editing steps. The voice follows the team's MyTakziah finals scripts: say who we are in a breath, show one person and one moment, carry one argument with a link from each part to the next, say the honest limits plainly, and close by echoing the opening.

Contents:

1.  [How the video works](#how-the-video-works)
1.  [Timing](#timing)
1.  [Director transcript](#director-transcript)
    1.  [V1: Hook](#v1-hook)
    1.  [V2: The problem](#v2-the-problem)
    1.  [V3: The user](#v3-the-user)
    1.  [V4: The solution](#v4-the-solution)
    1.  [V5: How it works](#v5-how-it-works)
    1.  [Live demo](#live-demo)
    1.  [V6: Innovation](#v6-innovation)
    1.  [V7: Impact](#v7-impact)
    1.  [V8: Who pays](#v8-who-pays)
    1.  [V9: Technical approach](#v9-technical-approach)
    1.  [V10: Close](#v10-close)
1.  [Recording the voiceover](#recording-the-voiceover)
1.  [Claim guardrails](#claim-guardrails)
1.  [Claims ledger](#claims-ledger)
1.  [Decisions for the team](#decisions-for-the-team)
1.  [Sources](#sources)

## How the video works

**The argument, in one breath.** Aina, our sample front-end developer, works at a company that has just rolled out AI coding tools, and her manager asks which training to fund. A course list doesn't answer that. Kotak's three-minute check-up for her job gives her a dated plan: which skill first, how many hours, a free link for each step and her employer's funding route. The plan moves when the evidence moves, because data decides and AI only explains. And because the rules are open, any AI assistant can call them: most teams build a chatbot; Kotak is the tool a chatbot calls.

- **Runtime:** 6:16, inside the 5:30 to 6:30 target and the 7:00 limit. The live demo runs 3:00.
- **The first 24 seconds** show the persona, the moment and her finished plan, then the team. The problem comes next.
- **One narrator** reads everything. Kopi, Kotak's guide, is heard once, in the What Changed shot, as the app's own sound. It never replaces the narrator.
- **The demo is the crux.** It shows the trend data feeding the role matching and the plan: the same answers, a new month, and the plan moves (D6).
- **Every segment links to the one before.** Each first sentence picks up the last thought ("Here's why she needs it", "So when the tools arrive", "That's what Kotak gives her", "Here's the rule behind it", "Let's open the box", "So where does that leave", "Who pays?", "Under the hood"). Keep the links when you trim.
- **Pace:** about 150 words a minute, with the marked pauses. It will feel slow; it is right. Never speed the audio up. A segment that runs long is read again, from its pickup line.
- **Labels:** a small "Sample persona · demo answers" tag on every app shot. It never covers the app's own labels.

## Timing

"Words" are the words in the `VOICEOVER` block. "Read" is the time at 150 words a minute, plus the marked pauses. The slot minus the read time is visual hold.

| Seg | Time      | Picture                      | Purpose                                              | Words |   Read |
| --- | --------- | ---------------------------- | ---------------------------------------------------- | ----: | -----: |
| V1  | 0:00–0:24 | Shot H1, Aina's roadmap      | The persona, the moment, her finished plan, the team |    51 | 21.5 s |
| V2  | 0:24–0:40 | Deck 2                       | The job is changing; the training isn't              |    31 | 13.4 s |
| V3  | 0:40–1:03 | Deck 3                       | The manager's question, and who we start with        |    50 | 20.6 s |
| V4  | 1:03–1:25 | Deck 4                       | What she leaves with, and the honest limit           |    48 | 19.8 s |
| V5  | 1:25–1:46 | Deck 5                       | Data decides. AI explains.                           |    44 | 18.6 s |
| D1  | 1:46–2:00 | Shot D1, intake              | Who she is, and what she wants                       |    25 | 10.3 s |
| D2  | 2:00–2:18 | Shot D2, questions           | Twelve can-do questions                              |    35 | 14.6 s |
| D3  | 2:18–2:52 | Shot D3, radar and job ads   | Six skills, dated verdicts, real job ads             |    74 | 30.3 s |
| D4  | 2:52–3:08 | Shot D4, roles               | Ranked roles with the maths open                     |    29 | 12.2 s |
| D5  | 3:08–3:36 | Shot D5, roadmap             | The plan to 80% fit                                  |    58 | 23.8 s |
| D6  | 3:36–4:16 | Shot D6, What Changed        | The data moves; the plan moves; Kopi says why        |    66 | 27.3 s |
| D7  | 4:16–4:28 | Shot D7, Ask Kopi            | Questions, answered from labelled data               |    23 |  9.2 s |
| M1  | 4:28–4:46 | Shot M1, an AI assistant     | The tool a chatbot calls                             |    34 | 14.2 s |
| V6  | 4:46–5:03 | Deck 8                       | Courses are the supply; Kotak sets the priority      |    36 | 15.0 s |
| V7  | 5:03–5:24 | Deck 9                       | SDG 4.4, the baseline, what we measure               |    46 | 19.0 s |
| V8  | 5:24–5:44 | Deck 10                      | Workers free; employers pay; the team view is next   |    44 | 18.2 s |
| V9  | 5:44–5:57 | Deck 11                      | What it runs on                                      |    29 | 11.6 s |
| V10 | 5:57–6:16 | Deck 12, then 3 s of silence | The echo, the name, the line                         |    37 | 15.9 s |

Total: 6:16, with 3:00 of live demo (1:46 to 4:46) and 5:16 of speech. D6's slot includes about 8 seconds of Kopi's own voice. Decks 6 and 7 are not in the video: the demo shows the same screens live. Check the totals again after any rewrite.

## Director transcript

Pause marks such as `[pause 0.4s]` are silence of that length. Everything else in square brackets is a direction, never read aloud.

### V1: Hook

**TIME:** `0:00–0:24` · **PURPOSE:** the persona, the moment, her finished plan, then the team.

**ON SCREEN:** shot H1, Aina's finished roadmap: "Your 35-Week Roadmap", "80% Fit by Week 35", the timeline from Technical documentation onwards, then a slow scroll down to the funding card. The tag "Sample persona · demo answers" from the first frame. Cut to Deck 1 on "We're Team T010NG", and hold it to the end of the line.

**DELIVERY:** Begin still and unhurried, as MyTakziah began. "This is Aina's plan" is said to the judge, warmly, like showing them a page. Slow down for the three facts of the plan and give each its own breath. "We're Team T010NG" is brisk and friendly; say T010NG as "Tolong", one word.

**VOICEOVER:**

> This is Aina's plan. [pause 0.4s] Aina is our sample persona: a front-end developer in Kuala Lumpur, whose company has just rolled out AI coding tools. [pause 0.3s] Her plan: ten hours a week, technical documentation first, and eighty per cent fit for her job by week thirty-five. [pause 0.4s] We're Team T010NG, and this is Kotak.

**NOTES:** Aina is invented for this pitch, and "sample persona" says so in the first sentence about her. Never call her a user, a tester or a case study. "Eighty per cent fit" is the app's fit score: her levels against what the job is estimated to need. The numbers come from the demo answers at 10 hours a week ([claims ledger](#claims-ledger)).

### V2: The problem

**TIME:** `0:24–0:40` · **PURPOSE:** the job is changing, and the training isn't.

**ON SCREEN:** Deck 2, "The job is changing. The training isn't." Push in gently on the "56%" and "26%" card as the numbers are spoken. The footnote "National figures; not estimates for software workers" stays readable.

**DELIVERY:** "Here's why she needs it" turns from her to the country, quietly. Read the numbers level, as facts, with a small lift on "only". Land the last two sentences slowly; they are the deck's headline.

**VOICEOVER:**

> Here's why she needs it. [pause 0.3s] Fifty-six per cent of Malaysian professionals already use AI at work. Only twenty-six per cent have had formal training. [pause 0.4s] The job is changing. [pause 0.3s] The training isn't.

**NOTES:** Both figures are national, from the Hays Asia Salary Guide 2025 via the Domain 1 brief. Never present them as figures for software workers.

### V3: The user

**TIME:** `0:40–1:03` · **PURPOSE:** the manager's question, and who we start with.

**ON SCREEN:** Deck 3, "AI tools arrive. What should we learn?" Push in on "Her manager asks which training to fund this year" as it is spoken, then on "The same engine covers 923 jobs. We start here."

**DELIVERY:** This is Aina's week, so the register comes back to one person. Put the manager's question in a slightly different voice, as a question someone actually asked. "A course list doesn't answer that" is plain, not scornful.

**VOICEOVER:**

> So when the tools arrive, her manager asks which training to fund this year. [pause 0.3s] A course list doesn't answer that. Aina needs to know which skill comes first, and how long it will take. [pause 0.3s] We start with developers, testers and designers. The same engine covers nine hundred and twenty-three jobs.

**NOTES:** Her employer pays the HRD Corp levy (Deck 3); V8 picks this up. "Developers, testers and designers" is the group the team chose after the mentor session; the engine still covers all 923 jobs.

### V4: The solution

**TIME:** `1:03–1:25` · **PURPOSE:** what she leaves with, and the honest limit.

**ON SCREEN:** Deck 4, "Leave with a plan. Start this week." Push in on card 01, the dated plan, then card 02, "A free link for each step", on the last sentence.

**DELIVERY:** "That's what Kotak gives her" answers V3 directly. List the four things she leaves with at an even pace. The last sentence is an honest limit said plainly, as MyTakziah said its price hypotheses: no apology, no hurry.

**VOICEOVER:**

> That's what Kotak gives her, in a three-minute check-up for her job. [pause 0.3s] She leaves with a dated plan: the hours each week, a free link for each step, and her employer's funding route. [pause 0.3s] Kotak names no course it hasn't checked, so each link says it's a search suggestion.

**NOTES:** Never say "AI check-up". The roadmap's links are web searches marked "Search suggestion, not checked"; Kotak lists no unchecked course as a course.

### V5: How it works

**TIME:** `1:25–1:46` · **PURPOSE:** data decides, AI explains; then the hand-off into the demo.

**ON SCREEN:** Deck 5, "Data decides. AI explains." Push in on the three cards (Source, Rule, Output) as "fixed rules over dated public data" is spoken, then on "The rule" box. Dissolve into shot D1 on "Let's open the box."

**DELIVERY:** Slow down for "Data decides. AI explains.": it is the line a judge should repeat. The middle is matter-of-fact. "Let's open the box" is light and inviting; it hands the floor to the demo.

**VOICEOVER:**

> Here's the rule behind it. [pause 0.3s] Data decides. AI explains. [pause 0.4s] Fixed rules over dated public data set every verdict, score and step. Claude only writes the explanation, from the cited rows, and a check rejects any explanation that changes a verdict. [pause 0.3s] Let's open the box.

**NOTES:** Kotak means "box" in Malay; the close comes back to it. Claude Haiku 5.5 writes the explanations (Deck 11). If Claude fails, a fixed template answers; the verdict never changes.

### Live demo

**TIME:** `1:46–4:46` · three minutes of the live app, recorded in OBS from the live demo link ([shot list](/docs/demo/video.md#shot-list)).

**ON SCREEN:** the app fills the frame. One chip top left names the step (Intake, Questions, Radar, Roles, Roadmap, What Changed, Ask Kopi, Your AI), and at most one short callout at a time. The tag "Sample persona · demo answers" stays on throughout. Cut on the narration, not on the clicks.

**DELIVERY:** The demo narration says why each moment matters to Aina, never which button is pressed: the screen shows the buttons. Keep the energy a little higher than the deck, as if sitting beside her.

#### D1: Intake

**TIME:** `1:46–2:00` · **CHIP:** Intake

**ON SCREEN:** Check-Up start: Working, "web developer" typed and Web Developers picked, then the goal Stay Strong in My Job.

**VOICEOVER:**

> Aina starts with who she is: working, as a web developer. [pause 0.3s] Then what she wants: to stay strong in her job as AI changes it.

**NOTES:** Leave the other intake fields as they are. This is the intake that gives the deck's numbers on the live build.

#### D2: Questions

**TIME:** `2:00–2:18` · **CHIP:** Questions

**ON SCREEN:** Kopi asks the first two or three can-do questions, and each is answered. Callout: "12 questions · about 3 minutes".

**VOICEOVER:**

> Then Kopi, Kotak's guide, asks twelve can-do questions about her own work, two for each of six skills. [pause 0.3s] Some are worded the other way round, to catch answers on autopilot. [pause 0.3s] It takes about three minutes.

**NOTES:** Questions 2, 4, 7, 10 and 12 use reversed wording, where agreeing means less skill. Kopi is named by its job, the guide; never as an avatar or by its animation.

#### D3: Radar and job ads

**TIME:** `2:18–2:52` · **CHIP:** Radar

**ON SCREEN:** the radar with its "self-reported" label, the verdict chips and the dated sources, the dashed "Needed by" line; then a scroll to the Job Ads in Malaysia card. Callout on the card: "JobStreet ads · as of <recording date>".

**VOICEOVER:**

> Her radar compares six skills: her own, self-reported level against what the job is estimated to need a year ahead. [pause 0.3s] Each skill gets a verdict with a dated source. Technical documentation is rising: AI helps it scale. Web site building is declining because of AI. [pause 0.4s] And it's tied to real hiring: about a hundred and seventy JobStreet ads in Malaysia match her job, at a median of six thousand three hundred ringgit a month.

**NOTES:** Read the ad count and the median off the card on the recording day, and say them rounded (the count to the nearest ten). If they changed, read the pickup line with the new figures. Never say Kotak predicts her pay. The "Needed by" line is an estimate twelve months ahead; say "estimated", always.

#### D4: Roles

**TIME:** `2:52–3:08` · **CHIP:** Roles

**ON SCREEN:** Roles That Fit: the ranked roles with their fit scores and reasons; the highlighted card's bold reason; then See the Maths open.

**VOICEOVER:**

> Kotak ranks the roles she fits, each with its score and the reason it's there. [pause 0.3s] See the Maths opens the formula behind every number. [pause 0.3s] Nothing stays inside the box.

#### D5: Roadmap

**TIME:** `3:08–3:36` · **CHIP:** Roadmap

**ON SCREEN:** the roadmap at 10 hours a week: "Your 35-Week Roadmap", "80% Fit by Week 35", the first step's hours and its free search link; tick the first step and watch its skill level rise; end on the funding card. Callout: "80% fit by week 35 · 10 h/week".

**VOICEOVER:**

> Her roadmap puts the steps in the order that gains the most fit per hour, and leaves declining skills for last. [pause 0.3s] At ten hours a week, she reaches eighty per cent fit by week thirty-five. [pause 0.3s] Each step shows its hours and a free search link. And the funding card tells her employer to apply before the training starts.

**NOTES:** Before filming, set Hours Per Week to 10 and the Plan Start Date to Monday 2 November 2026, so the screen matches Deck 4. The narration still quotes weeks, never dates. At the app's default of 4 hours a week the plan runs 88 weeks; never imply the default.

#### D6: What Changed

**TIME:** `3:36–4:16` · **CHIP:** What Changed

**ON SCREEN:** What Changed, starting on April 2026: load May 2026; the radar's line moves, six verdicts flip ("New data landed. Six skills changed, and your roadmap moved with them."), the ranking reorders, and Web site building, now Declining, moves from step 4 to step 6, the last. Kopi speaks its line in its speech bubble. Callout: "Same answers. New month."

**DELIVERY:** This is the moment that wins marks, so slow down. Give "Same job. Same twelve answers." a beat each. Stop talking while Kopi speaks, and come back quietly after it.

**VOICEOVER:**

> Now the moment that matters most. [pause 0.3s] Same job. Same twelve answers. Only the data moves, from April to May. [pause 0.3s] In April there was one month of AI-use data, too little for a trend, so every skill read Unknown. In May, six verdicts flip, the ranking reorders, and web site building, now declining, drops from step four to last. [pause 0.3s] [Kopi speaks, about 8 seconds] The trend data drives the plan. Kopi just says why.

**NOTES:** This is the rubric's must-show feature: "the trend signal layer feeding the role matching system". Kopi's voice is the app's own cached audio, recorded with the screen; keep it under the 8 seconds the slot allows, and never replace the narrator with it.

#### D7: Ask Kopi

**TIME:** `4:16–4:28` · **CHIP:** Ask Kopi

**ON SCREEN:** Ask Kopi: "Which rising skills do web developers lack most?" Kopi checks the national skill gaps and calls the rows sample data. Keep the words "sample data" readable.

**VOICEOVER:**

> Aina can ask Kopi about her plan. Here it checks the national skill gaps, and says plainly that these rows are sample data.

**NOTES:** Kopi's reply is live and differs between takes. Use a take where it says "sample data" plainly.

#### M1: Your AI

**TIME:** `4:28–4:46` · **CHIP:** Your AI

**ON SCREEN:** about 3 seconds of the app's Connect Your AI page with the MCP address, then an AI assistant with Kotak connected answers a question about web developers from Kotak's tools; its answer shows the same verdicts as the radar. Callout: "Same rules, over MCP".

**DELIVERY:** The line in the middle is the stand-out line of the video. Say it slowly, with a full stop between the two sentences.

**VOICEOVER:**

> Kotak doesn't stop at its own screen. [pause 0.3s] Most teams build a chatbot. Kotak is the tool a chatbot calls. [pause 0.3s] Any AI assistant can ask Kotak, and get the same verdicts, from the same rules.

### V6: Innovation

**TIME:** `4:46–5:03` · **PURPOSE:** courses are the supply; Kotak sets the priority.

**ON SCREEN:** Deck 8, "Courses are the supply. Kotak sets the priority." Push in on "What already exists" on the first sentence, then "What Kotak adds".

**DELIVERY:** Name the three platforms with respect: they are supply, not rivals. The last two sentences fall slowly; they are the deck's headline.

**VOICEOVER:**

> So where does that leave MasterClass, ReSkills or e-LATiH? [pause 0.3s] They offer courses. Kotak tells you which skill to learn first, and why now, then points you to them. [pause 0.3s] Courses are the supply. Kotak sets the priority.

**NOTES:** Never call a specific course HRD Corp-claimable: there is no public list of claimable programmes. ReSkills' HRD Corp-registered claim rests on 2021 coverage, so the narration doesn't repeat it.

### V7: Impact

**TIME:** `5:03–5:24` · **PURPOSE:** SDG 4.4, the baseline, and what we measure.

**ON SCREEN:** Deck 9, "A plan you can audit. A baseline you can move." Push in on the 39.8% card, then on "What we do not claim".

**DELIVERY:** The baseline is a fact, read level. "We claim no jobs placed" is the honest limit; say it as plainly as the number.

**VOICEOVER:**

> That's SDG target 4.4: more adults with the skills for decent work. [pause 0.3s] In 2024, thirty-nine point eight per cent of Malaysians had above-basic digital skills in all five areas. [pause 0.3s] We claim no jobs placed. We measure every plan: sourced, dated, and reached in under three minutes.

### V8: Who pays

**TIME:** `5:24–5:44` · **PURPOSE:** workers free; employers pay; the team view is next.

**ON SCREEN:** Deck 10, "Workers use it free. Employers pay." Push in on "Employers · Next" and its "Not built yet", then on "The Same Rules Through MCP".

**DELIVERY:** "Who pays?" is a real question, then a beat. "It isn't built yet" is said plainly, without hurrying past it.

**VOICEOVER:**

> Who pays? [pause 0.3s] Workers use Kotak free. Employers pay for a team view of where to spend the HRD Corp levy they already pay. That view is our next step; it isn't built yet. [pause 0.3s] And an employer's own HR assistant can call the same rules.

**NOTES:** No prices: none has a source. Grants are a route to explore, and the narration names none.

### V9: Technical approach

**TIME:** `5:44–5:57` · **PURPOSE:** what it runs on; the only place Live2D and ElevenLabs are named.

**ON SCREEN:** Deck 11, "Rules in the browser. Evidence with a date." Push in on the architecture picture.

**DELIVERY:** Brisk and even; a list read once.

**VOICEOVER:**

> Under the hood: rules in the browser, Claude Haiku to explain, RunPod to draft the skills and questions, Live2D and ElevenLabs for Kopi, and Replit for the live demo.

### V10: Close

**TIME:** `5:57–6:16`, ending on 3 seconds of silence.

**ON SCREEN:** Deck 12, "A plan for your job. Try Kotak.", with both QR codes readable for the whole segment and the hold.

**DELIVERY:** Come back to Aina, quietly, as MyTakziah came back to the families. Take a full beat before "Kotak is Malay for box". "Data decides. AI explains." is slower than anything before it. End warm: "Thank you."

**VOICEOVER:**

> Aina doesn't need another course list. She needs to know where to start. [pause 0.4s] Kotak is Malay for box. We built it to open the box on your job. [pause 0.4s] Data decides. AI explains. [pause 0.3s] We're Team T010NG. Thank you.

## Recording the voiceover

- **The narrator** reads every segment from this script, at 1.0× speed. Pick one team member at G1.
- **The room:** small and soft, with curtains, a sofa or a wardrobe of clothes nearby. Phone or laptop mic about 20 cm away, a little off to the side. No fan or air-conditioner noise.
- **Files:** one per segment, named by the segment (`V01` to `V10`, `D1` to `D7`, `M1`), two takes each. Record 10 seconds of silence in the same room for the edit.
- **Check the length:** if a segment runs more than 2 seconds over its "Read" time, read it again slower, never faster, and cut a pause in the edit instead.
- **Pickup lines** for the figures that can change on the day:
  - D3, if the card shows a different count or median: "about <count> JobStreet ads in Malaysia match her job, at a median of <median> ringgit a month."
  - D6, if Kopi's line runs long: end the segment on "The trend data drives the plan." and drop "Kopi just says why."

Pronunciation: T010NG is "Tolong"; Kotak is "KO-tak"; Kopi is "KO-pee"; e-LATiH is "ee-LA-tih"; HRD Corp is "H-R-D Corp"; RM6,300 is "six thousand three hundred ringgit".

## Claim guardrails

- **Aina is a sample persona.** Never "our user", "a tester", "a real case" or "a pilot".
- **No banned phrases** in the narration, the captions or the overlays: "AI check-up", "12-week", "chance of", "guarantee", "AI decides", "will replace you", "certified", "real user".
- **Estimates stay estimates.** "Needed by" targets, fit scores and job-ad counts are estimates; say "estimated" or "about".
- **The team view isn't built.** Say "next step"; never show or describe it as working.
- **No course is HRD Corp-claimable** in our words. Employers apply before training and claim approved costs; the funding card says to check the scheme.
- **Live2D and ElevenLabs** are named only in V9.
- **No issue or pull-request numbers** on screen, in the narration or in the captions.

## Claims ledger

| Claim (as spoken)                                                                                                                  | Seg    | Source                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| Ten hours a week, technical documentation first, 80% fit by week 35                                                                | V1, D5 | `@kotak/sdk` on the May 2026 snapshot, Web Developers, demo answers, 10 h/week; Deck 4             |
| 56% of Malaysian professionals use AI at work; 26% have had formal training                                                        | V2     | Hays Asia Salary Guide 2025, via the Domain 1 brief; Deck 2                                        |
| The same engine covers 923 jobs                                                                                                    | V3     | `data/generated/role-corners.json`; Deck 3                                                         |
| Each link says it's a search suggestion                                                                                            | V4     | Roadmap step links, "Search suggestion, not checked"; Deck 4                                       |
| A check rejects any explanation that changes a verdict                                                                             | V5     | `packages/shared/src/rules`; Deck 5                                                                |
| Twelve can-do questions, two for each of six skills; some worded the other way round                                               | D2     | `packages/shared/src/rules/scoring.ts` (`REVERSED_SLOTS`); `apps/web/src/views/QuestionsView.tsx`  |
| Technical documentation rising; web site building declining because of AI                                                          | D3     | Radar verdicts on the May 2026 snapshot, demo answers                                              |
| About 170 JobStreet ads match her job; median RM6,300 a month                                                                      | D3     | Job Ads in Malaysia card, "JobStreet Malaysia job ads, reviewed by Kotak", read on 24 October 2026 |
| Roadmap order: most fit per hour, declining skills last                                                                            | D5     | `packages/shared/src/rules/roadmap.ts`                                                             |
| April: one month of AI-use data, every skill Unknown; May: six verdicts flip; web site building moves from step 4 to step 6 (last) | D6     | What Changed, April to May 2026, demo answers; Deck 6                                              |
| Kopi calls the national rows sample data                                                                                           | D7     | `apps/api/db/sample-checkups.ts`; Kopi's national skill gaps tool                                  |
| Any AI assistant gets the same verdicts over MCP                                                                                   | M1     | `/api/mcp`; the app's Connect Your AI page; Deck 12                                                |
| 39.8% of Malaysians had above-basic digital skills in all five areas, 2024                                                         | V7     | DOSM, UN SDG API indicator 4.4.1; Deck 9                                                           |
| Employers pay the HRD Corp levy; the team view isn't built                                                                         | V8     | HRD Corp FAQ, accessed 23 October 2026; Deck 10                                                    |
| Claude Haiku explains; RunPod drafts the skills and questions; Replit hosts the demo                                               | V9     | `apps/api/src/ai/claude.ts`; `docs/TECH-DECLARATION.md`; Deck 11                                   |

## Decisions for the team

1.  **The narrator.** One team member reads everything, for one level and fast pickups.
1.  **The job-ad figures.** Re-read the card on the recording day; the pickup line covers a change.
1.  **The D7 take.** Pick the take where Kopi says "sample data" most plainly.

## Sources

- [Recording and editing steps](/docs/demo/video.md), with the shot list, the OBS settings and the Premiere edit.
- [Pitch deck](/docs/demo/deck/pitch-deck.html): the slide text and sources each segment reads from.
- [Brief: deliverables and judging](/docs/BRIEF.md).
- [Design system: content rules](/docs/DESIGN.md).
- [Product principles](/docs/PRODUCT.md).

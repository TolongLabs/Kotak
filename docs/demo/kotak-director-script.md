# Kotak video director script

The script for the Kotak pitching video: ten narrated slides with a live demo of the working app between slides 5 and 6. One narrator, a team member, reads every `VOICEOVER` block, at 1.0× speed. A Playwright harness films the app, and Remotion assembles the slides, the footage, the narration and the demo graphics; [`video.md`](/docs/demo/video.md) owns the recording and editing steps. The voice follows the team's MyTakziah finals scripts: say who we are in a breath, open on real people and real numbers, carry one argument with a link from each part to the next, say the honest limits plainly, and close by echoing the opening.

Contents:

1.  [How the video works](#how-the-video-works)
1.  [Timing](#timing)
1.  [Director transcript](#director-transcript)
    1.  [V1: Team](#v1-team)
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
1.  [Sources](#sources)

## How the video works

**The argument, in one breath.** Malaysia is losing office jobs, not factory jobs, and the jobs most exposed to AI are losing the most. Workers use AI but aren't trained for it, and nobody tells them which skill to learn first. Kotak does: a three-minute check-up for your job gives a dated plan, with the skill to start on, the hours, a free step for each skill and the employer's funding route. The plan moves when the data moves, because data decides and AI only explains. It is the only tool we found that does all of that, workers use it free, employers pay a fraction of the training levy they already pay, and the rules run the same in the browser, in the app and in any AI assistant.

- **Runtime:** 6:46: 16 seconds over our 6:30 target and 14 seconds under the 7:00 limit. The live demo runs 3:00. If the narration reads slower than 150 words a minute, use the [trim list](#recording-the-voiceover).
- **Rubric weight:** the hook, the user and the solution carry Problem-Solution Fit (25%); innovation, the demo's What Changed moment and the MCP line carry Innovation (30%); the demo and the technical approach carry Feasibility (25%); one argument with clear links carries Clarity (20%).
- **One narrator** reads everything. Kopi, Kotak's guide, is heard once, in the What Changed shot, as the app's own sound.
- **Every segment links to the one before** ("Here's why", "So we start with", "A course list can't answer that", "How does it work?", "Let's open the box", "So what's new?", "For a worker", "So who pays?", "And under the hood"). Keep the links when you trim.
- **Pace:** read at about 150 words a minute, with the marked pauses. In the edit, the slide segments (V1 to V10) play at 1.2× with the pitch kept, about 180 words a minute; the demo segments (D1 to M1) play at 1.0×. Never go past 1.2×; a segment that still runs long is read again from the [trim list](#recording-the-voiceover).
- **Labels:** a small "Sample persona · demo answers" tag on every app shot.

## Timing

"Read" is the time at 150 words a minute, plus the marked pauses. "Played" is the time in the video: slide segments play at 1.2×, demo segments at 1.0×. The slot minus the played time is visual hold.

| Seg | Time      | Picture                      | Purpose                                             | Words |   Read | Played |
| --- | --------- | ---------------------------- | --------------------------------------------------- | ----: | -----: | -----: |
| V1  | 0:00–0:13 | Deck 1                       | Who we are, the domain, what we built               |    36 | 14.7 s | 12.2 s |
| V2  | 0:13–0:50 | Deck 2                       | The hook: real losses, real numbers, the honest gap |   103 | 43.0 s | 35.8 s |
| V3  | 0:50–1:08 | Deck 3                       | Who Kotak is for, and her manager's question        |    48 | 19.5 s | 16.2 s |
| V4  | 1:08–1:37 | Deck 4, then shot H1         | What she gets; all six must-haves                   |    83 | 33.8 s | 28.2 s |
| V5  | 1:37–1:47 | Deck 5                       | Data decides. AI explains.                          |    23 |  9.9 s |  8.2 s |
| D1  | 1:47–2:01 | Shot D1, intake              | Who she is, and what she wants                      |    27 | 11.1 s | 11.1 s |
| D2  | 2:01–2:19 | Shot D2, questions           | Twelve can-do questions                             |    35 | 14.6 s | 14.6 s |
| D3  | 2:19–2:53 | Shot D3, radar and job ads   | Six skills, dated verdicts, real job ads            |    74 | 30.3 s | 30.3 s |
| D4  | 2:53–3:09 | Shot D4, roles               | Ranked roles with the maths open                    |    25 | 10.6 s | 10.6 s |
| D5  | 3:09–3:37 | Shot D5, roadmap             | The plan to 80% fit                                 |    60 | 24.6 s | 24.6 s |
| D6  | 3:37–4:17 | Shot D6, What Changed        | The data moves; the plan moves; Kopi says why       |    75 | 30.9 s | 30.9 s |
| D7  | 4:17–4:29 | Shot D7, Ask Kopi            | Questions, answered from labelled data              |    23 |  9.2 s |  9.2 s |
| M1  | 4:29–4:47 | Shot M1, an AI assistant     | The tool a chatbot calls                            |    37 | 15.4 s | 15.4 s |
| V6  | 4:47–5:14 | Deck 6                       | What exists, and what only Kotak does               |    77 | 31.7 s | 26.4 s |
| V7  | 5:14–5:33 | Deck 7                       | What a worker gains; SDG 4.4                        |    50 | 20.6 s | 17.2 s |
| V8  | 5:33–5:58 | Deck 8                       | Free for workers; employers pay under a tenth       |    72 | 29.4 s | 24.5 s |
| V9  | 5:58–6:24 | Deck 9                       | Two halves, one rulebook, live and tested           |    73 | 29.4 s | 24.5 s |
| V10 | 6:24–6:40 | Deck 10, then 3 s of silence | The echo, the name, the line                        |    38 | 15.9 s | 13.2 s |

Total: 6:40, with 3:00 of live demo (1:47 to 4:47). D6's slot includes about 8 seconds of Kopi's own voice. Without the 1.2× speed-up the cut runs about 7:22, over the limit: then read the [trim list](#recording-the-voiceover). Check the totals again after any rewrite.

## Director transcript

Pause marks such as `[pause 0.4s]` are silence of that length. Everything else in square brackets is a direction, never read aloud.

### V1: Team

**TIME:** `0:00–0:13` · **PURPOSE:** who we are, the domain, and what we built. No persona yet.

**ON SCREEN:** Deck 1, "Team": the five portraits with full names, the Kotak box, and the SDC, Aiversecity, SDG 4 and SDG 8 logos top right. A slow push-in.

**DELIVERY:** Warm, direct and brief, like MyTakziah's "Good afternoon. We are Team Survive." Say T010NG as "Tolong", one word, and smile on "help". The last sentence is the promise of the whole video; slow down for it.

**VOICEOVER:**

> Hi, we're Team T010NG. Tolong is Malay for help. [pause 0.3s] We're in Domain 1, the future-ready workforce, and we built Kotak. It shows a worker what AI is changing in their job, and what to learn next.

### V2: The problem

**TIME:** `0:13–0:50` · **PURPOSE:** the hook: real losses, real numbers, and the honest gap.

**ON SCREEN:** Deck 2, "This Time, It's the Office.": the wall of dated clippings. Push in on each card as it is spoken: the 52,607 card, then "1 in 2" with the 1998 / 2009 / 2026 strip, then the 69% card, then the 56% / 26% line. The footnote "The minister says AI is not yet a main cause" stays readable while that sentence is spoken.

**DELIVERY:** Begin still, as MyTakziah did. Read the first number slowly and exactly; it is a count of people. "This time, it's the office" is quiet, almost to yourself. "The minister says AI isn't a main cause yet" is fair and level, not a set-up for a sneer. Lift on "But". Land the last sentence slowly: it is the gap Kotak closes.

**VOICEOVER:**

> Here's why. [pause 0.4s] By mid-July this year, fifty-two thousand, six hundred and seven Malaysians had lost their jobs. That's about two hundred and seventy people a day. [pause 0.3s] Half were professionals, managers, executives or technicians. In 1998 and 2009, production workers were hit hardest. [pause 0.3s] This time, it's the office. [pause 0.5s] The minister says AI isn't a main cause yet. But a study at Institute Of Strategic & International Studies (ISIS) Malaysia found the jobs most exposed to AI see sixty-nine per cent more job losses than average. [pause 0.3s] And while fifty-six per cent of Malaysian professionals use AI at work, only twenty-six per cent have been trained.

**NOTES:** Never say AI caused these job losses. The minister names closures, voluntary separation schemes and rationalisation as the main causes; the ISIS finding is a link in PERKESO data, not proof of replacement. "This time, it's the office" rests on BusinessToday's comparison with 1998 and 2009.

### V3: The user

**TIME:** `0:50–1:08` · **PURPOSE:** who Kotak is for, and the question it answers.

**ON SCREEN:** Deck 3, "Digital Workers Whose Jobs AI Is Changing Now.": the rows Who Uses It, The Moment, Who Pays and Also For, and Aina's bubble, labelled "Sample persona". Push in on Who Uses It on the first sentence, then on the bubble as the manager's question is spoken.

**DELIVERY:** "So we start with" turns from the country to one person. Warm on "Meet Aina". Say the manager's question in a slightly different voice, as a question someone really asked.

**VOICEOVER:**

> So we start with the people closest to the change: developers, testers and designers. [pause 0.3s] Meet Aina, our sample persona, a front-end developer in Kuala Lumpur. She works at a tech company that just rolled out AI coding tools. Her manager asks: which training do we fund this year?

**NOTES:** Aina is invented for this pitch; "sample persona" says so. Never call her a user, a tester or a case. The engine covers 923 jobs; the slide says so, and the narration doesn't need to.

### V4: The solution

**TIME:** `1:08–1:37` · **PURPOSE:** what she leaves with: direct and convincing.

**ON SCREEN:** Deck 4, "Every Must-Have, Not Just a Plan.", for the first sentence; cut to shot H1, Aina's finished roadmap ("Your 35-Week Roadmap", "80% Fit by Week 35"), on "She leaves with a dated plan"; cut back to Deck 4's must-have table on "And it covers".

**DELIVERY:** "A course list can't answer that" picks up the manager's question. "Kotak can" is confident and short. List what she leaves with at an even pace, one breath each.

**VOICEOVER:**

> Now, a course list can't answer that. Kotak can, in a three-minute check-up for her job. [pause 0.3s] Twelve questions and no CV needed. She leaves with a dated plan: a week-by-week reskilling calendar, from her start date to eighty per cent fit for her job. It shows which skill first, the hours each week, a free step for each skill, and her employer's funding route. [pause 0.3s] And it covers all six must-haves in the Domain 1 brief, from a dated trend layer to SDG tags.

**NOTES:** Never say "AI check-up". The free steps are web searches marked "Search suggestion, not checked"; the narration says "a free step", never "a free course".

### V5: How it works

**TIME:** `1:37–1:47` · **PURPOSE:** the one rule, then the hand-off into the demo.

**ON SCREEN:** Deck 5, the three-step flow. Dissolve into shot D1 on "Let's open the box."

**DELIVERY:** Slow down for "Data decides. AI explains.": it is the line a judge should repeat. "Let's open the box" is light and inviting.

**VOICEOVER:**

> So, how does it work? [pause 0.2s] Data decides. AI explains. [pause 0.3s] Fixed rules over dated public data set every verdict and step. [pause 0.2s] Marilah buka kotakmu.

### Live demo

**TIME:** `1:47–4:47` · three minutes of the live app, recorded by the harness on a production build ([shot list](/docs/demo/video.md#shot-list)).

**ON SCREEN:** the app fills the frame. The graphics pack frames it in three acts: Problem (D1 to D3), Solution (D4 and D5) and Outcome (D6 to M1). An act banner opens each act, the HUD at the bottom shows the act and the step, and at most one callout or result card is on screen at a time ([cue sheet](/docs/demo/demo-graphics.md#cue-sheet)). The tag "Sample persona · demo answers" stays on throughout. Cut on the narration, not on the clicks.

**DELIVERY:** The demo narration says why each moment matters to Aina, never which button is pressed. Keep the energy a little higher than the slides, as if sitting beside her.

#### D1: Intake

**TIME:** `1:47–2:01` · **CHIP:** Intake

**ON SCREEN:** Check-Up start: Working, "web developer" typed and Web Developers picked, then the goal Stay Strong in My Job.

**GRAPHICS:** `act-1-problem` and `hud-1` at the start; `c-d1-who` on "who she is", with `ring-wide` on Web Developers.

**VOICEOVER:**

> First, the problem. [pause 0.3s] Aina starts with who she is: working, as a web developer, and she wants to stay strong in her job as AI changes it.

**NOTES:** Leave the other intake fields as they are. This intake gives the deck's numbers on the live build.

#### D2: Questions

**TIME:** `2:01–2:19` · **CHIP:** Questions

**ON SCREEN:** Kopi asks the first two or three can-do questions, and each is answered.

**GRAPHICS:** `hud-2` at the start; `c-d2-questions` on "twelve can-do questions", with `ring-box` on the answer buttons; `c-d2-reversed` on "worded the other way round".

**VOICEOVER:**

> Then Kopi, Kotak's guide, asks twelve can-do questions about her own work, two for each of six skills. [pause 0.3s] Some are worded the other way round, to catch answers on autopilot. [pause 0.3s] It takes about three minutes.

**NOTES:** Questions 2, 4, 7, 10 and 12 use reversed wording, where agreeing means less skill. Kopi is named by its job, the guide.

#### D3: Radar and job ads

**TIME:** `2:19–2:53` · **CHIP:** Radar

**ON SCREEN:** the radar with its "self-reported" label, the verdict chips and the dated sources, the dashed "Needed by" line; then a scroll to the Job Ads in Malaysia card.

**GRAPHICS:** `hud-3` and `c-d3-radar` on "Her radar compares six skills" (`ring-circle`, zoom 120%); `c-d3-rising` on "Technical documentation gets rising"; `c-d3-declining` on "Web site building gets declining"; `c-d3-jobs` on "tied to real hiring", or `c-blank` with the day's numbers.

**VOICEOVER:**

> Her radar compares six skills: her own, self-reported level against what the job is estimated to need a year ahead. [pause 0.3s] Each skill gets a verdict with a dated source. Technical documentation gets rising: AI helps it scale. Web site building gets declining because of AI. [pause 0.4s] And it's tied to real hiring: about a hundred and seventy JobStreet ads in Malaysia match her job, at a median of six thousand three hundred ringgit a month.

**NOTES:** Read the ad count and the median off the card on the recording day, and say them rounded (the count to the nearest ten); the pickup line covers a change. The "Needed by" line is an estimate twelve months ahead.

#### D4: Roles

**TIME:** `2:53–3:09` · **CHIP:** Roles

**ON SCREEN:** Roles That Fit: three roles with their fit scores and reasons; the highlighted card's bold reason; then See the Maths open.

**GRAPHICS:** `act-2-solution` and `hud-4` at the start; `c-d4-fit` on "ranks the roles she fits"; `c-d4-maths` with `arrow-right` on "See the Maths".

**VOICEOVER:**

> Now the solution. [pause 0.3s] Kotak ranks the roles she fits, each with its score and its reason. [pause 0.3s] See the Maths opens the formula behind every number.

#### D5: Roadmap

**TIME:** `3:09–3:37` · **CHIP:** Roadmap

**ON SCREEN:** the roadmap at 10 hours a week: "Your 35-Week Roadmap", "80% Fit by Week 35", the first step's hours and its free search link; tick the first step and watch its skill level rise; end on the funding card.

**GRAPHICS:** `hud-5` and `c-d5-order` on "most fit per hour"; `r-d5-plan` on "eighty per cent fit by week thirty-five" (dim to 45%, 3 seconds); `c-d5-free` on "its hours and a free search link"; `ring-box` on the funding card.

**VOICEOVER:**

> Her roadmap puts the steps in the order that gains the most fit per hour, and leaves declining skills for last. [pause 0.3s] At ten hours a week, Kotak estimates she reaches eighty per cent fit by week thirty-five. [pause 0.3s] Each step shows its hours and a free search link. And the funding card tells her employer to apply before the training starts.

**NOTES:** Before filming, set Hours Per Week to 10 and the Plan Start Date to Monday 2 November 2026, so the screen matches Deck 4. The narration quotes weeks, never dates. At the app's default of 4 hours a week the plan runs 88 weeks; never imply the default.

#### D6: What Changed

**TIME:** `3:37–4:17` · **CHIP:** What Changed

**ON SCREEN:** What Changed, starting on April 2026: load May 2026; the radar's line moves, six verdicts flip ("New data landed. Six skills changed, and your roadmap moved with them."), the ranking reorders, and Web site building, now Declining, moves from step 4 to step 6, the last. Kopi speaks its line in its speech bubble. Callout: "Same answers. New month."

**GRAPHICS:** `act-3-outcome` and `hud-6` at the start; `c-d6-same` on "Same job. Same twelve answers."; `c-d6-april` on "every skill read Unknown"; `c-d6-may` on "six verdicts flip"; `c-d6-step` with `arrow-down` on "drops from step four to last"; nothing over Kopi while it speaks; `r-d6-moved` on "The trend data drives the plan".

**DELIVERY:** This is the moment that wins marks, so slow down. Give "Same job. Same twelve answers." a beat each. Stop talking while Kopi speaks, and come back quietly after it.

**VOICEOVER:**

> And the outcome: a plan that moves with the data. [pause 0.3s] Same job. Same twelve answers. Only the data moves, from April to May. [pause 0.3s] Our hardest risk is thin data, so Kotak never guesses: in April, with one month of AI-use data, every skill read Unknown. In May, six verdicts flip, the ranking reorders, and web site building, now declining, drops from step four to last. [pause 0.3s] [Kopi speaks, about 8 seconds] The trend data drives the plan. Kopi just says why.

**NOTES:** This is the rubric's must-show feature: "the trend signal layer feeding the role matching system". Kopi's voice is the app's own cached audio, recorded with the screen.

#### D7: Ask Kopi

**TIME:** `4:17–4:29` · **CHIP:** Ask Kopi

**ON SCREEN:** Ask Kopi: "Which rising skills do web developers lack most?" Kopi checks the national skill gaps and calls the rows sample data. Keep the words "sample data" readable.

**GRAPHICS:** `hud-7` and `c-d7-kopi` on "says plainly that these rows are sample data", with `ring-wide` on the words "sample data".

**VOICEOVER:**

> Aina can ask Kopi about her plan. Here it checks the national skill gaps, and says plainly that these rows are sample data.

**NOTES:** Kopi's reply is live and differs between takes. Use a take where it says "sample data" plainly.

#### M1: Your AI

**TIME:** `4:29–4:47` · **CHIP:** Your AI

**ON SCREEN:** about 3 seconds of the app's Connect Your AI page with the MCP address, then an AI assistant with Kotak connected answers a question about web developers from Kotak's tools; its answer shows the same verdicts as the radar.

**GRAPHICS:** `hud-8` at the start, with `ring-wide` on the MCP address; `c-m1-mcp` on "Kotak is the tool a chatbot calls", held to the end of the shot.

**DELIVERY:** The middle line is the stand-out line of the video. Say it slowly, with a full stop between the two sentences.

**VOICEOVER:**

> Kotak doesn't stop at its own screen. [pause 0.3s] Most teams build a chatbot. Kotak is the tool a chatbot calls. [pause 0.3s] Any AI assistant that speaks MCP can ask Kotak, and get the same verdicts, from the same rules.

### V6: Innovation

**TIME:** `4:47–5:14` · **PURPOSE:** what exists, and the five things only Kotak does together.

**ON SCREEN:** Deck 6, "Others List Courses. Kotak Says What to Learn First.", the competitor grid. Push in on the rows as they are named, then light the Kotak column on "Kotak is the only one we found".

**DELIVERY:** Name the others with respect: they are good at what they do. "Kotak is the only one we found" is confident and exact; "we found" stays in. The last two sentences fall slowly; they are the slide's headline.

**VOICEOVER:**

> Now, what's so special with Kotak? [pause 0.3s] As you can see, MyMahir and LinkedIn map skills. MasterClass, ReSkills and e-LATiH offer courses. A chatbot can't say where its plan came from. [pause 0.3s] Kotak is the only one we found that dates each skill's AI trend, shows its maths, times the plan, points to funding, and lets any AI call the same rules. [pause 0.3s] Course sites tell you what you could learn. Kotak tells you what to learn first, and why.

**NOTES:** "The only one we found" rests on the team's public-tool review in October 2026; never drop "we found". Never call a course HRD Corp-claimable.

### V7: Impact

**TIME:** `5:14–5:33` · **PURPOSE:** the stakes, the money already in the system, and SDG 4.4.

**ON SCREEN:** Deck 7, "Impact": the cards 3 Min, Week 35, 923 jobs and RM0 for workers, then the mission strip and "For Malaysia: levy-funded training aimed at the rising skills, toward SDG 4.4". Push in on each card as it is spoken.

**DELIVERY:** Warm and plain: this is what she gets. "For Malaysia" widens the frame; slow down for SDG 4.4.

**VOICEOVER:**

> For a worker, the gain is plain: three minutes, a plan to the eighty per cent fit threshold, and nothing to pay, across nine hundred and twenty-three jobs. [pause 0.3s] For Malaysia, the levy already funds training; Kotak helps aim it at the rising skills. [pause 0.3s] That's SDG 4.4: skills for decent work.

**NOTES:** "A plan to eighty per cent fit" is Aina's demo plan at 10 hours a week, and fit is an estimate. "Kotak helps aim it" says what Kotak is for; we claim no jobs saved and no levy moved yet.

### V8: Who pays

**TIME:** `5:33–5:58` · **PURPOSE:** the business model and the price, honestly labelled.

**ON SCREEN:** Deck 8, three tiers. Push in on "Kotak Team · RM5 per worker per month" as it is spoken, then on the levy anchor, then on "Prices to test, not contracts".

**DELIVERY:** "So who pays?" is a real question, then a beat. Say the price plainly, as a founder would. "These are prices to test" is said as plainly as the price itself, as MyTakziah said its price hypotheses.

**VOICEOVER:**

> So who pays? [pause 0.3s] Workers use Kotak free. Employers pay for a team view: five ringgit per worker a month. For a developer on the median advertised pay, the levy works out to sixty-three ringgit a month, so Kotak costs under a tenth of it, and shows which skills the levy should fund. [pause 0.3s] Agencies could license the anonymous national totals. These are prices to test, and the team view is our next build.

**NOTES:** RM5 is a price hypothesis, not a quote or a contract. The levy is 1% of wages for registered employers (HRD Corp FAQ); RM63 is 1% of the RM6,300 median on the job-ads card. The levy funds approved training, not Kotak: never say employers pay Kotak from the levy.

### V9: Technical approach

**TIME:** `5:58–6:24` · **PURPOSE:** prove it is built: two halves, one rulebook.

**ON SCREEN:** Deck 9, "Technical Architecture": push in on the data half and its job-ad row (Job-Ad Collector → Ad Review → Neon Postgres), then the product half, then the lock on "verdict".

**DELIVERY:** Speak like a tech lead showing a working system: calm, specific, no adjectives. A small beat after "same answers, same result".

**VOICEOVER:**

> And under the hood, two halves share one rulebook. Every week, dated public data becomes a snapshot; every day, new JobStreet ads come in, Claude sorts them and a moderator checks them. RunPod drafted the skills and questions for nine hundred and twenty-three jobs in thirteen minutes. In the app, the rules run in your browser: same answers, same result. [pause 0.2s] Claude Haiku explains, and a check rejects any explanation that changes a verdict.

**NOTES:** Live2D and ElevenLabs are named on Deck 9 only, and not in any other narration. Replit hosts the live demo (Deck 9 and Deck 10).

### V10: Close

**TIME:** `6:24–6:40`, ending on 3 seconds of silence.

**ON SCREEN:** Deck 10, "Open the box on your job.", with both QR codes readable for the whole segment and the hold.

**DELIVERY:** Come back to Aina, quietly, as MyTakziah came back to the families. Take a full beat before "Kotak is Malay for box". "Data decides. AI explains." is slower than anything before it. End warm: "Thank you."

**VOICEOVER:**

> Ultimately, Aina doesn't need another course list. She needs to know where to start. [pause 0.4s] Kotak is Malay for box. We built it to open the box on your job. [pause 0.3s] Data decides. AI explains. We're Team T010NG. Thank you.

## Recording the voiceover

- **The narrator** reads every segment from this script, at 1.0× speed.
- **The room:** small and soft, with curtains, a sofa or a wardrobe of clothes nearby. Phone or laptop mic about 20 cm away, a little off to the side. No fan or air-conditioner noise.
- **Files:** one per segment, named by the segment (`V01` to `V10`, `D1` to `D7`, `M1`), two takes each. Record 10 seconds of silence in the same room for the edit.
- **Check the length:** if a segment runs more than 2 seconds over its "Read" time, read it again at a calm pace and cut a pause in the edit instead. Speed only the slide segments, to at most 1.2× (the voice staging uses ffmpeg's pitch-keeping `atempo`).
- **Trim list,** if the cut runs past 6:45, in this order: V2 "That's about two hundred and seventy people a day."; V6 "A chatbot can't say where its plan came from." Together they save about 6 seconds at 1.2×. The 1.2× speed-up itself is not optional: without it the cut runs about 7:22.
- **Pickup lines** for the figures that can change on the day:
  - D3, if the card shows a different count or median: "about <count> JobStreet ads in Malaysia match her job, at a median of <median> ringgit a month."
  - V8, if the median changed: "For a developer on the median advertised pay, the levy is <1% of the median> ringgit a month."

Pronunciation: T010NG is "Tolong"; Kotak is "KO-tak"; Kopi is "KO-pee"; e-LATiH is "ee-LA-tih"; ISIS is "I-sis"; HRD Corp is "H-R-D Corp"; 52,607 is "fifty-two thousand, six hundred and seven".

## Claim guardrails

- **AI didn't cause the 52,607 job losses** in our words. Say what the minister says, then what the ISIS study found: a link, not proof.
- **Aina is a sample persona.** Never "our user", "a tester", "a real case" or "a pilot".
- **Prices are prices to test.** No revenue, customer or contract is implied; the team view isn't built.
- **"The only one we found"**, never "the only one in the world".
- **Estimates stay estimates.** "Needed by" targets, fit scores and job-ad counts are estimates; say "estimated" or "about".
- **No course is HRD Corp-claimable** in our words, and the levy never pays for Kotak.
- **Live2D and ElevenLabs** are named only on Deck 9.
- **No banned phrases** in the narration, the captions or the overlays: "AI check-up", "12-week", "chance of", "guarantee", "AI decides", "will replace you", "certified", "real user".
- **No issue or pull-request numbers** on screen, in the narration or in the captions.

## Claims ledger

| Claim (as spoken)                                                                                  | Seg    | Source                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 52,607 Malaysians lost their jobs by mid-July 2026; about 270 a day (52,607 ÷ 197 days)            | V2     | PERKESO Employment Insurance System, unemployment-benefit applications to 16 July 2026 ([SAYS][says-52607])                                                                                                               |
| Half were professionals, managers, executives or technicians; in 1998 and 2009, production workers | V2     | PMET 51% of 2026 retrenchments, PERKESO data ([SAYS][says-52607]); 1998: production workers 54% (Bank Negara), 2009: plant and machine operators four in ten (Labour Department) ([BusinessToday, 4 October 2026][bt-ai]) |
| The minister says AI isn't a main cause yet                                                        | V2     | [Malay Mail, 24 June 2026][mm-jobs]; [BusinessToday, 4 October 2026][bt-ai]                                                                                                                                               |
| Jobs most exposed to AI see 69% more job losses than average                                       | V2     | Calvin Cheng, CERT policy paper at ISIS Malaysia, June 2026, from PERKESO loss-of-employment data; associative ([CERT][cert]; [ISIS][isis])                                                                               |
| 56% of Malaysian professionals use AI at work; 26% have been trained                               | V2     | Hays Asia Salary Guide 2025, via the Domain 1 brief                                                                                                                                                                       |
| Twelve questions, no CV; a dated plan; a free step for each skill; a funding route                 | V4, D5 | The live app; `docs/PRD.md`                                                                                                                                                                                               |
| Twelve can-do questions, two for each of six skills; some worded the other way round               | D2     | `packages/shared/src/rules/scoring.ts` (`REVERSED_SLOTS`); `apps/web/src/views/QuestionsView.tsx`                                                                                                                         |
| Technical documentation rising; web site building declining because of AI                          | D3     | Radar verdicts on the May 2026 snapshot, demo answers                                                                                                                                                                     |
| About 170 JobStreet ads match her job; median RM6,300 a month                                      | D3, V8 | Job Ads in Malaysia card, "JobStreet Malaysia job ads, reviewed by Kotak", read on 24 October 2026                                                                                                                        |
| Most fit per hour first, declining skills last; 80% fit by week 35 at 10 h/week                    | D5     | `packages/shared/src/rules/roadmap.ts`; `@kotak/sdk` on the May 2026 snapshot, demo answers, 10 h/week                                                                                                                    |
| April all Unknown; May: six verdicts flip; web site building from step 4 to step 6 (last)          | D6     | What Changed, April to May 2026, demo answers, on the live build                                                                                                                                                          |
| Kopi calls the national rows sample data                                                           | D7     | `apps/api/db/sample-checkups.ts`; Kopi's national skill gaps tool                                                                                                                                                         |
| Any AI assistant gets the same verdicts over MCP                                                   | M1     | `/api/mcp`; the app's Connect Your AI page                                                                                                                                                                                |
| The only one we found with dated trends, visible maths, a timed plan and a funding route           | V6     | The team's public-tool review, October 2026: MyMahir, LinkedIn Career Explorer, masterclass.com, reskills.com, elatih.hrdcorp.gov.my                                                                                      |
| Three minutes; a plan to 80% fit; nothing to pay; 923 jobs                                         | V7     | The live app; Deck 7; `data/generated/role-corners.json`                                                                                                                                                                  |
| The levy already funds approved training                                                           | V7     | HRD Corp FAQ, accessed 23 October 2026                                                                                                                                                                                    |
| SDG 4.4: skills for decent work                                                                    | V7     | UN SDG target 4.4 text; Deck 7                                                                                                                                                                                            |
| RM5 per worker per month; the levy is RM63 a month at the median; under a tenth                    | V8     | Price hypothesis (team); levy of 1% of wages, HRD Corp FAQ, accessed 23 October 2026; 1% of RM6,300                                                                                                                       |
| RunPod drafted skills and questions for 923 jobs in 13 minutes, none failed                        | V9     | `docs/TECH-DECLARATION.md`: 923 jobs, 783 seconds for the full run, all filled                                                                                                                                            |
| Live on Replit; over 120 automated tests pass on every change                                      | V9     | The live demo link; CI on every pull request (120 to 138 pass, database tests skip)                                                                                                                                       |
| Covers all six must-haves in the Domain 1 brief                                                    | V4     | Deck 4 table; `docs/PRD.md`; Domain 1 brief, section 4 (`docs/sources/drive.google.com/domain-1-aiversecity.md`)                                                                                                          |
| Every week, dated public data becomes a snapshot                                                   | V9     | `.github/workflows/refresh-data.yml` (weekly) and the nightly job-ads refresh in `wrangler.jsonc`                                                                                                                         |
| Every day, new JobStreet ads come in; Claude sorts them and a person checks them                   | V9     | `apps/api/src/scrapers/jobstreet/README.md`, "Reviewing a batch"; the nightly queue in `wrangler.jsonc`                                                                                                                   |
| The rules run in the browser; Claude Haiku explains; a check rejects any changed verdict           | V9     | `packages/shared/src/rules`; `apps/api/src/ai/claude.ts`                                                                                                                                                                  |

[mm-jobs]: https://www.malaymail.com/news/malaysia/2026/06/24/malaysia-records-42807-job-losses-as-697000-roles-at-risk-from-ai-without-urgent-upskilling-says-hr-minister/224963
[bt-ai]: https://www.businesstoday.com.my/2026/10/04/is-ai-the-reason-behind-job-losses-in-malaysia/
[says-52607]: https://says.com/my/news/2026-is-on-track-to-be-malaysias-worst-year-for-retrenchments-since-the-pandemic
[cert]: https://www.cert.isis.org.my/?p=428
[isis]: https://www.isis.org.my/2026/06/10/automation-anxiety/

## Sources

- [Recording and editing steps](/docs/demo/video.md), with the shot list, the answer key and the Remotion pipeline.
- [Pitch deck](/docs/demo/deck/kotak-pitch-deck.html): the slide text and sources each segment reads from.
- [Brief: deliverables and judging](/docs/BRIEF.md).
- [Design system: content rules](/docs/DESIGN.md).

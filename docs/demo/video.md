# Demo video

How the team makes the pitching video: a narrated deck with a three-minute live demo of Kotak in the middle. A Playwright harness films the live app, the team records the narration, and Remotion assembles the slides, the footage, the narration and the [demo graphics](demo-graphics.md) into one file. This is the pipeline from our earlier project; the Remotion project lives outside this repository. [`kotak-director-script.md`](kotak-director-script.md) holds the words, the timing and what each segment shows.

Contents:

1.  [Rules for the video](#rules-for-the-video)
1.  [Shot list](#shot-list)
1.  [Answer key](#answer-key)
1.  [Pipeline](#pipeline)
1.  [Record the narration](#record-the-narration)
1.  [Captions and upload](#captions-and-upload)
1.  [Quality checks](#quality-checks)
1.  [Fallbacks](#fallbacks)
1.  [Sources](#sources)

## Rules for the video

- **Five to seven minutes, public on YouTube.** Each 30 seconds over 7:00 costs 1 point ([deliverables](/docs/BRIEF.md#preliminary-deliverables)). The script runs 6:40; keep the cut under 6:50 so a slow read can't cross 7:00.
- **The live demo runs 3:00,** in three acts: Problem (D1 to D3), Solution (D4 and D5) and Outcome (D6 to M1). It shows the most important feature live: the trend data feeding the role matching and the plan.
- **Our own voices.** A team member narrates. The voice staging speeds the slide segments (V1 to V10) to 1.2× with the pitch kept; the demo segments (D1 to M1) stay at 1.0×. No generated narration. Kopi's voice is heard only as the app's own sound in shot D6.
- **The team first, then the hook.** The first 13 seconds say who we are, the domain and what we built.
- **Sample means labelled.** Aina is a sample persona and the answers are demo answers. The edit tags every app shot, and the app's own "self-reported" and "sample data" labels stay readable ([content rules](/docs/DESIGN.md#content-rules)).
- **Every number has a source** in the script's [claims ledger](/docs/demo/kotak-director-script.md#claims-ledger).
- **Declared tools:** Playwright films the takes, Remotion edits, and OpenAI Whisper (`whisper-1`) times the narration's words for the cuts and captions. All three are in [`TECH-DECLARATION.md`](/docs/TECH-DECLARATION.md); a fallback tool joins them only if it is used.

## Shot list

The harness records each shot as its own take on a local production build, at 1920 × 1080 and 30 fps, with a fixed clock (Monday 2 November 2026, 09:00 MYT) and a fresh browser for every take. Slots are the edit's lengths.

| Shot | Slot | Screen                                | On camera                                                                                                                        |
| ---- | ---: | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| H1   | 12 s | Roadmap, in V4                        | Aina's finished plan at rest: "Your 35-Week Roadmap", "80% Fit by Week 35", the timeline, then a slow scroll to the funding card |
| D1   | 14 s | Check-Up start                        | Working, "web developer" typed and Web Developers picked, then the goal Stay Strong in My Job                                    |
| D2   | 18 s | Questions                             | Kopi asks questions 1 to 3, answered with the number keys from the [answer key](#answer-key)                                     |
| D3   | 34 s | Radar and Gaps                        | The radar with its "self-reported" label, verdicts, dated sources and the "Needed by" line; then the Job Ads in Malaysia card    |
| D4   | 16 s | Roles That Fit                        | The three roles with fit scores and reasons; the highlighted card; See the Maths open                                            |
| D5   | 28 s | Roadmap                               | The title and readiness line, the first step's hours and free link; tick the first step and its level rises; the funding card    |
| D6   | 40 s | What Changed                          | Starting on April 2026, load May 2026: the line moves, six verdicts flip, the ranking and steps reorder, and Kopi speaks         |
| D7   | 12 s | Ask Kopi                              | "Which rising skills do web developers lack most?"; Kopi checks the national skill gaps and calls the rows sample data           |
| M1   | 18 s | Connect Your AI, then an AI assistant | 3 s of the Connect Your AI page; then an assistant with Kotak connected answers about web developers with the same verdicts      |

Hours Per Week is 10 and the Plan Start Date is Monday 2 November 2026 for H1 and D5, so the screen matches Deck 4. D6 starts on April 2026.

## Answer key

The intake is Working, the job Web Developers and the goal Stay Strong in My Job; the other fields stay as they are. The number keys 1 to 4 answer without clicking. Questions 2, 4, 7, 10 and 12 are worded the other way round, so these keys give the demo answers ("Mostly" on each basic skill, "Not yet" on each advanced one).

| Q   | Skill                            | Starts with                                                      | Key |
| --- | -------------------------------- | ---------------------------------------------------------------- | --: |
| 1   | Technical documentation          | "I can record simple test results with guidance."                |   3 |
| 2   | Technical documentation          | "I would struggle to document complex technical factors…"        |   4 |
| 3   | Web specifications and standards | "I can maintain knowledge of web technologies through reading."  |   3 |
| 4   | Web specifications and standards | "I would struggle to develop procedures for ongoing…"            |   4 |
| 5   | Web site building                | "I can build simple web pages using authoring tools…"            |   3 |
| 6   | Web site building                | "I can select optimal programming languages and tools…"          |   1 |
| 7   | Web testing and updates          | "I would still need help to perform basic web site tests."       |   2 |
| 8   | Web testing and updates          | "I can direct web site updates and establish server…"            |   1 |
| 9   | Web design and databases         | "I can analyze user needs to list basic technical requirements." |   3 |
| 10  | Web design and databases         | "I would find it hard to create complex web models…"             |   4 |
| 11  | Web performance and support      | "I can respond to user email inquiries with guidance."           |   3 |
| 12  | Web performance and support      | "I would find it hard to recommend and implement server…"        |   4 |

Done when the roadmap, at 10 hours a week, reads "Your 35-Week Roadmap" and "80% Fit by Week 35".

## Pipeline

1.  **Preflight.** The harness runs every shot's actions and checks every cue without recording. Done when every shot passes.
1.  **Narration (team).** Record the takes as in [Record the narration](#record-the-narration). This can run at the same time as step 1.
1.  **Record (on the team's go).** The harness records every shot. Each run gets its own folder with the raw takes, Kopi's D6 audio and a manifest of cue times. Re-record one shot without redoing the rest.
1.  **Stage the voice.** Each take is trimmed and levelled to −17 LUFS. The slide takes are sped to 1.2× with ffmpeg's pitch-keeping `atempo`, and Whisper times every word.
1.  **Ingest.** Each take becomes constant 30 fps H.264 with its cues; the newest good take of each shot wins.
1.  **Edit.** Remotion lays the slides, H1 and the demo takes on the narration. Every cut, callout, ring and result card lands on a spoken word or a recorded cue, following the [cue sheet](demo-graphics.md#cue-sheet), and the "Sample persona · demo answers" tag sits on every app shot.
1.  **Finish.** Render 1920 × 1080 at 30 fps, normalise to −14 LUFS and −1 dBTP, write the English SRT from the script's words and the Whisper timings, and run the [quality checks](#quality-checks).

## Record the narration

Follow the script's [voiceover steps](/docs/demo/kotak-director-script.md#recording-the-voiceover):

1.  One narrator, in a small, soft room, with the mic about 20 cm away.
1.  One file per segment, named `V01` to `V10`, `D1` to `D7` and `M1`, two takes each, plus 10 seconds of room silence.
1.  Read at about 150 words a minute, at a calm pace. The staging does the 1.2× for the slide segments; never speed the reading up.
1.  Read D3's figures from the card on the recording day.

## Captions and upload

1.  **Captions:** the SRT uses the script's spelling (Kotak, Kopi, T010NG, Aina, HRD Corp, JobStreet, MasterClass, ReSkills, e-LATiH, SDG 4.4, MCP, Claude Haiku, RunPod, Live2D, ElevenLabs, Replit, kotakmu). Check it once against the script.
1.  **YouTube:** upload the final MP4. Title: "Kotak · SDC Hackathon 2026 · Domain 1 · Team T010NG". Description: one line on Kotak, then the live demo, the repository and the deck links. Audience: "No, it's not made for kids". Add the SRT under Subtitles.
1.  **Visibility: Public**, never Unlisted or Private.
1.  **Check signed out:** open the link in an Incognito window. It plays, the captions show, and the runtime is under 7:00.
1.  **Link it:** put the YouTube link in the README's Demo Video link.

## Quality checks

Automated, after the render:

- [ ] Runtime 6:00 to 6:50, and the demo at least 2:59.
- [ ] Loudness within 0.7 LU of −14 LUFS; true peak at most −1 dBTP.
- [ ] No banned phrase in the narration or the captions: "AI check-up", "12-week", "chance of", "guarantee", "AI decides", "will replace you", "certified", "real user".

By hand, watching the whole video once with sound:

- [ ] Every spoken number matches the claims ledger; D3's figures match the card on the recording day.
- [ ] The sample tag is on every app shot; the "self-reported" label and Kopi's "sample data" are readable; no graphic covers Kopi while it speaks.
- [ ] Live2D and ElevenLabs are named only in V9. No issue or pull-request numbers appear anywhere.
- [ ] After upload: Public, plays signed out, captions on.

## Fallbacks

- **A shot fails in the harness:** film that shot by hand with screen recording, from the shot list and the answer key, and drop it into the run as that shot's take. Add the screen recorder to the declaration.
- **The Remotion edit isn't ready by 03:30 MYT:** cut the same slides, takes and narration with ffmpeg alone, or by hand in a video editor. Add whatever tool is used to the declaration.
- **Nothing is uploaded by 05:00 MYT:** record one take of the deck and the live demo with live narration, and upload it.

## Sources

- [Director script](/docs/demo/kotak-director-script.md): the narration, the timing and the claims ledger.
- [Demo graphics](/docs/demo/demo-graphics.md): the act banners, HUD, callouts, result cards and the cue sheet.
- [Pitch deck](/docs/demo/deck/kotak-pitch-deck.html) and its stills.
- [Brief: deliverables](/docs/BRIEF.md#preliminary-deliverables) and [judging](/docs/BRIEF.md#judging).
- [Playwright screencast](https://playwright.dev/docs/api/class-screencast), [Remotion](https://www.remotion.dev/docs/), [Whisper](https://platform.openai.com/docs/guides/speech-to-text) and [ffmpeg `loudnorm`](https://ffmpeg.org/ffmpeg-filters.html#loudnorm).

# Demo video

How the team makes the pitching video: a narrated deck with a three-minute live demo of Kotak in the middle. The team records the live app with OBS Studio and edits in Adobe Premiere Pro, and uses no other tools. [`kotak-director-script.md`](/docs/demo/kotak-director-script.md) holds the words, the timing and what each segment shows; this page holds the shot list and the recording, editing and upload steps.

Contents:

1.  [Rules for the video](#rules-for-the-video)
1.  [Shot list](#shot-list)
1.  [Record the demo in OBS](#record-the-demo-in-obs)
    1.  [Set up once](#set-up-once)
    1.  [Answer key](#answer-key)
    1.  [Takes, in recording order](#takes-in-recording-order)
1.  [Record the narration](#record-the-narration)
1.  [Edit in Premiere](#edit-in-premiere)
1.  [Captions and export](#captions-and-export)
1.  [Upload](#upload)
1.  [Quality checks](#quality-checks)
1.  [Sources](#sources)

## Rules for the video

- **Five to seven minutes, public on YouTube.** Each 30 seconds over 7:00 costs 1 point ([deliverables](/docs/BRIEF.md#preliminary-deliverables)). The script runs 6:29; keep the cut between 5:30 and 6:30.
- **The live demo runs 3:00.** It is the most important feature live: the trend data feeding the role matching and the plan.
- **Our own voices.** A team member narrates. The slide segments (V1 to V10) may play at up to 1.2× with the pitch kept; the demo segments (D1 to M1) play at 1.0×. No generated narration. Kopi's voice is heard only as the app's own sound in shot D6.
- **The team first, then the hook.** The first 13 seconds say who we are, the domain and what we built; the real job-loss numbers follow.
- **Sample means labelled.** Aina is a sample persona and the answers are demo answers; the edit tags every app shot, and the app's own "self-reported" and "sample data" labels stay readable ([content rules](/docs/DESIGN.md#content-rules)).
- **Every number has a source** in the script's [claims ledger](/docs/demo/kotak-director-script.md#claims-ledger).

## Shot list

Record each shot as its own OBS file. Lengths are the edit's slots; record a few seconds more at each end.

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

## Record the demo in OBS

### Set up once

1.  **Browser:** Chrome, a new Incognito window, so the guest session starts empty. Maximise it on a 1920 × 1080 screen, set the zoom to 100% and hide the bookmarks bar. Open the live demo: <https://kotak-alaskxntxna.replit.app>. Turn the sound on: Kopi speaks in D6.
1.  **OBS video:** Settings → Video: base and output resolution 1920 × 1080, 30 fps.
1.  **OBS output:** Settings → Output → Recording: format MKV, a hardware encoder if the list has one, quality "High Quality, Medium File Size". After recording, File → Remux Recordings turns the MKV files into MP4 for Premiere.
1.  **OBS sources:** a Window Capture of the Chrome window. Desktop Audio on, so Kopi's voice is recorded; the microphone muted for every demo take.
1.  **Pace:** move the mouse slowly and hold each state for about 1.5 seconds. If something goes wrong, keep recording, wait 2 seconds and do it again; the edit cuts it.

### Answer key

The intake is Working, the job Web Developers and the goal Stay Strong in My Job; leave the other fields as they are. Press the number keys 1 to 4; no clicking is needed. Questions 2, 4, 7, 10 and 12 are worded the other way round, so these keys give the demo answers ("Mostly" on each basic skill, "Not yet" on each advanced one).

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

Done when the roadmap, at 10 hours a week, reads "Your 35-Week Roadmap" and "80% Fit by Week 35". If it doesn't, start again in a new Incognito window.

### Takes, in recording order

1.  **D1.** Start recording on the landing page. Click Start, pick Working, type "web developer" and pick Web Developers, pick Stay Strong in My Job and continue. Stop.
1.  **D2.** Start recording on question 1. Answer questions 1 to 3 slowly from the key. Stop. Answer questions 4 to 12 off camera.
1.  **D3.** Start recording on Radar and Gaps. Rest on the radar; hover a verdict chip; scroll slowly to the Job Ads in Malaysia card and rest there. Stop. Note the ad count and the median on the card, for the narration.
1.  **D4.** Start recording on Roles That Fit. Rest on the three roles, then on the highlighted card, then open See the Maths. Stop.
1.  **Off camera:** on the Roadmap, set Hours Per Week to 10 and the Plan Start Date to Monday 2 November 2026.
1.  **D5.** Start recording at the top of the Roadmap. Rest on the title and the readiness line, then on the first step and its free link. Tick the first step and rest while its level rises. Scroll to the funding card. Stop. Untick the step.
1.  **H1.** Start recording at the top of the Roadmap. Rest for 3 seconds, then scroll slowly through the timeline to the funding card. Stop.
1.  **D6.** On What Changed, pick April 2026 off camera and let it settle. Start recording. Pick May 2026, and rest while the line moves and Kopi speaks to the end. Stop.
1.  **D7.** Start recording on Ask Kopi. Type the question, send it and wait for the whole reply. Stop. Make up to 3 takes, and keep the one that says "sample data" most plainly.
1.  **M1.** Start recording on the app's Connect Your AI page and rest for 3 seconds. Switch to an AI assistant that has Kotak's MCP address added, as that page explains. Ask "Using Kotak, which skills are rising and declining for web developers?", and rest on its tool call and its answer. Stop.

## Record the narration

Follow the script's [voiceover steps](/docs/demo/kotak-director-script.md#recording-the-voiceover): one narrator, one file per segment (`V01` to `V10`, `D1` to `D7`, `M1`), two takes each, and 10 seconds of room silence. OBS can record it: a scene with only the microphone, Desktop Audio muted. Read D3's figures from the card noted in take D3.

## Edit in Premiere

1.  **Sequence:** 1920 × 1080, 30 fps. Import the 10 deck stills (`S01` to `S10`, 1920 × 1080 PNG, exported with the deck), the remuxed MP4 takes and the narration files.
1.  **Lay out the timeline** in the script's [timing](/docs/demo/kotak-director-script.md#timing) order. Video track 1: the deck stills S01 to S05 (V1 to V5, with H1 cut into V4), the demo takes (D1 to M1), then S06 to S10 (V6 to V10). Audio track 1: the narration. Audio track 2: the footage sound, muted everywhere except Kopi's voice in D6.
1.  **Speed the slide narration.** Select the V1 to V10 narration clips, Clip → Speed/Duration → 120%, with Maintain Audio Pitch ticked. Leave D1 to M1 at 100%.
1.  **Trim to the narration.** Each slot runs from its first word to a beat after its last. Cut the waits out of the takes; keep the actions.
1.  **Move gently.** On each deck still, scale from 100% to about 106% over the segment. Where the script names a push-in, move toward that card instead. Cross Dissolve of 8 frames between segments.
1.  **Text on screen** (Essential Graphics, Atkinson Hyperlegible Next, or a plain sans if it isn't installed):
    - A chip top left on each demo shot, at least 54 px: Intake, Questions, Radar, Roles, Roadmap, What Changed, Ask Kopi, Your AI.
    - The script's callout for the shot, at least 54 px, one at a time, never over an app label.
    - "Sample persona · demo answers", at least 36 px, bottom left, on every app shot, H1 included.
1.  **Sound:** keep the narration level steady; let Kopi's line in D6 play clear, with no narration over it. No music.

## Captions and export

1.  **Captions:** Text panel → Transcribe sequence, English. Create captions of at most 42 characters and 2 lines. Fix every name against the script: Kotak, Kopi, T010NG, Aina, HRD Corp, JobStreet, MasterClass, ReSkills, e-LATiH, SDG 4.4, MCP, Claude Haiku, RunPod, Live2D, ElevenLabs, Replit. Export the captions as an SRT sidecar file.
1.  **Loudness:** in Export, Effects → Loudness Normalization: ITU BS.1770-3, target −14 LUFS, maximum true peak −1 dBTP.
1.  **Export:** H.264, 1920 × 1080, 30 fps, VBR 2 pass, target 16 Mbps; audio AAC, 48 kHz, 320 kbps. Name it `kotak-pitch-video.mp4`.

## Upload

1.  **YouTube:** upload `kotak-pitch-video.mp4`. Title: "Kotak · SDC Hackathon 2026 · Domain 1 · Team T010NG". Description: one line on Kotak, then the live demo, the repository and the deck links. Audience: "No, it's not made for kids". Add the SRT under Subtitles.
1.  **Visibility: Public**, never Unlisted or Private.
1.  **Check signed out:** open the link in an Incognito window. It plays, the captions show, and the runtime is under 7:00.
1.  **Link it:** put the YouTube link in the README's Demo Video link.

## Quality checks

Before upload, watch the whole export once with sound, and check:

- [ ] Runtime 5:30 to 6:30, and the demo at least 3:00.
- [ ] Every spoken number matches the script's claims ledger; D3's figures match the card on the recording day.
- [ ] No banned phrase in the narration, the captions or the text: "AI check-up", "12-week", "chance of", "guarantee", "AI decides", "will replace you", "certified", "real user".
- [ ] The "Sample persona · demo answers" tag is on every app shot; the "self-reported" label and Kopi's "sample data" are readable.
- [ ] Live2D and ElevenLabs are named only in V9. No issue or pull-request numbers appear anywhere.
- [ ] Kopi's voice is clear in D6, and the loudness normalisation ran.
- [ ] After upload: Public, plays signed out, captions on.

## Sources

- [Director script](/docs/demo/kotak-director-script.md): the narration, the timing and the claims ledger.
- [Pitch deck](/docs/demo/deck/kotak-pitch-deck.html) and its stills.
- [Brief: deliverables](/docs/BRIEF.md#preliminary-deliverables) and [judging](/docs/BRIEF.md#judging).
- [OBS Studio](https://obsproject.com/kb/) and [Adobe Premiere Pro](https://helpx.adobe.com/premiere-pro/user-guide.html) user guides.

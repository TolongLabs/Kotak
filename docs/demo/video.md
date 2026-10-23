# Demo video

The pitching video is a short narrated deck with a long live demo of Kotak in the middle. Two Claude Code sessions make it: a **Director** writes and edits it, and a **Recorder** films the real app with Playwright. Remotion assembles the slides, the footage and the narration into one file. The method comes from earlier projects of ours that made their demo videos the same way.

Issues: [#82][i82] (script and record) and [#84][i84] (captions and upload).

Contents:

1.  [Rules for the video](#rules-for-the-video)
1.  [Video plan](#video-plan)
1.  [Roles](#roles)
1.  [Pipeline](#pipeline)
1.  [Live-demo shot list](#live-demo-shot-list)
1.  [Recording the prototype](#recording-the-prototype)
    1.  [Harness](#harness)
    1.  [Determinism](#determinism)
    1.  [Manifest and cue sheets](#manifest-and-cue-sheets)
1.  [Assembling in Remotion](#assembling-in-remotion)
    1.  [Project](#project)
    1.  [Motion design](#motion-design)
    1.  [Sound and captions](#sound-and-captions)
1.  [Quality checks](#quality-checks)
1.  [Review gates](#review-gates)
1.  [Lessons from earlier projects](#lessons-from-earlier-projects)
1.  [Kickoff prompts](#kickoff-prompts)
    1.  [Director prompt](#director-prompt)
    1.  [Recorder prompt](#recorder-prompt)
1.  [Sources](#sources)

[i82]: https://github.com/TolongLabs/Kotak/issues/82
[i84]: https://github.com/TolongLabs/Kotak/issues/84

## Rules for the video

- **Five to seven minutes, public on YouTube.** Each 30 seconds over 7:00 costs 1 point ([deliverables][brief-deliv]). Target 6:00; the cut stays between 5:30 and 6:30 ([#82][i82]).
- **Mostly demo.** The organisers asked for a balance of slides and demo, with the demo first in priority ([context][ctx]).
- **Our own voices.** Team members narrate at 1.0× speed. No AI-generated narration and no sped-up audio ([context][ctx]; [#82][i82]).
- **Problem and user first.** The first 15 seconds say the same user, moment and reason as PRD section 2.1 and the first slide ([context][ctx]).
- **Sample means labelled.** Demo profiles are sample data, the radar keeps its "self-reported" label, and the national view keeps its sample tags ([content rules][design-content]).
- **Every number has a source.** Spoken numbers match the deck and its sources. Never state a percentage chance for a verdict ([content rules][design-content]).

[brief-deliv]: /docs/BRIEF.md#preliminary-deliverables
[ctx]: /docs/CONTEXT.md#what-this-means-for-us
[design-content]: /docs/DESIGN.md#content-rules

## Video plan

The Director may move time between parts. The live demo stays at 3:00 or more, and the total stays inside 5:30 to 6:30.

| Time      | Part                                                           | Source                                               |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| 0:00–0:45 | Hook and problem, worded as PRD section 2.1                    | Deck                                                 |
| 0:45–1:30 | How Kotak works: rules decide, AI explains; the six must-haves | Deck                                                 |
| 1:30–4:45 | **Live demo**                                                  | Recorder footage ([shot list](#live-demo-shot-list)) |
| 4:45–5:20 | Architecture, with Replit and RunPod                           | Deck                                                 |
| 5:20–5:50 | SDG 4.4 impact                                                 | Deck                                                 |
| 5:50–6:00 | Close                                                          | Deck                                                 |

**Render the whole video in Remotion.** Export each slide of the PPTX deck ([#80](https://github.com/TolongLabs/Kotak/issues/80)) as a 1920 × 1080 PNG. Then one timeline holds the slides, the narration and the demo, with one mix and one caption file. Export the slides again whenever the deck changes.

## Roles

| Role           | Who                             | Owns                                                                                                                       | Hands over                                                                      |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Director       | Claude Code session on Opus 5.5 | The script, the shot list, the Remotion edit, the mix, the captions and the quality checks                                 | The shot list to the Recorder; stills, rough cut and final files to AlaskanTuna |
| Recorder       | Claude Code session on Opus 5.5 | The recording harness, the takes, the manifest and cue sheets, and the motion components (callouts, push-ins, click rings) | Footage, the manifest and the components to the Director                        |
| AlaskanTuna    | Person, owner of #82 and #84    | The review gates, the narration takes with the team, the upload and the link check                                         | Approvals and the recorded narration                                            |
| Frontend owner | Person, owner of [#28][i28]     | Says when the frontend is frozen for final takes                                                                           | The freeze time and commit                                                      |
| Deck owner     | Person, owner of #80            | The PPTX deck                                                                                                              | The final deck                                                                  |

Name the sessions `kotak-director` and `kotak-recorder`. They message each other with SendMessage; files are the contract between them. The Recorder never drives the edit, and the Director never drives the app.

[i28]: https://github.com/TolongLabs/Kotak/issues/28

## Pipeline

1.  **Brief (Director).** Write `video/BRIEF.md`: the story, the narration for every slide and shot, and a timing table inside 5:30 to 6:30. Stop at gate G1.
1.  **Shot list (Director).** Write `video/src/data/shots.json` from the approved brief and send it to the Recorder.
1.  **Narration (team).** Team members record the approved narration in their own voices. The Director reads its timings into `video/src/data/voice.json`.
1.  **Harness and draft takes (Recorder).** Build the harness on the current app build and record draft takes, so the edit can start.
1.  **Final takes (Recorder).** When the frontend owner freezes the frontend, record every shot again on that commit.
1.  **Ingest (Director).** Convert each take to 30 fps H.264 and read its cues into `video/src/data/footage.json`.
1.  **Edit and motion (both).** The Director builds the timeline; the Recorder builds the motion components to the Director's spec.
1.  **Review.** Five stills at G2, a half-scale rough cut at G3.
1.  **Finish (Director).** Render, normalise loudness, write captions, run the checks. Stop at G4.
1.  **Upload (AlaskanTuna).** Upload as public, fix the captions by hand, then open the link from a signed-out browser before submitting ([#84][i84]).

## Live-demo shot list

The Director owns this list; the Recorder confirms each shot on the frozen build. The screens are the views in the [design system][design-screens], and the demo case is a hand-checked sample profile ([#104](https://github.com/TolongLabs/Kotak/issues/104)). Steps between shots run off camera.

| Shot | Length | Screen                           | On camera                                                                                                                | Built in |
| ---- | -----: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| D1   |   15 s | Desktop, Check-Up: Start         | Load the sample profile: a front-end developer in Kuala Lumpur who picks "show me where I could go" and health           | #59      |
| D2   |   25 s | Desktop, Check-Up: Questions     | Kopi asks two or three of the 12 can-do questions, answered with the Y and N keys                                        | #59      |
| D3   |   35 s | Desktop, Radar and Gaps          | The radar, its verdict chips and dated sources; the slow and fast toggle moves the dashed "needed by 2027" line          | #61      |
| D4   |   25 s | Desktop, Matched Roles           | Three ranked roles; tap a fit score to show its maths                                                                    | #64      |
| D5   |   30 s | Desktop, Roadmap                 | Milestones with time estimates, free resources and a finish date; tick one and watch the corner level rise               | #67      |
| D6   |   40 s | Desktop, What Changed            | Load the May 2026 snapshot: the line moves, a verdict flips, the ranking and roadmap reorder, and Kopi says what changed | #69      |
| D7   |   15 s | Desktop, National View           | The rising skills workers lack most, totals only for groups of 10 or more, and the sample tags                           | #72      |
| D8   |   10 s | Phone, 390 × 844, Radar and Gaps | The same radar on a phone                                                                                                | #61      |

The shots total 195 seconds before trimming. D6 is the key moment: the rubric names "the trend signal layer feeding role matching" as the feature to show ([live demo][live-demo]).

[design-screens]: /docs/DESIGN.md#screens
[live-demo]: /docs/ideas/0007-kotak.md#must-haves-and-the-live-demo

## Recording the prototype

### Harness

- **Files:** `video/record/playwright.config.ts` and `video/record/takes.rec.ts`, outside any test folder, so CI never records video.
- **Target:** the app's production build, the build the judges get. Record its commit hash in the manifest.
- **Browser:** Chromium, headed on WSL. The Live2D canvas needs the GPU.
- **One file per take:** set the shot up off camera, then start a screencast, act, and stop it. Playwright records with `page.screencast.start()` ([Playwright screencast][pw-screencast]); check the call against the Playwright version the harness pins:

```ts
let firstFrame: number | undefined
await page.screencast.start({
  path: `video/public/footage/raw/${shot}-take${take}.webm`,
  size: { width: 1920, height: 1080 },
  fps: 30,
  onFrame: ({ timestamp }) => {
    firstFrame ??= timestamp
  }
})

// A cue is the moment the expected state is visible, not the moment of the click.
async function cue(id: string, visible: Locator) {
  await expect(visible).toBeVisible()
  cues.push({ id, tMs: Date.now() - firstFrame!, box: await visible.boundingBox() })
}

// ...the shot's actions and cues...
await page.screencast.stop()
```

- **Phone shots:** use a 390 × 844 viewport with `deviceScaleFactor: 3` and a screencast size of 1170 × 2532. Check the real frame size with `ffprobe` on the first take.

### Determinism

- **A fresh browser context for every take.** The guest session lives in `localStorage` ([#41](https://github.com/TolongLabs/Kotak/issues/41)), so nothing carries over.
- **The same sample profile** starts every take.
- **Fixed snapshot order:** every take starts on the April 2026 snapshot. The demo switcher toggles back after D6 for repeat takes ([#69](https://github.com/TolongLabs/Kotak/issues/69)).
- **Fixed words:** the demo roles run from the pre-warmed answer and audio caches ([#43](https://github.com/TolongLabs/Kotak/issues/43); [#46](https://github.com/TolongLabs/Kotak/issues/46)), so Kopi says the same lines in every take.
- **Fix the clock:** `page.clock.setFixedTime('2026-10-24T09:00:00+08:00')`, so the roadmap's finish dates stay the same across takes.
- **Same build for every final take.** Re-record every shot after any frontend change.

### Manifest and cue sheets

The Recorder writes `video/public/footage/manifest.json`. Coordinates are CSS pixels of the take's viewport.

```json
{
  "commit": "a1b2c3d",
  "takes": [
    {
      "shot": "D6",
      "take": 2,
      "status": "ok",
      "file": "raw/D6-take2.webm",
      "viewport": { "width": 1920, "height": 1080 },
      "fps": 30,
      "cues": [{ "id": "verdict-flip", "tMs": 6120, "box": { "x": 812, "y": 404, "width": 520, "height": 48 } }]
    }
  ]
}
```

- Agree the cue ids with the Director before recording. They come from `shots.json`.
- Mark a bad take `"failed"`. Never overwrite or delete a take; the ingest picks the newest `"ok"` take.

[pw-screencast]: https://playwright.dev/docs/api/class-screencast

## Assembling in Remotion

### Project

- **Where:** a `video/` folder at the root of this repository, with its own `package.json`, outside the app. Pin Remotion 4.0.530, the version our earlier projects used. Run `bun install` inside `video/`.
- **Keep it out of the submission repository.** If any video code moves there, declare it as pre-existing work ([PRD section 6.1](/docs/PRD.md#61-pre-existing--prior-owned-work)).
- **Ignore media in Git:** `video/out/`, `video/public/footage/`, `video/public/voice/` and `video/public/music/`. Commit the code, the brief, `shots.json` and the data JSON.
- **Port from the earlier projects:** the frame and keyframe helpers, the timeline layout, the cue windows, the subtitle and SRT builders, the music envelope, and the loudness and QA scripts. Leave out their voice-generation scripts: the narration is ours.
- **Ingest:** convert each take to constant 30 fps H.264 before the edit:

```shell
ffmpeg -i raw/D6-take2.webm -vf fps=30 -c:v libx264 -crf 16 -pix_fmt yuv420p -an D6-take2.mp4
```

- **Compositions:** `Main` (the whole video, 1920 × 1080, 30 fps), `MainNoMusic`, `Demo` (the live demo alone, for review) and one preview per shot.

### Motion design

- **The app is the star.** Show the app window inset on a calm background, about 0.86 scale, with room for one callout beside it. The phone shot sits in a plain phone frame.
- **Guide the eye.** A gentle push-in, about 1.12×, toward the cue's box at each key action, and a ring at the click point.
- **Chapter chip per shot:** Intake, Questions, Radar, Roles, Roadmap, What Changed, National View.
- **One callout per shot,** five words at most, for example "The data moved the line" in D6.
- **Motion rules:** deterministic by frame, eased in and at rest; no bounce, whip-pan or smear. Cut on the narration.
- **Look:** Atkinson Hyperlegible Next and the colour tokens in the [design system](/docs/DESIGN.md). Overlay text is at least 54 px.
- **Never cover a label or a source:** the "self-reported" label, the sample tags and the dated source lines stay visible.

### Sound and captions

- **Team voices.** Team members record the narration in their own voices, at 1.0× speed.
- **Kopi's in-app voice is product audio.** It plays inside demo shots under the narration and never replaces it.
- **Music is optional.** If used, duck it 12 dB under the narration and also render a version without music, in case YouTube claims the track.
- **Loudness:** −14 LUFS integrated and at most −1 dBTP true peak.
- **Captions:** an English SRT built from the script and the narration timings, then fixed by hand before upload ([#84][i84]).

## Quality checks

Automated, in the QA script:

- The whole video runs 330 to 390 seconds, and the live demo at least 180 seconds.
- Loudness is within 0.7 LU of −14 LUFS, and true peak is at most −1 dBTP.
- The narration and captions contain no banned phrase: "chance of", "guarantee", "AI decides", "will replace you", "certified", "real user". The Director extends the list.
- The Recorder's harness confirms the "self-reported" label on every radar cue and the sample tags on every national-view cue.
- Overlay text is at least 54 px.

By hand, before upload:

- Every spoken number matches the deck and its source.
- A team member watches the whole video once, with sound.

## Review gates

AlaskanTuna approves each gate. Every gate finishes before the upload in [#84][i84]; the submission deadline is 7:59:59 AM on Sunday 25 October 2026 ([deadlines](/docs/BRIEF.md#deadlines)).

| Gate | AlaskanTuna approves                              |
| ---- | ------------------------------------------------- |
| G1   | The brief, the shot list and the narration script |
| G2   | Five stills from the edit                         |
| G3   | A half-scale rough cut                            |
| G4   | The final files, after the automated checks       |

- **Start the final render early.** An earlier project's renderer took about an hour for a 98-second video with layered scenes; this video is almost four times longer.
- **Final takes need the frozen frontend.** If the freeze slips, record on the latest `main` and note the commit.

## Lessons from earlier projects

- **Cut on cue windows, not one long take per screen.** One first edit ran 138 seconds against a 119.5-second cap.
- **Actions run ahead of the screen.** Taps showed on screen 0.8 to 1.7 seconds after the logged time. Log a cue when its state is visible, then check it on a still.
- **Raw captures can drop still frames.** Convert to constant 30 fps before the edit.
- **A UI change means new takes.**
- **Agree the contract first:** cue ids, time base, coordinate scale and file paths, before either session builds on them.
- **Label every render** with its version, its source takes and its review state, so notes map to a cut.

## Kickoff prompts

Start each session in one shared worktree, so the main checkout stays free:

```shell
git worktree add -b video/edit ../kotak-video origin/main
```

The Director owns everything in `video/` except `video/record/` and `video/src/motion/`, which the Recorder owns. Only the Director runs Git. When you start a session, add the local path of the earlier project's video folder and its brief to the prompt.

### Director prompt

```text
You are kotak-director, the Director of the Kotak pitching video (issues #82 and #84).
Read docs/demo/video.md fully. Then read docs/PRD.md section 2.1, docs/PRODUCT.md,
docs/DESIGN.md, docs/CONTEXT.md "What this means for us", docs/ideas/0007-kotak.md
"Must-haves and the live demo", and the slide stills exported from the PPTX deck (#80).

You own the script, video/src/data/shots.json, the Remotion project in video/, the
mix, the captions and the quality checks. The Recorder session (kotak-recorder) films
the app; you never drive the app yourself. Team members record the narration; never
generate a voice.

Reference: the earlier project's video folder and brief at <paths>. Port its timing,
caption, audio and QA modules; don't copy its story or look.

Steps: 1) write video/BRIEF.md and stop at gate G1 for AlaskanTuna; 2) write shots.json
and send it to the Recorder; 3) scaffold video/ and ingest the recorded narration;
4) ingest the Recorder's takes; 5) build the edit; 6) stills (G2), rough cut (G3),
final (G4).

Rules: claim nothing the deck can't source; keep every sample view labelled; commit
code and data only, never media; open a pull request per gate.
```

### Recorder prompt

```text
You are kotak-recorder, the Recorder and motion designer for the Kotak pitching video
(issue #82). The Director is kotak-director; it owns the script and the edit.

Read docs/demo/video.md fully, then the app's routes and screens for the shots in
shots.json, and docs/DESIGN.md. Read the Playwright screencast docs before using the API.

You own video/record/ (the harness) and video/src/motion/ (callouts, push-ins, click
rings, chapter chips), plus the footage in video/public/footage/. Don't run Git.

Steps: 1) build the harness and record draft takes of every shot in shots.json on the
current build; 2) send the Director the manifest path and any shot you could not
record, with the reason; 3) build the motion components to the Director's spec;
4) when the frontend owner announces the freeze, record every shot again on that commit.

Rules: never change the app to make a shot work; report the gap instead. Keep failed
takes, marked failed. Confirm the "self-reported" label and the sample tags at every cue.
```

## Sources

- [Preliminary deliverables][brief-deliv] and [what this means for us][ctx], item 9 on the video.
- [Design system: screens][design-screens] and [content rules][design-content].
- [Playwright screencast][pw-screencast] and [Playwright videos](https://playwright.dev/docs/videos).
- [Remotion documentation](https://www.remotion.dev/docs/).

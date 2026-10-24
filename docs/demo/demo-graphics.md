# Demo graphics

The live demo is the crux of the video, so it carries its own graphics: act banners that tell the story as problem, solution and outcome, a progress bar that shows where Aina is, callouts that say why each screen matters, and rings, arrows and zooms that point at the proof. Every graphic is a transparent PNG in [`graphics/png`](graphics/png), drawn in the deck's design system. Shot IDs and timecodes follow [the director script](/docs/demo/kotak-director-script.md#live-demo).

Contents:

1.  [The story in three acts](#the-story-in-three-acts)
1.  [The graphics pack](#the-graphics-pack)
1.  [Premiere setup](#premiere-setup)
1.  [Motion recipes](#motion-recipes)
1.  [Cue sheet](#cue-sheet)
1.  [If time runs short](#if-time-runs-short)

## The story in three acts

| Act      | Shots      | Time      | The question it answers                                  |
| -------- | ---------- | --------- | -------------------------------------------------------- |
| Problem  | D1, D2, D3 | 1:47–2:53 | Which of Aina's skills is AI changing, and is it hiring? |
| Solution | D4, D5     | 2:53–3:37 | Which role fits her, and what does she learn first?      |
| Outcome  | D6, D7, M1 | 3:37–4:47 | Does the plan stay true when the data moves?             |

Each act opens with its banner. The progress bar stays on for the whole demo and shows the act, the step and the steps still to come.

## The graphics pack

All files are in [`graphics/png`](graphics/png). [`graphics/overlays.html`](graphics/overlays.html) is their source: open it in Chrome to preview every graphic on a checkerboard.

| Kind        | Files                                                 | Size                  | Use                                                             |
| ----------- | ----------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Act banners | `act-1-problem`, `act-2-solution`, `act-3-outcome`    | 1920×1080, top left   | 3 seconds at the start of each act                              |
| HUD         | `hud-1` to `hud-8`                                    | 1920×1080, bottom bar | One per step, on for the whole step                             |
| Callouts    | `c-d1-who` to `c-m1-mcp`, numbered 1 to 17            | 1920×1080, right side | One at a time, on the narration words below                     |
| Blank card  | `c-blank`                                             | 1920×1080, right side | Type over it in Premiere when a number changes on recording day |
| Results     | `r-d5-plan`, `r-d6-moved`                             | 1920×1080, centre     | 3 seconds over a dimmed frame                                   |
| Rings       | `ring-wide`, `ring-box`, `ring-small`, `ring-circle`  | Cropped               | Move and scale over the element the narration names             |
| Arrows      | `arrow-right`, `arrow-down`, `arrow-left`, `arrow-up` | 220×220               | Point at a control the narration names                          |

The full-frame graphics drop in at the default position; only rings and arrows need placing.

## Premiere setup

1.  Record the demo in OBS at 2560×1440 if the screen allows it, so a zoom to 133% stays sharp. On a 1080p screen, record at 1920×1080 and keep zooms at 120% or below.
1.  Use a 1920×1080, 30 fps sequence. Scale a 1440p capture to 75%.
1.  Import the whole `graphics/png` folder.
1.  Stack the tracks: V1 the capture, V2 a black Color Matte for dimming, V3 rings and arrows, V4 callouts and results, V5 act banners, V6 the HUD.
1.  Keep at most one callout and one ring on screen at a time, and never cover Kopi's speech bubble while Kopi speaks in D6.

## Motion recipes

Set every keyframe pair to Ease In and Ease Out (right-click the keyframe, then Temporal Interpolation).

1.  **Zoom.** On the capture, add Video Effects → Distort → Transform. Clear "Use Composition's Shutter Angle" and set Shutter Angle to 180 for motion blur. Keyframe Scale from 100 to 125 and Position onto the target over 15 frames, hold, then return over 15 frames.
1.  **Callout.** Add Transform: Position X 60 pixels to the right of its rest point and Opacity 0, moving to rest and 100 over 10 frames. Fade Opacity out over 6 frames.
1.  **Ring.** Scale 85 to 100 and Opacity 0 to 100 over 6 frames; fade out over 6 frames.
1.  **Act banner.** Position X 700 pixels to the left, sliding to rest over 12 frames; hold 2.5 seconds; Cross Dissolve out over 8 frames.
1.  **HUD.** Cross Dissolve over 6 frames from one step's HUD to the next.
1.  **Result card.** Raise the V2 matte (#10100B) to 45% Opacity for the card's 3 seconds. The card scales from 92 to 100 with Opacity in over 10 frames.

## Cue sheet

Times are where the narration lands in the 6:46 cut. Cut each graphic on its words, not on the clock.

| Time | Shot | Graphic                   | On the words                                   | Pointer and motion                                   |
| ---- | ---- | ------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| 1:47 | D1   | `act-1-problem`, `hud-1`  | Shot start                                     | Banner slides in; HUD stays on                       |
| 1:51 | D1   | `c-d1-who`                | "who she is: working, as a web developer"      | `ring-wide` on Web Developers as it is picked        |
| 2:01 | D2   | `hud-2`                   | Shot start                                     | Zoom 120% on the question card                       |
| 2:03 | D2   | `c-d2-questions`          | "twelve can-do questions"                      | `ring-box` on the answer buttons                     |
| 2:11 | D2   | `c-d2-reversed`           | "worded the other way round"                   | None                                                 |
| 2:19 | D3   | `hud-3`, `c-d3-radar`     | "Her radar compares six skills"                | `ring-circle` on the radar; zoom 120%                |
| 2:29 | D3   | `c-d3-rising`             | "Technical documentation gets rising"          | `ring-small` on its Rising chip                      |
| 2:35 | D3   | `c-d3-declining`          | "Web site building gets declining"             | `ring-small` on its Declining chip                   |
| 2:43 | D3   | `c-d3-jobs`               | "tied to real hiring"                          | `ring-box` on the Job Ads in Malaysia card           |
| 2:53 | D4   | `act-2-solution`, `hud-4` | Shot start                                     | Banner slides in                                     |
| 2:57 | D4   | `c-d4-fit`                | "ranks the roles she fits"                     | `ring-box` on the highlighted role card              |
| 3:03 | D4   | `c-d4-maths`              | "See the Maths"                                | `arrow-right` at See the Maths                       |
| 3:09 | D5   | `hud-5`, `c-d5-order`     | "most fit per hour"                            | Zoom 120% on the step list                           |
| 3:17 | D5   | `r-d5-plan`               | "eighty per cent fit by week thirty-five"      | Dim to 45%; result card 3 seconds                    |
| 3:24 | D5   | `c-d5-free`               | "its hours and a free search link"             | `ring-wide` on the first step's hours and link       |
| 3:32 | D5   | None                      | "the funding card"                             | `ring-box` on the funding card                       |
| 3:37 | D6   | `act-3-outcome`, `hud-6`  | Shot start                                     | Banner slides in                                     |
| 3:41 | D6   | `c-d6-same`               | "Same job. Same twelve answers."               | `ring-small` on the April 2026 selector              |
| 3:49 | D6   | `c-d6-april`              | "every skill read Unknown"                     | Zoom 120% on the radar                               |
| 3:56 | D6   | `c-d6-may`                | "six verdicts flip"                            | `ring-wide` on "New data landed. Six skills changed" |
| 4:02 | D6   | `c-d6-step`               | "drops from step four to last"                 | `arrow-down` beside Web site building as it moves    |
| 4:05 | D6   | None                      | Kopi speaks, about 8 seconds                   | Clear the frame; nothing over Kopi                   |
| 4:13 | D6   | `r-d6-moved`              | "The trend data drives the plan"               | Dim to 45%; result card 3 seconds                    |
| 4:17 | D7   | `hud-7`, `c-d7-kopi`      | "says plainly that these rows are sample data" | `ring-wide` on the words "sample data"               |
| 4:29 | M1   | `hud-8`                   | Shot start                                     | `ring-wide` on the MCP address                       |
| 4:34 | M1   | `c-m1-mcp`                | "Kotak is the tool a chatbot calls"            | Hold the callout to the end of the shot              |

`c-d3-jobs` reads "About 170 ads, median RM6,300, as of 24 Oct 2026". If the card shows other numbers on recording day, use `c-blank` and type the new ones with Premiere's Type tool in Atkinson Hyperlegible Next.

## If time runs short

Keep, in this order: the HUD, the three act banners, the two result cards, and the D3 and D6 callouts with Cross Dissolve. Drop the rings and zooms first, then the other callouts.

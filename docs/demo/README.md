# Demo

Everything the team shows judges and mentors: the live final pitch, the preliminary pitching video, and their decks. Each round has its own folder, with its own decks and the assets they load. The decks use Kotak's colours and type.

Contents:

1.  [Layout](#layout)
1.  [Final pitch](#final-pitch)
1.  [Preliminary round](#preliminary-round)
1.  [See also](#see-also)

## Layout

```text
docs/demo/
├── final/    the live final pitch on 1 November 2026 and its deck
└── prelim/   the preliminary pitching video, its graphics, the preliminary deck and the mentor deck
```

## Final pitch

- [`final/pitch-script.md`](final/pitch-script.md): the word-for-word script, slide by slide, with timings and the checks to run before rehearsal. Rehearse from this one; it wins over the Q&A sheet.
- [`final/qa-cheat-sheet.md`](final/qa-cheat-sheet.md): the judges' likely questions, each with a one-sentence answer, where to show it and who answers first.
- [`final/kotak-pitch-deck.html`](final/kotak-pitch-deck.html): the pitch deck's source, 9 slides, with the pitch script as its speaker notes. It loads its images from `final/assets/`. The [`.pptx`](final/kotak-pitch-deck.pptx) and [`.pdf`](final/kotak-pitch-deck.pdf) beside it are its exports, with the speaker notes in the `.pptx`.

## Preliminary round

- [`prelim/director-script.md`](prelim/director-script.md): the video's script: the narration for every segment, the timing, the claim guardrails and the claims ledger.
- [`prelim/video.md`](prelim/video.md): the how-to: the rules, the shot list with the demo answer key, the recording harness, the demo segment, the Premiere edit, the captions and the public upload.
- [`prelim/demo-graphics.md`](prelim/demo-graphics.md): the demo's on-screen graphics and when each appears. Their source is [`prelim/graphics/overlays.html`](prelim/graphics/overlays.html), exported to `prelim/graphics/png/`; `video/scripts/day-card.ts` reads from there.
- [`prelim/kotak-pitch-deck.pdf`](prelim/kotak-pitch-deck.pdf) and [`.pptx`](prelim/kotak-pitch-deck.pptx): the preliminary deck, exported on 24 October. Its HTML source became the final deck.
- [`prelim/kotak-mentor-deck.html`](prelim/kotak-mentor-deck.html): the 5-slide deck for the online mentor session on 23 October.
- `prelim/assets/`: the images the mentor deck and the overlays load, and stills from earlier deck versions.

## See also

- [Final plan](/docs/analyses/final-plan.md): the bet, the score path and the questions to drill for the final
- [Final deliverables](/docs/BRIEF.md#final-deliverables): the deck, the report and the rules for each
- [Design system](/docs/DESIGN.md) and [product principles](/docs/PRODUCT.md#design-principles)

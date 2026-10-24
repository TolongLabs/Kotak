# Demo

How the team makes the submission media: the pitching video and the pitch deck. [`kotak-director-script.md`](kotak-director-script.md) holds the video's words and timing, [`video.md`](video.md) says how a Playwright harness films the demo, Remotion assembles the demo segment and Premiere Pro edits the whole video, [`demo-graphics.md`](demo-graphics.md) gives the live demo's on-screen graphics and when each appears, and [`example-pitch-deck.html`](example-pitch-deck.html) is the design reference for the deck.

Contents:

1.  [Demo video](#demo-video)
1.  [Example deck](#example-deck)
1.  [See also](#see-also)

## Demo video

[`kotak-director-script.md`](kotak-director-script.md) is the pitching video's script: the narration for every segment, the timing, the claim guardrails and the claims ledger. [`video.md`](video.md) is the how-to: the rules, the shot list with the demo answer key, the recording harness, the demo segment, the Premiere edit, the captions and the public upload.

## Example deck

[`example-pitch-deck.html`](example-pitch-deck.html) is a finished 11-slide deck from an earlier hackathon of ours, with its names replaced by placeholders. Use it as the reference for layout and visual assets. Our deck, [`deck/kotak-pitch-deck.html`](deck/kotak-pitch-deck.html), exports to PPTX and PDF in Kotak's colours and type ([design system](/docs/DESIGN.md)). Open the example in Chrome or Edge, and move between slides with the arrow keys or the controls that show when you move the mouse. Press N for its presenter notes.

Copy these from it:

- **One family of visual assets**: 3D renders of white clay objects with a single accent colour, on white. The same style serves as the large art panels and the small card icons. Use Kotak's yellow, `color/accent/box`, as the accent.
- **A split layout**: text on the left, a large art panel or screenshot on the right.
- **Numbers as cards**: an icon, a big number, a one-line claim and its source in a monospace line underneath.
- **Steady chrome**: the logo top left and a "02 / 11 · Section" tag on every slide.
- **A dark closing slide** with QR codes for the code and the live demo.

Its images are embedded in the HTML as base64, so the file needs nothing else. Make our own renders in the same style.

## See also

- [Preliminary deliverables](/docs/BRIEF.md#preliminary-deliverables): the deck, the video and the rules for each
- [Design system](/docs/DESIGN.md) and [product principles](/docs/PRODUCT.md#design-principles)

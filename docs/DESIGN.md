# Kotak design system

These are the visual rules for Kotak's web app: colour, type, layout, components and content. The [Figma file][figma] holds the full design system and every mockup. For anything visual, this file wins over the code.

Contents:

1.  [Source of truth](#source-of-truth)
1.  [Colour](#colour)
    1.  [Semantic colour tokens](#semantic-colour-tokens)
    1.  [SDG colours](#sdg-colours)
    1.  [Colour rules](#colour-rules)
1.  [Typography](#typography)
1.  [Spacing, radius and surfaces](#spacing-radius-and-surfaces)
1.  [Layout](#layout)
1.  [Components](#components)
1.  [Iconography](#iconography)
1.  [Content rules](#content-rules)
1.  [Kopi, the counsellor](#kopi-the-counsellor)
1.  [Motion](#motion)
1.  [Accessibility](#accessibility)
1.  [Screens](#screens)
1.  [See also](#see-also)

## Source of truth

- The [Figma file][figma] has seven pages: Cover, Foundations, Brand, Iconography, Components, Mockups and Archive · v0.1.
- Build screens from the Mockups page. Each view has a phone frame (390 px) and a desktop frame (1440 px) with the same content.
- When the code and this file disagree, this file wins. When this file and Figma disagree, ask AlaskanTuna, who owns the design.
- Open design work is tracked in [#31](https://github.com/TolongLabs/sdc-hack/issues/31).
- Use the semantic tokens below, never raw hex values. The primitive scales (ink, box, green, amber, red and sdg) sit underneath them.

## Colour

### Semantic colour tokens

| Token                       | Light            | Dark             | Use                                         |
| --------------------------- | ---------------- | ---------------- | ------------------------------------------- |
| `color/bg/default`          | `#FFFFFF`        | `#10100B`        | Page background                             |
| `color/bg/panel`            | `#F8F7F2`        | `#1B1A13`        | Panels, sidebar, quiet cards                |
| `color/text/primary`        | `#191812`        | `#F3F2ED`        | Text, lines and icons ("ink")               |
| `color/text/muted`          | `#595851`        | `#ACABA3`        | Secondary text                              |
| `color/border/subtle`       | `#D8D8D2`        | `#37362F`        | Card borders and dividers                   |
| `color/border/control`      | `#828078`        | `#6A6961`        | Input and control borders                   |
| `color/accent/box`          | `#F6D732`        | `#EFD127`        | Primary actions                             |
| `color/accent/box-hover`    | `#E2C21F`        | `#F6D732`        | Hover on primary actions                    |
| `color/accent/on-box`       | `#191812`        | `#191812`        | Text on the yellow accent                   |
| `color/accent/on-box-muted` | `#595851`        | `#595851`        | Muted text on yellow surfaces               |
| `color/state/success`       | `#1D7D3E`        | `#5AC576`        | Success messages                            |
| `color/state/warning`       | `#B15300`        | `#F39E4C`        | Warnings                                    |
| `color/state/error`         | `#C9302D`        | `#F66D62`        | Errors                                      |
| `color/focus/ring`          | `#191812`        | `#EFD127`        | Focus rings                                 |
| `color/radar/role`          | `#191812`        | `#F3F2ED`        | The dashed "needed by 2027" line            |
| `color/radar/you`           | `#F6D732`        | `#EFD127`        | The user's line on the radar                |
| `color/radar/you-fill`      | `#FAE784`        | `#96841C`        | The user's shape and the Strengths quadrant |
| `color/surface/glass`       | `#FFFFFF` at 72% | `#10100B` at 72% | Glass islands, always with background blur  |

### SDG colours

SDG chips use the official UN colours. The text is ink (`#191812`) or white per goal, and every pair meets 4.5:1.

| Goal                           | Colour    | Text  |
| ------------------------------ | --------- | ----- |
| SDG 1 No Poverty               | `#E5243B` | White |
| SDG 2 Zero Hunger              | `#DDA63A` | Ink   |
| SDG 3 Good Health              | `#4C9F38` | Ink   |
| SDG 4 Quality Education        | `#C5192D` | White |
| SDG 5 Gender Equality          | `#FF3A21` | Ink   |
| SDG 6 Clean Water              | `#26BDE2` | Ink   |
| SDG 7 Clean Energy             | `#FCC30B` | Ink   |
| SDG 8 Decent Work              | `#A21942` | White |
| SDG 9 Industry and Innovation  | `#FD6925` | Ink   |
| SDG 10 Reduced Inequalities    | `#DD1367` | White |
| SDG 11 Sustainable Cities      | `#FD9D24` | Ink   |
| SDG 12 Responsible Consumption | `#BF8B2E` | Ink   |
| SDG 13 Climate Action          | `#3F7E44` | White |
| SDG 14 Life Below Water        | `#0A97D9` | Ink   |
| SDG 15 Life on Land            | `#56C02B` | Ink   |
| SDG 16 Peace and Justice       | `#00689D` | White |
| SDG 17 Partnerships            | `#19486A` | White |

### Colour rules

- Never use yellow for text. On white, give every yellow shape an ink outline, because yellow alone is 1.4:1.
- Verdicts use ink icons and words, never red, amber or green.
- Use the state colours for messages only: success, warning and error.
- Every card, container and CTA has a solid or glass background. Never use a see-through or half-transparent one.
- Use glass only for floating islands: the landing nav, the app top bars and sticky action bars. Glass always pairs the `color/surface/glass` fill with a 24 px background blur and a 1 px `color/border/subtle` line.

## Typography

All three families are on Google Fonts:

- Atkinson Hyperlegible Next for interface text and data.
- Atkinson Hyperlegible Mono for sources, dates, levels and citation numbers.
- Shantell Sans for Kopi's speech only.

| Style         | Font                 | Size / line height | Letter spacing | Use                     |
| ------------- | -------------------- | ------------------ | -------------- | ----------------------- |
| Display/XL 72 | Next ExtraBold       | 72 / 76            | -2%            | Landing headlines       |
| Display/L 48  | Next ExtraBold       | 48 / 54            | -1.5%          | Landing headlines       |
| Display/33    | Next ExtraBold       | 33 / 36            | -1%            | Landing headlines       |
| Title/L 28    | Next Bold            | 28 / 32            | -0.5%          | Page titles             |
| Title/M 23    | Next Bold            | 23 / 28            | 0              | Page and section titles |
| Title/S 19    | Next SemiBold        | 19 / 24            | 0              | Card titles             |
| Body/L 18     | Next Regular         | 18 / 28            | 0              | Landing body text       |
| Body/M 16     | Next Regular         | 16 / 24            | 0              | Body text               |
| Body/S 14     | Next Regular         | 14 / 20            | 0              | Secondary text          |
| Label/L 16    | Next SemiBold        | 16 / 24            | 0              | Buttons and list titles |
| Label/M 14    | Next SemiBold        | 14 / 20            | 0              | Labels                  |
| Label/S 12    | Next Medium          | 12 / 16            | 2%             | Chips and captions      |
| Mono/M 14     | Mono Medium          | 14 / 20            | 0              | Data values             |
| Mono/S 12     | Mono Regular         | 12 / 16            | 0              | Sources, dates, levels  |
| Cat/Speech 18 | Shantell Sans Medium | 18 / 26            | 0              | Kopi's speech box       |

The smallest text is 12 px.

## Spacing, radius and surfaces

- Spacing sits on a 4 px grid: 4, 8, 12, 16, 24, 32, 48 and 64 (`space/1` to `space/16`).
- Radius: `radius/sm` (6) for controls, `radius/md` (12) for cards and the speech box, `radius/full` for chips, pills and the phone top bar. The landing's large showcase cards use a 24 px radius.
- Use borders, not shadows. Cards get a 1 px `color/border/subtle` line. Only popovers get `Elevation/Popover`: 0 8 24, ink at 12%. Popovers are menus, the date picker, tooltips and the data chip's About This Data.
- Kopi's speech box has a 2 px ink frame, like a game dialogue.

## Layout

- Phone frames are 390 px wide with 24 px side padding. Desktop frames are 1440 px wide.
- The desktop app shell has a 256 px sidebar (72 px collapsed) and a main column with 48 px padding, so content is 1088 px wide.
- The top bar is a glass island that stays at the top of the main column. It has no sound button; the mute button lives in Kopi's speech box. Its data chip opens About This Data, which names the snapshot and says whether each role's skills are AI-drafted or hand-checked; a dot on the chip marks AI-drafted skills. Pages carry no inline AI-drafted notice.
- Columns are symmetrical. Two columns are 532 + 24 + 532 px, three are equal thirds and the four stat cards are equal quarters. Cards in one row share one height.
- Results pages stack in one order: the Stepper (Check-Up flow pages only), Kopi, the page header, then the content. The Dashboard opens with its greeting, then Kopi and the Next Step. Loading, error and no-job states lead with their message instead.
- Sticky parts: the top bar everywhere; on desktop, the radar column on the Radar and What Changed pages and the reasoning column on the Roadmap page; on phone, the main action bar at the bottom.
- Questions and the AI Unavailable state centre a single column. Every other app page and state uses the full content width, including Check-Up Start, No Job Match, and the empty, loading and error states.

## Components

Every component lives on the Components page. Build each one as a custom component; never ship a browser-default control.

- **Inputs and controls**: CTA, Button, Icon Button, Link, Text Field, Password Field, Search Field, Textarea, Select with Select Menu, Date Picker, Checkbox, Radio, Switch, Slider, Tabs, Accordion Item, a thin Scrollbar and Cursor (arrow and not-allowed).
- **Feedback**: Banner, Toast, Tooltip, Modal Dialog, Progress, Progress Bar, Spinner and Page Transition.
- **App shell**: Topbar, Phone Top Bar, Sidebar, Sidebar Brand, Nav Item, Nav Island and Avatar.
- **Kotak parts**: Counsellor, Cat Dialogue, Voice Toggle, Verdict Chip, Scenario Switch, Future Skills Radar, Skills SWOT, Skill Row, Gap Card, Reasoning, Citation, Source Reference, Role Card, Roadmap Step, Roadmap Timeline, Readiness Graph, What Changed Card, SDG Chip, Choice Card, Job Suggestions and Action Menu.
- **Legacy from v0.1**: App Bar, Milestone, SDG tag and Source line. Don't use them in new screens.

## Iconography

- Use Lucide icons (ISC licence), drawn as ink strokes at 16, 18, 20 or 24 px.
- The Iconography page holds the 61 icons in use. Don't mix in icons from other sets.

## Content rules

- Headings, subheadings, card titles and buttons use Title Case. Body text and helper text use sentence case.
- Five verdict words, each with an icon and a fixed meaning:
  - **Rising**: demand is growing; learn to work with AI here.
  - **Steady**: little change is expected in the next 12 months.
  - **Declining**: demand is falling; spend fewer hours here.
  - **Split**: the sources or the two scenarios disagree, so the user gets two plans.
  - **Unknown**: there isn't enough data yet, and Kotak says so instead of guessing.
- Never show a percentage chance for a verdict.
- Every claim cites its source with a numbered citation, such as `[2]`, in mono. Each number links to a Source Reference that names the source, the table or rows used, and the read date.
- Explanations use the Reasoning block: the heading "Why Kopi Says This", two sentences written from the cited rows only, and the fixed footer "Fixed rules set the verdict. Claude wrote these two sentences from the cited rows only."
- Label sample data as sample data. Never invent jobs, numbers or statistics.
- Voice: playful, never childish; curious, not pushy; honest about doubt. Write "Split: the sources disagree, so here are two plans.", not "87% chance this skill will grow."

## Kopi, the counsellor

- Kopi is a black cat who opens the box with the user, one question and one verdict at a time. The name comes from kopi-O, Malaysia's black coffee.
- Kopi uses the Live2D sample model Hijiki (© Live2D Inc.). Credit the model in the app footer and in the technical and tools declaration with the notice [Live2D designates](https://www.live2d.com/en/learn/sample/model-terms/) for apps, word for word: "This content uses sample data owned and copyrighted by Live2D Inc. The sample data are utilized in accordance with terms and conditions set by Live2D Inc. This content itself is created at the author’s sole discretion."
- Kopi has six poses, one per moment: Idle (start, waiting), Asking (a yes/no question), Thinking (verdicts loading), Happy (plan ready, milestone done), Worried (error or missing data) and Explaining (reading a verdict out).
- Kopi speaks out loud through ElevenLabs text to speech. The mute button sits in the speech box.
- The logo is a black cat peeking out of an open yellow box, with "kotak" in lowercase Atkinson Hyperlegible Next ExtraBold. Never recolour the cat, and keep clear space of half the mark's height on every side.

## Motion

- Page transition: the box opens in three beats, Kopi reads the line out loud, then the page fades in. With reduced motion, use a 200 ms fade instead.
- Kopi's entrance: once per page visit, Kopi assembles from ASCII glyphs sampled from the pose art. Rows rise from the bottom over about 0.6 s, each glyph scrambling in the text colour before it settles in the art's colour; the art then takes over and Live2D fades in on top, fitted to the art's frame. With reduced motion, Kopi appears as the still art at once.
- The live demo moment: when the newer data loads, verdict chips change, the dashed radar line moves, SWOT items change quadrant and the roadmap reorders. Animate each change so a judge can follow it.
- Keep all other motion to hover and focus states.

## Accessibility

- Every text pair meets WCAG 2.2 AA: 4.5:1 for text and 3:1 for control borders. Ink on white is 17.7:1.
- Focus rings use `color/focus/ring`: ink in light mode, yellow in dark mode.
- Disabled fields show a lock icon and the not-allowed cursor, as on the pilot's guest-only Auth page.
- The Questions page takes the Y and N keys on desktop.
- Respect reduced motion, and keep Kopi's mute button one tap away.

## Screens

The Mockups page has 13 views, each as a phone and desktop pair. Every pair shows the same content; only the layout adapts.

1.  Landing
2.  Auth: guest-only sign-in for the pilot
3.  Dashboard
4.  Check-Up: Start
5.  Check-Up: Questions
6.  Radar and Gaps
7.  Matched Roles
8.  Roadmap
9.  What Changed: the live demo moment
10. National View: a public page for TalentCorp, HRD Corp and MOHE
11. Page Transition
12. State: AI Unavailable
13. State: No Job Match

## See also

- [PRODUCT.md](PRODUCT.md): users, principles and voice.
- [Kotak solution design](/docs/ideas/0007-kotak.md)
- [Figma file: Kotak · Design System & Mockups][figma]

[figma]: https://www.figma.com/design/XumA0GuVqzPE3TyhWo0y6B/Kotak-%C2%B7-Design-System---Mockups?node-id=2-67&t=ff4OM0izfoA7aORx-1

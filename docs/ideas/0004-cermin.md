# Cermin

Cermin, Malay for mirror, reads a person's exported Claude or ChatGPT history and maps each conversation to O\*NET work tasks, the way the Anthropic Economic Index does for whole countries. It then shows which job their AI use says they are already growing into. The intake is what someone does with AI, not what their CV claims. See the [ranking](0000-ranking.md) for its place.

Contents:

1.  [User and moment](#user-and-moment)
1.  [How it works](#how-it-works)
1.  [The six must-haves](#the-six-must-haves)
1.  [Why it stands out](#why-it-stands-out)
1.  [Why people would use it](#why-people-would-use-it)
1.  [Live demo for the preliminary](#live-demo-for-the-preliminary)
1.  [Build plan to 25 October](#build-plan-to-25-october)
1.  [Hardest risk and fallback](#hardest-risk-and-fallback)
1.  [Scores](#scores)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## User and moment

- **Primary user**: one of the Malaysian professionals who use AI tools at work without formal training, 56% and 26% respectively ([domain file][d1-bg]). The moment comes when they update a CV, prepare for an appraisal, or wonder whether all that AI use is building a career or replacing one.
- **Second user**: an L&D lead who receives an opt-in, anonymised team summary.
- **Why now**: OpenAI's "Your Year with ChatGPT" showed that people want a recap of their AI use, but it hands out awards and a poem, not a career reading, and it launched in five English-speaking markets, not Malaysia ([TechCrunch][recap]).

[d1-bg]: /docs/sources/drive.google.com/domain-1-aiversecity.md#1-background
[recap]: https://techcrunch.com/2025/12/22/chatgpt-launches-a-year-end-review-like-spotify-wrapped/

## How it works

1.  **Export.** The user exports their history, which Claude sends as an emailed download link that expires after 24 hours ([Claude export][claude-export]); ChatGPT offers a similar export. The demo uses synthetic exports only.
2.  **Scrub and classify.** Names, emails and numbers are scrubbed first. An open-weight model on a RunPod GPU then tags each conversation with an O\*NET task and with whether the person delegated the task or worked with the AI. That mirrors the index's automation and augmentation split ([metric definitions][aei-docs]), and the chats never go to a third-party API.
3.  **Mirror.** The user sees the tasks they already do with AI and how they work with it, against Malaysia's and Singapore's figures for their occupation.
4.  **Credit only what builds skill.** A task counts towards a skill only where the person worked with the AI rather than handing the task over, because in Anthropic's study developers who learned a new library with AI scored 17% lower on a quiz than those who coded by hand, while those who also asked it conceptual questions scored well ([skill formation][skillform]). Heavy delegation is flagged, not rewarded.
5.  **Match.** Roles are ranked by how much of their task bundle the person already practises, plus skill overlap and demand flags, with the breakdown shown.
6.  **Plan.** The gap becomes free modules with real durations from the Microsoft Learn catalogue.
7.  **Recap card.** A shareable summary that names tasks and roles but no conversation content.

[claude-export]: https://support.claude.com/en/articles/9450526-how-can-i-export-my-claude-data
[skillform]: https://www.anthropic.com/research/AI-assistance-coding-skills
[aei-docs]: https://huggingface.co/datasets/Anthropic/EconomicIndex/raw/main/release_2026_06_26/data_documentation.md

## The six must-haves

| Must-have             | How Cermin meets it                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Skills profile intake | An AI chat export, scrubbed and classified, with a questionnaire for anyone without one                  |
| AI-trend signal layer | Dated Economic Index snapshots for Malaysia, Singapore and worldwide, refreshed by a script              |
| Future-role matching  | Ranked roles with the score split into tasks practised, skill overlap and demand                         |
| Reskilling pathway    | Ordered free modules with durations and a finish date                                                    |
| SDG mapping           | Tasks, skills and roles tagged to targets such as 4.4, 8.2 and 8.5                                       |
| Handling uncertainty  | Scenarios at Malaysia's and Singapore's adoption pace, and each classification shown with its confidence |

## Why it stands out

Every idea in our [field simulation][field] starts from a CV, a form, a syllabus or a roster. None takes behaviour as intake, and none applies the index's method to one person. Cermin is the only candidate whose input changes every time the user works.

[field]: /docs/research/field-simulation.md

## Why people would use it

- **Curiosity and sharing**: a recap of your own AI use is something people already open when it's offered.
- **It updates with every export**, so a monthly re-run shows drift towards or away from a target role.
- **It credits work people do with AI**, which rarely shows up on a CV, and warns when AI use is replacing their own practice.

## Live demo for the preliminary

Upload a synthetic export for a sample "marketing executive". The mirror shows their tasks, their delegate-or-collaborate mix and how it compares. Switch the trend snapshot from April to May 2026, and their standing and role ranking move, with the source and date shown.

## Build plan to 25 October

1.  **21 October**: parsers for the Claude and ChatGPT export formats; synthetic exports for three sample profiles.
2.  **22 October**: scrubber; an open model on a RunPod GPU classifies conversations into O\*NET tasks, checked by hand on a sample.
3.  **23 October**: mirror view, match score, gap and pathway; mentor session.
4.  **24 October**: deploy on a Replit Reserved VM, RunPod proof, PRD, declaration, video.
5.  **25 October, before 7:59 AM**: submit and check every link.

## Hardest risk and fallback

- **Classification can be wrong.** Show confidence, let the user correct any task, and report accuracy on a hand-labelled sample in the PRD.
- **People are wary of uploading chats.** Process on our own GPU, delete after processing, keep only task counts, and offer the questionnaire instead.
- **It only sees AI users**, who aren't the most at-risk workers. Say so, and treat Cermin as one entry point beside a plain questionnaire.

## Scores

Scores out of 5, from round 9 (ours) and the round 10 panel, three other Claude models judging blind in persona: Claude Sonnet 5.5 as the sponsor, Claude Fable 5.1 as a government official and Claude Haiku 5.5 as a technical mentor. The [ranking](0000-ranking.md#scoring-matrix) explains the method.

| Criterion            | Weight | Ours | Sponsor judge | Government judge | Technical judge |
| -------------------- | ------ | ---- | ------------- | ---------------- | --------------- |
| Innovation           | 30%    | 5    | 4             | 4                | 5               |
| Problem-solution fit | 25%    | 4    | 3             | 3                | 2               |
| Feasibility          | 25%    | 3    | 3             | 3                | 2               |
| Clarity              | 20%    | 4    | 4             | 4                | 3               |
| Actual use           |        | 4    | 3             | 3                | 3               |

- **Rubric**: 81 from us and 67.3 from the panel, 74.2 on average.
- **Uniqueness**: 5: no match in either field pass.
- **Composite**: 77.4, rank 4 of 5 finalists. All three judges picked Dividen as the winner.

What the judges attacked, and the fix we adopt:

- **No employer or data-protection officer would sanction chat uploads** (government and sponsor judges). Scrub and tag in the browser where possible, keep an occupation-only path, and never store conversation text.
- **The tagger is unvalidated** (technical judge). Hand-label 50 synthetic conversations, publish the tagger's accuracy, and keep a manual delegate-or-collaborate toggle as the fallback.
- **It reaches only AI users, mostly urban white-collar** (government judge). Pair it with a plain questionnaire, and say who it leaves out.

## Open questions

- We couldn't fetch OpenAI's export help page because of bot protection; confirm the current ChatGPT export format before relying on it.
- Would judges see chat-history intake as a privacy risk even with synthetic data? Ask the mentor.

## See also

- [Idea ranking](0000-ranking.md)
- [Field simulation](/docs/research/field-simulation.md)
- [Trend and skills data](/docs/research/trend-data.md)

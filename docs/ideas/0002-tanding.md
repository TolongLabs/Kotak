# Tanding

Tanding, Malay for a match or contest, puts a team and the latest AI models on the same short tasks from the team's own occupations. Colleagues grade the answers blind, and each person's reskilling plan is built from where they beat the AI and where the AI beat them. Each new model release re-runs the contest, so the trend is measured on the user's own work. See the [ranking](0000-ranking.md) for its place.

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

- **Primary user**: an L&D lead running the "AI at work" session most companies are holding now, which is usually a tool demo that leaves no data behind. A TVET or university career centre can run the same session with final-year students.
- **Second user**: each participant, who keeps their results and can rerun them alone.
- **Why now**: OpenAI's GDPval measures models on 1,320 real work tasks from 44 occupations, and graded its public 220-task subset through "blinded expert pairwise comparisons" against experts' own work ([GDPval paper][gdpval-paper]; [dataset][gdpval]). Tanding brings that method to a Malaysian team's own work, with the team as the graders.

[gdpval-paper]: https://cdn.openai.com/pdf/d5eb7428-c4e9-4a33-bd86-86dd4bcf12ce/GDPval.pdf
[gdpval]: https://huggingface.co/datasets/openai/gdpval

## How it works

1.  **Task bank.** For each occupation, five ten-minute tasks written by us from that occupation's O\*NET task statements, each with a rubric. They are labelled as practice exercises based on cited task statements, not real work.
2.  **Contest.** Each person does two or three tasks. The same tasks go to a frontier model through its API, an open-weight model on a RunPod GPU, and an older model, so the scoreboard shows how capability has moved.
3.  **Blind grading.** Answers are shuffled and stripped of authorship, and colleagues grade them against the rubric. No AI grades a contest it's in.
4.  **Results.** For each task: person wins, AI wins, or tie, with the dated model version. Combined with the [Anthropic Economic Index][aei]'s usage data, the results show which tasks are likely to shift first.
5.  **Choose.** Each person then marks which tasks they want AI to take, since workers want AI on fewer tasks than it can already do ([WORKBank][workbank]); the contest shows what AI can do, and the person decides what it should do.
6.  **Match.** Roles are ranked by how much of their work sits in tasks where the person outscored the models, plus skill overlap and demand flags, with the breakdown shown.
7.  **Plan.** For tasks the AI won, learn to direct and check AI on them; for tasks the person won, deepen them; then close the gap to the target role. Free modules with real durations from the Microsoft Learn catalogue, each step ending in a small piece of real work.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[workbank]: https://arxiv.org/abs/2506.06576

## The six must-haves

| Must-have             | How Tanding meets it                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Skills profile intake | Graded work samples plus a short questionnaire: skills shown, not just claimed                       |
| AI-trend signal layer | Dated model releases re-run on the task bank, plus dated Economic Index snapshots                    |
| Future-role matching  | Ranked roles with the score split into tasks won, skill overlap and demand                           |
| Reskilling pathway    | Ordered free modules with durations, split into "work with AI" and "deepen" tracks                   |
| SDG mapping           | Tasks, skills and roles tagged to targets such as 4.4 and 8.5                                        |
| Handling uncertainty  | Two scenarios: adoption catches up with what models can do in the contest, or follows observed usage |

## Why it stands out

No idea in either pass of our [field simulation][field] had people and models attempt the same tasks. The closest, proof-of-skill challenges, appeared only when models were asked for unusual ideas, and none of them compares a person with AI. Tanding also keeps humans in charge literally: people do the grading.

[field]: /docs/research/field-simulation.md

## Why people would use it

- **It is a workshop format** L&D teams can run again with each cohort, and it leaves data behind.
- **"I beat the AI on three of five tasks in my job"** is a result people share.
- **New model releases are news**, and each one updates everybody's scoreboard.

## Live demo for the preliminary

Pick "accounts clerk". The scoreboard shows the team's graded answers beside an older model's and a current model's. Switch the model release from the older to the newer, and the tasks won flip, the role ranking changes, and the plan shifts towards "work with AI" modules, with the model name and release date shown. A judge can take one task live and see where they land.

## Build plan to 25 October

1.  **21 October**: task bank for three occupations, five tasks each with rubrics, drawn from O\*NET 31.0 statements.
2.  **22 October**: run the frontier model, an older model and an open model on a RunPod GPU on every task; blind-grading screen.
3.  **23 October**: team members do and grade the tasks as the seeded panel, labelled as such; match score, gap and pathway; mentor session.
4.  **24 October**: deploy on a Replit Reserved VM, RunPod proof, PRD, declaration, video.
5.  **25 October, before 7:59 AM**: submit and check every link.

## Hardest risk and fallback

- **Writing good tasks and rubrics is slow.** Cap the demo at three occupations and fifteen tasks, and reuse O\*NET wording so each task cites its source.
- **Small panels grade noisily.** Show agreement between graders and the number of grades behind each result, and call the results indicative.
- **A demo judge can't grade blind alone.** Seed the panel with our team's grades, labelled, and let the judge add one more.

## Scores

Scores out of 5, from round 9 (ours) and the round 10 panel, three other Claude models judging blind in persona: Claude Sonnet 5.5 as the sponsor, Claude Fable 5.1 as a government official and Claude Haiku 5.5 as a technical mentor. The [ranking](0000-ranking.md#scoring-matrix) explains the method.

| Criterion            | Weight | Ours | Sponsor judge | Government judge | Technical judge |
| -------------------- | ------ | ---- | ------------- | ---------------- | --------------- |
| Innovation           | 30%    | 5    | 5             | 5                | 5               |
| Problem-solution fit | 25%    | 4    | 3             | 3                | 2               |
| Feasibility          | 25%    | 3    | 2             | 3                | 2               |
| Clarity              | 20%    | 5    | 4             | 4                | 4               |
| Actual use           |        | 4    | 3             | 4                | 3               |

- **Rubric**: 85 from us and 71.0 from the panel, 78.0 on average.
- **Uniqueness**: 5: no match in either field pass.
- **Composite**: 80.6, rank 2 of 5 finalists. All three judges picked Dividen as the winner.

What the judges attacked, and the fix we adopt:

- **Too much to build in 4.5 days** (all three judges). Ship one or two occupations with seeded, pre-graded results across two model versions, replay them in the demo, and keep one live task as a bonus.
- **A desk exercise isn't evidence a job automates** (government judge). Report results per task, require all five tasks before ranking roles, and say what a contest can't show.
- **Pitting staff against AI may demoralise** (sponsor judge). Frame the result as who does what best, and lead with the tasks people win.

## Open questions

- GDPval's dataset card states no licence, so we link to it rather than copy its tasks. Is that enough for the task bank to cite it as method only?
- Which open model on RunPod gives the clearest contrast with a frontier model at our budget?

## See also

- [Idea ranking](0000-ranking.md)
- [Field simulation](/docs/research/field-simulation.md)
- [Comparable winners](/docs/research/comparable-winners.md)

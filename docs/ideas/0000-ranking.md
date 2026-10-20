# Idea ranking

Five product ideas for Domain 1, ranked after ten rounds of ideation against the preliminary rubric, how unusual each is among the 123 teams, and whether people would actually use it. We recommend building [Dividen](0001-dividen.md). The rounds ran on 20 October 2026 and drew on the [brief](/docs/BRIEF.md), the [context](/docs/CONTEXT.md), a [field simulation](/docs/research/field-simulation.md) and [X research](/docs/research/x-inspiration.md). File numbers follow the rank at the time of writing.

Contents:

1.  [Ranking](#ranking)
1.  [Recommendation](#recommendation)
1.  [Scoring matrix](#scoring-matrix)
1.  [The ten rounds](#the-ten-rounds)
1.  [Ideas cut along the way](#ideas-cut-along-the-way)
1.  [See also](#see-also)

## Ranking

| Rank | Idea                         | In one line                                                                        | Rubric | Uniqueness | Actual use | Composite |
| ---- | ---------------------------- | ---------------------------------------------------------------------------------- | ------ | ---------- | ---------- | --------- |
| 1    | [Dividen](0001-dividen.md)   | The hours AI saves a team become pledged learning time, for HR after an AI rollout | 89.0   | 4          | 3.8        | 85.8      |
| 2    | [Tanding](0002-tanding.md)   | A team and AI models do the same tasks from their jobs, and colleagues grade blind | 78.0   | 5          | 3.7        | 80.6      |
| 3    | [Baki](0003-baki.md)         | The work a support bot can't resolve becomes new roles for the agents              | 80.8   | 4          | 3.7        | 79.6      |
| 4    | [Cermin](0004-cermin.md)     | Your own AI chat history shows which job you are already growing into              | 74.2   | 5          | 3.5        | 77.4      |
| 5    | [Seberang](0005-seberang.md) | Your job's near future, observed in Singapore and Selangor                         | 79.7   | 2          | 2.8        | 70.3      |

Rubric is out of 100, uniqueness and actual use out of 5; the [scoring matrix](#scoring-matrix) explains each. All three judges on the round 10 panel, three other Claude models in persona, picked Dividen. They scored Tanding 5 of 5 for innovation, the only idea with a unanimous 5, but 2.3 on average for feasibility.

## Recommendation

- **Build Dividen, with Seberang's cross-country scenarios inside it.** It has the highest composite and the panel's unanimous vote. Every number it needs is in data we have already opened and checked. It gives HR a business moment, and it answers the sponsor's mission, AI that "serves humanity — not replaces it" ([context](/docs/CONTEXT.md#the-event-and-its-people)), with a commitment HR can report on.
- **Adopt the panel's fixes before building**: show hours as a conservative band, require a measured HR baseline before any hours figure appears in the company report, show pledged against completed learning hours, show HR only aggregates above a minimum group size, and tag every role and skill with its SDG target. Details are in [Dividen's scores](0001-dividen.md#scores).
- **Keep Tanding for the grand final.** It is the most original idea, and its contest could later feed Dividen's question of which tasks people want AI to take, but it is too much to build by 25 October.
- **Settle the decision as a team**, then sharpen Dividen with `/grill-with-docs`, the next step on this repository's [main flow](/.agents/skills/ask-matt/SKILL.md), and spend the mentor slot on 21 to 23 October on the business case ([brief](/docs/BRIEF.md#support-and-contacts)).

## Scoring matrix

Each criterion is scored from 1 to 5.

| Criterion                 | Weight    | A 5 means                                                                                                                                  | A 1 means                    |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Innovation and creativity | 30%       | A mechanism outside every field cluster, novel in how signals become forecasts, how scenarios are modelled or how SDG links change choices | Inside a big cluster         |
| Problem-solution fit      | 25%       | All six must-haves fall out of the core loop, from tracking AI to the SDG link, with humans deciding                                       | Links in the chain missing   |
| Feasibility of build      | 25%       | The trend layer feeding matching can run live by 25 October on data we have checked, with a named risk and fallback                        | Depends on data we can't get |
| Clarity                   | 20%       | A cold listener can repeat the user, the moment and the takeaway                                                                           | Confusing                    |
| Uniqueness                | Composite | No idea in either field pass is the same product                                                                                           | 11 or more are               |
| Actual use                | Composite | A recurring trigger, users who seek it out, and output they share                                                                          | A demo toy                   |

- **Rubric** is the four criteria weighted as the [domain's rubric][rubric] weights them, out of 100. The final rubric score is the mean of ours from round 9 and the panel's mean from round 10.
- **Uniqueness** comes from counting field ideas a judge would see as the same product: none scores 5, one or two 4, three to five 3, six to ten 2, and more 1. Two checkers, Claude Sonnet 5.5 and Claude Fable 5.1, counted against all 99 field ideas, and we kept the stricter count.
- **Actual use** is the mean of ours and the panel's.
- **Composite** is 70% rubric, 15% uniqueness and 15% actual use, the last two scaled to 100.
- **Gates**, pass or fail: public or synthetic data only, no invented jobs, courses or statistics, Replit as an integral part, one real RunPod GPU step, and humans making career decisions ([brief](/docs/BRIEF.md#rules-that-can-cost-us)). All five finalists pass.

[rubric]: /docs/sources/drive.google.com/domain-1-aiversecity.md#8-marking-rubric--preliminary-round

## The ten rounds

1.  **Field simulation.** Five models, three samples each, gave 75 ideas for the brief, which fall into nine clusters. The largest, an HR redeployment planner, holds 16 ([field simulation](/docs/research/field-simulation.md)). These clusters defined what to avoid.
2.  **User and moment.** We looked for moments outside the clusters: the quarter after an AI rollout, the day a new model ships, a team's AI workshop, a policy planner's budget, a training provider's course update.
3.  **Intake and unit.** We changed what goes in: a person's own AI chat history, work samples, colleagues, courses, a national budget, hours of time. Cermin and Tanding started here.
4.  **Engines from checked data.** We opened the Anthropic Economic Index's June 2026 file and found per-country and per-state rows and time estimates with and without AI. Those gave Seberang's cross-country scenarios and Dividen's hours.
5.  **Rituals and a second field pass.** We looked for reasons to return, then asked three models for unusual ideas. They converged again on crowd forecasting, skill swaps, simulators and appraisal tools, which demoted our forecasting tournament and reverse-mentoring ideas.
6.  **X research.** 50 searches returned 1,156 posts ([X inspiration](/docs/research/x-inspiration.md)). They gave us Baki, from IKEA's retraining of call-centre staff, and five design rules: exposure is not fate, never count tokens, end steps in real work, let workers choose what AI takes, and send a dated "what changed" update. They also showed that the Economic Index has become a Claude connector, so the data alone no longer sets an entry apart.
7.  **Inversion and SDG.** We tested AI instead of the person, made the worker the data source, looked at a future that already exists elsewhere, and turned SDG 8.2 productivity into 4.4 skills, in hours.
8.  **Score and cut.** We scored about 28 candidates on the matrix and kept the top five.
9.  **Mutate and red-team.** We added worker choice to Dividen and Tanding, credited only collaborative AI use in Cermin, and rechecked uniqueness against 99 field ideas with two models. Seberang fell, because one checker matched its user's experience to eight task-exposure ideas.
10. **Blind panel.** Claude Sonnet 5.5 as the sponsor, Claude Fable 5.1 as a government official and Claude Haiku 5.5 as a technical mentor scored the five finalists blind, in shuffled order, and named each one's biggest weakness. All three picked Dividen.

## Ideas cut along the way

Cut ideas weren't red-teamed or judged, so their scores are from round 8 and run higher than they would have after the later rounds.

| Idea                                          | Cut in round | Round 8 composite | Why                                                                                     |
| --------------------------------------------- | ------------ | ----------------- | --------------------------------------------------------------------------------------- |
| AI workflow recipes for each task of your job | 8            | 76.0              | Needs crowd content we would have to invent; kept as "work with AI" steps in pathways   |
| Reskilling cohorts by target role             | 8            | 72.3              | Weak link to the trend layer; a retention feature, not a product                        |
| Radar for AI data-work entry roles            | 8            | 70.2              | Taxonomies lack roles such as LLM evaluator, so matching risks inventing jobs           |
| National reskilling budget allocator          | 8            | 70.0              | No Malaysian employment data by detailed occupation, and few users                      |
| Synthetic apprenticeship ladder               | 8            | 70.0              | Close to proof-of-skill challenges, which models propose when asked for unusual ideas   |
| Reverse-mentoring matcher                     | 5            | 69.3              | Skill swaps came up in two of three models' unusual ideas                               |
| Appraisal evidence pack                       | 5            | 69.3              | All three models proposed it when asked for unusual ideas                               |
| Future-proofed job descriptions               | 5            | 69.3              | Two of three models proposed it; serves hiring, not reskilling                          |
| A simulated shift or interview from 2030      | 5            | 69.3              | Two of three models proposed it, and it invites invented detail                         |
| Skills forecasting tournament                 | 5            | 67.2              | Two of three models proposed it; weak on matching, and X showed no usable market signal |
| AI transition agreements for unions           | 8            | 67.2              | Few users, and a framing the business sponsor may resist                                |
| Guild reskilling mutual fund                  | 8            | 66.7              | Too much to build or explain in 4.5 days                                                |
| Workforce pack for SME tenders                | 8            | 66.0              | Niche                                                                                   |
| Course freshness labels                       | 5            | 65.8              | Supply side, so it misses role matching; two of three models proposed it                |
| Proof-of-skill challenges                     | 5            | 65.8              | Two of three models proposed it                                                         |
| Gig-to-ladder by Malay voice note             | 6            | 62.8              | Voice-first coaching for blue-collar workers already has five field ideas               |

Several more became features of the finalists rather than products: backtested forecasts, the weekly "what changed" update, an exposure map as the front door, a funding-route resolver that says who pays, and the want-versus-can task map.

For comparison we scored three of the crowded clusters the same way. The HR redeployment planner reaches 65.9, and the task-level exposure alert and retrenchment-day planner 62.4 each. They fit the rubric well but lose on uniqueness, which is the point of the exercise.

## See also

- [Field simulation](/docs/research/field-simulation.md) and [X inspiration](/docs/research/x-inspiration.md), the evidence behind rounds 1, 5 and 6
- [Brief](/docs/BRIEF.md) and [context](/docs/CONTEXT.md)
- [Domain 1 problem statement and rubric](/docs/sources/drive.google.com/domain-1-aiversecity.md)

# Field simulation

What other Domain 1 teams are likely to build, estimated by asking the AI models they use for ideas. On 20 October 2026 we gave five current models the prompt a typical team would paste in, collected 75 ideas, and clustered them. The [idea ranking](/docs/ideas/0000-ranking.md) uses the clusters to score uniqueness.

Contents:

1.  [Method](#method)
1.  [Clusters](#clusters)
1.  [Second pass: asking for unusual ideas](#second-pass-asking-for-unusual-ideas)
1.  [What it means for us](#what-it-means-for-us)
1.  [Limits](#limits)
1.  [See also](#see-also)

## Method

- **Models**: Claude Opus 5.5, Claude Sonnet 5.5 and Claude Haiku 5.5 through the Anthropic API, GPT-6 Luna through the OpenAI API, and Gemini 3.8 Flash through the Gemini API, each sampled three times at default settings. GPT-6.1 Sol, Gemini 4 Argon and Grok 4.7 were also planned but refused for want of credit or quota.
- **Prompt**: the [Domain 1 problem statement][d1] verbatim, the four target users, the six must-haves and the rubric's weights and warnings, ending "Give us your 5 best project ideas that could win. For each: a product name, a one-sentence pitch, the target user, and the key differentiating feature."
- **Extraction and clustering**: Claude Sonnet 5.5 extracted every idea into one line each, and we added five it dropped from one GPT-6 Luna reply, 75 in all. Claude Opus 5.5 then clustered them "by core mechanism and user, so that a judge would see ideas in one cluster as variants of the same product", and we checked the clusters by hand.

[d1]: /docs/sources/drive.google.com/domain-1-aiversecity.md

## Clusters

Nine clusters hold all 75 ideas. Names repeat across models and samples: three runs independently named an idea Second Shift, and three named one WorkforceWeather.

| Ideas | Cluster                           | Core mechanism                                                                                                | Names it produced                                                                                                                                                              |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 16    | HR workforce redeployment planner | Exposure heatmap and scenario slider turning at-risk roles into internal moves and HRD Corp levy-funded plans | WorkforceWeather ×3, Redeploy ×2, GoalLedger, Skill Radar for L&D, Skill Drift Radar, ShiftBoard, LevyLens, RetainPulse, ReRoute, ShiftForward, RoleRemix, TeamShift, TeamTwin |
| 11    | Task-level exposure early warning | A job split into tasks, each scored against dated AI capability signals, with adjacent pivot roles            | PivotPulse, TaskAutopsy, TaskShift ×2, ShiftShield ×2, SecondShift, KarierKalis, NextDesk, PivotSafe, TaskShock MY                                                             |
| 11    | Curriculum and cohort audit       | Syllabus or cohort skills compared with dated signals for TVET and university programme leads                 | CohortCompass ×2, Curriculum Pulse ×2, Signal Ledger, SyllabusDrift, CurriculumRadar, Syllabus Radar, CurriculaShift, DegreeHedge, GradShield                                  |
| 9     | Student and graduate navigator    | Electives, projects, offers or a first job chosen to close the gap to emerging roles                          | Pilihan, Kompas, Before You Enrol, FYP Compass, Elective Compass, GradZero, Campus Compass, GradProof, GradSignal                                                              |
| 7     | Retrenchment-day crisis planner   | A layoff notice turned into a plan around severance, savings and EIS, with a bridge role                      | Second Shift ×3, Runway ×2, Day Zero ×2                                                                                                                                        |
| 6     | Career-switcher skill translation | Experience translated into transferable skills with the shortest bridging route                               | Jejak, Bridge Map, Half-Life, CareerBridge, SwitchSprint, CareRoute                                                                                                            |
| 5     | No-regret career hedge            | Skills or pathways scored across slow, base and fast scenarios, like an investment portfolio                  | CareerHedge ×2, NoRegret, SkillFolio, ForkPath                                                                                                                                 |
| 5     | Green-economy just transition     | Workers moved into NETR and green-economy roles, with SDG impact as a matching input                          | Just Transition Compass, GreenLeap, EcoShift AI, GreenShift, GreenBridge                                                                                                       |
| 5     | Voice-first coach for blue-collar | WhatsApp or voice intake in Bahasa Malaysia and other languages, without a CV                                 | Kerjaya WA, Bual, TVET-Morph, ShiftFloor, MekanikNext                                                                                                                          |

Features recur across clusters too: a fast, base and slow scenario toggle, HRD Corp-claimable courses, an ESG or SDG export, and a "radar" or "weather" dashboard appear in most ideas.

## Second pass: asking for unusual ideas

A team that knows the obvious ideas are taken might ask its assistant for unusual ones. We gave Claude Opus 5.5, GPT-6 Luna and Gemini 3.8 Flash the same prompt plus the nine clusters, and asked for eight ideas each "whose core mechanism is in none of these clusters", that users would return to, and that a student team could demo in four days. The 24 answers converged again:

- **Appraisal and negotiation evidence** in all three: RaiseCase, Stretch Assignment Negotiator and AppraisalShield.
- **Crowd forecasting tournaments** in two: SkillFutures Exchange and Forecast Commons.
- **Cross-generational or peer skill swaps** in two: TandemLearn and Skill Swap Circle.
- **Simulated shifts in a future role** in two: ShiftSim and Future Shift Simulator.
- **Proof-of-skill challenges and projects** in two: ProofQuest, ImpactGigs and SDG Mission Squads.
- **Future-proofed job descriptions** in two: JD Time Machine and JobCraft Studio.
- **Course freshness ratings** in two: CourseCheck and Pathway Reality Check.

So "unusual" has a second, smaller crowd of its own. No answer in either pass used observed cross-country AI adoption as a scenario, turned the time AI saves into learning time, took a person's own AI chat history as intake, or had people and models attempt the same tasks under blind grading.

## What it means for us

- **The clever ideas are the new baseline.** The rubric warns against "upload a CV and ask a chatbot for jobs", and none of the 75 ideas is that. The models already suggest a specific user and moment, Malaysian schemes and scenarios, so a team that asks its assistant once lands in one of these nine clusters. Uniqueness has to come from a mechanism the models didn't propose, not from a sharper framing of one they did.
- **The HR redeployment cluster is the most crowded.** It holds more than a fifth of the ideas and also matches the domain file's optional "Employer / HR view", so expect many teams there.
- **Asking for unusual ideas isn't enough.** The second pass shows that a model told to avoid the nine clusters lands in a smaller set of its own, so we checked our candidates against both passes.
- **Two weak spots stand out.** Only one idea gives its forecasts a track record (Signal Ledger), and none grounds its scenarios in observed data rather than a slider of adjectives.

## Limits

Five models, three samples each, and one prompt are a small sample. Teams also brainstorm without AI, mentors steer them, and the 123 teams' real entries were still empty templates on 20 October, so the clusters estimate the field rather than measure it. A team that prompts differently, for example by asking for unusual ideas, would get a different spread.

## See also

- [Idea ranking](/docs/ideas/0000-ranking.md), which scores each idea's uniqueness against these clusters
- [Comparable winners](/docs/research/comparable-winners.md), for what won in other competitions
- [Domain 1 problem statement and rubric](/docs/sources/drive.google.com/domain-1-aiversecity.md)

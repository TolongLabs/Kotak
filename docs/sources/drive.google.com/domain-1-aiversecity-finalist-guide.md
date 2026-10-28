# Domain 1 finalist guide: Aiversecity Future-Ready Workforce

The finalist guide and final-round marking rubric for Domain 1 of SDC Hackathon 2026, _The Aiversecity Future-Ready Workforce Domain_, shared in the Finalist Drive on 26 October 2026 ([source PDF](https://drive.google.com/file/d/1XZz0PFvMA5VYt9_EzLkCOQde-vvI2xPH/view)). It keeps the [preliminary problem statement](domain-1-aiversecity.md) and sets the standard for the final: the complete product, judged live against a new six-criterion rubric. The cover adds the KrackedDevs logo to the Replit and Runpod ones.

Contents:

1.  [Unchanged from the preliminary guide](#unchanged-from-the-preliminary-guide)
1.  [3. What changes at the final](#3-what-changes-at-the-final)
1.  [4. The final demo journey](#4-the-final-demo-journey)
1.  [5. Must-have features: final standard](#5-must-have-features-final-standard)
1.  [6. Technical expectations](#6-technical-expectations)
1.  [7. Good-to-have features (optional)](#7-good-to-have-features-optional)
1.  [8. Impact & evidence](#8-impact--evidence)
1.  [9. Rules and boundaries](#9-rules-and-boundaries)
1.  [11. Marking rubric – final round](#11-marking-rubric--final-round)
    1.  [How judging works](#how-judging-works)
1.  [12. Prepare for Q&A](#12-prepare-for-qa)
1.  [13. Common mistakes](#13-common-mistakes)

## Unchanged from the preliminary guide

These parts match the [preliminary guide](domain-1-aiversecity.md) word for word:

- The [domain overview](domain-1-aiversecity.md#domain-overview): sponsor Aiversecity, Intermediate difficulty, main SDG 4, relevant SDGs 5, 8, 9 and 10, and the same targets.
- [The problem statement](domain-1-aiversecity.md#the-problem-statement).
- [1. Background](domain-1-aiversecity.md#1-background) and [2. Who you are building for](domain-1-aiversecity.md#2-who-you-are-building-for).
- 10. What success looks like, the same Aiversecity quote as [the preliminary guide's](domain-1-aiversecity.md#7-what-success-looks-like).

## 3. What changes at the final

You reached the Final with a proposal and one working feature. The Final judges the complete product, running live in front of the panel, against a new rubric.

|                | Preliminary round                                     | Final round                                                                                     |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| What is judged | Your proposal and a first proof you can build it      | The complete, working system, judged live                                                       |
| Demo           | A rough version of your single most important feature | The full journey, end to end, with all six must-haves working                                   |
| Criteria       | Four criteria                                         | Six criteria. Technical Execution and Design & UX are scored for the first time                 |
| Feasibility    | Can you build it in time?                             | Can it work beyond the hackathon: reach, cost, data freshness, privacy and measured SDG impact? |
| Communication  | Clarity of the written proposal                       | Live pitch and Q&A, with more than one teammate answering                                       |
| Scores         | Used to select finalists                              | Start fresh. Your Preliminary score does not carry forward                                      |

## 4. The final demo journey

Judges expect to watch one synthetic user move through all six stages in a single live session, from "who I am today" to "where I can be in the AI era".

1.  **Tell us about yourself.** Enter a sample profile through a CV upload, form or questionnaire. Judges check that skills and potential are really captured and drive the results, not pre-filled.
1.  **See the Future Skills Radar.** Rising and declining skills and roles, each showing its source and date. Judges may ask you to change the trend data at this point.
1.  **Get matched.** Ranked future roles, each with a match score, the reasons behind it and a skills-gap breakdown. Expect "why this score, and what would raise it?"
1.  **Follow a pathway.** An ordered reskilling plan with time estimates and free or low-cost resources. Judges may check that a course is real.
1.  **See the SDG contribution.** Every role and skill tagged to one or more SDGs, and how the chosen path contributes to the goals.
1.  **Compare futures.** Switch between at least two scenarios and show how the recommendations shift, clearly labelled as estimates.

## 5. Must-have features: final standard

All six must work live at the Final. A must-have that is missing, or only described rather than shown, caps your Problem-Solution Fit score.

| Feature                            | Shown live at the Final means                                                                                               | Not enough                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1. Skills profile intake           | Skills and potential captured from a synthetic profile through a CV upload, form or questionnaire, and used by the matching | A single hard-coded demo user                           |
| 2. AI-trend signal layer           | At least one updatable source wired in, with its name and date on screen. Results change when the data changes              | Hard-coded “top skills” lists, or a source with no date |
| 3. Future-role matching            | Ranked roles with an explainable match score and a clear skills gap                                                         | A score with no reason, or an unsourced model opinion   |
| 4. Personalised reskilling pathway | Ordered steps with time estimates, using real free or low-cost resources (online courses, HRD Corp-claimable programmes)    | A generic course list, or courses that do not exist     |
| 5. SDG mapping                     | Every role and skill tagged to at least one SDG with a reason, and the chosen path's contribution shown                     | Decorative SDG badges added at the end                  |
| 6. Handling uncertainty            | At least two scenarios (e.g. moderate vs fast AI disruption), recommendations shift between them, labelled as estimates     | One prediction presented as certain                     |

## 6. Technical expectations

These separate a strong build from a demo. They are what judges probe under Technical Execution.

- **Trend pipeline.** Ingest at least one updatable public source (job posting data, news or research feeds, open datasets). Store the fetch date with each snapshot so the screen can show it, and make a refresh possible during the demo.
- **Explainable scoring.** Make the match score decomposable, for example skill overlap weighted by trend momentum. Show the components and what would raise the score.
- **Grounding and guardrails.** If you use a language model, name it. Build recommendations from your own sourced tables of roles, skills and courses and cite the source on each one. When no source exists, say so rather than guess.
- **Scenario model.** Drive scenarios from explicit parameters, such as the speed of AI adoption, applied to the trend signals, not from hand-written alternative outputs.
- **SDG mapping method.** Keep a mapping from roles and skills to SDG targets with a one-line reason for each link, and add it up into the user's path contribution.
- **Robustness.** Handle a thin profile, an unknown skill or an unavailable data source without crashing, for example by falling back to the last good snapshot.
- **Engineering.** Deployed and reachable from your link, an organised repository with a README, and steady commits through the hacking window.

## 7. Good-to-have features (optional)

These are not scored separately. They earn credit inside the criteria below, but never make up for a missing must-have.

| Feature                                                                                            | Where it earns credit                         |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Employer / HR view: a workforce-level skills-gap heatmap and reskilling plan for a team or company | Innovation & Creativity; Impact & Feasibility |
| Automatic re-planning when new AI-trend data changes the recommendations                           | Innovation & Creativity; Technical Execution  |
| Inclusive design: English, Bahasa Malaysia and Chinese; low-bandwidth and mobile-friendly          | Impact & Feasibility; Design & UX             |
| Learner motivation: progress tracking, skill badges and similar features                           | Design & UX                                   |
| Fairness checks so recommendations do not discriminate by age, gender or background                | Impact & Feasibility                          |
| SDG contribution view aggregated for a person, a company or a region                               | Problem-Solution Fit; Innovation & Creativity |

## 8. Impact & evidence

Impact & Feasibility is 20% of your score, and Section 4 of your [final report](final-report-template.md#4-environmental--sdg-impact-verification) must back every claim with numbers. Unsupported claims are not credited.

- **Reach.** Who you serve first, through which channel (career centres, TVET providers, HR teams) and how many people, realistically.
- **Data freshness and cost.** How often trend data refreshes, and what data, model calls and hosting cost per user or per month at scale.
- **Learning cost.** How much of a typical pathway is free or low-cost, such as HRD Corp-claimable programmes.
- **Measured SDG impact.** Your Phase 2 result against the baseline and target from your Phase 1 proposal, and how you verified it (logs, test runs, counters).
- **Privacy and fairness.** How personal data would be protected under Malaysia's PDPA, and how you check recommendations for bias.
- **Proof (optional, bonus marks).** In Section 4.1, the code logic, formula or log output that proves your impact claim. It must reflect what you actually built.

## 9. Rules and boundaries

The five rules in the [preliminary guide](domain-1-aiversecity.md#6-rules-and-boundaries) are unchanged: data, AI disclosure and guardrails, human-centred, technology and out of scope. One is new:

- **Declare everything:** list every API, model, dataset and AI tool in your Technical & Tools Declaration. Undeclared resources found at judging may affect your score or eligibility.

## 11. Marking rubric – final round

The Final judges the complete, working system, live. Each criterion is scored from 1 to 10 and multiplied by its weight; the weighted scores add up to a total out of 100.

| Criterion               | Weight   | What judges look for in this domain                                                                                                                                                                                                                                                                                                         |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Innovation & Creativity | 25%      | Trend tracking that keeps updating, explains itself and shows uncertainty, with SDG links that change a user's choices. Clever combinations of existing data and tools count. You can name the job sites and course platforms that exist and show what makes yours different. Not a fixed list, a basic course recommender or a CV chatbot. |
| Technical Execution     | 25%      | The full journey runs live: profile, trends with source and date, ranked roles with an explainable score and skills gap, learning plan, SDG tags and two scenarios. Passes the change test, and spot-checked jobs, courses and numbers are real. Mostly a real pipeline rather than mocked, deployed, with organised code.                  |
| Impact & Feasibility    | 20%      | Who you would reach and how, how trend data stays fresh and what it costs, realistic free or low-cost learning options (e.g. HRD Corp), personal data protected, and SDG impact measured against your Phase 1 baseline. Credit for fairness checks, multiple languages or low-data design.                                                  |
| Problem-Solution Fit    | 15%      | Every part of the problem statement answered and all six must-haves shown live. SDG test: if the tag were removed, would the user lose anything? AI helps people decide; it never makes hiring decisions.                                                                                                                                   |
| Presentation & Pitch    | 10%      | A clear story from “who I am now” to “where I could be”: problem, solution, live demo, impact. Honest that predictions are estimates and about data limits. Within time, with more than one teammate answering questions.                                                                                                                   |
| Design & UX             | 5%       | A first-time user gets from profile to ranked roles and a learning plan in minutes, without being told how. Reasons, sources and scenarios are easy to read. Judged on the product, not the slides.                                                                                                                                         |
| **Total**               | **100%** |                                                                                                                                                                                                                                                                                                                                             |

### How judging works

- All six must-haves must work live. A missing or only-described must-have caps your Problem-Solution Fit score, and bonus features cannot replace it.
- Judges may run live checks: change the trend data, verify a recommended job, course or number, or ask why a score is what it is.
- A live demo is required. Bring a backup (offline build or recording) in case of connectivity issues.
- Your Preliminary score does not carry forward. The pitch and Q&A time limit will be confirmed by the organizers.

## 12. Prepare for Q&A

Expect questions like these. More than one teammate should be able to answer them.

- Please change the trend data now. What should change in the results?
- Where does this recommendation come from? Is this course or number real?
- Why did this person get this score, and what would raise it?
- How do you keep the trend data current, and what does it cost?
- What happens if AI moves faster or slower than you predict?
- How do you stop the system inventing a job or a course?

## 13. Common mistakes

- Fixed trend lists, or results that do not change when the data changes.
- A language model inventing jobs, courses or numbers.
- One prediction shown as if it were certain.
- SDG tags added at the end that change nothing for the user.
- Pre-recorded or hard-coded output presented as live.

Questions? Contact the organizers through the Discord. The cover also gives Instagram [@sdc_xmumhack](https://www.instagram.com/sdc_xmumhack/) and [sdc.xmumhack@gmail.com](mailto:sdc.xmumhack@gmail.com).

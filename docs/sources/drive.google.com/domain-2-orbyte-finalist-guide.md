# Domain 2 finalist guide: Orbyte Smart SME Challenge

The finalist guide and final-round marking rubric for Domain 2 of SDC Hackathon 2026, _Orbyte Smart SME Challenge: Less Busywork, Better Business_, shared in the Finalist Drive on 26 October 2026 ([source PDF](https://drive.google.com/file/d/1FzVPboGhZJ1RMvYm4_EouPJWoEAUfDQ1/view)). It keeps the [preliminary problem statement](domain-2-orbyte.md) and sets the standard for the final: the complete product, judged live against a new six-criterion rubric. The cover adds the KrackedDevs logo to the Replit and Runpod ones.

Contents:

1.  [Changes to the preliminary guide's sections](#changes-to-the-preliminary-guides-sections)
1.  [3. What changes at the final](#3-what-changes-at-the-final)
1.  [4. The final demo journey](#4-the-final-demo-journey)
1.  [5. Must-have features: final standard](#5-must-have-features-final-standard)
1.  [6. Technical expectations](#6-technical-expectations)
1.  [7. Good-to-have features (optional)](#7-good-to-have-features-optional)
1.  [8. Impact & evidence](#8-impact--evidence)
1.  [9. Rules and boundaries](#9-rules-and-boundaries)
1.  [12. Marking rubric – final round](#12-marking-rubric--final-round)
    1.  [How judging works](#how-judging-works)
1.  [13. Prepare for Q&A](#13-prepare-for-qa)
1.  [14. Common mistakes](#14-common-mistakes)

## Changes to the preliminary guide's sections

The [domain overview](domain-2-orbyte.md#domain-overview), [the problem statement](domain-2-orbyte.md#the-problem-statement) and section 11, What success looks like, match the [preliminary guide](domain-2-orbyte.md#8-what-success-looks-like) word for word. Three sections changed slightly:

- **1. Background** drops the "Ideas to get you started" list. The rest of the [background](domain-2-orbyte.md#1-background) is unchanged.
- **2. Who you are building for** adds one sentence to the [preliminary text](domain-2-orbyte.md#2-who-you-are-building-for): "Many have different levels of digital confidence and no time for formal training."
- **10. Support and data** adds one sentence to the [preliminary text](domain-2-orbyte.md#7-support-and-data): "Judges will not mark you down for simulated logins, roles or data, or for having no link to the live Orbyte platform."

## 3. What changes at the final

You reached the Final with a proposal and a rough working slice. The Final judges the complete product, running live in front of the panel, against a new rubric.

|                | Preliminary round                                   | Final round                                                                                             |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| What is judged | Your proposal and a first proof you can build it    | The complete, working product, judged live                                                              |
| Demo           | A rough slice of the core journey on synthetic data | The full journey: trigger, data, decision, approval, action and result, with all six must-haves working |
| Criteria       | Four criteria                                       | Six criteria. Technical Execution and Design & UX are scored for the first time                         |
| Feasibility    | Can you build it in time?                           | Can it work as a business: measured benefit, many SMEs via Orbyte, pricing, privacy                     |
| Communication  | Clarity of the written proposal                     | A startup-style pitch and Q&A, with more than one teammate answering                                    |
| Scores         | Used to select finalists                            | Start fresh. Your Preliminary score does not carry forward                                              |

## 4. The final demo journey

Judges expect to watch one complete task for one SME, live and in a single run, from the moment work arrives to a recorded result.

1.  **Trigger.** A business event or request starts the work, such as a new order, an overdue invoice or a low-stock reading. Automatic triggers earn extra credit.
1.  **Connected data.** The automation pulls together the relevant business information from your synthetic records and assumed interfaces.
1.  **Decision logic.** Rules or AI (only where it adds value) decide what should happen. Missing information or exceptions are handed to a person.
1.  **Human approval.** A person with the right role approves the consequential action. Judges will ask what happens if they say no.
1.  **Visible outcome.** The action completes, the user sees the result and the activity log shows exactly what just happened.
1.  **A second business.** Show, or clearly explain, how a different type of SME would adopt the same product through Orbyte.

## 5. Must-have features: final standard

All six must work live at the Final. A must-have that is missing, or only described rather than shown, caps your Problem-Solution Fit score. Logins, roles and permissions may be simulated.

| Feature                          | Shown live at the Final means                                                                             | Not enough                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1. One clear SME problem         | The same named user and recurring chore you took into the Final, now delivered as one use case            | Several half-built use cases, or “SMEs are inefficient”            |
| 2. Core automated journey        | Trigger, connected data, decision, approval, action and result run end to end on synthetic data           | Steps skipped, narrated over or shown on slides                    |
| 3. Accuracy and ease of learning | Correct, repeatable results, and a new user can follow the flow without formal training                   | Different results for the same input; screens that need explaining |
| 4. People stay in control        | Roles decide who can view or act; approval really blocks the action; the log records the live demo        | An approval button that does nothing, or a fixed-text log          |
| 5. Orbyte fit and reuse          | Fits Orbyte as a connected hub, and you show how a second business would use it                           | A standalone tool, or one that only suits one company              |
| 6. Business benefit and SDG      | Benefit in numbers (time saved, errors avoided, steps removed) with assumptions, and the SDG contribution | “Saves hours every week” with no numbers behind it                 |

## 6. Technical expectations

These separate a strong build from a demo. They are what judges probe under Technical Execution.

- **Approval gate.** Enforce approval in your backend, not just the interface: the consequential action cannot run until a person with the right role approves, and a rejection stops it and is recorded.
- **Activity log.** Write each entry as it happens: who, what, when, the decision and the outcome. The log on screen must match the demo judges just watched.
- **Decision logic.** Use rules where rules are enough and AI only where it adds judgement. Be ready to explain why. If you use a language model, name it.
- **Accuracy and exceptions.** The same input gives the same correct result. Incomplete or unusual records go to a person with a clear reason, rather than a guess.
- **Data and interfaces.** Team-created synthetic records and documented API or interface assumptions, so the product could plug into Orbyte without live access.
- **Reuse.** Keep business-specific settings in configuration, so a second SME is a setup change, not a rebuild. A reusable connector, module or API earns extra credit.
- **Engineering.** Deployed and reachable from your link, an organised repository with a README, and steady commits through the hacking window.

## 7. Good-to-have features (optional)

These are not scored separately. They earn credit inside the criteria below, but never make up for a missing must-have.

| Feature                                                                                                               | Where it earns credit                         |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Real-world validation: testing the problem or prototype with real SME owners or staff, and sharing what you learned   | Innovation & Creativity; Impact & Feasibility |
| Automatic triggers: events, schedules, business rules or an intelligent agent, with human oversight                   | Innovation & Creativity; Technical Execution  |
| Explainable decisions: recommendations based on connected business context, with exceptions handed clearly to a human | Technical Execution                           |
| Reusable building block: a connector, module or API other solutions could build on                                    | Impact & Feasibility                          |
| Business model: usage-based, transaction-based, freemium or partner pricing suited to Orbyte                          | Impact & Feasibility                          |
| Growth path: reaching different SMEs, partner services and other markets                                              | Impact & Feasibility; Presentation & Pitch    |

## 8. Impact & evidence

Impact & Feasibility is 20% of your score, and Section 4 of your [final report](final-report-template.md#4-environmental--sdg-impact-verification) must back every claim with numbers. Unsupported claims are not credited.

- **Business benefit.** Time saved, errors avoided or steps removed per task or per week, with the assumptions behind each number.
- **Against your baseline.** Your Phase 2 result compared with the baseline and target from your Phase 1 proposal, and how you verified it (logs, test runs, counters).
- **Scale through Orbyte.** Which kinds of SMEs could use it, how many, and what a second business would need to change.
- **Business model and cost.** How you would charge, and what it costs to run at scale, including any AI or API calls.
- **Privacy.** How Malaysia's PDPA principles would be handled in a real deployment: who sees what, consent and retention.
- **SDG.** How the measured benefit supports SDG 8 (8.2, 8.3) or SDG 9, or SDG 10 or 12 where it genuinely applies.
- **Proof (optional, bonus marks).** In Section 4.1, the code logic, formula or log output that proves your benefit claim. It must reflect what you actually built.

## 9. Rules and boundaries

Compared with the [preliminary rules](domain-2-orbyte.md#6-rules-and-boundaries), "Creative freedom" is gone, "Data and privacy" drops its PDPA sentence (now under [Impact & evidence](#8-impact--evidence)), and "Declare everything" is new.

- **Genuine SME need:** the problem must be real, in areas such as sales, customer service, finance, procurement, inventory, compliance, marketing, sustainability, logistics or market access.
- **Add something new:** your solution must add a distinct SME business capability, not reproduce Orbyte's existing HR and administrative functions.
- **Fit the hub:** the concept should fit Orbyte's role as a shared business hub that brings functions, information and services together, not an unrelated standalone product.
- **Reusable:** design for many SMEs, not one organisation's internal process.
- **Focus:** demo one clear use case. Broader features can be presented as a future roadmap.
- **Data and privacy:** use only team-created synthetic data, with no real personal, customer or company records.
- **Declare everything:** list every API, model, dataset and AI tool in your Technical & Tools Declaration. Undeclared resources found at judging may affect your score or eligibility.
- **Out of scope:** processing real payments, submitting statutory filings, and giving legal or financial advice. You may demo preparatory workflows using synthetic data.

## 12. Marking rubric – final round

The Final judges the complete, working product, live. Each criterion is scored from 1 to 10 and multiplied by its weight; the weighted scores add up to a total out of 100.

| Criterion               | Weight   | What judges look for in this domain                                                                                                                                                                                                                                                                  |
| ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Innovation & Creativity | 25%      | A fresh automation product small businesses would really want to use, solving one specific, real SME pain point. Clever combinations of existing tools count. You know what SMEs use today and why yours is better. AI earns no credit by itself; not a generic chatbot or dashboard in new colours. |
| Technical Execution     | 25%      | The whole journey runs live: request, connected data and logic, human approval, action and visible result. Approval really blocks the action until it is given, and the activity log shows what just happened. Results are accurate and repeatable; missing information goes to a human.             |
| Impact & Feasibility    | 20%      | The benefit in numbers (time saved, errors avoided) with your assumptions, compared with your Phase 1 baseline. How many different businesses could use it through Orbyte, how you would earn money, and how you would protect privacy under PDPA. No legal or financial advice.                     |
| Problem-Solution Fit    | 15%      | One clear use case that fits Orbyte as a connected hub and adds a new business capability, not an HR or admin tool. All six must-haves shown live. SDG 8 or 9 tied to the measured benefit.                                                                                                          |
| Presentation & Pitch    | 10%      | Pitched like a startup: the problem, your user, a live demo, the benefit and the Orbyte fit, with a market story rather than a feature tour. Within time, with more than one teammate answering questions.                                                                                           |
| Design & UX             | 5%       | A first-time small-business user can follow it without training, in plain language without jargon. Approvals and the activity log are easy to find. Judged on the product, not the slides.                                                                                                           |
| **Total**               | **100%** |                                                                                                                                                                                                                                                                                                      |

### How judging works

- All six must-haves must work live. A missing or only-described must-have caps your Problem-Solution Fit score, and bonus features cannot replace it.
- A solution that copies Orbyte's existing HR and admin functions scores low on Problem-Solution Fit.
- Judges may run live checks: approve and reject an action, open the activity log, ask who can see and act on the data, or ask how a second business would use it.
- A live demo is required. Bring a backup (offline build or recording) in case of connectivity issues.
- Your Preliminary score does not carry forward. The pitch and Q&A time limit will be confirmed by the organizers.

## 13. Prepare for Q&A

Expect questions like these. More than one teammate should be able to answer them.

- Show me the activity log for what you just did. What happens if the approver says no?
- Who can see this data, and who can act on it?
- What is the benefit in numbers, and what are you assuming?
- How many manual steps does your tool remove compared with today?
- How would a second business start using it, and what would you charge?
- Why is this not just an Orbyte HR or admin feature?

## 14. Common mistakes

- An approval button that does nothing, or an action that happens before approval.
- An activity log that is fixed text, not a real record of the demo.
- Big claims ("saves 10 hours a week") with no numbers behind them.
- A tool that only suits one company, or that copies Orbyte's HR and admin tools.
- AI used for its own sake, or a re-skinned chatbot.
- Real customer data, real payments or real government filings.

Questions? Contact the organizers through the Discord. The cover also gives Instagram [@sdc_xmumhack](https://www.instagram.com/sdc_xmumhack/) and [sdc.xmumhack@gmail.com](mailto:sdc.xmumhack@gmail.com).

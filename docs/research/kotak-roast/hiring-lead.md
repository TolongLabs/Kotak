# Roast: Talent Acquisition Lead at a Mid-Sized KL Tech Company

## Verdict

- **Innovation: 3/5** — Turning employer hiring rules into cited verdicts is a fresh angle for students, but expecting employers to publicly declare their testing bar ignores how Kuala Lumpur tech companies actually hire.
- **Live demo (easy and clear): 2/5** — Jumping from a student view to a hiring manager form and back while typing in a fake sample company makes the demo confusing and look staged.
- **Feasibility as a pilot: 2/5** — Shipping student, employer, and reviewer screens plus a RunPod pipeline by 25 October at 7:59 AM while losing Friday to `sdp-hack` will break your build, and zero real employers will publish cards at launch.

## Attacks

1. **Employer hiring-bar cards have zero incentive and high gaming risk**
   - **Attack**: You make `"the hiring lead or engineering manager"` `"70% of the pitch"` and expect us to `"publish a dated hiring-bar card"`, but as a KL talent lead hiring 20 juniors a year, I would never publish our exact interview rules because candidates will game our assessments, different squads use different bars, and HR will block any public promise that rejected applicants can dispute.
   - **Why it matters**: This hits Problem-Solution Fit (25%) and Innovation & Creativity (30%) because the organisers require targeting a mix of businesses and government (`brief.md`), and a business model built on an action employers actively avoid will collapse under judge questioning.
   - **Question the team must answer**: What concrete benefit does a KL hiring lead get from publishing a hiring-bar card on Kotak that outweighs the risk of 500 candidates gaming our take-home test with AI?
   - **What would fix it**: Replace self-published named cards with automated extraction from public job ads and engineering career pages, or let employers submit anonymous benchmarks at career fairs in exchange for unlocking the market report.

2. **Your six "box" questions confuse interview prep rules with job-role matching**
   - **Attack**: Your box asks process questions like `"Are LeetCode-style tests still how you get hired?"` and `"Are AI tools allowed in interviews and take-home tests?"`, and in your demo `"AI engineer moves up under one future"` when a company allows AI in a take-home, even though interview rules never determine whether a graduate fits an AI engineer role versus a backend role.
   - **Why it matters**: This hits Problem-Solution Fit (25%), which scores you on predicting emerging skills and matching people to future roles (`domain-1.md`), because what we actually test AI-native juniors on in KL—debugging AI-generated code, writing tests, explaining system trade-offs live, and shipping clean PRs—is missing from your six questions.
   - **Question the team must answer**: Why would an employer allowing AI tools during a take-home test make `"AI engineer"` a better career match for a student who only knows Python and React?
   - **What would fix it**: Split the engine so employer skill requirements (like debugging AI code, testing, and system design) drive the role match score, while interview-format rules only change the prep steps in the student's plan.

3. **The live demo relies on typing a fake sample employer card because real Malaysian data is empty**
   - **Attack**: Because `evidence.md` admits Malaysia has `"no public statistic on LeetCode-style tests, AI use in interviews, or portfolios versus degrees"` and found only Grab's regional page, your live demo has to `"publish a sample company's card"` under a `"Sample data"` banner just to move a verdict from `"Unknown"` to `"Split"`.
   - **Why it matters**: This hits Feasibility of Build (25%) and Innovation & Creativity (30%) because judges want to see `"the trend signal layer feeding the role matching"` live (`kotak.md`), and flipping an `if/else` rule (`"at least two counted sources agree"`) with a synthetic card you just typed in looks like a rigged CRUD app.
   - **Question the team must answer**: How do you convince judges that Kotak tracks real AI workforce trends when your own demo requires inventing a sample company to make the screen change?
   - **What would fix it**: Seed the database before Sunday with 30 to 50 real public Malaysian tech job listings and engineering pages (my estimate of what two team members can gather in three hours) so the demo runs on 100% real company evidence.

4. **The RunPod GPU step contradicts your two-minute employer form and human approval gate**
   - **Attack**: You propose that `"an open-weights model on RunPod Serverless turns source text into structured evidence"` and that `"extracted evidence counts only after a person approves it"`, yet your live demo skips both by having a hiring lead fill a structured form (`"declare the junior hiring bar in two minutes"`) that updates the student view immediately.
   - **Why it matters**: This hits Feasibility of Build (25%) and sponsor compliance (`brief.md`) because if the hiring lead clicks form inputs in the demo, your RunPod GPU model does nothing during the core loop, or else requires a third admin approval screen that slows the demo down.
   - **Question the team must answer**: Where does the RunPod model actually run during your four-step live demo if the hiring lead is entering structured card fields by hand and unapproved AI extractions cannot count?
   - **What would fix it**: Have the hiring lead paste a raw job description or interview guide into the demo, let the RunPod model extract the skills and interview rules live on screen with highlighted quotes, and let the hiring lead click one button to approve and publish it.

5. **Switching between student and hiring-lead personas mid-demo will lose cold judges**
   - **Attack**: Your demo script asks the presenter to `"Load a sample student"`, check an `"Unknown"` verdict, `"Switch to the hiring lead's view and publish a sample company's card"`, and jump `"Back in the student's view"` to inspect `"What changed"`.
   - **Why it matters**: This hits Clarity of Proposal (20%), which requires a cold listener to easily explain back who the user is and what they walk away with (`domain-1.md`), because role-playing two different users in one short demo blurs who the product is actually built for.
   - **Question the team must answer**: Can a judge watching your five-minute video follow the story when you abandon the student halfway through step 2 to act as an HR manager?
   - **What would fix it**: Keep the student profile and ranked roles visible on one half of the screen while triggering a live evidence ingestion feed on the other half so judges see the cause and the `"What changed"` diff side by side.

6. **Macro underemployment and Claude chat logs cannot score specific junior tech roles**
   - **Attack**: You claim `"Your roles"` gives `"a score out of 100, its reasons ('6 of 7 skills employers list') and the gap"` driven by OpenDOSM underemployment and `"Anthropic Economic Index Malaysia rows"`, even though OpenDOSM's 74.3% underemployment figure has `"no ICT split"` (`evidence.md`) and your own doc admits the Economic Index `"measures Claude usage, not jobs"`.
   - **Why it matters**: This hits Problem-Solution Fit (25%) and Feasibility of Build (25%) because claiming an exact score out of 100 for Malaysian tech roles using all-degree underemployment and global O*NET task mappings looks like false precision to any hiring manager.
   - **Question the team must answer**: How can a quarterly macro survey across all university degrees and a dataset of Claude prompts tell a computer science student whether KL employers are hiring junior data engineers or QA engineers right now?
   - **What would fix it**: Drive the role match score out of 100 strictly from extracted Malaysian employer skill requirements and MyCOL/TalentCorp role mappings, and display OpenDOSM and the Anthropic Economic Index only as clearly labelled market-context indicators.

7. **Building three interfaces and chasing late features like Live2D cats across a split weekend will sink the pilot**
   - **Attack**: With Friday 23 October lost to `"sdp-hack"`, you still plan to build four student steps, `"What changed"`, `"the hiring lead's declare and publish steps"`, `"a review screen where the team approves extracted evidence"`, OpenDOSM and Economic Index pipelines, and RunPod/Replit deployments in 48 hours, while still debating `"Akinator-style intake"`, `"Web scraping"`, and `"Live2D cats"` (`"Tororo and Hijiki"`).
   - **Why it matters**: This hits Feasibility of Build (25%) and Clarity of Proposal (20%) because shipping half-finished screens or committing after 7:59:59 AM on 25 October means penalties or `"immediate disqualification"` (`brief.md`), and VTuber cats will undermine your credibility in a pitch aimed `"70%"` at hiring leads and `"30%"` at TalentCorp and MOHE.
   - **Question the team must answer**: Which screens are you cutting tonight so five tired students can finish the code, two signed PDFs, the deck, and a 5–7 minute YouTube video before Sunday morning?
   - **What would fix it**: Drop the Live2D cats, Akinator intake, scheduled scraper, and separate admin review screen tonight, and focus the entire build on the four-step student flow plus a single RunPod-powered evidence ingestion trigger.

## What to keep

- **Rules decide; AI reads and cites**: Keeping verdict math, role scores, and plan order in deterministic code (`"Rules decide; the AI reads and explains"`) while forcing every claim to show its source and date directly answers the rubric's guardrail against hallucinated jobs and stats.
- **Explicit uncertainty and the "What changed" diff**: Showing `"Settled, Split or Unknown"` verdicts with two labelled future scenarios and a visible `"What changed"` note when new evidence arrives nails all six Domain 1 must-haves (`domain-1.md`).
- **The sharp graduate decision moment**: Framing the student user around a concrete four-month choice—how an AI-native CS student should split their time between portfolio proof, courses, and interview prep—is far stronger than a generic career chatbot.

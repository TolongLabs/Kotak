# Roast: Senior Full-Stack and Machine-Learning Engineer

## Verdict

- **Innovation**: 3/5 — Turning employer hiring rules into first-party evidence is a smart angle, but a six-question rule table where half the answers start as "Unknown" looks like a static spreadsheet unless the AI extraction and trend-weighting math are visible.
- **Live demo (easy and clear)**: 2/5 — Switching personas mid-demo and mutating a shared sandbox database will confuse judges and break as soon as multiple judges open the live Replit link without resetting.
- **Feasibility as a pilot**: 2/5 — Shipping student, employer, and admin review screens plus three data pipelines, a Replit Reserved VM deploy, a RunPod GPU service, and six strict deliverables in roughly 48 hours of real coding time (my estimate, with Friday blocked by another hackathon) is over-scoped.

## Attacks

1. **Two-sided app plus admin review in two days of real coding**
   - **Attack**: Your cut line still promises "the four student steps with form intake, the box, What changed, the hiring lead's declare and publish steps, and a review screen where the team approves extracted evidence", even though Friday 23 October is blocked out as "sdp-hack day".
   - **Why it matters**: This hits Feasibility of Build (25%), because building three separate role interfaces plus six mandatory deliverables in roughly 40 to 48 hours of effective coding time (my estimate) risks a broken app or a late commit after the 7:59:59 AM repository freeze.
   - **Question the team must answer**: Which developer is building and testing seven screens across three user roles while the rest of the five-person team produces two signed PDFs, a PPTX deck, and a 5–7 minute video?
   - **What would fix it**: Cut the admin evidence review screen completely and collapse the hiring lead's "declare and publish steps" into a single drawer on the main screen so you only build one unified four-step interface.

2. **Shared sandbox state breaks when judges test the live link**
   - **Attack**: Your live demo script requires switching views to "publish a sample company's card: 'AI tools allowed in the take-home', dated today" inside a shared "demo dataset the team can reset".
   - **Why it matters**: This hits Feasibility of Build (25%) and Clarity of Proposal (20%), because preliminary judges test your live Replit link asynchronously and will see an already-mutated "Split" state if the previous judge did not click reset.
   - **Question the team must answer**: What happens when a second judge opens your live Replit URL ten minutes after the first judge already published the sample card and mutated the database?
   - **What would fix it**: Store sandbox mutations in browser `sessionStorage` per visitor and put a one-click "Simulate Employer Card" toggle and a "Reset Demo" button directly on the student view.

3. **RunPod Serverless is hidden behind a human queue and vulnerable to GPU cold starts**
   - **Attack**: You propose that "an open-weights model on RunPod Serverless turns source text into structured evidence" and that "extracted evidence counts only after a person approves it", while leaving "which open model runs on RunPod" undecided.
   - **Why it matters**: This hits Innovation & Creativity (30%) and Feasibility of Build (25%), because hiding RunPod behind an offline human approval queue makes the live demo look like a hard-coded lookup table, while calling RunPod Serverless live without a warm worker triggers a 20-to-60-second GPU cold start (my estimate) that stalls the demo.
   - **Question the team must answer**: How will a judge testing your live link see RunPod GPU inference working in real time without waiting on a human reviewer or a serverless cold start?
   - **What would fix it**: Pick a small instruct model on RunPod tonight, wire a live "Extract Hiring Bar with RunPod" button into the sample card drawer with a pre-warmed worker and instant cached fallback, and show the RunPod Pod ID and latency on screen.

4. **The rule engine looks like `if (sources >= 2)` rather than AI trend forecasting**
   - **Attack**: Your core mechanism rests on "a fixed list of hiring-bar questions" where "A question is Settled when at least two counted sources agree" and half the box starts as "Unknown" because "Malaysian evidence is thin".
   - **Why it matters**: This hits Innovation & Creativity (30%) and Problem-Solution Fit (25%), because Domain 1 asks you to "predict which skills and jobs will emerge or decline", and counting whether two rows agree across six fixed questions looks like a static spreadsheet rather than a predictive AI signal layer.
   - **Question the team must answer**: Why should judges award top innovation marks to a rule engine that only checks if two sources agree across six hard-coded computer science questions?
   - **What would fix it**: Show the scoring math on screen by combining the Anthropic Economic Index automation-versus-augmentation delta, OpenDOSM underemployment data, and employer card weights into a visible skill-demand formula that recalculates role scores and skill gaps live.

5. **Five hours on Thursday wasted on static ETL pipelines**
   - **Attack**: Thursday's build plan budgets "the Economic Index outlook pipeline (about 5 hours)" plus "O\*NET 31.0 skills (CC BY 4.0) ... under Malaysian role names from MyCOL and TalentCorp through a hand-checked crosswalk", even though the pilot is scoped to "computer science first".
   - **Why it matters**: This hits Feasibility of Build (25%), because spending five hours of your only full coding day building an automated pipeline for static CSV snapshots steals critical time from the UI when a CS-only pilot needs at most 8 to 12 tech roles (my estimate).
   - **Question the team must answer**: Why spend five hours on Thursday engineering a data pipeline for static Anthropic Economic Index files when your pilot only covers computer science roles?
   - **What would fix it**: Pre-compute the Anthropic Economic Index deltas and O\*NET-to-MyCOL skill mappings for 10 CS roles in a 30-minute Python script committed as static JSON, and spend your live API effort caching the OpenDOSM endpoint (`lfs_qtr_sru_age`) so its 4 requests-per-minute limit and 301 trailing-slash redirect (`evidence.md`) never break the demo.

6. **Live2D VTuber cats and Akinator intake are fatal scope creep**
   - **Attack**: In tonight's discussion list, you float having "Live2D cats guide each step, VTuber-style" using "Tororo and Hijiki" alongside an "Akinator-style intake" and "scheduled scraping of public employer pages".
   - **Why it matters**: This hits Feasibility of Build (25%) and Clarity of Proposal (20%), because integrating the Live2D Cubism WebGL SDK, state triggers, and license rules on Replit burns 8 to 12 hours (my estimate) while clashing with a pitch aimed 70% at engineering managers and 30% at TalentCorp and MOHE.
   - **Question the team must answer**: How do VTuber anime cats and web scrapers survive a two-day build schedule or help engineering managers and government officials trust your labour-market data?
   - **What would fix it**: Kill the Live2D companion, the Akinator intake, and the scheduled web scraper tonight so zero engineering hours go into WebGL sprites or brittle HTML parsers.

7. **Undecided stack, models, and score formula threaten the Technical Declaration**
   - **Attack**: Two days before the freeze, you leave "the stack, the visual design, the exact score formula, which open model runs on RunPod, and which model writes explanations, which the declaration must name" completely "Left to the builder".
   - **Why it matters**: This hits Feasibility of Build (25%) and Clarity of Proposal (20%), because preliminary judges inspect your GitHub repository and run your code (`brief.md`), and any mismatch between your codebase and `SDC2026_TeamName_TechDeclaration.pdf` can trigger deductions or disqualification.
   - **Question the team must answer**: How can the docs track write the PRD and Technical & Tools Declaration tomorrow when the stack, the role-scoring formula, and both AI models are still undecided?
   - **What would fix it**: Lock a single-repo stack on a Replit Reserved VM, write down the exact role-matching formula, and name both the RunPod model and explanation LLM tonight before anyone starts coding or drafting PDFs.

## What to keep

- **Deterministic rules with AI strictly for extraction and explanation**: Keeping "Rules decide; the AI reads and explains" prevents hallucinated jobs, courses, or statistics and directly satisfies the Domain 1 guardrail against "upload a CV and ask a chatbot".
- **The "What changed" reactive diff loop**: Showing a live diff of how one new employer card shifts a verdict from Unknown to Split, re-ranks roles, and updates the reskilling plan is the exact "trend signal layer feeding the role matching" proof the judges asked to see.
- **Honest "Unknown" and "Split" states backed by two-future scenarios**: Turning thin Malaysian data into explicit "Settled, Split or Unknown" verdicts with two labelled future scenarios ("if algorithm tests stay" versus "if AI-assisted tests spread") nails the "Handling uncertainty" must-have with real intellectual honesty.

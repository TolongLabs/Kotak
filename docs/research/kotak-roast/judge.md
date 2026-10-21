# Roast: Aiversecity Domain 1 Judge

## Verdict

- **Innovation: 3/5** — Turning employer hiring rules into dated verdicts is a fresh angle in a crowded graduate-tool bracket, but faking employer disagreement with sample cards undercuts the core promise.
- **Live demo (easy and clear): 2/5** — Switching from a student to a hiring lead and back to a diff screen across six questions and two futures is too busy for a cold judge to follow in a short video.
- **Feasibility as a pilot: 2/5** — Building two user portals, a human-approval queue, a RunPod extractor, and three data pipelines in roughly two free days (my estimate from your schedule) will break before Sunday morning.

## Attacks

1. **Sample cards faking employer disagreement**
   - **Attack**: You claim `"It creates the missing Malaysian statistic"`, yet you manufacture your flagship Split verdict `"with Grab's page saying yes and a sample card saying no"` because real local data is missing.
   - **Why it matters**: This hits **Innovation & Creativity (30%)** and **Feasibility of Build (25%)**, because a truth ledger driven by team-written sample cards looks like the invented evidence you promised to avoid.
   - **Question the team must answer**: How can you pitch cited, trustworthy verdicts when half of your demo's disagreement comes from a fictitious employer card you wrote yourselves?
   - **What would fix it**: Collect five to ten real hiring-bar cards from actual Malaysian tech leads or mentors before Sunday (my estimate of a credible seed), or compute verdicts from real public job postings instead of sample cards.

2. **Interview rules confused with role demand**
   - **Attack**: You focus the box on `"what employers now test for junior tech roles"` and claim in the demo that when a card marks `"AI tools allowed in the take-home"`, the role `"AI engineer moves up under one future"`.
   - **Why it matters**: This hits **Problem-Solution Fit (25%)**, which requires a logical chain from tracking AI advancement to predicting emerging or declining jobs and matching skills, not confusing interview rules with occupation demand.
   - **Question the team must answer**: Why would an employer allowing AI tools in a coding test make `"AI engineer"` a better skill match than software engineer for the same student?
   - **What would fix it**: Separate interview-format rules from role matching so that role rankings move only when skill demand or AI-adoption signals change.

3. **No real value for the 70% business user**
   - **Attack**: You label `"Business user, 70% of the pitch: the hiring lead or engineering manager"`, but your cut line drops `"compare, the government index"` and leaves employers with a two-minute form that only feeds students.
   - **Why it matters**: This hits **Problem-Solution Fit (25%)** and **Feasibility of Build (25%)**, because judges expecting a business and government workforce tool will see a student app with an unpaid employer data-entry step bolted on.
   - **Question the team must answer**: Why would a busy Malaysian engineering manager fill out your form on day one when the comparison view is cut and it gives them zero help reskilling their own team?
   - **What would fix it**: Keep a working employer comparison view in the live prototype that benchmarks a company's junior skill requirements against market supply and outputs a team onboarding plan.

4. **Two contradictory engines for the two futures**
   - **Attack**: You say in one section that `"Where a verdict is Split, the student sees two futures"`, and in the next that the Anthropic Economic Index `"outlook feeds the role score and the two futures"`.
   - **Why it matters**: This hits **Clarity of Proposal (20%)** and **Problem-Solution Fit (25%)**, because a cold listener cannot tell which mechanism generates your uncertainty scenarios or what happens when several questions split at once.
   - **Question the team must answer**: Do your two future scenarios come from employer disagreements over interview rules or from automation-versus-augmentation shifts in the Economic Index?
   - **What would fix it**: Drive the two future role scenarios strictly from the Economic Index outlook and keep interview-rule splits inside the action steps of the reskilling plan.

5. **Decorative SDG tags that never change a choice**
   - **Attack**: You satisfy the fifth must-have by having `"Every role and step tagged to target 4.4 (skills for jobs) or 8.5 (decent work for young people)"`, even for generic tasks like `"practise an AI-assisted take-home"`.
   - **Why it matters**: This hits **Innovation & Creativity (30%)** and **Problem-Solution Fit (25%)**, because Aiversecity requires a meaningful rather than decorative SDG link and rewards showing how `"SDG links change a user's choices"`.
   - **Question the team must answer**: How does stamping SDG 4.4 or 8.5 on every computer science role and study step help a student choose between career paths or contribute to sustainability?
   - **What would fix it**: Tag roles and portfolio projects to specific sustainability domains such as SDG 3 (health tech), SDG 7 (clean energy software), or SDG 9 (digital infrastructure) so the student can filter paths by impact.

6. **Two-day build overload and a hidden RunPod step**
   - **Attack**: Because `"The team also has sdp-hack due on Friday 23 October at 11:59 PM, so Friday stays light"`, you leave roughly two working days (my estimate from your 21–25 October plan) to build four student screens, a diff engine, an employer flow, an Economic Index pipeline, a RunPod extractor, and a human review screen.
   - **Why it matters**: This hits **Feasibility of Build (25%)**, because overbuilding across two hackathons invites broken links and your rule that `"extracted evidence counts only after a person approves it"` hides the RunPod step during a solo judge's test.
   - **Question the team must answer**: When a judge opens your live link alone, how do they see the RunPod model extract evidence and update role rankings without waiting for a team member to approve it?
   - **What would fix it**: Cut the admin approval screen and let the judge paste a real job ad or hiring page into the demo so the RunPod model extracts skills and re-ranks roles live on screen.

7. **Missing course dataset and O\*NET fallback gaps**
   - **Attack**: You rely on `"O*NET 31.0 skills (CC BY 4.0)"` where `"if AI engineer has none, the demo uses the closest O*NET occupation"`, and you promise `"mixing free courses with proof-building steps"` without naming any verified course dataset.
   - **Why it matters**: This hits **Problem-Solution Fit (25%)** and **Feasibility of Build (25%)**, because the rubric requires real free or HRD Corp-claimable learning resources and accurate skill gaps for emerging AI roles rather than fallback US occupation codes.
   - **Question the team must answer**: Which specific public catalogue of free or Malaysian courses feeds Step 4 so that the app never invents a course?
   - **What would fix it**: Curate a small, cited JSON dataset of real free courses and MDEC or HRD Corp programmes mapped directly to modern AI and software skills instead of leaning on O*NET fallbacks.

8. **Late-stage mascot and game gimmicks**
   - **Attack**: Despite noting that `"9 of 75 rival ideas target students and graduates"`, you still entertain adding `"Akinator-style intake"` and `"Live2D cats guide each step, VTuber-style"` to an already crowded interface.
   - **Why it matters**: This hits **Clarity of Proposal (20%)** and **Innovation & Creativity (30%)**, because anime mascots and guessing games distract cold judges from your evidence mechanism and undermine your credibility with hiring leads and TalentCorp.
   - **Question the team must answer**: If a judge gives your prototype three minutes (my estimate of judging attention), why are you spending build hours on VTuber cats instead of proving the data pipeline?
   - **What would fix it**: Cut the Live2D companion, the Akinator intake, and the web scraper tonight so the whole team builds the core evidence-to-pathway loop.

## What to keep

- **"Rules decide; the AI reads and explains"**: Keeping deterministic rules in charge of verdicts, role scores, and plan order while using the language model only to extract structured evidence and write plain-English explanations directly satisfies Aiversecity's human-centred AI guardrail.
- **The visible "What changed" diff when new evidence lands**: Showing side by side how a newly dated source shifts verdicts, re-ranks roles, and updates the student's plan delivers the exact live proof the Domain 1 rubric asks for.
- **Honest `Unknown` verdicts backed by real Malaysian baselines**: Starting from checked local data—such as OpenDOSM's Q2 2026 figure that 74.3% of employed tertiary-educated 15–24-year-olds work in semi-skilled or low-skilled jobs—and labelling missing data as `Unknown` instead of guessing builds immediate trust with judges.

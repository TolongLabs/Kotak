# Roast: Policy Officer, Graduate Employability and MyMahir (TalentCorp Malaysia)

## Verdict

- **Innovation: 2/5** — You spotted a real gap in Malaysian graduate guidance, but a six-question FAQ where two unverified employer forms mark a national question as `"Settled"` is a tiny poll, not an AI workforce predictor.
- **Live demo (easy and clear): 2/5** — Switching tabs to submit a fake employer card under a `"Sample data"` banner looks like a staged database toggle, and allowing AI in a take-home test should not make the `"AI engineer"` role rank higher.
- **Feasibility as a pilot: 2/5** — Losing Friday to `sdp-hack` before the 25 October 7:59 AM MYT deadline leaves about 48 hours of build time (my estimate), yet you plan pipelines your demo skips while cutting the `"compare"` and `"government index"` views that employers and TalentCorp actually need.

## Attacks

1. **Two unverified employer cards cannot settle a national hiring bar**
   - **Attack**: Declaring a national question `"Settled when at least two counted sources agree"` and rolling unverified two-minute forms `"into a Malaysian hiring-bar index"` fails basic data validity for any government or university partner.
   - **Why it matters**: This hits **Innovation & Creativity (30%)** and **Problem-Solution Fit (25%)**, because you claim Kotak `"creates the missing Malaysian statistic"`, yet two self-selected forms without employer verification are anecdotes that TalentCorp could never publish.
   - **Question the team must answer**: How do you stop two unverified managers—or one student spoofing a two-minute form—from flipping a national verdict for every computer science graduate in Malaysia?
   - **What would fix it**: Replace the two-source `"Settled"` rule with transparent sample counts verified via corporate email domains (for example, showing "3 of 5 verified Malaysian tech employers allow AI in take-homes") until a question reaches at least 30 verified employers (my estimate for a minimum pilot sample).

2. **The box tracks interview exam rules instead of emerging skills and roles**
   - **Attack**: Centring `"The box"` on `"what employers now test for junior tech roles"`—such as `"Are LeetCode-style tests still the gate?"` and `"Are AI tools allowed in interviews?"`—confuses interview prep with the domain brief's mandate to predict emerging and declining roles and skills.
   - **Why it matters**: This damages **Problem-Solution Fit (25%)** and **Clarity of Proposal (20%)**, especially when your demo claims that publishing `"AI tools allowed in the take-home"` makes `"AI engineer"` move up, which mixes up interview rules for general developers with job demand for AI engineers.
   - **Question the team must answer**: Why would a company letting candidates use AI during a take-home coding test increase demand or skill fit for the occupation `"AI engineer"`?
   - **What would fix it**: Change hiring-bar cards so employers declare which junior tasks are declining and which AI skills they now test for—such as prompt evaluation, agent workflows, or code review—so new cards directly update skill gaps and role match scores.

3. **Overwriting MyMahir with US O\*NET skills and Claude chat logs will alienate Malaysian judges**
   - **Attack**: Using `"O*NET 31.0 skills"` where `"if AI engineer has none, the demo uses the closest O*NET occupation"` and driving role outlooks from `"Anthropic Economic Index Malaysia rows"` ignores TalentCorp's MyMahir platform, which mapped 268 local roles and 748 skills including AI engineer on 6 October 2026 (`evidence.md`).
   - **Why it matters**: This hurts **Problem-Solution Fit (25%)** and **Feasibility of Build (25%)**, because pitching `"TalentCorp and the Ministry of Higher Education, who steer graduate programmes and MyMahir"` while substituting American O\*NET proxies and Claude usage ratios for MyMahir's local taxonomy undercuts your credibility.
   - **Question the team must answer**: Why should TalentCorp or Malaysian hiring leads accept an American O\*NET proxy for `"AI engineer"` and global Claude usage snapshots when MyMahir and MyCOL already define Malaysian tech roles and skills?
   - **What would fix it**: Seed your demo roles and skill lists directly from MyCOL 2024/2025 and the TalentCorp MyMahir digital skill mappings cited in `evidence.md`, using O\*NET only as a labelled fallback for unmapped tasks.

4. **You pitch 70% business and 30% government value, then cut both views from the build**
   - **Attack**: You frame the `"Business user, 70% of the pitch"` and `"Government user, 30% of the pitch"`, yet your cut line admits `"The PRD and deck only describe compare, the government index"`, leaving the prototype as a student app plus a bare data-entry form.
   - **Why it matters**: This hits **Innovation & Creativity (30%)** and **Clarity of Proposal (20%)**, because the organisers require targeting `"a mix of businesses and government"` (`brief.md`), and no hiring lead will `"declare the junior hiring bar in two minutes"` if the `"compare"` benchmark view is missing.
   - **Question the team must answer**: Why would an engineering manager give you hiring data if the employer comparison screen is cut, and how does TalentCorp get 30% of the pitch when the government index is only on slides?
   - **What would fix it**: Build one shared aggregate dashboard view that serves as both the employer `"compare"` benchmark and `"the government index"`, displaying live card tallies beside OpenDOSM's 74.3% youth underemployment baseline (`evidence.md`).

5. **The sandbox demo looks like a staged form toggle built on fake evidence**
   - **Attack**: After promising `"statistics from major industry leaders, cited and grounded with trustworthy sources"`, your live demo runs `"under a visible 'Sample data' banner"` where you `"publish a sample company's card"` to flip a verdict from `"Unknown"` to `"Split"`.
   - **Why it matters**: This undermines **Feasibility of Build (25%)** and **Innovation & Creativity (30%)**, because judges watching you type a synthetic company card to trigger an `if/else` rule will see a manual CRUD app and confirm your own risk that `"Sample employers can look like invented evidence"`.
   - **Question the team must answer**: How do you prove your `"AI-trend signal layer"` tracks real labour shifts when the centrepiece of your demo is typing a fake employer card into a sandbox?
   - **What would fix it**: Demo the trend layer by feeding a real, dated Malaysian document—such as Grab's engineering hiring page or TalentCorp's 6 October 2026 release (`evidence.md`)—into your RunPod extractor so judges watch real text turn into structured skill signals and re-rank roles live.

6. **Your two-day build plan wastes hours on pipelines and extras that the demo never touches**
   - **Attack**: With `"sdp-hack due on Friday 23 October at 11:59 PM"` before the 25 October 7:59 AM freeze, you spend Thursday building a RunPod text extractor, `"a review screen where the team approves extracted evidence"`, and a live fetcher for an OpenDOSM series whose `"next update [is] 11 November 2026"`, none of which run in your form-based demo.
   - **Why it matters**: This puts **Feasibility of Build (25%)** at high risk, because building unused background pipelines while still debating `"Live2D cats"` and an `"Akinator-style intake"` can leave your core loop unfinished by Sunday morning.
   - **Question the team must answer**: Why are you spending Thursday building an admin approval screen and a RunPod text extractor if your preliminary demo script only submits a structured two-minute form?
   - **What would fix it**: Drop `"Live2D cats"`, `"Akinator-style intake"`, and scheduled scraping tonight, cache OpenDOSM and Economic Index as static dated files, and put the RunPod extractor directly inside the hiring-lead demo step so pasting a job ad pre-fills the hiring-bar card.

7. **Collecting named cards at career fairs ignores corporate HR policy**
   - **Attack**: Pitching `"career fairs, run with universities and TalentCorp, as the way cards get collected"` while leaving `"Should hiring-bar cards name the company, or stay anonymous in the index?"` unresolved ignores that booth staff cannot publish official company hiring policies on the spot.
   - **Why it matters**: This weakens **Feasibility of Build (25%)** and **Problem-Solution Fit (25%)**, because your cold-start plan relies on career fairs, yet named cards require corporate HR sign-off and unverified anonymous cards break your `"trustworthy sources"` rule.
   - **Question the team must answer**: How can an engineering manager at a university career fair publish a public hiring-bar card in two minutes without breaching their company's external communications rules?
   - **What would fix it**: Default cards to verified sector-and-size attribution in the index (for example, "Verified Malaysian bank, 1,000+ staff") while letting HR teams opt into displaying their company name when they want a public badge for job ads.

## What to keep

- **Ground the problem in graduate skill-related underemployment**: Leading with OpenDOSM's Q2 2026 statistic that `"74.3% of employed tertiary-educated 15–24-year-olds worked in semi-skilled or low-skilled jobs"` frames Malaysia's real graduate challenge much more accurately than raw unemployment rates.
- **Keep rules in charge of scores and AI strictly on extraction and explanation**: Enforcing `"Rules decide; the AI reads and explains"` prevents hallucinated jobs, courses, and statistics while satisfying Domain 1's human-centred guardrail.
- **Show two explicit futures and a live diff when evidence is split**: Turning employer disagreement into two labelled scenarios with a `"What changed"` summary directly satisfies Aiversecity's requirement to handle uncertainty and visibly update recommendations when signals shift.

# Roast: Malaysian technology lawyer (PDPA, web-scraping terms and licences)

## Verdict

- **Innovation (2/5)**: Framing career rumours as a cited ledger of "Settled, Split or Unknown" verdicts is clever, but triggering scenario splits with team-written sample cards instead of live market data fails to predict emerging AI skills.
- **Live demo (easy and clear) (3/5)**: Watching one new card flip a student's verdict is easy to grasp, but jumping across student, hiring-lead, and review views while mixing real citations with fake sample employers blurs what is real.
- **Feasibility as a pilot (2/5)**: Building two user flows, a review console, and a RunPod pipeline before 25 October at 7:59 AM MYT alongside `sdp-hack` is already tight, and unverified company cards, scraping blocks, PDPA rules, and the Live2D licence make a real pilot legally unsafe.

## Attacks

1. **Manufactured scenario splits from fake sample cards**
   - **Attack**: Because Malaysian hiring data is thin, `"Are LeetCode-style tests still the gate?" starts Split, with Grab's page saying yes and a sample card saying no`, which means your scenario engine only works in the demo by mixing real citations with fake employer data you wrote yourselves.
   - **Why it matters**: This hits **Innovation & Creativity (30%)** and **Feasibility of Build (25%)**, because Domain 1 forbids inventing data and requires a real trend-signal layer, not a manual form where the presenter publishes `"a sample company's card"` under a `"Sample data"` banner.
   - **Question the team must answer**: How does Kotak honour its own anti-goal of `"any invented employer, job, course or statistic shown as real"` when a fictional company card directly alters the student's role rankings alongside Grab and OpenDOSM?
   - **What would fix it**: Drive the two future scenarios strictly from real variance in your OpenDOSM and Anthropic Economic Index snapshots, and isolate sample employer cards in a separate preview mode that never feeds the student's live verdict score.

2. **Unverified two-minute company cards create defamation and authority risks**
   - **Attack**: Letting a visitor `"declare the junior hiring bar in two minutes"` and `"publish a dated hiring-bar card"` that `"becomes first-party evidence in students' verdicts"` assumes an engineer at a career fair has legal authority to bind their employer and that no one will impersonate a named company.
   - **Why it matters**: This hits **Problem-Solution Fit (25%)** and **Feasibility of Build (25%)**, because publishing unverified claims under a named Malaysian company's brand invites defamation or passing-off liability, whereas making cards anonymous reduces Tier 1 evidence to rumour.
   - **Question the team must answer**: Why would any Malaysian company's HR or legal team allow an engineering manager at a booth to publicly publish internal hiring gates in two minutes without corporate sign-off or identity verification?
   - **What would fix it**: Require corporate work-email verification and an authorised-representative checkbox before any card names a company, and aggregate unverified inputs only into anonymous industry counts once a minimum sample size is met.

3. **Scraping employer pages and social chatter breaches website terms and hits bot blocks**
   - **Attack**: You propose `"scheduled scraping of public employer pages, government releases and news"` under the rule `"Only sites whose terms allow it"`, while also displaying `"Reddit, X and Facebook chatter"`, even though those platforms and most corporate career portals forbid automated scraping in their terms of use.
   - **Why it matters**: This hits **Feasibility of Build (25%)**, because building a compliant scraper before 25 October at 7:59 AM MYT is unrealistic when `evidence.md` admits that PwC's PDF and ISIS Malaysia's site already blocked your own research fetches.
   - **Question the team must answer**: Which Malaysian employer career sites and social platforms have terms of service that legally permit your scheduled scraper to extract and republish their text without a commercial API licence?
   - **What would fix it**: Cut scheduled web scraping and Tier 3 social-media chatter completely, and rely on OpenDOSM's CC BY 4.0 API plus human-curated public pages pasted into the RunPod extraction screen.

4. **CV uploads, open student forms, and named quotes risk PDPA and hackathon rule breaches**
   - **Attack**: Collecting student profiles `"by form or CV upload"` and quoting Tier 2 `"named statements by leaders at major companies"` through `"an open-weights model on RunPod Serverless"` sends identifiable personal data to foreign servers without the bilingual privacy notice, consent, and cross-border safeguards required by Malaysia's Personal Data Protection Act 2010 (PDPA).
   - **Why it matters**: This hits **Feasibility of Build (25%)**, because Domain 1 orders teams to `"not use real personal data or real CVs"`, so leaving an open profile form or scraped personal names on a public Replit URL risks both a hackathon rule breach and unlawful data processing in a pilot.
   - **Question the team must answer**: What stops a judge or student on your public Replit link from entering real personal details or uploading a real CV that gets transmitted to an overseas RunPod endpoint?
   - **What would fix it**: Remove CV upload and free-text personal identifiers from the build, lock Step 1 to preset sample profiles with anonymous skill checkboxes, and cite published institutional reports rather than named individuals.

5. **The Live2D Free Material License conflicts with your mandatory Apache 2.0 repository licence**
   - **Attack**: Committing `"Live2D's free sample models Tororo and Hijiki"` under `"Live2D's Free Material License terms"` into a public GitHub repository `"with an Apache 2.0 licence"` breaches Live2D's licence, which forbids relicensing its proprietary models under an open-source licence and restricts use beyond small businesses when pitching to `"TalentCorp and the Ministry of Higher Education"`.
   - **Why it matters**: This hits **Feasibility of Build (25%)** and **Clarity of Proposal (20%)**, because every asset must pass the signed Technical & Tools Declaration checklist in `brief.md`, and rigging proprietary VTuber cats before Friday's `sdp-hack` deadline wastes build hours for zero rubric marks.
   - **Question the team must answer**: How can you legally distribute Live2D's proprietary sample models inside a public Apache 2.0 repository when the Apache licence grants anyone unrestricted rights to copy, modify, and redistribute the repository's contents?
   - **What would fix it**: Cut the Live2D companion cats tonight and use plain Apache-2.0-compatible icons so your public repository and Technical & Tools Declaration stay fully compliant.

6. **The four-step live demo bypasses your mandatory RunPod GPU step and human review screen**
   - **Attack**: You claim `"an open-weights model on RunPod Serverless turns source text into structured evidence"` that `"counts only after a person approves it"`, yet your four-step demo script only has the presenter `"publish a sample company's card"` from a form without touching RunPod or the approval screen.
   - **Why it matters**: This hits **Clarity of Proposal (20%)** and **Feasibility of Build (25%)**, because jumping between student, hiring-lead, and admin review screens splits focus in a 5-to-7-minute video while leaving your compulsory RunPod GPU integration outside the main demo loop.
   - **Question the team must answer**: If the live demo flips verdicts through a two-minute structured form, when do judges actually see the RunPod model extract unstructured text and a human approve it?
   - **What would fix it**: Replace the hiring-lead form in the preliminary demo with the evidence-review screen, where you run the RunPod extractor live on a real public employer page, approve the extracted rule, and show the student's verdict update.

7. **Static quarterly feeds and unmarked O\*NET edits weaken the continuous trend-signal claim**
   - **Attack**: You map `"O*NET 31.0 skills (CC BY 4.0)"` under `"Malaysian role names from MyCOL and TalentCorp through a hand-checked crosswalk"` alongside `"OpenDOSM skill-related underemployment by age: quarterly, CC BY 4.0, no key, next update 11 November 2026"` and static `"Anthropic Economic Index Malaysia rows"`.
   - **Why it matters**: This hits **Innovation & Creativity (30%)**, because none of those external sources updates before judging ends on 28 October, and displaying modified O\*NET skill lists under Malaysian role titles without marking your edits breaches CC BY 4.0 attribution rules.
   - **Question the team must answer**: When OpenDOSM will not update until 11 November 2026 and O\*NET is a static US taxonomy, what real external Malaysian data feed in Kotak actually updates during the hackathon?
   - **What would fix it**: Add a visible CC BY 4.0 modification notice on every crosswalked role card (`"adapted from O*NET 31.0"`), and run your RunPod extractor over a dated set of real public Malaysian tech job descriptions to drive the live trend signal.

## What to keep

- **Deterministic rules with human sign-off (`"Rules decide; the AI reads and explains"`)**: Restricting the language model to extraction and plain-English explanation while fixed rules compute verdicts and scores satisfies Domain 1's human-centred guardrail and prevents hallucinated career advice.
- **Honest `"Settled, Split or Unknown"` verdicts with one-tap citations**: Showing `"Unknown"` where Malaysian data is missing and turning `"Split"` verdicts into two explicit future scenarios labelled as estimates directly answers the rubric's uncertainty and source-citation rules.
- **Open CC BY 4.0 data backbone (OpenDOSM and O\*NET 31.0)**: Building the macro context and base skill taxonomy on royalty-free, no-key public datasets gives the prototype a legally clean foundation that judges can verify from your public repository.

# Best practices that win marks under the SDC 2026 rubric

Research behind the [context document](/docs/CONTEXT.md) on what wins marks for our Domain 1 preliminary submission, due 25 October 2026 at 7:59:59 AM MYT. All sources were accessed on 20 October 2026: official judging guides, accelerator pitch advice and LLM provider docs, with event-specific rules taken from our [brief](/docs/BRIEF.md). Pages that WebFetch couldn't render were read through [Jina Reader](https://jina.ai/reader/).

Contents:

1.  [How judges score](#how-judges-score)
1.  [Problem framing and innovation](#problem-framing-and-innovation)
1.  [Demo and live prototype](#demo-and-live-prototype)
1.  [Video and pitch deck](#video-and-pitch-deck)
1.  [Repository](#repository)
1.  [LLM credibility](#llm-credibility)
1.  [Impact claims](#impact-claims)
1.  [Judge Q&A](#judge-qa)
1.  [Top 10 for our next 4.5 days](#top-10-for-our-next-45-days)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## How judges score

- **Assume 3 to 4 minutes of attention.** MLH's judging plan recommends "4 mins per project. 2 minutes for presentation + demo, 1 minute for questions from judges and score compilations, and 1 minute for judge travel". The same page tells judges they "only have 3 minutes per team" ([MLH judging plan][mlh-plan]).
- **Judges start in different places.** A Databricks judge: "the first thing I do is go over the requirements". A Square judge watches the video before testing the product. Put the six must-haves at the top of the README and on slide 2 ([Devpost judges][dp-judges]).
- **Spread the effort across criteria.** Judges mark down teams that "over-indexed on one particular criteria at the detriment of the rest", and "if it doesn't really nail the prompt, it's going to be hard to give it full points" ([Devpost judges][dp-judges]).
- **Eligibility is the cheapest loss.** Devpost: "you'd be surprised how many submissions are disqualified simply because they didn't meet the baseline criteria." Check that every link opens when logged out, and that the video is public ([Devpost criteria][dp-criteria]).

## Problem framing and innovation

- **Go narrow and deep.** Paul Graham: build "something a small number of people want a large amount", a hole that is "narrow and deep, like a well". Name one user at one moment, for example a career switcher in the week their role is flagged for automation ([Paul Graham][pg-ideas]).
- **Start from the problem, not the template.** Judges look for teams that "see the problem behind the solution", and the standouts "depart the most from that template". "Upload a CV and chat about jobs" is the template here ([Devpost judges][dp-judges]).
- **Answer "why now".** Sequoia: "The best companies almost always have a clear why now?" and "Describe the pain of your customer". Our why-now is fast-moving AI capability, shown through dated trend data ([Sequoia][sequoia]).
- **Make the one-liner concrete.** Kevin Hale warns against ambiguity, jargon and buzzwords: "To make things reproducible, I need to know nouns" ([YC How to Pitch][yc-pitch]).

[sequoia]: https://sequoiacap.com/article/writing-a-business-plan/
[yc-pitch]: https://www.ycombinator.com/library/6q-how-to-pitch-your-startup

## Demo and live prototype

- **Show the resolution and skip the busywork.** Devpost: "Skip mundane flows such as creating user credentials", and "it's crucial to show resolution to the problem you initially identified". Put the seeded sample profiles behind one button ([Devpost demo][dp-demo]).
- **Prove the trend data drives the output.** The live feature must be "the trend signal layer feeding the role matching system", and success means the output "visibly changes when the trend data changes". Build a swap between two dated trend snapshots that reruns the score and gap on screen ([brief][brief-challenge]).
- **Keep the app awake.** Replit Autoscale can scale down until "the count drops to as low as zero". Reserved VM is "One dedicated server that never sleeps", recommended for "Always-on API servers" ([Replit Autoscale][replit-auto]). Replit confirms that on Autoscale "the first request after scaling to zero can take a few seconds—that's a normal cold start" ([Replit FAQ][replit-faq]), an app goes idle "after 15 minutes of inactivity" ([publishing costs][replit-costs]), and Autoscale's settings stop at CPU, memory and "Max machines", with no minimum ([machine configuration][replit-machines]). The cheapest current Reserved VM, 0.5 vCPU and 2 GiB, costs $0.0208 an hour, about $7 for two weeks, which one member's Core plan, with "$20 in monthly credits", covers ([Replit pricing][replit-pricing]; [plans FAQ][replit-plans]). A production database still suspends "If a database remains idle for 5 minutes" ([Replit billing][replit-billing]), so open the app shortly before judges are expected.
- **Plan for the model API going down.** The Claude API returns `529 overloaded_error` "when the API experiences high traffic across all users", and the SDK retries only twice by default. Serve cached demo responses, labelled as cached with their date, and name this risk in the PRD ([Anthropic errors][a-errors]).

[dp-demo]: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
[replit-auto]: https://docs.replit.com/cloud-services/deployments/autoscale-deployments
[replit-faq]: https://docs.replit.com/help/deployment-and-publishing
[replit-costs]: https://docs.replit.com/billing/deployment-pricing
[replit-machines]: https://docs.replit.com/features/publishing/machine-configuration
[replit-pricing]: https://docs.replit.com/billing/aug-cloud-billing-updates
[replit-billing]: https://docs.replit.com/billing/about-usage-based-billing
[replit-plans]: https://docs.replit.com/help/pricing-and-plans

## Video and pitch deck

- **Pitch in the first seconds, from a script.** Devpost: "explain what your app does" in "the first few seconds of your video". Rehearse the script, and "Edit out the messy stuff" ([Devpost video help][dp-video-help]).
- **Budget each segment and never speed up the audio.** Split the script into intro, idea, components, demo and close, and don't speed up the audio. Aim for about 6:00, since every 30 seconds past 7:00 costs a point, and upload early ([Devpost 6 tips][dp-6tips]; [ETHGlobal][eth]).
- **One idea per slide.** Hale: "A simple slide, therefore, expresses one idea". He says "I usually hate screenshots" because they are "almost always illegible, complex, and non-obvious", and recommends "a bulleted list of steps" to show what you do. Ralston: "more than 7 words on a slide it is likely to be too many" ([YC deck design][yc-deck]; [YC Demo Day guide][yc-dd]).
- **Review the captions.** YouTube's automatic captions "might misrepresent the spoken content due to mispronunciations, accents, dialects, or background noise". Captions should also cover meaningful non-speech sound ([YouTube captions][yt-auto]; [WCAG 1.2.2][wcag]).
- **Practise, with critics.** Ralston calls practice the one preparation technique that matters, done in front of people who give "honest, unvarnished feedback". The deck must tell the same story as the video ([YC Demo Day guide][yc-dd]).

[dp-video-help]: https://help.devpost.com/article/84-video-making-best-practices
[yc-dd]: https://www.ycombinator.com/blog/guide-to-demo-day-pitches/
[yt-auto]: https://support.google.com/youtube/answer/6373554
[wcag]: https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html

## Repository

- **Write the README for a stranger.** It should cover "What the project does", "Why the project is useful", "How users can get started", where to get help and who maintains it. The organisers add the links, run steps and Replit/RunPod usage ([GitHub READMEs][gh-readme]).
- **Declare every tool and every use of AI.** MLH: "You must credit any tools used and be clear on what you made and what was generated." Uncredited AI use means disqualification, and a project "should not be a reskin of an existing AI tool" ([MLH rules][mlh-rules]).
- **Commit small and often, with typed messages.** Conventional Commits help with "Communicating the nature of changes to teammates, the public, and other stakeholders". The organisers treat a single big commit as possibly pre-built work ([Conventional Commits][cc]).
- **Show the code.** A judge: "Ambiguity is a red flag, and also projects that lack detail and code." Link the matcher and the citation check from the README ([Devpost judges][dp-judges]).

[mlh-rules]: https://guide.mlh.com/general-information/judging-and-submissions/rules-for-your-hackathon
[cc]: https://www.conventionalcommits.org/en/v1.0.0/

## LLM credibility

- **Use API citations, not prompt-only citations.** With Anthropic's Citations feature, citations "are guaranteed to contain valid pointers to the provided documents", and they are "significantly more likely to cite the most relevant quotes". Show each `cited_text` next to its recommendation ([Anthropic citations][a-cite]).
- **Restrict the model to our data and let it abstain.** Anthropic recommends "Allow Claude to say 'I don't know'", "External knowledge restriction", and "If it can't find a quote, it must retract the claim." Enforce this in code too: drop any job or course ID that isn't in the retrieved set ([Anthropic hallucinations][a-halluc]).
- **Label forecasts as estimates.** The OpenAI Model Spec says to express uncertainty for "predictions of future states", and ranks a "hedged right answer" above "no answer", which is above a "confident wrong answer". Use labelled scenarios instead of false precision ([OpenAI Model Spec][oa-spec]).
- **Measure the hallucination rate.** "Design evals that mirror your real-world task distribution. Don't forget to factor in edge cases!" Run 20 seeded profiles and report uncited recommendations, with 0 as the target ([Anthropic evals][a-tests]; [OpenAI accuracy][oa-acc]).

[a-cite]: https://platform.claude.com/docs/en/build-with-claude/citations
[oa-spec]: https://model-spec.openai.com/2026-08-18.html
[oa-acc]: https://developers.openai.com/api/docs/guides/optimizing-llm-accuracy

## Impact claims

- **Lead with target 4.4 and indicator 4.4.1.** The Domain 1 targets are 4.3, 4.4, 8.2 and 8.5 ([Domain 1 overview][d1-overview]). Target 4.4 is "relevant skills ... for employment", measured by indicator 4.4.1 ([UN Goal 4][un4]). The UN SDG API returns Malaysia (area code 458) values for 4.4.1 for 2015 and 2017–2024 ([UN SDG API][un-sdg-api]).
- **Treat 8.6 as a secondary option only.** Target 8.6 is "substantially reduce the proportion of youth not in employment, education or training" (indicator 8.6.1), but it isn't one of the Domain 1 targets. Use it only if our KPI actually moves it ([UN Goal 8][un8]).
- **Take the baseline from an official series.** For 4.4.1, copy the Malaysia value and year from the UN SDG API response ([UN SDG API][un-sdg-api]). For the secondary 8.6.1 option, the World Bank NEET series is sourced from ILO's ILOSTAT, so copy the value and year from the live page ([World Bank NEET][wb-neet]).
- **Fill section 4 of the template exactly.** It wants the sub-target, baseline, KPI and Phase 2 target with citations, and warns that vague projections "may weaken your case". Label every assumption as an assumption ([brief][brief-judging]).

[d1-overview]: /docs/sources/drive.google.com/domain-1-aiversecity.md#domain-overview
[un4]: https://sdgs.un.org/goals/goal4
[un8]: https://sdgs.un.org/goals/goal8
[wb-neet]: https://data.worldbank.org/indicator/SL.UEM.NEET.ZS

## Judge Q&A

- **Drill the standard questions.** "What inspired your project?", "What tools did you use, and why?", "What challenges did you solve, and how?" ([ETHGlobal][eth]).
- **Answer in one sentence first.** MLH gives questions and scoring 1 minute in total ([MLH judging plan][mlh-plan]).
- **Make sure anyone can answer anything.** Judges can interview any member about any part, including the AI-assisted parts. Everyone should be able to explain the citation gate, the fallback and the data sources ([brief][brief-judging]).

## Top 10 for our next 4.5 days

Ranked by expected marks per hour. The hour figures are our own estimates.

1.  **Run the eligibility sweep (1 h):** logged-out link check, public video and repo, word limits, no blank declarations. Protects every criterion ([Devpost criteria][dp-criteria]).
1.  **Write one user, one moment and one why-now (2 h)**, worded the same in PRD 2.1, on slide 1 and in the first 15 seconds of the video. Innovation and Clarity ([Paul Graham][pg-ideas]).
1.  **Build the trend-snapshot swap (4 h)** that visibly changes the score and gap, with source dates. Feasibility and Problem-Solution Fit ([brief][brief-challenge]).
1.  **Add a citation gate in code, an "I don't know" path and a human accept-or-edit step (4 h).** Problem-Solution Fit and Feasibility ([Anthropic hallucinations][a-halluc]).
1.  **Add seeded profiles, cached fallback responses and a Reserved VM deployment (3 h)**, and name the risk in the PRD. Feasibility ([Anthropic errors][a-errors]).
1.  **Have a teammate set up from the README on a clean machine (1.5 h).** Feasibility ([GitHub READMEs][gh-readme]).
1.  **Write the impact section (2 h):** lead with target 4.4 and indicator 4.4.1, a Malaysia baseline from the UN SDG API, a KPI and a Phase 2 target, all cited. Innovation and Feasibility ([UN SDG API][un-sdg-api]).
1.  **Record a scripted video of about 6:00 (6 h)**, with reviewed captions, uploaded by 23 October. Clarity, and avoids the overrun penalty ([Devpost 6 tips][dp-6tips]).
1.  **Build the deck (3 h):** one idea per slide, short headlines, a bulleted list of steps instead of screenshots, in the same order as the video. Clarity ([YC deck design][yc-deck]).
1.  **Run the 20-profile citation eval and a Q&A drill (3 h).** Feasibility, plus interview readiness ([Anthropic evals][a-tests]; [ETHGlobal][eth]).

## Open questions

- **Google Solution Challenge criteria.** Search snippets showed points for naming SDG "goals and targets" and for user feedback. The live developers.google.com pages now redirect, and web.archive.org was blocked, so these aren't used above.
- **Microsoft Imagine Cup 2026 criteria weights.** Seen only in third-party summaries.
- **Demo fallback advice from a hackathon source.** None found. That advice rests on Anthropic's error docs.
- **Captions and video length.** Devpost's video help article doesn't cover them.
- **Malaysia NEET value.** The World Bank page showed no value for Malaysia, and ILOSTAT returned 403.
- **YC on live demos.** Ralston says "demos seldom work" in investor Demo Day pitches. That conflicts with our required live demo, so we keep the demo and rehearse it.

## See also

- [SDC Hackathon 2026 context](/docs/CONTEXT.md), which these notes support
- [SDC Hackathon 2026 brief](/docs/BRIEF.md)
- [Comparable hackathon winners](/docs/research/comparable-winners.md)
- [Lineage, people and Malaysian precedent](/docs/research/lineage-and-local.md)
- [Prior art, SDG mapping and course catalogues](/docs/research/prior-art-sdg-courses.md)
- [Trend and skills data](/docs/research/trend-data.md)

[mlh-plan]: https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
[dp-judges]: https://info.devpost.com/blog/hackathon-judging-tips
[dp-criteria]: https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria
[pg-ideas]: https://paulgraham.com/startupideas.html
[dp-6tips]: https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
[eth]: https://ethglobal.com/events/ethonline2026/info/details
[yc-deck]: https://www.ycombinator.com/blog/how-to-design-a-better-pitch-deck
[brief-challenge]: /docs/BRIEF.md#our-challenge
[a-errors]: https://platform.claude.com/docs/en/api/errors
[gh-readme]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
[a-halluc]: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
[a-tests]: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
[un-sdg-api]: https://unstats.un.org/sdgapi/swagger/
[brief-judging]: /docs/BRIEF.md#judging

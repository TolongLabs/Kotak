# SDC Hackathon 2026 context

The background our [brief] leaves out: who is behind Domain 1, what comparable winners built, what earns marks, and which data and products already exist in this space. It informs product and pitch choices and isn't a glossary; the brief, and the organisers' sources above it, still govern the rules. Every external source was accessed on 20 October 2026, and this file can go once the grand final ends on 1 November.

Contents:

1.  [What this means for us](#what-this-means-for-us)
1.  [The event and its people](#the-event-and-its-people)
1.  [Comparable winners](#comparable-winners)
1.  [What wins marks](#what-wins-marks)
1.  [The domain landscape](#the-domain-landscape)
    1.  [Prior art and white space](#prior-art-and-white-space)
    1.  [Trend and skills data](#trend-and-skills-data)
    1.  [SDG mapping](#sdg-mapping)
    1.  [Learning resources](#learning-resources)
1.  [Unverified claims](#unverified-claims)
1.  [See also](#see-also)

## What this means for us

Recommendations, not decisions: the team decides. After the brief's eligibility checks, they run roughly in order of marks per hour, and each names the criterion it serves and the section with the evidence. Nothing under [unverified claims](#unverified-claims) goes into the PRD's impact section or the deck, because false information can mean disqualification ([Terms and Conditions 11][tc11]).

1.  **Name one user, one moment and one reason it matters now**, worded the same in PRD section 2.1, on the first slide and in the video's first 15 seconds. The evidence favours an HR or L&D manager, or a TVET career centre, planning a cohort's reskilling, with each person's own view underneath. That serves the organisers' "businesses and government" and Aiversecity's stated focus on businesses, and it is a combination we found in no existing product. _Innovation, Clarity_ ([people](#the-event-and-its-people); [white space](#prior-art-and-white-space)).
2.  **Make the trend data visibly drive the ranking.** Load two dated snapshots of the Anthropic Economic Index's Malaysia rows (April and May 2026), swap them on screen, and let scores and gaps move with the source and date beside each. A live arXiv pull, stamped with its fetch time, shows the feed is current. _Feasibility, Problem-Solution Fit_ ([data](#trend-and-skills-data)).
3.  **Let the data decide and the model explain.** Score matches deterministically over O\*NET skills and show the breakdown. The model only explains, quotes its sources through the API's citations, and can say "I don't know"; code drops any job or course that isn't in our data. That is the rule CareerSphere's team built around, and it answers the judges' warning against "upload a CV and ask a chatbot for jobs". _Innovation, Problem-Solution Fit_ ([winners](#comparable-winners); [marks](#what-wins-marks)).
4.  **Build scenarios from data, not adjectives.** For Malaysia, the index splits AI use into automation and augmentation across 20 occupation groups, which gives an automation-led and an augmentation-led scenario, each labelled an estimate. Neither of the two closest winners shows more than one scenario. _Innovation_ ([data](#trend-and-skills-data); [winners](#comparable-winners)).
5.  **Tie every SDG tag to a target with Malaysian data.** The domain's targets are 4.3, 4.4, 8.2 and 8.5, and the UN SDG API returns their official text and Malaysia's figures for indicator 4.4.1, on ICT skills. We found no official skill-to-SDG crosswalk, so we publish our own with a cited basis per row; that is what makes the link "meaningful rather than decorative". _Problem-Solution Fit, Innovation_ ([SDG mapping](#sdg-mapping)).
6.  **Cite each Malaysian figure with its source, date and scope**, because they aren't one series: about 600,000 workers needing reskilling (October 2024, and the domain file's figure), about 697,000 jobs at risk without upskilling (the HR Minister, June 2026, as reported by Bernama), and TalentCorp's 620,000 workers projected to be significantly affected. Anchor the role list in MyMahir, TalentCorp's Impact Study and MyCOL. _Clarity, Problem-Solution Fit_ ([people](#the-event-and-its-people)).
7.  **Take pathway steps from live catalogues, and never call a course "HRD Corp-claimable".** We found no working public list of claimable programmes, so state the scheme's rules instead. Microsoft Learn's catalogue gives real durations for the time estimates. _Problem-Solution Fit_ ([learning resources](#learning-resources)).
8.  **Make the live link survive judging.** Deploy on a Replit Reserved VM, about US$7 for two weeks from one member's Core credits, because an idle Autoscale app's first request "can take a few seconds". Put seeded sample profiles behind one click, commit the dated snapshots with a refresh script, and serve cached, labelled answers if the model API is overloaded. Name the data risk and this fallback in the PRD. _Feasibility_ ([marks](#what-wins-marks); [data](#trend-and-skills-data)).
9.  **Script a video of about six minutes that is mostly demo**, in our own voices, with captions checked by hand. The organisers asked for a balance of slides and demo but to prioritise the demo, and discouraged AI-generated voices ([transcript], 01:13:08 and 01:14:47). _Clarity_ ([marks](#what-wins-marks)).
10. **Use the mentor slot on the business case.** The windows run 21 to 23 October, and two of the six mentors come from KrackedDevs, a Malaysian builder community ([people](#the-event-and-its-people)).

[tc11]: /docs/sources/sdchack.my/terms-and-conditions.md#11-cheating--misconduct

## The event and its people

- **No track record to copy.** SDC 2026 is the first dedicated hackathon circuit at XMUM ([overview]), and searches found no earlier SDC, XMUM AI Club or XMUM-hosted hackathon. No judges are named; they "may comprise representatives from academia, industry, sponsors, or other professionals" ([Terms and Conditions 7.1.2][tc71]). Asked what separates a winning submission, the organisers said to target "what our domain sponsors have expected from you" ([transcript], 01:11:02).
- **Aiversecity says it builds human-centred AI for people and businesses.** Its one-page site states its mission "to help people, businesses, and societies design AI that serves humanity — not replaces it" ([Aiversecity][aiv]). It is the title sponsor and runs the ORION AI Youth Leaders network, which may offer members "career and internship matching with companies in Aiversecity's business network" ([participant handbook 13][ph13]). Its CEO's LinkedIn profile lists Gordan Vong as founder and CEO since January 2026 ([profile][gordan-vong]); no Aiversecity page names a legal entity, products or customers, and its terms and privacy pages are marked as drafts ([terms][aiv-terms]). Its representative closed her remarks with "put people first" ([transcript], 00:18:01).
- **The mentors lean to business and building.** Two of the six are from KrackedDevs; the others come from Binance, Western Digital, Saichuang Weilai, in venture capital, and Intrinsic SEA ([team portal][tp-mentors]).
- **The Malaysian figures differ in scope.** In October 2024 the HR Minister said about 600,000 workers in 10 sectors needed reskilling within three to five years ([Bernama, October 2024][bernama-600k]). In June 2026 his successor cited a TalentCorp study finding about 697,000 jobs "at risk of being affected by technological advancements and the green economy" if workers don't upskill ([Bernama, June 2026][bernama-697k]), and about 120 roles "identified as increasingly important" ([Malay Mail][mm-697k]). Neither the 697,000 nor the 120 appears in the Hansard record of his oral answer or in any TalentCorp release; TalentCorp's January 2026 figure was about 685,000 ([TalentCorp release][tc-685k]). TalentCorp's Impact Study says about 620,000 workers, 18% of the workforce in the sectors it analysed, are "projected to be significantly affected". It names around 60 emerging roles, and career pathways and 864 skills for 84 highly impacted roles; phase 2 is in progress ([TalentCorp][tc-impact]).
- **Judges may know the government platforms.** MyMahir lists TalentCorp's in-demand and emerging roles with their skills ([MyMahir][mymahir]). MyCOL 2024/2025, the critical occupations list, is published only as PDFs ([MyCOL][mycol]). HRD Corp lets employers claim up to 100% of approved training and runs e-LATiH, a learning portal with free courses ([HRD Corp][hrdcorp]). PERKESO's MYFutureJobs matches jobseekers with employers ([MYFutureJobs][mfj]).
- **The nearest Malaysian precedent set a production bar.** Talentbank's Tech Hackathon, "Build Asia's Career OS with AI", crowned its first cohort's winners on 22 August 2026, and its page sets a "Production-ready only" standard, with an adoption pool "Awarded only for exceptional work". It names the winners but not what they built ([Talentbank][talentbank]). Our sponsor judges may ask the same question: could they adopt what we build?

[overview]: /docs/sources/sdchack.my/overview.md#what-is-sdc
[tc71]: /docs/sources/sdchack.my/terms-and-conditions.md#71-general-principles
[aiv]: https://aiversecity.com/
[gordan-vong]: https://www.linkedin.com/in/gordanvong
[aiv-terms]: https://aiversecity.com/terms
[ph13]: /docs/sources/drive.google.com/participant-handbook.md#13-aiversecity-orion-ai-youth-leaders-sponsor-community
[tp-mentors]: /docs/sources/sdchack.my/team-portal.md#mentors
[bernama-600k]: https://www.bernama.com/en/news.php?id=2350085
[bernama-697k]: https://bernama.com/en/general/news.php?id=2572379
[mm-697k]: https://www.malaymail.com/news/malaysia/2026/06/24/malaysia-records-42807-job-losses-as-697000-roles-at-risk-from-ai-without-urgent-upskilling-says-hr-minister/224963
[tc-685k]: https://www.talentcorp.com.my/resources/press-releases/talentcorp-drives-national-ai-readiness-as-rm110-million-jelajah-ai-mymahir-expands-nationwide/
[tc-impact]: https://www.talentcorp.com.my/impact-study/
[hrdcorp]: https://hrdcorp.gov.my/
[talentbank]: https://www.techhackathon.com/

## Comparable winners

SDC has no past winners, so these come from comparable competitions. Each placing is confirmed by the organiser or a Devpost winner badge. Eight entries judged on other rubrics are a small sample that only shows the survivors, so read the patterns as hints, not laws.

| Project                           | Event and placing                                                                                                   | Why it matters to us                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [PivotPath]                       | Claude Hackathon x UVicHacks 2026, first place                                                                      | Closest overlap: five paths ranked by match, O\*NET automation risk and demand trend, each with a free-course plan                |
| [CareerSphere]                    | PyCon Singapore 2026, first overall ([results][pycon-results])                                                      | Fit scored against Singapore's official skills framework and about 88,000 live postings; "the data decides and the AI interprets" |
| [Hunar]                           | Smart India Hackathon 2024, a nodal-centre joint winner ([results][sih-results]); the team's post names the project | Trending skills, job forecasts and skill gaps, voice-first in three languages                                                     |
| [Jobiri]                          | EUvsVirus 2020, challenge winner                                                                                    | AI career advisor for job seekers and for public employment services                                                              |
| [GetWage]                         | Google Solution Challenge 2022, Top 10                                                                              | Daily-wage work for people hit by unemployment, tagged SDGs 1, 4 and 8                                                            |
| [XPRIZE Rapid Reskilling][xprize] | XPRIZE 2020–23, grand prize unclaimed                                                                               | Judged on training time, placement and retention; no team placed 5,000 workers                                                    |
| [Argus]                           | Imagine Cup 2025, world champion                                                                                    | Born of the founders' grandparents' low vision; judged on AI use, inclusive design and viability                                  |
| [MamaMate]                        | ITU AI for Good Innovation Factory 2025                                                                             | Offline for rural mothers; ITU praised its "bold yet deeply grounded approach"                                                    |

The closest published SDG rubric is the Google Solution Challenge 2024's: 25 points for impact, covering the chosen SDG targets, three pieces of real-user feedback and metrics, and 25 for technology, including "an actual working application (not a mockup)" ([archived timeline][gsc-2024]).

What the winners share:

- A narrow user with a vivid need, often from the founders' own lives, such as PivotPath's retail clerks and truck drivers, for whom a bootcamp's fee is "a wall".
- Official data in the loop. PivotPath grounds its model in O\*NET data, and CareerSphere's team scored deterministically after finding that "features where the LLM decides felt like thin chatbot wrappers".
- Scores users can audit, and an action on every gap: a course, a posting or a plan. [PyCon Singapore][pycon] asked for "actionable pathways instead of overwhelming skill sets".
- A deployed, working demo, and outcomes measured rather than promised.
- Inclusion designed in: offline, voice-first or multilingual.

PivotPath and CareerSphere already have explainable scores, gaps and course plans, so those alone won't stand out. Neither shows more than one scenario, maps roles or skills to SDG targets, or tracks AI advancement continuously (PivotPath's trend is O\*NET's static outlook), and neither uses Malaysian data. That is our room.

[PivotPath]: https://devpost.com/software/pivot-path
[CareerSphere]: https://www.rohanjk.xyz/projects/careersphere
[Hunar]: https://www.linkedin.com/posts/shrynsjn_smartindiahackathon2024-hackathonwinners-activity-7274090331585859585-z-e7
[Jobiri]: https://devpost.com/software/jobiri-the-first-ai-based-digital-career-advisor
[GetWage]: https://developers.googleblog.com/2022/07/top-10-winners-demo-Day-2022.html
[xprize]: https://www.xprize.org/news/xprize-announces-conclusion-of-rapid-reskilling-competition
[Argus]: https://techcommunity.microsoft.com/blog/studentdeveloperblog/announcing-the-2025-imagine-cup-world-champion/4414342
[MamaMate]: https://aiforgood.itu.int/mamamate-wins-again-this-time-at-the-ai-for-good-innovation-factory-grand-finale-2025/
[gsc-2024]: http://web.archive.org/web/20240926112720/https://developers.google.com/community/gdsc-solution-challenge/timeline
[pycon]: https://pycon.sg/hackathon.html
[pycon-results]: https://pycon.sg/hackathon_entries/results.html
[sih-results]: https://www.sih.gov.in/sih2024/sih2024-grand-finale-result

## What wins marks

Practices from judging guides, accelerators and model providers, beyond the brief's rules:

- **Judges skim.** MLH budgets 4 minutes a project, 2 of them for the demo ([MLH][mlh-plan]). Devpost's judges check the requirements, the video and the product, not always in that order, and mark down teams that "over-indexed on one particular criteria" ([Devpost judges][dp-judges]). Put the six must-haves at the top of the README and on an early slide.
- **Go narrow, concrete and timely.** Build "something a small number of people want a large amount" ([Paul Graham][pg]), answer "why now?" ([Sequoia]), and use nouns rather than buzzwords ([Y Combinator][yc-pitch]).
- **Demo the resolution.** "Skip mundane flows such as creating user credentials" and show the problem being solved ([Devpost demo][dp-demo]).
- **Script the video and deck.** Say what the app does in the first few seconds ([Devpost video][dp-video]); budget each segment and never speed up the audio ([Devpost tips][dp-tips]); put one idea on each slide, and prefer a list of steps to a screenshot ([Y Combinator deck][yc-deck]); fix YouTube's automatic captions, which can misrepresent speech ([YouTube][yt-captions]); and rehearse in front of honest critics ([Y Combinator Demo Day][yc-dd]).
- **Write the README for a stranger**: what it does, why it's useful, how to start and where to get help ([GitHub][gh-readme]). "Ambiguity is a red flag, and also projects that lack detail and code" ([Devpost judges][dp-judges]), so link the matcher and the citation check from the README.
- **Ground the model.** Anthropic's citations "are guaranteed to contain valid pointers to the provided documents" ([citations][a-cite]). Let the model say "I don't know", restrict it to the documents given, and have it retract any claim it can't quote ([hallucinations][a-halluc]). Test on cases that mirror real use ([evals][a-evals]), for example 20 sample profiles with zero uncited recommendations as the bar.
- **Keep the demo up.** Replit's Autoscale drops to "as low as zero" servers when idle, and then "the first request after scaling to zero can take a few seconds"; a Reserved VM "never sleeps" ([Replit][replit]; [FAQ][replit-faq]). The cheapest current Reserved VM costs $0.0208 an hour ([pricing][replit-pricing]), and a production database still suspends after 5 idle minutes ([billing][replit-billing]). The Claude API returns `529 overloaded_error` when it is "temporarily overloaded" ([errors][a-errors]).
- **Quote impact exactly.** Use the official target and indicator text, and a baseline from the official series ([UN SDG API][sdg-api]).
- **Drill the questions.** "What inspired your project?", "What tools did you use, and why?" and "What challenges did you solve, and how?" ([ETHGlobal][eth]). Answer each in one sentence first.

[mlh-plan]: https://guide.mlh.com/general-information/judging-and-submissions/judging-plan
[dp-judges]: https://info.devpost.com/blog/hackathon-judging-tips
[pg]: https://paulgraham.com/startupideas.html
[Sequoia]: https://sequoiacap.com/article/writing-a-business-plan/
[yc-pitch]: https://www.ycombinator.com/library/6q-how-to-pitch-your-startup
[dp-demo]: https://info.devpost.com/blog/how-to-present-a-successful-hackathon-demo
[dp-video]: https://help.devpost.com/article/84-video-making-best-practices
[dp-tips]: https://info.devpost.com/blog/6-tips-for-making-a-hackathon-demo-video
[yc-deck]: https://www.ycombinator.com/blog/how-to-design-a-better-pitch-deck
[yt-captions]: https://support.google.com/youtube/answer/6373554
[yc-dd]: https://www.ycombinator.com/blog/guide-to-demo-day-pitches/
[gh-readme]: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
[a-cite]: https://platform.claude.com/docs/en/build-with-claude/citations
[a-halluc]: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
[a-evals]: https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
[replit]: https://docs.replit.com/cloud-services/deployments/autoscale-deployments
[replit-faq]: https://docs.replit.com/help/deployment-and-publishing
[replit-pricing]: https://docs.replit.com/billing/aug-cloud-billing-updates
[replit-billing]: https://docs.replit.com/billing/about-usage-based-billing
[a-errors]: https://platform.claude.com/docs/en/api/errors
[eth]: https://ethglobal.com/events/ethonline2026/info/details

## The domain landscape

What already exists, what data we can legally use, and where the gaps are.

### Prior art and white space

- **MyMahir** (TalentCorp): a role and skill explorer with In-Demand and Emerging tags that matches a user's top skills to roles and suggests upskilling and training, plus an AI Readiness Index for organisations. It shows no numeric score, time estimates, scenarios or SDG tags ([MyMahir][mymahir]; [user guide][mymahir-guide]).
- **MYFutureJobs** (PERKESO): "AI-driven skill-based job matching", with no explanation of how it works, plus counselling ([MYFutureJobs][mfj]).
- **HRD Corp e-LATiH and e-TRiS**: rails for courses and grants, with no matching ([e-LATiH][elatih]).
- **Singapore's Jobs-Skills Portal**: the strongest regional benchmark. Its 369 role profiles flag "high-growth" skills from job postings, but it covers only Singapore, with no personal score, scenarios or SDGs ([Job-Skills Profile][swda]).
- **LinkedIn Career Explorer**: a 0–100 skills-similarity score for each career move, with "Skills You'll Need". It is the best precedent for an explainable score, but has no trends, courses, scenarios or SDGs ([Career Explorer][li-ce]).
- **Lightcast Career Coach, Coursera Skills Tracks and Google Career Certificates**: sold to institutions or tied to one catalogue, with no scenarios or SDG links ([Lightcast]; [Coursera][coursera]; [Google][google-certs]).

None of them combines AI-trend scenarios, SDG target tags and a timed Malaysian pathway. No Malaysian tool we checked joins MyMahir-style role data to a scored gap and a timed path through e-LATiH or HRD Corp-funded training.

[elatih]: https://elatih.hrdcorp.gov.my/about-us
[swda]: https://jobsandskills.swda.gov.sg/data-and-tools/dashboards/job-skills-profile
[li-ce]: https://linkedin.github.io/career-explorer/
[Lightcast]: https://lightcast.io/solutions/software/career-coach
[coursera]: https://www.coursera.org/business/skill-tracks
[mymahir-guide]: https://www.mymahir.my/assets/document/MyMahir_User_Guide_v1.pdf

### Trend and skills data

The trend layer must be updatable and dated, so feeds and versioned datasets come first:

| Source                          | What it gives us                                                                                                               | Access                                     | Licence                                           | Latest                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------- | --------------------------------------- |
| [Anthropic Economic Index][aei] | Monthly AI-usage shares for 198 to 243 Malaysian occupations, and an automation or augmentation split for 20 occupation groups | Hugging Face, no key; 219 MB file          | Data CC BY, code MIT                              | 26 Jun 2026 release, April and May 2026 |
| [O\*NET 31.0][onet]             | About 900 occupations with skills, Hot Technologies, Emerging Tasks and, through the API only, Bright Outlook                  | Bulk download, no key; API with a free key | CC BY 4.0, fixed credit line                      | August 2026; quarterly                  |
| [arXiv API][arxiv]              | The newest cs.AI and cs.LG papers                                                                                              | No key; one request every 3 seconds        | Metadata CC0                                      | Live                                    |
| [OpenDOSM][dosm]                | Monthly labour force; annual wages by occupation group                                                                         | CSV, or an API at 4 requests a minute      | CC BY 4.0                                         | August 2026                             |
| [ESCO v1.2.1][esco]             | Occupations and skills mapped to ISCO-08, in many languages                                                                    | API, no key                                | Free reuse with acknowledgement ([FAQ][esco-faq]) | December 2025                           |

- **Citable but not feeds**, as they are PDFs or figures only: the ILO's generative AI exposure index ([2025 update][ilo-exposure]), the World Bank and ISIS Malaysia study, which scores 484 Malaysian occupations and finds 28% of the workforce "highly exposed" ([September 2025][wb-isis]), the WEF Future of Jobs Report 2025, under CC BY-NC-ND 4.0 unless marked otherwise ([WEF][wef]; [licence][wef-licence]), [MyCOL][mycol], and MASCO 2020, Malaysia's occupation classification, which is a PDF under the HR Ministry's copyright, so ask before publishing a parsed copy ([MASCO][masco]).
- **Avoid**: Lightcast's free tier is only for nonprofits and public-good projects, subject to approval, and allows 50 skill-extraction calls a month ([Lightcast access][lightcast-api]). Adzuna's API doesn't cover Malaysia ([Adzuna spec][adzuna-spec]). Singapore's Skills Framework data may be downloaded for analysis ([SWDA FAQ][swda-faq]) but not republished without SWDA's written permission ([SWDA terms][swda-terms]). JobStreet's and LinkedIn's terms forbid scraping ([JobStreet terms][jobstreet]; [LinkedIn agreement][linkedin-ua]).
- **A minimal stack**: O\*NET as the skills backbone, two Economic Index snapshots as the main trend signal, and arXiv as the live feed. The usage data joins on O\*NET codes. For Malaysian labels, O\*NET's and BLS's crosswalks reach ISCO-08 ([O\*NET crosswalks][onet-xwalk]; [BLS][bls-isco]), but no published table links ISCO-08 to MASCO 2020. Only about 300 of MASCO's 490 unit groups match ISCO-08 by code and title, so that step must be checked by hand and unmatched roles flagged ([trend data notes][notes-trend]).
- **Risks and fallbacks**: the index has no announced release schedule, is too big to load live, and measures Claude usage rather than jobs, so label it an "AI usage signal". Commit filtered, dated snapshots with their source URL, add a `bun` script that checks for new releases, and cache each arXiv pull with its timestamp.

[aei]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[onet]: https://www.onetcenter.org/database.html
[arxiv]: https://info.arxiv.org/help/api/tou.html
[dosm]: https://developer.data.gov.my/static-api/opendosm
[esco]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
[esco-faq]: https://esco.ec.europa.eu/en/about-esco/faq?page=2&search=
[ilo-exposure]: https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure
[wb-isis]: https://documents1.worldbank.org/curated/en/099092325013010451/pdf/P181093-2e5b89c5-f3be-43b3-868c-8890b74bef21.pdf
[wef]: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
[wef-licence]: https://www.weforum.org/about/licence-terms-on-the-use-of-forum-publications-and-materials
[masco]: https://jtksm.mohr.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf
[lightcast-api]: https://docs.lightcast.io/lightcast-api/docs/api-access
[jobstreet]: https://www.jobstreet.com.my/terms
[linkedin-ua]: https://www.linkedin.com/legal/user-agreement
[bls-isco]: https://www.bls.gov/soc/soccrosswalks.htm
[onet-xwalk]: https://www.onetcenter.org/crosswalks.html
[notes-trend]: /docs/research/trend-data.md#occupation-and-skills-taxonomies
[adzuna-spec]: https://developer.adzuna.com/swagger/spec/test2.json
[swda-terms]: https://jobsandskills.swda.gov.sg/terms-of-use
[swda-faq]: https://jobsandskills.swda.gov.sg/engage-us/faqs

### SDG mapping

- **The UN SDG API** needs no key and returns the official text of every goal, target and indicator, plus Malaysia's values for indicator 4.4.1, on ICT skills, for 2015 and 2017 to 2024 ([UN SDG API][sdg-api]).
- **ESCO's green and digital skill collections**, the digital one with 1,201 concepts, come with the rest of ESCO's data ([ESCO datasets][esco-data]). Linking green labels to environmental targets would be our own mapping, documented as such.
- **The ILO's green jobs definition** counts a job as green only if it is in the environmental sector and "meets the requirements of decent work" ([ILO guidelines][ilo-green]), which gives a two-part test for an SDG 8.5 tag.
- **The Aurora SDG queries** are the only open, target-level set, under CC BY 4.0, but are written for Scopus search and need translating ([Aurora]).
- **The OSDG Community Dataset**, under CC BY 4.0, has volunteer-validated texts labelled by goal, not target, for training or testing a classifier ([OSDG]).
- No official crosswalk from occupations or skills to SDGs turned up, at goal or target level.

[esco-data]: https://esco.ec.europa.eu/en/structure-esco-downloadable-datasets
[ilo-green]: https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@dgreports/@stat/documents/normativeinstrument/wcms_230736.pdf
[Aurora]: https://aurora-network-global.github.io/sdg-queries/
[OSDG]: https://zenodo.org/records/11441197

### Learning resources

- **Microsoft Learn's catalogue API** needs no key and gives each module's duration in minutes. Microsoft says it "will continue to function through June 2026, but it is planned for deprecation"; it still answered on 20 October, and the successor needs authentication and app onboarding ([Microsoft Learn][ms-learn]).
- **Coursera** documents no catalogue API ([Coursera affiliates][coursera-aff]); an undocumented one returns workloads but could change without notice. **edX's** public API leads with test courses from 2015 and 2016 ([edX API][edx]). Both risk dead or stale links.
- **freeCodeCamp** is free, with hour estimates on its catalogue courses but not on its certifications ([freeCodeCamp]). **Google Career Certificates** state "3-6 mos" at "under 10 hours" a week ([Google][google-certs]).
- **HRD Corp** sets the rules for claimable courses, such as at least 4 hours and an application in e-TRiS before training starts, but its "List of Training Programmes" link leads nowhere ([claimable courses][hrd-claimable]).

[ms-learn]: https://learn.microsoft.com/en-us/training/support/catalog-api
[coursera-aff]: https://www.coursera.org/about/affiliates
[edx]: https://courses.edx.org/api/courses/v1/courses/
[freeCodeCamp]: https://www.freecodecamp.org/learn
[hrd-claimable]: https://hrdcorp.gov.my/hrdcorp-claimable-courses

## Unverified claims

[Issue #20](https://github.com/TolongLabs/sdc-hack/issues/20) checked every open claim against primary sources, and the findings above reflect it; the [research notes](/docs/research/) hold the evidence. These still have no primary source, so cite them only as described, or not at all:

- The 697,000 jobs and about 120 emerging roles of June 2026: press-reported only. If used, attribute them to the minister as reported by Bernama or Malay Mail, never to TalentCorp data.
- Aiversecity's legal entity, products and customers: no Aiversecity page or profile names them, and SSM's paid registry wasn't searched.
- That Hunar is the project of team Access Denied, the SIH 2024 joint winner: only the team's own post links the two.

## See also

- [Our brief][brief]: the challenge, deadlines, deliverables, rubric and rules
- [Domain 1 problem statement and rubric](/docs/sources/drive.google.com/domain-1-aiversecity.md)
- [Opening briefing transcript][transcript], with the organisers' answers on judging
- [Team portal](/docs/sources/sdchack.my/team-portal.md), with the mentors and the submission page
- [Research notes](/docs/research/), with the cited findings behind this file: [lineage and local context](/docs/research/lineage-and-local.md), [comparable winners](/docs/research/comparable-winners.md), [best practices](/docs/research/best-practices.md), [trend data](/docs/research/trend-data.md), and [prior art, SDG mapping and courses](/docs/research/prior-art-sdg-courses.md)

[brief]: /docs/BRIEF.md
[transcript]: /docs/sources/opening-briefing/transcript.md
[mymahir]: https://www.mymahir.my/
[mfj]: https://myfuturejobs.gov.my/
[sdg-api]: https://unstats.un.org/sdgapi/swagger/
[mycol]: https://www.talentcorp.com.my/mycol/
[google-certs]: https://grow.google/certificates/

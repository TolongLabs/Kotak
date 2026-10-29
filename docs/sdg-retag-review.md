# SDG retag review

Kotak tags every skill corner with UN SDG targets and shows each tag with the target's UN text and a one-line reason (#391). The AI batch that wrote the corners (#77) set the tags without a fit check, and the #391 reviews found many that don't fit, such as 8.8 (safe working environments) on Web testing and updates. This page records the pass that checked every tag against its target's UN text and retagged the corners whose tags didn't fit (#408): the rule, how two Claude models applied it, what changed, and what happened to each tag the reviews flagged.

At the maintainer's request, a Claude Sonnet 5.5 review stands in for the human review the issue names. A second, independent AI review of PR #414 then found the pass too strict on 3.8 in health care and on the energy targets, and Claude Sonnet 5.5 judged those again. No person has read the result yet.

Contents:

1.  [The fit rule](#the-fit-rule)
1.  [How the pass ran](#how-the-pass-ran)
1.  [What changed](#what-changed)
1.  [The flagged tags](#the-flagged-tags)
1.  [The review's disagreements](#the-reviews-disagreements)
1.  [The review sample](#the-review-sample)
1.  [The second review's recheck](#the-second-reviews-recheck)
1.  [The demo roles](#the-demo-roles)
1.  [Limits](#limits)
1.  [See also](#see-also)

## The fit rule

Both models judged every tag against this rule, quoted from [`retag-sdg.ts`](/scripts/corners/retag-sdg.ts), with the UN text of all 58 targets in [`data/sdg-reasons.json`](/data/sdg-reasons.json) beside it:

> Keep a tag only where the target's UN text supports the corner's own statements and O*NET tasks.
>
> That means doing the work this corner's can-do statements and tasks describe directly contributes to something the target's UN text asks for, so a reader who sees only this corner and the target's text would agree the link is real. Judge the corner, not the job: the job's sector or its other duties don't count. A link that needs an extra assumption does not fit: a shared keyword, a benefit several steps away, or a benefit to people the target is not about. Measuring, testing or monitoring the very thing a target's text is about does count, since the target needs that evidence (testing water for pollution under 6.3); measuring something else does not.
>
> The targets that carry most tags:
>
> - 4.4 (relevant skills for employment, decent jobs and entrepreneurship): the user is building this skill for paid work, so it fits any corner that is a skill used in a job.
> - 8.5 (full and productive employment and decent work): fits any corner that is a skill for productive paid work, as 4.4 does.
> - 8.2 (productivity through diversification, technological upgrading and innovation): fits where the corner uses or improves technology, machines, software, data or methods in a way that raises output or efficiency, or develops new products or processes. Not routine clerical, care, interpersonal or manual work.
> - 8.8 (labour rights and safe and secure working environments for all workers): fits only where the corner's statements or tasks are about workers' own safety, health or rights: workplace hazards, safety rules and procedures, protective equipment, safe handling of dangerous machines or materials, accident prevention, labour standards, wages or working conditions. Not the safety of customers, patients, students, passengers or the public; not product quality, testing or routine maintenance; not the security of data or property.
> - 16.6 (effective, accountable and transparent institutions): fits where the corner's work is part of running a public institution or holding an organisation to account: government, courts and justice, regulation and inspection, audit and compliance, official records and public reporting, investigations. Not routine business paperwork, sales or rental records, or production logs.
> - 9.1 and 9.4: infrastructure means shared physical systems such as roads, rail, bridges, ports, water, sewer and power networks, telecommunication networks and public buildings, not farm, kitchen or office equipment, scientific data or models. 9.4 also needs the work to upgrade or retrofit infrastructure or industry for resource efficiency or clean technology.

The notes on the targets that carry most tags follow their UN text. 4.4 and 8.5 are about people having job skills and decent work, which any skill a user builds for a job supports, so they stayed on every corner that had them. The other three name narrower work, which is where most misfits were.

## How the pass ran

1.  **Judge.** On 29 October 2026, Claude Haiku 5.5 judged all 6,214 tags on the 5,520 corners of the 923 jobs, one job per request at medium effort, with structured output. For each tag it gave a one-sentence reason and fits or not, and it named the corner's best-fitting target from the 58 in the reasons table. Its safety classifier refused one job, Pesticide Handlers, Sprayers, and Applicators, Vegetation, six times, so Claude Sonnet 5.5 judged that job with the same prompt.
1.  **Retag.** A corner keeps the tags that fit, in their order. A corner that lost a tag gets its best-fitting target in that tag's place, unless it already has it, or it kept a tag and the best target is the broad 4.4 or 8.5. So every corner keeps at least one tag, and no target outside the reasons table is added.
1.  **Review.** Claude Sonnet 5.5 checked 149 corners: all 62 that carry a tag the #391 reviews flagged, and a stratified sample of 87 of the other 1,753 changed corners, at least one from each of 32 strata (the first removed target, and whether another target took its place), drawn in a fixed hash order. It saw each corner's statements, O\*NET tasks, and tags before and after the pass, but not the judge's reasons. It agreed on 112 and disagreed on 37.
1.  **Fixes.** Claude Opus 5.5, the coding agent, read each disagreement against the rule and accepted 17 fixes, 3 more in part, and declined 17. It also changed 2 corners after reading the reason check's verdicts, below.
1.  **Recheck.** After a second review, Claude Sonnet 5.5 judged 3.8 again on 90 health corners, 7.1, 7.2 and 7.3 on 159 energy corners, and four single tags, [below](#the-second-reviews-recheck). A corner keeps at most three tags, as the batch prompt asked, so a corner past three lost its broad 4.4 or 8.5.
1.  **Reason check.** Kotak shows a target's reason beside every skill it tags, and each reason was written for the skills tagged when #391 ran. So Claude Sonnet 5.5 checked whether the reason is true of the corner for each of the 423 targets a corner gained, other than 4.4 and 8.5. 121 weren't, such as 7.3's reason about insulating buildings beside a skill that designs nanodevices, and those tags were dropped; a corner left with none got 4.4.

The run cost about US$2.94 of the US$3 cap: US$1.09 for Claude Haiku 5.5 (the judge, a first reason check and two trial runs) and US$1.85 for Claude Sonnet 5.5 (one job, the review, the recheck and the reason checks).

[`retag-sdg.ts`](/scripts/corners/retag-sdg.ts) runs each step. It always reads the AI batch's tags from git (commit `19c8e04`), checked by their SHA-256 hash, never the working file, so it can't retag an already retagged file. The model answers are not in the repo: the script cached every one under `/tmp/kotak-orch/408` on the machine that ran it, and `apply` rebuilds the same `role-corners.json` from that cache. Without the cache, a rerun asks the models again and can get different answers.

`build:data` passes, and only `sdg_targets` changed: all 927 bundle files match a build from the old tags once those fields are taken out, so no verdict, fit score or level moved.

## What changed

1,838 of the 5,520 corners changed. The tags went from 6,214 to 5,973: 4,345 kept, 1,869 removed and 1,628 added, 1,310 of them 4.4. Skill tags now use 46 targets, up from 40. 1.1, 1.2, 9.4, 10.2, 12.3 and 14.2 have no skill tags now; 10.2 and 12.3 stay on job chips.

| Target | Before | Kept | Removed | Added | After |
| ------ | ------ | ---- | ------- | ----- | ----- |
| 1.1    | 1      | 0    | 1       | 0     | 0     |
| 1.2    | 1      | 0    | 1       | 0     | 0     |
| 2.3    | 3      | 1    | 2       | 0     | 1     |
| 2.4    | 5      | 5    | 0       | 5     | 10    |
| 3.3    | 0      | 0    | 0       | 6     | 6     |
| 3.8    | 290    | 235  | 55      | 19    | 254   |
| 3.9    | 1      | 0    | 1       | 3     | 3     |
| 4.1    | 0      | 0    | 0       | 3     | 3     |
| 4.2    | 0      | 0    | 0       | 2     | 2     |
| 4.3    | 0      | 0    | 0       | 1     | 1     |
| 4.4    | 2151   | 2149 | 2       | 1310  | 3459  |
| 4.7    | 1      | 1    | 0       | 0     | 1     |
| 6.1    | 2      | 1    | 1       | 0     | 1     |
| 6.2    | 0      | 0    | 0       | 1     | 1     |
| 6.3    | 9      | 9    | 0       | 4     | 13    |
| 6.4    | 5      | 4    | 1       | 1     | 5     |
| 6.6    | 4      | 1    | 3       | 1     | 2     |
| 7.1    | 9      | 8    | 1       | 51    | 59    |
| 7.2    | 7      | 6    | 1       | 73    | 79    |
| 7.3    | 1      | 1    | 0       | 13    | 14    |
| 8.2    | 960    | 295  | 665     | 4     | 299   |
| 8.5    | 1166   | 1160 | 6       | 16    | 1176  |
| 8.8    | 728    | 174  | 554     | 2     | 176   |
| 8.10   | 0      | 0    | 0       | 1     | 1     |
| 9.1    | 4      | 0    | 4       | 18    | 18    |
| 9.4    | 83     | 0    | 83      | 0     | 0     |
| 9.5    | 0      | 0    | 0       | 30    | 30    |
| 10.2   | 3      | 0    | 3       | 0     | 0     |
| 11.2   | 1      | 1    | 0       | 2     | 3     |
| 11.3   | 0      | 0    | 0       | 3     | 3     |
| 11.4   | 0      | 0    | 0       | 2     | 2     |
| 11.5   | 4      | 4    | 0       | 3     | 7     |
| 11.6   | 26     | 5    | 21      | 2     | 7     |
| 12.2   | 8      | 4    | 4       | 4     | 8     |
| 12.3   | 2      | 0    | 2       | 0     | 0     |
| 12.4   | 3      | 1    | 2       | 2     | 3     |
| 12.5   | 277    | 41   | 236     | 0     | 41    |
| 12.6   | 1      | 1    | 0       | 1     | 2     |
| 12.8   | 1      | 0    | 1       | 1     | 1     |
| 13.1   | 4      | 3    | 1       | 0     | 3     |
| 13.2   | 14     | 0    | 14      | 1     | 1     |
| 14.2   | 2      | 0    | 2       | 0     | 0     |
| 14.4   | 0      | 0    | 0       | 1     | 1     |
| 15.1   | 27     | 21   | 6       | 0     | 21    |
| 15.2   | 1      | 1    | 0       | 1     | 2     |
| 15.3   | 5      | 3    | 2       | 1     | 4     |
| 15.5   | 2      | 2    | 0       | 1     | 3     |
| 16.1   | 0      | 0    | 0       | 4     | 4     |
| 16.3   | 1      | 1    | 0       | 0     | 1     |
| 16.6   | 400    | 206  | 194     | 31    | 237   |
| 16.10  | 0      | 0    | 0       | 4     | 4     |
| 17.17  | 1      | 1    | 0       | 0     | 1     |

## The flagged tags

These are every tag of 9.1, 11.6, 12.8, 13.2 and 14.2, and each tag the #391 reviews named, with the corner's tags before the pass, after it, after the fixes, the recheck and the reason check (Final), and the review's verdict on the pass. 18 changed again after the pass: 6 by accepted fixes, one of them also by the recheck, and 12 by the reason check.

| Flagged | Skill (job)                                                                               | Before     | After the pass | Sonnet 5.5            | Final      |
| ------- | ----------------------------------------------------------------------------------------- | ---------- | -------------- | --------------------- | ---------- |
| 2.3     | Applied biological research (Molecular and Cellular Biologists)                           | 3.8, 2.3   | 9.5            | Agrees                | 9.5        |
| 6.1     | Water advisory (Hydrologic Technicians)                                                   | 6.1, 13.1  | 13.1           | Agrees                | 13.1       |
| 6.6     | Water and land systems (Agricultural Engineers)                                           | 6.6, 12.5  | 9.1            | Disagrees: 15.3, 2.4  | 9.1, 2.4   |
| 7.1     | Roof system upgrades (Roofers)                                                            | 7.1, 8.5   | 8.5, 7.3       | Agrees                | 8.5, 7.3   |
| 7.2     | Generator Control (Power Plant Operators)                                                 | 7.2, 8.2   | 7.1            | Agrees                | 4.4        |
| 8.8     | Safe route driving (Bus Drivers, Transit and Intercity)                                   | 8.8        | 11.2           | Agrees                | 4.4        |
| 8.8     | Skin care and hygiene (Makeup Artists, Theatrical and Performance)                        | 8.8        | 4.4            | Agrees                | 4.4        |
| 8.8     | Web testing and updates (Web Developers)                                                  | 8.2, 8.8   | 4.4            | Disagrees: 8.2        | 4.4        |
| 9.1     | Facility and equipment upkeep (Farmers, Ranchers, and Other Agricultural Managers)        | 8.8, 9.1   | 4.4            | Agrees                | 4.4        |
| 9.1     | Equipment maintenance (Hydrologic Technicians)                                            | 8.2, 9.1   | 4.4            | Agrees                | 4.4        |
| 9.1     | Data quality control (Hydrologic Technicians)                                             | 4.4, 9.1   | 4.4            | Disagrees: 6.3        | 4.4        |
| 9.1     | Monitoring and reporting (Hydrologists)                                                   | 4.4, 9.1   | 4.4            | Agrees                | 4.4        |
| 9.4     | Celestial measurements (Astronomers)                                                      | 9.4        | 9.5            | Disagrees: 4.4        | 9.5        |
| 9.4     | Supplies and equipment (Food Service Managers)                                            | 9.4        | 4.4            | Agrees                | 4.4        |
| 9.4     | Computational model design (Mathematicians)                                               | 8.2, 9.4   | 8.2            | Agrees                | 8.2        |
| 11.6    | Policy and planning advice (Anthropologists and Archeologists)                            | 11.6, 8.5  | 8.5, 16.6      | Disagrees: 16.6       | 8.5        |
| 11.6    | Structural Design Planning (Architects, Except Landscape and Naval)                       | 11.6, 12.5 | 11.6           | Agrees                | 11.6       |
| 11.6    | Site Compliance Checks (Architects, Except Landscape and Naval)                           | 11.6, 8.8  | 11.6           | Agrees                | 11.6       |
| 11.6    | Institutional engagement (Art, Drama, and Music Teachers, Postsecondary)                  | 8.5, 11.6  | 8.5            | Agrees                | 8.5        |
| 11.6    | Local guidance (Concierges)                                                               | 11.6       | 4.4            | Agrees                | 4.4        |
| 11.6    | Environmental Standards (Construction Managers)                                           | 12.5, 11.6 | 11.6           | Disagrees: 12.6       | 11.6       |
| 11.6    | Impact monitoring (Environmental Scientists and Specialists, Including Health)            | 12.5, 11.6 | 12.4           | Disagrees: 12.4, 11.6 | 4.4        |
| 11.6    | Fire code compliance (Fire-Prevention and Protection Engineers)                           | 8.8, 11.6  | 16.6           | Agrees                | 4.4        |
| 11.6    | Research and advisory (Geoscientists, Except Hydrologists and Geographers)                | 11.6, 4.4  | 4.4, 12.2      | Agrees                | 4.4, 12.2  |
| 11.6    | Site cleanup and containment (Hazardous Materials Removal Workers)                        | 8.8, 11.6  | 12.4           | Disagrees: 12.4, 8.8  | 4.4        |
| 11.6    | Community health programs (Healthcare Social Workers)                                     | 3.8, 11.6  | 3.8            | Agrees                | 3.8        |
| 11.6    | Roadside cleanup (Highway Maintenance Workers)                                            | 11.6       | 4.4            | Disagrees: 11.6       | 11.6       |
| 11.6    | Artifact conservation (Historians)                                                        | 11.6       | 11.4           | Agrees                | 11.4       |
| 11.6    | Environmental impact mitigation (Hydrologists)                                            | 6.6, 11.6  | 6.6            | Agrees                | 6.6        |
| 11.6    | Community programs (Mental Health Counselors)                                             | 3.8, 11.6  | 3.8            | Agrees                | 3.8        |
| 11.6    | Lawn planting and covering (Pesticide Handlers, Sprayers, and Applicators, Vegetation)    | 11.6       | 4.4            | Agrees                | 4.4        |
| 11.6    | Community health systems (Preventive Medicine Physicians)                                 | 3.8, 11.6  | 3.8            | Agrees                | 3.8        |
| 11.6    | Green regulations (Regulatory Affairs Managers)                                           | 12.5, 11.6 | 12.6           | Agrees                | 4.4        |
| 11.6    | Collector & Roof Mounting (Solar Thermal Installers and Technicians)                      | 7.1, 11.6  | 4.4            | Disagrees: 7.2        | 7.2, 7.1   |
| 11.6    | Site assessment (Traffic Technicians)                                                     | 8.8, 11.6  | 16.6           | Agrees                | 16.6       |
| 11.6    | Traffic impact reviews (Transportation Engineers)                                         | 11.6, 4.4  | 4.4, 11.2      | Agrees                | 4.4        |
| 11.6    | Tree health support (Tree Trimmers and Pruners)                                           | 11.6       | 4.4            | Agrees                | 4.4        |
| 11.6    | Sustainable planning design (Urban and Regional Planners)                                 | 11.6, 12.5 | 11.6, 11.3     | Agrees                | 11.6, 11.3 |
| 11.6    | Hydraulic modeling (Water Resource Specialists)                                           | 9.4, 11.6  | 9.1            | Agrees                | 4.4        |
| 11.6    | Hydraulic system analysis (Water/Wastewater Engineers)                                    | 11.6, 8.2  | 8.2            | Disagrees: 8.2, 6.1   | 8.2        |
| 11.6    | Site Coordination (Wind Energy Development Managers)                                      | 11.6       | 7.2            | Agrees                | 7.2        |
| 12.4    | Plant protection and records (Forest and Conservation Workers)                            | 15.1, 12.4 | 4.4            | Agrees                | 4.4        |
| 12.8    | Sales and customer advice (Farmers, Ranchers, and Other Agricultural Managers)            | 8.2, 12.8  | 4.4            | Agrees                | 4.4        |
| 13.1    | Resource planning and response (Farmers, Ranchers, and Other Agricultural Managers)       | 1.2, 13.1  | 13.1           | Agrees                | 13.1       |
| 13.2    | Sustainability Risk Assessment (Chief Sustainability Officers)                            | 12.5, 13.2 | 4.4            | Disagrees: 16.6       | 16.6       |
| 13.2    | Field sampling (Environmental Science and Protection Technicians, Including Health)       | 13.2, 6.3  | 6.3, 3.9       | Agrees                | 6.3, 3.9   |
| 13.2    | Pollution monitoring (Environmental Science and Protection Technicians, Including Health) | 12.5, 13.2 | 12.5, 12.4     | Agrees                | 12.5       |
| 13.2    | Fire hazard inspections (Forest Fire Inspectors and Prevention Specialists)               | 13.2, 15.1 | 15.1           | Agrees                | 15.1       |
| 13.2    | Fire patrol and monitoring (Forest Fire Inspectors and Prevention Specialists)            | 13.2, 15.1 | 15.1           | Agrees                | 15.1       |
| 13.2    | Fire reporting and records (Forest Fire Inspectors and Prevention Specialists)            | 13.2, 15.1 | 4.4            | Disagrees: 15.1       | 15.1       |
| 13.2    | Fire crew leadership (Forest Fire Inspectors and Prevention Specialists)                  | 8.8, 13.2  | 8.8            | Agrees                | 8.8        |
| 13.2    | Public safety and regulation (Forest Fire Inspectors and Prevention Specialists)          | 4.4, 13.2  | 4.4, 16.6      | Agrees                | 4.4, 16.6  |
| 13.2    | Fire and resource protection (Forest and Conservation Technicians)                        | 13.2       | 15.2           | Agrees                | 4.4        |
| 13.2    | Fire and site safety (Forest and Conservation Workers)                                    | 13.2, 8.8  | 11.5           | Agrees                | 11.5       |
| 13.2    | Water field research (Hydrologists)                                                       | 6.4, 13.2  | 6.4            | Agrees                | 6.4        |
| 13.2    | Climate and ice studies (Hydrologists)                                                    | 13.1, 13.2 | 4.4            | Disagrees: 13.1       | 13.1       |
| 13.2    | Environmental applications (Remote Sensing Scientists and Technologists)                  | 13.2, 15.1 | 15.1, 15.2     | Agrees                | 15.1       |
| 13.2    | Insulation and sealing (Weatherization Installers and Technicians)                        | 13.2, 7.3  | 7.3            | Agrees                | 7.3        |
| 14.2    | Livestock and fish management (Farmers, Ranchers, and Other Agricultural Managers)        | 2.4, 14.2  | 2.4            | Agrees                | 2.4        |
| 14.2    | Water quality evaluation (Hydrologists)                                                   | 6.3, 14.2  | 6.3            | Agrees                | 6.3        |
| 16.6    | Records and documentation (Counter and Rental Clerks)                                     | 16.6       | 4.4            | Agrees                | 4.4        |
| 16.6    | Operational logging (Furnace, Kiln, Oven, Drier, and Kettle Operators and Tenders)        | 16.6       | 4.4            | Agrees                | 4.4        |

## The review's disagreements

The 37 corners where Claude Sonnet 5.5 disagreed with the pass, with the decision on its fix. Final also includes the recheck and the reason check.

| Skill (job)                                                                                   | Before     | After the pass | Sonnet 5.5    | Decision | Final         | Why                                                                                                                             |
| --------------------------------------------------------------------------------------------- | ---------- | -------------- | ------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Client and farmer advice (Agricultural Engineers)                                             | 6.3, 2.4   | 6.3            | 6.3, 2.4      | Accepted | 6.3, 2.4      | Its tasks teach farmers to raise productivity, which 2.4 names                                                                  |
| Water and land systems (Agricultural Engineers)                                               | 6.6, 12.5  | 9.1            | 15.3, 2.4     | In part  | 9.1, 2.4      | Rural power and irrigation systems are infrastructure, so 9.1 stays; soil and water conservation adds 2.4                       |
| Sample collection (Agricultural Inspectors)                                                   | 3.9, 8.2   | 4.4            | 3.3           | Accepted | 3.3           | Testing samples for microbes tracks disease, as 3.3's reason says                                                               |
| Policy and planning advice (Anthropologists and Archeologists)                                | 11.6, 8.5  | 8.5, 16.6      | 16.6          | Declined | 8.5           | 8.5 fits any job skill; the reason check then dropped 16.6, whose reason is about records                                       |
| Celestial measurements (Astronomers)                                                          | 9.4        | 9.5            | 4.4           | Declined | 9.5           | 9.5 begins "Enhance scientific research", which this is                                                                         |
| Feedstock handling and mixing (Biomass Plant Technicians)                                     | 8.2        | 4.4            | 8.2           | Accepted | 8.2, 7.2      | Tuning mixing ratios for energy efficiency raises efficiency, as 8.2 asks                                                       |
| Regulatory Compliance (Biomass Power Plant Managers)                                          | 12.5       | 16.6           | 4.4           | Declined | 16.6          | The rule counts compliance work for 16.6                                                                                        |
| Sustainability Risk Assessment (Chief Sustainability Officers)                                | 12.5, 13.2 | 4.4            | 16.6          | Accepted | 16.6          | Reviewing programs for compliance is compliance work, which the rule counts for 16.6                                            |
| Institutional service (Communications Teachers, Postsecondary)                                | 16.6       | 4.4            | 16.6          | Declined | 4.4           | A college may be private; 16.6 needs a public body or accountability work                                                       |
| Environmental Standards (Construction Managers)                                               | 12.5, 11.6 | 11.6           | 12.6          | Declined | 11.6          | Environmental programs on building projects fit 11.6, so the pass stands                                                        |
| Derrick inspection and care (Derrick Operators, Oil and Gas)                                  | 8.8        | 4.4            | 8.8           | Declined | 4.4           | Checking derricks for flaws is upkeep; nothing says it is for the crew's safety                                                 |
| Impact monitoring (Environmental Scientists and Specialists, Including Health)                | 12.5, 11.6 | 12.4           | 12.4, 11.6    | Declined | 4.4           | Development impacts aren't a city's; the reason check then dropped 12.4, whose reason is about pest control                     |
| Preventive advice (Family Medicine Physicians)                                                | 3.8        | 4.4            | 3.8           | Accepted | 3.8           | Counselling patients on prevention is a health service, 3.8                                                                     |
| Fire cause analysis (Fire-Prevention and Protection Engineers)                                | 8.2, 12.5  | 16.6           | 9.5           | Accepted | 9.5           | Fire safety research is scientific research, 9.5; 16.6 needed a public employer                                                 |
| Fire reporting and records (Forest Fire Inspectors and Prevention Specialists)                | 13.2, 15.1 | 4.4            | 15.1          | Accepted | 15.1          | Matches the inspectors' other fire corners, which kept 15.1                                                                     |
| Site cleanup and containment (Hazardous Materials Removal Workers)                            | 8.8, 11.6  | 12.4           | 12.4, 8.8     | Declined | 4.4           | Containment stops spread to the environment; workers' safety isn't stated                                                       |
| Roadside cleanup (Highway Maintenance Workers)                                                | 11.6       | 4.4            | 11.6          | Accepted | 11.6          | Clearing litter and debris is the waste management 11.6 names                                                                   |
| Data quality control (Hydrologic Technicians)                                                 | 4.4, 9.1   | 4.4            | 6.3           | In part  | 4.4           | Pollution data on water bodies fits 6.3's text, but the reason check dropped it: its reason is about testing and treating water |
| Climate and ice studies (Hydrologists)                                                        | 13.1, 13.2 | 4.4            | 13.1          | Accepted | 13.1          | Climate and storm assessments measure climate hazards, which the rule counts for 13.1                                           |
| Molten metal handling (Metal-Refining Furnace Operators and Tenders)                          | 8.8        | 4.4            | 8.8           | Declined | 4.4           | The statements are about moving metal without spills, not workers' safety                                                       |
| Quality Inspection (Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic) | 8.2        | 4.4            | 8.2           | Declined | 4.4           | Inspecting and measuring parts is quality checking, which the rule leaves out of 8.2                                            |
| Nano Design (Nanosystems Engineers)                                                           | 8.2, 12.5  | 8.2            | 8.2, 7.3      | Declined | 8.2           | 7.3's text fits, but its reason is about insulating buildings, which isn't true of nano design                                  |
| Patient risk histories (Preventive Medicine Physicians)                                       | 3.8, 4.4   | 4.4            | 3.8, 3.3      | In part  | 3.8, 4.4      | Finding at-risk groups is preventive health care, 3.8; 3.3 covers only communicable disease                                     |
| Stakeholder coordination (Range Managers)                                                     | 16.6, 15.1 | 16.6           | 16.6, 15.1    | Accepted | 16.6, 15.1    | Mediating land use agreements to protect rangelands fits 15.1                                                                   |
| Compliance and inspection (Recycling Coordinators)                                            | 16.6, 8.8  | 16.6           | 16.6, 8.8     | Declined | 16.6          | Facility safety standards aren't stated as workers' safety                                                                      |
| System installation (Robotics Technicians)                                                    | 8.2        | 4.4            | 8.2           | Accepted | 8.2           | Installing robots for production is technological upgrading, 8.2                                                                |
| Plant growth experiments (Soil and Plant Scientists)                                          | 2.3, 4.4   | 4.4            | 2.3, 4.4      | Accepted | 2.3, 4.4      | Breeding higher-yield crops adds the farming knowledge 2.3 names                                                                |
| Inverter configuration and testing (Solar Photovoltaic Installers)                            | 8.2, 7.2   | 8.2            | 8.2, 7.2      | Accepted | 8.2, 7.2, 7.1 | Configuring solar inverters puts renewable power to use, 7.2                                                                    |
| System activation and inspection (Solar Photovoltaic Installers)                              | 7.1, 9.4   | 4.4            | 7.2           | Accepted | 7.2, 7.1      | Starting up solar systems fits 7.2                                                                                              |
| Collector & Roof Mounting (Solar Thermal Installers and Technicians)                          | 7.1, 11.6  | 4.4            | 7.2           | Accepted | 7.2, 7.1      | Mounting solar collectors fits 7.2                                                                                              |
| Digital conversion (Sound Engineering Technicians)                                            | 8.2        | 4.4            | 8.2           | Declined | 4.4           | No gain in output or efficiency is stated, which the rule needs for 8.2                                                         |
| Cargo securing checks (Transportation Inspectors)                                             | 8.8        | 4.4            | 8.8           | Declined | 4.4           | Bracing loads is cargo safety, not workers' safety                                                                              |
| Environmental impact studies (Water/Wastewater Engineers)                                     | 6.6, 12.5  | 6.3            | 6.3, 6.4      | Accepted | 6.3, 6.4      | Water use data and efficiency reviews fit 6.4                                                                                   |
| Hydraulic system analysis (Water/Wastewater Engineers)                                        | 11.6, 8.2  | 8.2            | 8.2, 6.1      | Declined | 8.2           | Modelling flow in networks is a step away from access to drinking water                                                         |
| Treatment plant design (Water/Wastewater Engineers)                                           | 6.1, 9.4   | 9.1            | 9.1, 6.1, 6.3 | Accepted | 6.1, 6.3      | Water supply design fits 6.1 and treatment plants 6.3; the reason check dropped 9.1, whose reason is about upkeep               |
| Web testing and updates (Web Developers)                                                      | 8.2, 8.8   | 4.4            | 8.2           | Declined | 4.4           | Testing and routine updates are upkeep, which the rule leaves out of 8.2                                                        |
| Site maintenance and SEO (Web and Digital Interface Designers)                                | 8.2        | 4.4            | 8.2           | Declined | 4.4           | Routine updates and search listing are upkeep and marketing, not technological upgrading                                        |

## The review sample

The 87 sampled corners, by stratum. Claude Sonnet 5.5 agreed on 64; the disagreements are in the table above.

| Stratum       | Skill (job)                                                                                                                                 | Before     | After the pass | Sonnet 5.5               | Final         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------- | ------------------------ | ------------- |
| removed 10.2  | Guest assistance (Baggage Porters and Bellhops)                                                                                             | 8.5, 10.2  | 8.5            | Agrees                   | 8.5           |
| removed 12.2  | Program Evaluation (Chief Sustainability Officers)                                                                                          | 4.4, 12.2  | 4.4            | Agrees                   | 4.4           |
| removed 12.4  | Sample collection (Hydrologic Technicians)                                                                                                  | 6.3, 12.4  | 6.3            | Agrees                   | 6.3           |
| removed 12.5  | Kitchen supply management (Cooks, Private Household)                                                                                        | 12.5, 4.4  | 4.4            | Agrees                   | 4.4           |
| removed 12.5  | Nano Design (Nanosystems Engineers)                                                                                                         | 8.2, 12.5  | 8.2            | Disagrees: 8.2, 7.3      | 8.2           |
| removed 13.1  | Water measurement (Hydrologic Technicians)                                                                                                  | 6.4, 13.1  | 6.4            | Agrees                   | 6.4           |
| removed 15.1  | Stakeholder coordination (Range Managers)                                                                                                   | 16.6, 15.1 | 16.6           | Disagrees: 16.6, 15.1    | 16.6, 15.1    |
| removed 16.6  | Emergency response and coordination (Chemical Plant and System Operators)                                                                   | 8.8, 16.6  | 8.8            | Agrees                   | 8.8           |
| removed 16.6  | Medical records (Nurse Midwives)                                                                                                            | 16.6, 8.5  | 8.5            | Agrees                   | 8.5           |
| removed 2.3   | Plant growth experiments (Soil and Plant Scientists)                                                                                        | 2.3, 4.4   | 4.4            | Disagrees: 2.3, 4.4      | 2.3, 4.4      |
| removed 2.4   | Client and farmer advice (Agricultural Engineers)                                                                                           | 6.3, 2.4   | 6.3            | Disagrees: 6.3, 2.4      | 6.3, 2.4      |
| removed 3.8   | Special diet cooking (Cooks, Private Household)                                                                                             | 3.8, 4.4   | 4.4            | Agrees                   | 4.4           |
| removed 3.8   | Patient risk histories (Preventive Medicine Physicians)                                                                                     | 3.8, 4.4   | 4.4            | Disagrees: 3.8, 3.3      | 3.8, 4.4      |
| removed 7.1   | Controls & Monitoring Setup (Solar Thermal Installers and Technicians)                                                                      | 7.1, 8.2   | 8.2            | Agrees                   | 8.2, 7.1, 7.2 |
| removed 7.2   | Inverter configuration and testing (Solar Photovoltaic Installers)                                                                          | 8.2, 7.2   | 8.2            | Disagrees: 8.2, 7.2      | 8.2, 7.2, 7.1 |
| removed 8.2   | Menu and recipe design (Cooks, Private Household)                                                                                           | 4.4, 8.2   | 4.4            | Agrees                   | 4.4           |
| removed 8.2   | Assembly and repair (Helpers--Installation, Maintenance, and Repair Workers)                                                                | 4.4, 8.2   | 4.4            | Agrees                   | 4.4           |
| removed 8.2   | Demand forecasting and coordination (Supply Chain Managers)                                                                                 | 8.2, 4.4   | 4.4            | Agrees                   | 4.4           |
| removed 8.8   | Emergency and Compliance (Captains, Mates, and Pilots of Water Vessels)                                                                     | 8.8, 16.6  | 16.6           | Agrees                   | 16.6          |
| removed 8.8   | Compliance and inspection (Recycling Coordinators)                                                                                          | 16.6, 8.8  | 16.6           | Disagrees: 16.6, 8.8     | 16.6          |
| removed 9.4   | Designing electrical systems (Electrical and Electronics Drafters)                                                                          | 9.4, 4.4   | 4.4            | Agrees                   | 4.4           |
| retagged 1.1  | Client Support (Social and Community Service Managers)                                                                                      | 1.1        | 4.4            | Agrees                   | 4.4           |
| retagged 10.2 | Passenger boarding support (Passenger Attendants)                                                                                           | 10.2, 8.5  | 8.5, 11.2      | Agrees                   | 8.5           |
| retagged 12.3 | Compliance inspections (Agricultural Inspectors)                                                                                            | 8.5, 12.3  | 8.5, 16.6      | Agrees                   | 8.5, 16.6     |
| retagged 12.5 | Regulatory Compliance (Biomass Power Plant Managers)                                                                                        | 12.5       | 16.6           | Disagrees: 4.4           | 16.6          |
| retagged 12.5 | Lawn maintenance routines (Landscaping and Groundskeeping Workers)                                                                          | 12.5       | 4.4            | Agrees                   | 4.4           |
| retagged 12.5 | Maintenance and inventory (Mobile Heavy Equipment Mechanics, Except Engines)                                                                | 12.5       | 4.4            | Agrees                   | 4.4           |
| retagged 12.5 | Output handling (Paper Goods Machine Setters, Operators, and Tenders)                                                                       | 12.5       | 4.4            | Agrees                   | 4.4           |
| retagged 12.5 | Shipment verification (Shipping, Receiving, and Inventory Clerks)                                                                           | 12.5       | 4.4            | Agrees                   | 4.4           |
| retagged 12.5 | Regulatory compliance review (Urban and Regional Planners)                                                                                  | 12.5       | 16.6           | Agrees                   | 16.6          |
| retagged 15.1 | Site prep and contracts (Foresters)                                                                                                         | 8.5, 15.1  | 8.5, 15.2      | Agrees                   | 8.5, 15.2     |
| retagged 15.3 | Pest and soil control (Soil and Plant Scientists)                                                                                           | 12.4, 15.3 | 12.4, 2.4      | Agrees                   | 12.4, 2.4     |
| retagged 16.6 | Budget policy development (Budget Analysts)                                                                                                 | 16.6       | 4.4            | Agrees                   | 4.4           |
| retagged 16.6 | Institutional service (Communications Teachers, Postsecondary)                                                                              | 16.6       | 4.4            | Disagrees: 16.6          | 4.4           |
| retagged 16.6 | Policy Standards (Document Management Specialists)                                                                                          | 16.6       | 4.4            | Agrees                   | 4.4           |
| retagged 16.6 | Clinic administration (Podiatrists)                                                                                                         | 16.6       | 4.4            | Agrees                   | 4.4           |
| retagged 16.6 | Transaction compliance and review (Real Estate Brokers)                                                                                     | 16.6       | 4.4            | Agrees                   | 4.4           |
| retagged 16.6 | Invoice and return approval (Wholesale and Retail Buyers, Except Farm Products)                                                             | 16.6       | 4.4            | Agrees                   | 4.4           |
| retagged 2.3  | Field and crop inspection (First-Line Supervisors of Farming, Fishing, and Forestry Workers)                                                | 2.3        | 2.4            | Agrees                   | 2.4           |
| retagged 3.8  | Preventive advice (Family Medicine Physicians)                                                                                              | 3.8        | 4.4            | Disagrees: 3.8           | 3.8           |
| retagged 3.8  | Meal quality checks (Food Servers, Nonrestaurant)                                                                                           | 3.8, 12.5  | 4.4            | Agrees                   | 4.4           |
| retagged 3.9  | Sample collection (Agricultural Inspectors)                                                                                                 | 3.9, 8.2   | 4.4            | Disagrees: 3.3           | 3.3           |
| retagged 6.1  | Treatment plant design (Water/Wastewater Engineers)                                                                                         | 6.1, 9.4   | 9.1            | Disagrees: 9.1, 6.1, 6.3 | 6.1, 6.3      |
| retagged 6.4  | Plumbing & Piping Systems (Solar Thermal Installers and Technicians)                                                                        | 6.4, 9.4   | 4.4            | Agrees                   | 7.1, 7.2      |
| retagged 6.6  | Environmental impact studies (Water/Wastewater Engineers)                                                                                   | 6.6, 12.5  | 6.3            | Disagrees: 6.3, 6.4      | 6.3, 6.4      |
| retagged 7.1  | System activation and inspection (Solar Photovoltaic Installers)                                                                            | 7.1, 9.4   | 4.4            | Disagrees: 7.2           | 7.2, 7.1      |
| retagged 8.2  | Feedstock handling and mixing (Biomass Plant Technicians)                                                                                   | 8.2        | 4.4            | Disagrees: 8.2           | 8.2, 7.2      |
| retagged 8.2  | Data infrastructure (Biostatisticians)                                                                                                      | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Research and updates (Chemistry Teachers, Postsecondary)                                                                                    | 8.2        | 9.5            | Agrees                   | 9.5           |
| retagged 8.2  | Mixing dental materials (Dental Laboratory Technicians)                                                                                     | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Fire cause analysis (Fire-Prevention and Protection Engineers)                                                                              | 8.2, 12.5  | 16.6           | Disagrees: 9.5           | 9.5           |
| retagged 8.2  | Equipment and seedling checks (Forest and Conservation Workers)                                                                             | 8.2, 12.5  | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Promotional materials (Fundraising Managers)                                                                                                | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Compressor controls (Gas Compressor and Gas Pumping Station Operators)                                                                      | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Cutting operation (Milling and Planing Machine Setters, Operators, and Tenders, Metal and Plastic)                                          | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Quality Inspection (Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic)                                               | 8.2        | 4.4            | Disagrees: 8.2           | 4.4           |
| retagged 8.2  | Digital content production (News Analysts, Reporters, and Journalists)                                                                      | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Coating Application (Plating Machine Setters, Operators, and Tenders, Metal and Plastic)                                                    | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Control equipment operation (Power Distributors and Dispatchers)                                                                            | 8.2        | 7.1            | Agrees                   | 4.4           |
| retagged 8.2  | Milestone monitoring (Project Management Specialists)                                                                                       | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | PR strategy planning (Public Relations Specialists)                                                                                         | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Conduct field research (Recreation and Fitness Studies Teachers, Postsecondary)                                                             | 8.2        | 9.5            | Agrees                   | 9.5           |
| retagged 8.2  | System installation (Robotics Technicians)                                                                                                  | 8.2        | 4.4            | Disagrees: 8.2           | 8.2           |
| retagged 8.2  | Product knowledge and planning (Sales Engineers)                                                                                            | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Digital conversion (Sound Engineering Technicians)                                                                                          | 8.2        | 4.4            | Disagrees: 8.2           | 4.4           |
| retagged 8.2  | Material shaping (Tool and Die Makers)                                                                                                      | 8.2        | 4.4            | Agrees                   | 4.4           |
| retagged 8.2  | Site maintenance and SEO (Web and Digital Interface Designers)                                                                              | 8.2        | 4.4            | Disagrees: 8.2           | 4.4           |
| retagged 8.8  | Accident investigation and testing (Aviation Inspectors)                                                                                    | 8.8        | 16.6           | Agrees                   | 16.6          |
| retagged 8.8  | Equipment maintenance and inspection (Biomass Plant Technicians)                                                                            | 8.8        | 4.4            | Agrees                   | 7.1, 7.2      |
| retagged 8.8  | Inspection and testing (Boilermakers)                                                                                                       | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Repairing damaged masonry (Brickmasons and Blockmasons)                                                                                     | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Derrick inspection and care (Derrick Operators, Oil and Gas)                                                                                | 8.8        | 4.4            | Disagrees: 8.8           | 4.4           |
| retagged 8.8  | Kitchen hygiene and waste (Food Preparation Workers)                                                                                        | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Equipment monitoring and repair (Grinding, Lapping, Polishing, and Buffing Machine Tool Setters, Operators, and Tenders, Metal and Plastic) | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Facility upkeep (Lifeguards, Ski Patrol, and Other Recreational Protective Service Workers)                                                 | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Track monitoring (Locomotive Engineers)                                                                                                     | 8.8        | 9.1            | Agrees                   | 9.1           |
| retagged 8.8  | Quality assurance (Medical Dosimetrists)                                                                                                    | 8.8, 4.4   | 4.4, 8.2       | Agrees                   | 4.4, 8.2      |
| retagged 8.8  | Molten metal handling (Metal-Refining Furnace Operators and Tenders)                                                                        | 8.8        | 4.4            | Disagrees: 8.8           | 4.4           |
| retagged 8.8  | Maintenance and records (Mixing and Blending Machine Setters, Operators, and Tenders)                                                       | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Classroom management (Preschool Teachers, Except Special Education)                                                                         | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Track patrol and cleaning (Rail-Track Laying and Maintenance Equipment Operators)                                                           | 8.8        | 9.1            | Agrees                   | 9.1           |
| retagged 8.8  | Maintaining saw tools (Sawing Machine Setters, Operators, and Tenders, Wood)                                                                | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Problem reporting (Textile Winding, Twisting, and Drawing Out Machine Setters, Operators, and Tenders)                                      | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Check credentials (Transit and Railroad Police)                                                                                             | 8.8        | 4.4            | Agrees                   | 4.4           |
| retagged 8.8  | Cargo securing checks (Transportation Inspectors)                                                                                           | 8.8        | 4.4            | Disagrees: 8.8           | 4.4           |
| retagged 9.4  | Road building and clearing (Logging Equipment Operators)                                                                                    | 9.4        | 8.5            | Agrees                   | 8.5           |
| retagged 9.4  | Risk assessment (Penetration Testers)                                                                                                       | 9.4        | 4.4            | Agrees                   | 4.4           |

## The second review's recheck

An independent AI review of PR #414 read 40 random corners and found 38 fine. It found two gaps in recall: 88 corners had lost 3.8, many of them health care, and the energy targets were uneven, with 7.1 down from 9 corners to 1 and the solar installers' corners carrying different targets for the same kind of work. Claude Sonnet 5.5 judged these targets again with the fit rule and these readings:

> - 3.8: giving people health care (examining, diagnosing, treating, nursing or caring for patients, preventing disease, immunising, or teaching patients about their health) is the access to quality essential health-care services the target names. Health research, administration, and fitness or wellness work are not.
> - 7.1: installing, running, maintaining or planning systems that generate or deliver energy, such as power plants, grids, and solar or wind systems, supports access to reliable, modern energy services.
> - 7.2: the same work on renewable sources (solar, wind, hydro, geothermal, bioenergy) raises the renewable share of energy.
> - 7.3: work that cuts the energy that buildings, equipment or processes use, such as insulating, sealing, energy audits and efficiency upgrades.

### 3.8 in health care

It judged 3.8 on all 88 corners that had lost it and on 2 health corners the review named. 3.8 fits 34 of them, and all 34 carry it now. The other 56 are mostly research, administration, wellness, animal care and incidental first aid.

| Skill (job)                                                                           | Before    | Final     |
| ------------------------------------------------------------------------------------- | --------- | --------- |
| Patient communication (Cardiovascular Technologists and Technicians)                  | 3.8       | 3.8       |
| Personal and family counseling (Child, Family, and School Social Workers)             | 3.8       | 16.1, 3.8 |
| Client follow-up (Community Health Workers)                                           | 3.8       | 3.8       |
| Health education (Community Health Workers)                                           | 3.8, 4.4  | 4.4, 3.8  |
| Chromosome analysis (Cytogenetic Technologists)                                       | 4.4, 3.8  | 4.4, 3.8  |
| Care coordination (Dietetic Technicians)                                              | 3.8       | 3.8       |
| Menu planning (Dietetic Technicians)                                                  | 3.8       | 3.8       |
| Nutrition research (Dietitians and Nutritionists)                                     | 3.8       | 3.8       |
| Patient comfort (Emergency Medical Technicians)                                       | 3.8       | 3.8       |
| Health advisory (Epidemiologists)                                                     | 3.8       | 3.3, 3.8  |
| Patient communication (Family Medicine Physicians)                                    | 3.8       | 3.8       |
| Emergency response (Flight Attendants)                                                | 8.8, 3.8  | 3.8       |
| Public health outreach (Health Education Specialists)                                 | 3.8, 4.4  | 4.4, 3.8  |
| Family support (Healthcare Social Workers)                                            | 3.8, 8.5  | 8.5, 3.8  |
| Daily living assistance (Home Health Aides)                                           | 3.8, 8.5  | 8.5, 3.8  |
| Nutrition and housekeeping (Home Health Aides)                                        | 3.8, 12.5 | 3.8       |
| Patient engagement and exercise (Home Health Aides)                                   | 3.8, 8.5  | 8.5, 3.8  |
| Patient communication (Licensed Practical and Licensed Vocational Nurses)             | 3.8, 4.4  | 4.4, 3.8  |
| Patient Education (Neuropsychologists)                                                | 3.8       | 3.8       |
| Cosmetic and laser procedures (Oral and Maxillofacial Surgeons)                       | 3.8       | 3.8       |
| Caregiver education (Physical Therapist Assistants)                                   | 4.4, 3.8  | 4.4, 3.8  |
| Device management (Physical Therapists)                                               | 8.2       | 3.8       |
| Health surveillance tools (Preventive Medicine Physicians)                            | 3.8, 8.2  | 3.8       |
| Prevention program management (Preventive Medicine Physicians)                        | 8.5, 3.8  | 8.5, 3.8  |
| Rehabilitation counseling (Probation Officers and Correctional Treatment Specialists) | 3.8, 16.6 | 3.8       |
| Recreational activity support (Psychiatric Aides)                                     | 3.8       | 3.8       |
| Patient communication (Radiologists)                                                  | 3.8       | 3.8       |
| Health education (Registered Nurses)                                                  | 3.8, 4.4  | 4.4, 3.8  |
| Custom and orthopedic fitting (Shoe and Leather Workers and Repairers)                | 3.8, 4.4  | 4.4, 3.8  |
| Injury assessment (Sports Medicine Physicians)                                        | 3.8       | 3.8       |
| Prevention advice (Sports Medicine Physicians)                                        | 3.8, 4.4  | 4.4, 3.8  |
| Treatment planning (Sports Medicine Physicians)                                       | 3.8       | 3.8       |
| Therapeutic support (Teaching Assistants, Special Education)                          | 4.4, 3.8  | 4.4, 3.8  |
| Safety and care (Travel Guides)                                                       | 3.8, 8.8  | 3.8       |

### Energy

It judged 7.1, 7.2 and 7.3 on every corner of 26 energy jobs and on 3 other corners that had one of them. 7.1 fit 92, 7.2 fit 84 and 7.3 fit 25, and after the reason check 59, 79 and 14 carry them.

| Job                                                            | Corners | 7.1 before → after | 7.2 before → after | 7.3 before → after |
| -------------------------------------------------------------- | ------- | ------------------ | ------------------ | ------------------ |
| Biofuels Processing Technicians                                | 6       | 0 → 0              | 0 → 6              | 0 → 0              |
| Biofuels Production Managers                                   | 6       | 0 → 0              | 0 → 2              | 0 → 0              |
| Biofuels/Biodiesel Technology and Product Development Managers | 6       | 0 → 0              | 0 → 4              | 0 → 0              |
| Biomass Plant Technicians                                      | 6       | 0 → 1              | 0 → 3              | 0 → 0              |
| Biomass Power Plant Managers                                   | 6       | 0 → 1              | 0 → 2              | 0 → 0              |
| Electrical Power-Line Installers and Repairers                 | 6       | 0 → 5              | 0 → 0              | 0 → 0              |
| Energy Auditors                                                | 6       | 0 → 0              | 0 → 0              | 0 → 4              |
| Energy Engineers, Except Wind and Solar                        | 6       | 0 → 0              | 0 → 0              | 0 → 5              |
| Fuel Cell Engineers                                            | 6       | 0 → 1              | 0 → 0              | 0 → 0              |
| Geothermal Production Managers                                 | 6       | 0 → 2              | 0 → 3              | 0 → 0              |
| Geothermal Technicians                                         | 6       | 0 → 5              | 0 → 5              | 0 → 0              |
| Heavy and Tractor-Trailer Truck Drivers                        | 1       | 0 → 0              | 0 → 0              | 0 → 0              |
| Hydroelectric Plant Technicians                                | 6       | 0 → 3              | 0 → 5              | 0 → 0              |
| Hydroelectric Production Managers                              | 6       | 0 → 2              | 2 → 4              | 0 → 0              |
| Nuclear Power Reactor Operators                                | 6       | 0 → 2              | 0 → 0              | 0 → 0              |
| Plasterers and Stucco Masons                                   | 1       | 0 → 0              | 0 → 0              | 0 → 1              |
| Power Distributors and Dispatchers                             | 6       | 0 → 4              | 0 → 0              | 0 → 0              |
| Power Plant Operators                                          | 6       | 0 → 1              | 1 → 0              | 0 → 0              |
| Roofers                                                        | 1       | 1 → 0              | 0 → 0              | 0 → 1              |
| Solar Energy Installation Managers                             | 6       | 0 → 4              | 2 → 6              | 0 → 0              |
| Solar Energy Systems Engineers                                 | 6       | 0 → 6              | 0 → 6              | 0 → 0              |
| Solar Photovoltaic Installers                                  | 6       | 3 → 6              | 2 → 6              | 0 → 0              |
| Solar Sales Representatives and Assessors                      | 6       | 1 → 4              | 0 → 4              | 0 → 0              |
| Solar Thermal Installers and Technicians                       | 6       | 4 → 6              | 0 → 6              | 0 → 0              |
| Weatherization Installers and Technicians                      | 6       | 0 → 0              | 0 → 0              | 1 → 3              |
| Wind Energy Development Managers                               | 6       | 0 → 0              | 0 → 5              | 0 → 0              |
| Wind Energy Engineers                                          | 6       | 0 → 2              | 0 → 6              | 0 → 0              |
| Wind Energy Operations Managers                                | 6       | 0 → 1              | 0 → 2              | 0 → 0              |
| Wind Turbine Service Technicians                               | 6       | 0 → 3              | 0 → 4              | 0 → 0              |

### Single tags

| Skill (job)                                                     | Before   | Final    | Claude Sonnet 5.5                                                                                                                                                                                             |
| --------------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auxiliary equipment operation (Nuclear Power Reactor Operators) | 8.2, 8.8 | 8.2, 8.8 | 8.8 fits: Operating reactors to protect workers from radiation and ensure safety is directly about worker safety procedures.                                                                                  |
| Vehicle operation (Couriers and Messengers)                     | 8.8      | 4.4      | 8.8 doesn't fit: Driving safely and doing routine vehicle checks concerns delivery work and maintenance, not clearly workers' own hazards or rights.                                                          |
| Facility security checks (Correctional Officers and Jailers)    | 8.8      | 4.4      | 8.8 doesn't fit: Checks target contraband and escape prevention; the fire, safety and sanitation inspections are not framed around workers' own safety, so this is only loosely linked.                       |
| Breach investigation analysis (Information Security Engineers)  | 16.6     | 4.4      | 16.6 doesn't fit: Security breach investigation and compliance reviews are about computing environments, generally business security; no public institution or accountability link without extra assumptions. |

## The demo roles

The three demo roles' corners before and after. Their verdicts, fit scores and levels didn't change.

### Web Developers

| Skill                            | Before   | After    |
| -------------------------------- | -------- | -------- |
| Web site building                | 4.4, 8.2 | 4.4, 8.2 |
| Web testing and updates          | 8.2, 8.8 | 4.4      |
| Technical documentation          | 4.4      | 4.4      |
| Web design and databases         | 4.4, 8.2 | 4.4, 8.2 |
| Web specifications and standards | 4.4, 8.2 | 4.4      |
| Web performance and support      | 8.2, 8.5 | 8.2, 8.5 |

### Web and Digital Interface Designers

| Skill                                  | Before | After |
| -------------------------------------- | ------ | ----- |
| User research and testing              | 4.4    | 4.4   |
| Web development and coding             | 8.2    | 8.2   |
| Technical specifications and standards | 8.5    | 8.5   |
| Visual design and prototyping          | 4.4    | 4.4   |
| Team collaboration and strategy        | 8.5    | 8.5   |
| Site maintenance and SEO               | 8.2    | 4.4   |

### Bookkeeping, Accounting, and Auditing Clerks

| Skill                     | Before | After |
| ------------------------- | ------ | ----- |
| Accounting software entry | 4.4    | 4.4   |
| Financial data accuracy   | 8.5    | 8.5   |
| Regulatory compliance     | 16.6   | 16.6  |
| Financial calculations    | 4.4    | 4.4   |
| Office administration     | 8.5    | 8.5   |
| Cash handling             | 8.5    | 8.5   |

## Limits

- **AI judgment only.** Two Claude models and the coding agent made every call. No person has checked them, so the corners keep `quality: auto-generated`.
- **Strict on purpose.** The judge removed a tag whenever the link needed an extra step, and 4.4 took the place of most removed tags. That leaves some corners with a broad tag where a specific one might fit: the review restored or added a specific tag on 13 of the 87 sampled corners, and the second review found more in health care and energy. A missing specific tag shows nothing false; a wrong one does.
- **Borderline calls vary.** Run twice, Claude Haiku 5.5's reason check gave a different verdict on 17 of the 253 tags, which is why the final reason check used Claude Sonnet 5.5, and Claude Sonnet 5.5 also flipped some when its groups changed. The cache fixes this run's answers. First aid is one such case: 3.8 came back for Flight Attendants and Travel Guides but not for security guards or police.
- **9.1's reason.** It was written for the monitoring-station tags this pass removed, so the reason check kept 9.1 on only 18 of the 33 corners that gained it, most of them road, rail, sewer and power work whose UN text fits it. A reason that fits construction and repair work would let the rest carry it.
- **7.1's reason.** It names installing and checking energy systems such as solar, so the reason check dropped 7.1 from most corners that run a power plant, even where the recheck found it fits: Power Plant Operators keep it on 1 corner of 6. A reason that covers running power plants would let them carry it.
- **Unused rows.** 1.1, 1.2, 9.4 and 14.2 keep their rows in `data/sdg-reasons.json`, but no skill or job chip uses them now.

## See also

- [SDG reasons review](sdg-reasons-review.md), which flagged the tags
- [Data card](data-card.md)
- [Structured outputs][structured], [prompt caching][caching] and [rate limits][rate-limits] in the Claude API docs

[structured]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
[caching]: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[rate-limits]: https://platform.claude.com/docs/en/api/rate-limits

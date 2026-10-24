# Prior art, SDG mapping and course catalogues

Research behind [CONTEXT.md](/docs/CONTEXT.md) for SDC Hackathon 2026, Domain 1. All sources were accessed on 20 October 2026, and "tested" means we called the endpoint live with curl on that date. Our six must-haves are the yardstick below: (1) continuous AI-trend tracking, (2) matching with an explainable score and skills gap, (3) an ordered reskilling pathway with time estimates and low-cost or HRD Corp routes, (4) meaningful SDG tags, (5) more than one future scenario, (6) a cited source for every recommendation.

Contents:

1.  [Prior art](#prior-art)
    1.  [Prior art white space](#prior-art-white-space)
1.  [SDG mapping resources](#sdg-mapping-resources)
1.  [Course catalogues](#course-catalogues)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## Prior art

- **TalentCorp MyMahir (Malaysia).** For students, professionals and organisations. It has a roles and skills explorer ("800+ skills and 60+ roles"), roles tagged "In-Demand" or "Emerging", Basic, Specific and Technology skill groups per role, a role-compare tool, "140++" training programmes, and an AI Readiness Index for organisations, licensed from AI Singapore. Its [user guide][mymahir-guide] shows user profiling, "My Skills", and an Explorer that returns "roles that match the top 5 selected skills", "recommended skills for upskilling" and training programmes, so MyMahir does skill-based matching. We saw no sign of a numeric match score, time estimates, scenarios or SDG tags. [MyMahir][mymahir], [role page](https://mymahir.my/job/details/2684), [AIRI](https://airi.mymahir.my/)
- **PERKESO MYFutureJobs (Malaysia).** For jobseekers, including PWD, Orang Asli and "Second Chance" groups, and for employers. It does proximity-based matching, advertises "AI-driven skill-based job matching" with no explanation of how it works, and offers counselling and career fairs. It shows no score explanation, trend forecasts, scenarios or SDG links. [MYFutureJobs][myfuturejobs]
- **HRD Corp e-LATiH and e-TRiS (Malaysia).** e-LATiH is an individual learning portal with "over 1000" courses (the same page also says "200+"), in free and premium tiers. A search result attributes "over 2,000 free courses" to the HRD Corp home page, but the live page, rendered by JavaScript, didn't show it. These counts conflict and we have not picked one. e-TRiS is the grant system for employers and training providers. Both are content or funding rails with no matching, gap analysis, trend tracking or SDGs. [e-LATiH about][elatih-about], [Claimable Courses][hrdcorp-claimable], [HRD Corp home page][hrdcorp-home]
- **SkillsFuture / SWDA Jobs-Skills Portal (Singapore).** This is the strongest regional benchmark:
  - The Skills Framework datasets cover job roles, key tasks and skills across 38 sectors and are updated quarterly. They are not open data: the portal's terms forbid republishing them "without the prior written permission of SWDA" ([terms of use](https://jobsandskills.swda.gov.sg/terms-of-use)).
  - The Job-Skills Profile dashboard covers 369 roles. It lists the 25 most defining skills for each role, flagged "high-growth" or "high-ubiquity" from job-posting data.
  - Adjacent-role mobility tools are also available.
  - It is Singapore-only, with no personal explainable score, no AI-scenario switch and no SDG tags.

  [Skills Frameworks](https://jobsandskills.swda.gov.sg/frameworks/skills-frameworks), [Job-Skills Profile][job-skills-profile]

- **LinkedIn Career Explorer.** For job seekers. It gives a 0–100 "skills similarity" score per transition, based on skill overlap weighted by importance in the LinkedIn Skills Genome, and shows the gap as "Skills You'll Need". The data covers the last 5 years, the examples are US-based, and the footer reads © 2024. It is the best precedent for an explainable score, but it has no trend tracking, courses, scenarios or SDG links. [Career Explorer][career-explorer]
- **Lightcast Career Coach and Career Pathways.** Sold to institutions and workforce boards:
  - Career Coach offers assessments, program recommendations through a CIP-to-O\*NET crosswalk, a skills library of 32,000+ skills drawn from job postings, and local job postings that update monthly.
  - Career Pathways labels job moves as Similar, Lateral Transition, Advancement or Lateral Advancement, and shows the skill gaps for each move.
  - The pages we read show no scenarios or SDG links.

  [Career Coach][lightcast-career-coach], [Career Pathways](https://lightcast.io/resources/blog/career-pathways-launch)

- **Coursera Skills Tracks and Career Academy.** Sold to enterprises, governments and campuses:
  - Skills Tracks are role-aligned paths in Data, IT, Software & Product, and GenAI. Coursera says they are "powered by real-time labor market insights", and admin dashboards show skill gaps.
  - Career Academy maps entry-level roles to Professional Certificates.
  - Both are limited to Coursera's own catalogue, with no SDG links or scenarios.

  [Skills Tracks](https://www.coursera.org/business/skill-tracks), [Career Academy](https://blog.coursera.org/introducing-career-academy/)

- **Google Career Certificates and Google Skills.** The certificates are hosted on Coursera and take "3-6 mos … under 10 hours of flexible study per week". They cost US$49 a month in the US and Canada, and graduates can reach an employer consortium. Google Skills, launched in October 2025 as the successor to Cloud Skills Boost, has nearly 3,000 courses and labs. These are content and credentials, not matching tools. [Certificates][google-certificates], [Google Skills blog][google-skills-blog]

[mymahir-guide]: https://www.mymahir.my/assets/document/MyMahir_User_Guide_v1.pdf
[hrdcorp-home]: https://hrdcorp.gov.my/

### Prior art white space

- No product we checked has all six must-haves. Explainable scores exist (LinkedIn's 0–100 score, Lightcast's move types), and so do trend flags (SWDA's high-growth skills, MyMahir's Emerging roles). None of them adds AI-adoption scenarios (for example slow, base and fast) or SDG target tags. [Career Explorer][career-explorer], [Job-Skills Profile][job-skills-profile]
- No Malaysian tool we saw joins skill-based role matching, as MyMahir does, to a numeric match score and to a timed pathway through e-LATiH and HRD Corp-funded training. [MyMahir][mymahir], [e-LATiH][elatih-about]
- Our niche is a Malaysia-first tool for individuals, HR and L&D teams, and TVET centres:
  - Every role or skill change cites a trend source.
  - Every match shows its score breakdown.
  - Every course comes from a live catalogue with a stated duration.
  - SDG tags point to targets and indicators that have Malaysian data.

  [UNSD SDG API][unsd-sdg-api]

## SDG mapping resources

- **UN SDG indicator list.** It has 234 unique indicators (251 listed, because 13 repeat). It reflects the 2025 Comprehensive Review and the 57th Statistical Commission session (March 2026), and comes as PDF and Excel in six languages. [Indicator list][sdg-indicator-list]
- **UNSD SDG API.** It returns JSON and needs no authentication.
  - Tested `GET /sdgapi/v1/sdg/Goal/List?includechildren=true`. It returned the goal, target, indicator and series tree (about 10.9 MB), including the official text of targets 4.3, 4.4, 8.2 and 8.5 and indicators 4.3.1, 4.4.1, 8.2.1, 8.5.1 and 8.5.2.
  - Tested `GET /sdgapi/v1/sdg/Indicator/Data?indicator=4.4.1&areaCode=458`. It returned Malaysian ICT-skill values for 2015 and 2017–2024.
  - So a digital-skill recommendation can cite target 4.4 and Malaysia's actual 4.4.1 figures, not just a goal icon.

  [SDG API][unsd-sdg-api]

- **OSDG Community Dataset.** Licensed CC BY 4.0 on Zenodo; the latest version is v2024.04 (DOI 10.5281/zenodo.11441197). It holds paragraph-length texts validated by more than 1,400 volunteers, with goal-level labels only. Use it to train or evaluate a classifier that tags role and course text to goals. [Zenodo](https://zenodo.org/records/11441197)
- **OSDG tool and API.** The tool is free. The API is "free for research purposes", and others may be charged. It covers 15 languages and needs input of at least 50 words. The page gives no model licence. [OSDG](https://osdg.ai/)
- **Aurora SDG queries.** Scopus-syntax queries: 17 goal queries built from 169 target-level sub-queries. Licensed CC BY 4.0, in XML with an XSD schema, latest version v5.0.3 (July 2021). This is the most direct open route to target-level tags, but the Scopus syntax needs translating before it can match role or course text. [Aurora](https://aurora-network-global.github.io/sdg-queries/)
- **Elsevier 2023 SDG mapping.** Licensed CC BY 4.0, published 13 July 2023. It gives each SDG's Scopus query plus its top keyphrases, at goal level only. [Dataset](https://elsevier.digitalcommonsdata.com/datasets/y2zyy9vwzy/1)
- **ESCO green and digital collections.**
  - **Version and licence:** v1.2.1, updated 10 December 2025, which revised the links between green skills and occupations. Free to reuse for any purpose under Commission Decision 2011/833/EU, provided "The use of ESCO shall be acknowledged by publishing the statement" that the FAQ gives ([ESCO FAQ][esco-faq]).
  - **Formats:** CSV, ODS, JSON-LD, RDF, TTL and XML, plus an API.
  - **Green skills:** `greenSkillsCollection` has 571 concepts (381 skills, 185 knowledge concepts and 5 transversal skills) under Cedefop's definition ([green labelling][esco-green-labelling]).
  - **Digital skills:** `digitalSkillsCollection` has 1,201 concepts, based on DigComp, as shown on the datasets page. These map naturally to target 4.4 and indicator 4.4.1.
  - **Caveat:** linking green labels to specific environmental targets would be our own mapping, and we must document it as such.

  [Datasets][esco-datasets], [v1.2.1][esco-v121]

- **ILO green jobs definition.** Paragraph 13 of the 19th ICLS (2013) guidelines defines green jobs as the part of employment in the environmental sector that "meets the requirements of decent work". The ILO's 2025 handbook still uses this definition. Tag a role "green" plus SDG 8.5 only when it passes both the environmental test and the decent-work test. [ICLS guidelines][ilo-icls], [2025 handbook][ilo-handbook]
- **Occupation or skill to SDG crosswalk.** We found no official one, at goal or target level. If we build our own, publish it as a table where every row cites its basis: an ESCO label, an Aurora target-query hit, or an indicator definition. [ESCO datasets][esco-datasets]

[esco-faq]: https://esco.ec.europa.eu/en/about-esco/faq?page=2&search=
[esco-green-labelling]: https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/green-skills-labelling-esco
[esco-v121]: https://esco.ec.europa.eu/en/about-esco/escopedia/escopedia/esco-v121
[ilo-icls]: https://www.ilo.org/sites/default/files/wcmsp5/groups/public/@dgreports/@stat/documents/normativeinstrument/wcms_230736.pdf
[ilo-handbook]: https://www.ilo.org/sites/default/files/2025-08/Handbook%20on%20measuring%20green%20jobs%20and%20skills%20for%20green%20jobs.pdf

## Course catalogues

- **Microsoft Learn Catalog API (legacy).**
  - **Access:** `GET https://learn.microsoft.com/api/catalog/`, no authentication.
  - **Durations:** `duration_in_minutes` for modules and learning paths, `duration_in_hours` for instructor-led courses. Each record also has `url` and `last_modified`.
  - **Status:** the [overview page][ms-catalog-overview] says it "will continue to function through June 2026, but it is planned for deprecation". Tested, it still returned 200 with 3,463 en-us modules.
  - **Successor:** the Learn Platform API "requires users to be authenticated and applications to be onboarded" ([Platform API][ms-platform-api]). It is free under the Microsoft APIs Terms of Use and refreshes at least daily.
  - **Risk:** low risk of invented courses, but we must migrate to the successor.

  [Reference][ms-catalog-reference], [Platform API][ms-platform-api]

- **Coursera.** The affiliate programme runs on Impact and covers 4,000+ courses and Specializations. It offers banners, text links and a "product merchandiser field updated daily", but documents no catalogue API. The undocumented `api.coursera.org/api/courses.v1` endpoint answered without authentication and returns `workload` (for example "1 hour 30 minutes"), but it is unsupported. Medium risk. [Affiliates](https://www.coursera.org/about/affiliates)
- **edX.** Tested `courses.edx.org/api/courses/v1/courses/`. It returns public JSON with an `effort` field, but the first results were 2015–2016 test courses (for example one named "ntest"). Filter strictly by enrolment dates; high risk of stale links. [edX API](https://courses.edx.org/api/courses/v1/courses/)
- **freeCodeCamp.** Free, with the repository under BSD-3-Clause and stable certification URLs (Responsive Web Design, JavaScript, Python and others). Its [catalogue](https://www.freecodecamp.org/catalog) shows hour estimates on courses (for example "Beginner 5 hours"), but the certifications don't, so any certification-level time estimate would be our own documented assumption. [Repo](https://github.com/freeCodeCamp/freeCodeCamp), [Learn](https://www.freecodecamp.org/learn)
- **MIT OpenCourseWare.** Licensed CC BY-NC-SA 4.0, non-commercial use only. The terms page mentions no API, and course durations are not standardised. [Terms](https://ocw.mit.edu/pages/privacy-and-terms-of-use/)
- **Khan Academy.** The public API was removed in 2020 and its repository archived in 2022. We tested `/api/v1/topictree` and got HTTP 410, so links must be hand-curated. [khan-api](https://github.com/Khan/khan-api)
- **Google Skills and Career Certificates.** The launch post mentions no API or feed. Certificate durations are published (3–6 months at under 10 hours a week), so treat these as a curated list. [Google Skills][google-skills-blog], [Certificates][google-certificates]
- **Class Central.** It lists 250K courses and earns from ads and affiliate links. We found no public API, and it blocks automated fetching. [About](https://www.classcentral.com/about)
- **HRD Corp.**
  - **Claimable Courses page:** it sets the rules (training of at least 4 hours, applied for in e-TRiS before training starts). Its "List of Training Programmes" link is a placeholder (`href="#"`).
  - **Public listings:** e-TRiS has a public listing of 90 events (programme, provider, dates, venue and seats, but no fee) and an anonymous list of 7,937 training providers (contact details only).
  - **Access:** hrdcorp.gov.my sits behind bot protection.
  - **Risk:** with no public list of claimable programmes, never claim a specific course is "HRD Corp-claimable". State the scheme rules and link the provider list instead.

  [Claimable Courses][hrdcorp-claimable], [e-TRiS events][etris-events], [e-TRiS providers][etris-providers]

[ms-catalog-overview]: https://learn.microsoft.com/en-us/training/support/catalog-api
[ms-catalog-reference]: https://learn.microsoft.com/en-us/training/support/catalog-api-developer-reference
[ms-platform-api]: https://learn.microsoft.com/en-us/training/support/integrations-learn-platform-api-catalog
[etris-events]: https://etris.hrdcorp.gov.my/DigiGov/digigovportal.htm?actionFlag=getEventPublish&isAnonymous=true&changeLang=en_US
[etris-providers]: https://etris.hrdcorp.gov.my/DigiGov/digigovportal.htm?actionFlag=SC_getSearchCompoPage&isPopup=0&isAnonymous=true&tableid=row&tableid=row&tableid=row&d-16544-p=999&hideActionBtns=Y&screenMode=edit&elementId=1100889&applicationMstId=1100011&defaultSearchCrt=1100100%7E1%7EN%7EN&changeLang=en_US

## Open questions

The SkillsFuture terms were settled in issue 20: downloads are allowed for offline analysis, but republishing needs SWDA's written permission.

- **Blocked pages:** the MySkillsFuture course portal and the SDFE 2025 page both returned 403. [MySkillsFuture](https://courses.myskillsfuture.gov.sg/), [SDFE 2025](https://jobsandskills.skillsfuture.gov.sg/sdfe-2025)
- **Malaysian tools:** whether MyMahir has a numeric match score, a data API or a data licence, and how MYFutureJobs' "AI-driven" matching works. [MyMahir][mymahir], [MYFutureJobs][myfuturejobs]
- **LinkedIn and Lightcast:** whether Career Explorer is still maintained, the status of LinkedIn Skills Path, and Lightcast's coverage of Malaysia and its licensing terms. [Career Explorer][career-explorer], [Career Coach][lightcast-career-coach]
- **SDG data terms:** the UN indicator data licence, the meaning of the columns in ESCO's `greenShareOcc`, the OSDG model licence, and Elsevier's 2025 mapping (seen only in search results). [Indicator list][sdg-indicator-list], [ESCO datasets][esco-datasets]
- **Course data:** edX's official catalogue API terms, durations for MIT OCW and for freeCodeCamp certifications, and the e-LATiH FAQ (blocked). [e-LATiH][elatih-about]

## See also

- [SDC Hackathon 2026 context](/docs/CONTEXT.md), which these notes support
- [SDC Hackathon 2026 brief](/docs/BRIEF.md)
- [Best practices that win marks under the SDC 2026 rubric](/docs/research/best-practices.md)
- [Comparable hackathon winners](/docs/research/comparable-winners.md)
- [Lineage, people and Malaysian precedent](/docs/research/lineage-and-local.md)
- [Trend and skills data](/docs/research/trend-data.md)

[mymahir]: https://mymahir.my/
[myfuturejobs]: https://myfuturejobs.gov.my/
[elatih-about]: https://elatih.hrdcorp.gov.my/about-us
[hrdcorp-claimable]: https://hrdcorp.gov.my/hrdcorp-claimable-courses
[job-skills-profile]: https://jobsandskills.swda.gov.sg/data-and-tools/dashboards/job-skills-profile
[career-explorer]: https://linkedin.github.io/career-explorer/
[lightcast-career-coach]: https://lightcast.io/solutions/software/career-coach
[google-certificates]: https://grow.google/certificates/
[google-skills-blog]: https://cloud.google.com/blog/topics/training-certifications/google-skills-new-home-ai-learning
[unsd-sdg-api]: https://unstats.un.org/sdgapi/swagger/
[sdg-indicator-list]: https://unstats.un.org/sdgs/indicators/indicators-list/
[esco-datasets]: https://esco.ec.europa.eu/en/structure-esco-downloadable-datasets

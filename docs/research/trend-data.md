# Trend and skills data

Research behind [CONTEXT.md](/docs/CONTEXT.md): open, updatable data for the trend signal layer and role matching. All sources were accessed on 20 October 2026, and "tested" means the endpoint was called on that date.

Contents:

1.  [Candidate sources](#candidate-sources)
    1.  [Occupation and skills taxonomies](#occupation-and-skills-taxonomies)
    1.  [AI-exposure and AI-usage signals](#ai-exposure-and-ai-usage-signals)
    1.  [AI-advancement feeds](#ai-advancement-feeds)
    1.  [Job-market and labour signals relevant to Malaysia](#job-market-and-labour-signals-relevant-to-malaysia)
1.  [Recommended minimal stack](#recommended-minimal-stack)
1.  [Risks and fallbacks](#risks-and-fallbacks)
1.  [Open questions](#open-questions)
1.  [See also](#see-also)

## Candidate sources

### Occupation and skills taxonomies

- **O\*NET 31.0** ([database](https://www.onetcenter.org/database.html), [what's new](https://www.onetcenter.org/whatsnew.html), [Web Services](https://services.onetcenter.org/), [API reference](https://services.onetcenter.org/reference/))
  - Offers: about 900 US occupations with tasks, skills, technology skills, Hot Technologies and Emerging Tasks. Bright Outlook is available through Web Services and O\*NET OnLine, not in the bulk database files. 31.0 came out in late August 2026 and updated Emerging Tasks for 49 occupations. 30.3 (May 2026) lists 176 employer-based Hot Technologies.
  - Access: bulk downloads need no key. Web Services needs a free sign-up and sends the key in an `X-API-Key` header (GET only). Endpoints include `/online/hot_technology/`, `/online/bright_outlook/all` and `/online/occupations/[code]/in_demand_skills`. There is no endpoint for emerging tasks.
  - Limits: "no maximum rate limit", best-effort service, back off at least 200 ms after a 429. Per-day guidance is in the Terms of Service, which I did not read.
  - Licence: CC BY 4.0, with fixed credit text: "includes information from the O\*NET 31.0 Database … Used under the CC BY 4.0 license. O\*NET® is a trademark of USDOL/ETA", plus a modification notice if you change anything.
  - Cadence: quarterly, with the main update in Q3.
  - Malaysia: none (US SOC codes).
  - Fit: the matching backbone. Its skills and tasks feed the skills gap, and it is the key that the AI-usage datasets join on.
- **ESCO v1.2.1** ([API page][esco-api], [web-service API][esco-web-service], [docs][esco-docs])
  - Offers: EU occupations and skills, mapped to ISCO-08, with a `language` parameter. Last update 10/12/2025.
  - Access: tested with no key. `https://ec.europa.eu/esco/api/search?text=data%20scientist&type=occupation&language=en` returned 188 hits.
  - Limits: not stated.
  - Licence: the API software is EUPL 1.2. The data falls under Commission Decision 2011/833/EU: ESCO "can be downloaded, used, reproduced and reused for any purpose and by any interested party free of charge", provided "The use of ESCO shall be acknowledged by publishing the statement" ([ESCO FAQ][esco-faq]).
  - Malaysia: indirect, through ISCO-08, which MASCO is based on.
  - Fit: the ISCO bridge to MASCO, and multilingual skill labels.
- **Crosswalks from O\*NET to ISCO-08** ([O\*NET crosswalks][onet-crosswalks], [BLS ISCO crosswalk][bls-isco], [BLS 2010 to 2018 SOC][bls-soc-2018])
  - Route A: O\*NET-SOC 2019 to SOC 2018 (O\*NET's XLSX: 1,016 codes to 867, each with one parent), back to SOC 2010 (BLS's 2010-to-2018 XLSX: 42 codes split, 31 merged), then to ISCO-08 (BLS's ISCO-08 to 2010 SOC XLS, "August 2012 (Updated June 2015)": 1,123 rows, only 93 clean one-to-one pairs, and "The principle of parsimony was used … not including all the possible matches").
  - Route B: O\*NET's ESCO crosswalk maps 958 O\*NET-SOC codes to 3,341 ESCO codes, which reach 428 ISCO-08 unit groups. O\*NET says it "was performed by combining the use of artificial intelligence (AI) techniques with human validation" ([ESCO to O\*NET][onet-esco]).
  - Gap: no published MASCO 2020 to ISCO-08 correspondence was found; see MASCO below.
  - Fit: the bridge from O\*NET occupations towards Malaysian labels, with a fan-out at every step, so carried data must be weighted or one best match chosen.
- **Lightcast Open Skills** ([API access][lightcast-access], [Open Terms][lightcast-terms])
  - Access: the free tier is for "nonprofit organizations and public-good initiatives, subject to approval". It excludes the occupation taxonomies. Credentials are an OAuth client ID and secret.
  - Limits: 50 skill-extraction requests a month (scope `lightcast_open_free`). The cap applies to skill-extraction requests, and "A commercial license is required for for-profit or production use cases".
  - Licence: Lightcast's own Open Terms, not Creative Commons. Non-commercial use only, attribution required, and Wikipedia-sourced descriptions are CC BY-SA.
  - Fit: poor for a 4.5-day build, because approval is required and the quota is tiny.
- **MASCO 2020** ([MOHR PDF][masco-pdf], [eMASCO][emasco], [DOSM references][dosm-references])
  - Offers: Malaysia's official ISCO-based classification: 10 major, 51 sub-major, 147 minor and 490 unit groups, and 6,630 six-digit codes by the PDF's own table (its prose gives different counts). The Systematical Index also gives each code's MASCO 2013 code, except the 1,585 marked "New".
  - Access: PDF and HTML only. eMASCO, run by MOHR, is a browsable directory with no export or public API, and data.gov.my's catalogue has no MASCO entry. The English PDF (602 pages) extracts cleanly with `pdftotext -layout`, giving about 6,620 six-digit rows.
  - Licence: "@ Ministry of Human Resources 2020. No part of this publication may be reproduced" (PDF page ii); eMASCO's terms bar copying or distributing it for commercial purposes without the ministry's permission. Ask MOHR before publishing a parsed copy.
  - Correspondence to ISCO-08: none found; the PDF says only that MASCO follows ISCO "with changes and modifications". Comparing codes, about 300 of the 490 unit groups line up with ISCO-08 by code and title, 140 have no ISCO-08 code, and some shared codes mean different jobs (MASCO 3151 is aircraft technicians, ISCO 3151 ships' engineers). That last step has to be built and checked by hand.
  - Fit: the Malaysian labels shown to users, and the key that MyCOL and DOSM data use.
- **Singapore's Skills Framework** ([Skills Frameworks page][skillsfuture], [terms of use][swda-terms], [FAQ][swda-faq])
  - Offers: three XLSX downloads, "Updated quarterly": the Skills Framework dataset (Q3 2026, with 2,031 job roles and "job roles, key tasks, and skills across 38 sectors"), the Unique Skills List (September 2026) and the TSC-to-Unique-Skills mapping (June 2026). The portal is now run by SWDA, the Skills & Workforce Development Agency.
  - Licence: not open data. The terms say "You shall not reproduce, republish … or otherwise display or distribute in any way the Contents without the prior written permission of SWDA" and forbid scraping the site; the files aren't on data.gov.sg. The FAQ allows downloading "specific datasets for offline analysis".
  - Fit: a reference for internal analysis only; shipping it in a public repo or app needs SWDA's written permission.

[esco-api]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
[esco-web-service]: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api/esco-web-service-api
[esco-docs]: https://ec.europa.eu/esco/api/doc/esco_api_doc.html
[esco-faq]: https://esco.ec.europa.eu/en/about-esco/faq?page=2&search=
[lightcast-access]: https://docs.lightcast.io/lightcast-api/docs/api-access
[lightcast-terms]: https://legal.lightcast.io/lightcast-legal/open-terms-of-use
[masco-pdf]: https://jtksm.mohr.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf
[dosm-references]: https://www.dosm.gov.my/portal-main/downloadslist/reference?page=6&per-page=10
[skillsfuture]: https://jobsandskills.swda.gov.sg/frameworks/skills-frameworks
[swda-terms]: https://jobsandskills.swda.gov.sg/terms-of-use
[swda-faq]: https://jobsandskills.swda.gov.sg/engage-us/faqs
[emasco]: https://emasco.mohr.gov.my/
[onet-crosswalks]: https://www.onetcenter.org/crosswalks.html
[onet-esco]: https://www.onetcenter.org/crosswalks/esco/ESCO_to_ONET-SOC.xlsx
[bls-isco]: https://www.bls.gov/soc/soccrosswalks.htm
[bls-soc-2018]: https://www.bls.gov/soc/2018/crosswalks.htm

### AI-exposure and AI-usage signals

- **Anthropic Economic Index** ([HF dataset][aei-dataset], [latest data documentation][aei-docs])
  - Offers: `aei_claude_ai_2026-06-26.csv` is 219 MB, with columns `date_start, date_end, geo_id, geo_level, category_name, hierarchy_level, metric_id, value, node_name, node_external_id`. Facets are `onet` (task up to GWA level), `soc_occupation` and `request`. Metrics include automation and augmentation percentages.
  - Malaysia (tested): `geo_id=MYS` rows exist. Usage share by detailed occupation (`soc_occupation`) exists for 198 occupations in April 2026 and 243 in May 2026. The automation and augmentation split (`collaboration_bucket_automation_pct` and `collaboration_bucket_augmentation_pct`) for `MYS` isn't published per detailed occupation: it exists at SOC major-group level (20 groups, `hierarchy_level` 1), for O\*NET work activities (20 in April, 23 in May), for request clusters (17 and 19), and overall. Cells below a sample threshold are suppressed, so a missing row means not published, not zero.
  - Access: no key needed through HF resolve URLs.
  - Limits: anonymous limit is 3,000 resolver requests per 5 minutes ([HF rate limits][hf-rate-limits]).
  - Licence: the data is CC BY (version not stated) and the code is MIT. The README says "Data released under CC-BY, code released under MIT License", and the 2026-06-26 data documentation says "Data released under CC-BY." The YAML metadata says `license: mit`; we follow the README and the release documentation, and credit Anthropic.
  - Cadence: irregular, with releases on 2025-02-10, 2025-03-27, 2025-09-15 (added geography), 2026-01-15, 2026-03-24 and 2026-06-26. The latest is "Artifacts and monthly aggregates" and covers April and May 2026. No future release date has been announced.
  - Fit: the strongest dated, updatable signal that joins to occupations for the trend layer, and it has Malaysia rows. Scenarios work at occupation-group level, because the automation and augmentation split for Malaysia is not published per detailed occupation.
- **Microsoft "Working with AI"** ([repo](https://github.com/microsoft/working-with-ai), [paper](https://arxiv.org/abs/2507.07935))
  - Offers: `ai_applicability_scores.csv` and `soc_metrics.csv` by SOC code, built from 200k Bing Copilot conversations in 2024.
  - Licence: CC BY 4.0 (LICENSE.txt). Last push 2026-10-09.
  - Fit: a static second exposure lens for a scenario toggle.
- **"GPTs are GPTs"** ([repo](https://github.com/openai/GPTs-are-GPTs))
  - Offers: occupation-level exposure in `occ_level.csv` (alpha, beta, gamma), plus task labels in `data/`.
  - Licence: MIT. Last push 2025-10-04.
  - Fit: a static, 2023-era "exposure" lens.
- **ILO generative AI exposure index** ([WP96, 2023][ilo-wp96]; [WP140, 20 May 2025][ilo-wp140]; [2025 update brief][ilo-2025-brief])
  - Offers: ISCO-08 4-digit exposure gradients. A March 2026 [brief][ilo-2026-brief] adds a gender angle.
  - Access: PDF and EPUB only. I found no machine-readable scores and no stated licence.
  - Fit: an ISCO-level citation, not a data feed.
- **IMF**
  - [SDN/2024/001][imf-sdn], 14 Jan 2024: no occupation file found.
  - AI Preparedness Index through the DataMapper API (tested, no key): `https://www.imf.org/external/datamapper/api/v1/AI_PI/MYS` returns Malaysia 2023 = 0.632. The source is labelled "April 2024".
  - Fit: a country-level context tile only.
- **World Bank and ISIS Malaysia, "Novel AI technologies and the future of work in Malaysia"** ([PDF][wb-isis-pdf], dated September 2025)
  - Offers: AI exposure indices for 484 MASCO 4-digit occupations, shown only as figures. The headline is 28% of the workforce "highly exposed".
  - Licence: may be reproduced "for noncommercial purposes as long as full attribution to this work is given".
  - Fit: the best Malaysia-specific citation for the scenario narrative. It is not machine-readable.

[aei-dataset]: https://huggingface.co/datasets/Anthropic/EconomicIndex
[aei-docs]: https://huggingface.co/datasets/Anthropic/EconomicIndex/raw/main/release_2026_06_26/data_documentation.md
[ilo-wp96]: https://webapps.ilo.org/static/english/intserv/working-papers/wp096/index.html
[ilo-wp140]: https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure
[ilo-2025-brief]: https://www.ilo.org/sites/default/files/2025-05/Research%20brief_GenAI%202025%20Update.pdf
[ilo-2026-brief]: https://www.ilo.org/sites/default/files/2026-03/Research%20Brief%20GenAI_final0403.pdf
[imf-sdn]: https://www.imf.org/en/publications/staff-discussion-notes/issues/2024/01/14/gen-ai-artificial-intelligence-and-the-future-of-work-542379
[wb-isis-pdf]: https://documents1.worldbank.org/curated/en/099092325013010451/pdf/P181093-2e5b89c5-f3be-43b3-868c-8890b74bef21.pdf

### AI-advancement feeds

- **arXiv API** ([terms of use](https://info.arxiv.org/help/api/tou.html))
  - Access: tested, no key. `export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending` reports 207,574 total, with the newest published 2026-10-16.
  - Limits: one request every 3 seconds, one connection at a time.
  - Licence: metadata is CC0. Don't imply arXiv endorses the project.
  - Fit: a live, dated signal of AI-advancement topics.
- **Hugging Face Hub API** ([API](https://huggingface.co/docs/hub/api), [rate limits][hf-rate-limits])
  - Access: tested anonymously. `/api/models?sort=trendingScore&limit=3` works.
  - Limits: anonymous 500 API requests per 5 minutes; free tier 1,000.
  - Note: Papers with Code now 302-redirects to `huggingface.co/papers/trending`. `/api/daily_papers` returned data when tested, but I did not find it on the docs page I read.
- **Epoch AI** ([data](https://epoch.ai/data))
  - Offers: datasets updated in October 2026, including AI models (Oct 16, "over 3600" models), benchmarks (Oct 19) and "Frontier Lab Hiring" (daily archive of Anthropic and OpenAI job postings).
  - Licence: "Creative Commons Attribution", version not stated.
  - Fit: a capability-trend tile.
- **Stanford AI Index 2026** ([page][stanford-ai-index])
  - Offers: public data in a Google Drive folder, and chapter 4 covers the economy.
  - Licence: not stated.
  - Cadence: annual. Release date not stated.
- **GitHub Octoverse 2025** ([blog][octoverse])
  - Offers: narrative only, published 28 Oct 2025.
  - Access: I did not check for a trending API.
  - Cadence: annual.

[stanford-ai-index]: https://hai.stanford.edu/ai-index/2026-ai-index-report
[octoverse]: https://github.blog/news-insights/octoverse/

### Job-market and labour signals relevant to Malaysia

- **OpenDOSM and data.gov.my** ([OpenDOSM API][opendosm-api], [rate limit](https://developer.data.gov.my/rate-limit), [wages by occupation][dosm-wages-occupation])
  - Access: `https://api.data.gov.my/opendosm?id=<id>`. The direct CSV and Parquet files on `storage.dosm.gov.my` avoid the API limit.
  - Limits: the OpenDOSM and Data Catalogue APIs allow 4 requests per minute and return 429 above that.
  - Datasets: `lfs_month` is monthly (tested, latest row 2026-08-01). `wages_occupation` is annual by MASCO major group, data as of 2025, updated 21 Sep 2026, next update 30 Sep 2027, licensed CC BY 4.0. I found no dataset of employment by detailed occupation.
- **MyCOL 2024/2025** ([TalentCorp][mycol])
  - Offers: 66 critical occupations. The MyCOL 2024/2025 PDF says "the 66 occupations in the National list", and a separate Regional List exists. TalentCorp's MyCOL page says it covers the "skills imbalance across 18 economic sectors"; secondary sources say the occupations carry MASCO codes.
  - Access: PDF only, published annually. The site footer says "All Rights Reserved". Tenders for the 2025/2026 edition opened in February 2025, but I found no published 2025/2026 list.
  - Fit: a cited Malaysia demand flag on roles, but not a feed.
- **MyMahir and the TalentCorp Impact Study** ([press release, 18 Nov 2024][talentcorp-press-release])
  - Offers: findings on 10 sectors and 60 emerging roles, published on mymahir.my.
  - Access: no public API found.
- **ILMIA** ([KILM employment by occupation][ilmia-kilm])
  - Offers: according to a search snippet, employment by occupation on MASCO-08 major groups.
  - Access: the site's TLS certificate had expired, so I couldn't fetch it.
- **WEF Future of Jobs Report 2025** ([page][wef-future-of-jobs], read through Jina Reader, [docs](https://jina.ai/reader))
  - Offers: published 7 Jan 2025. It projects 170M jobs created, 92M displaced and 78M net by 2030. Fastest-growing roles are tech roles (Big Data, Fintech, AI/ML) and green roles. Fastest-declining roles are clerical (postal clerks, bank tellers, data entry). The top skill is AI and big data.
  - Licence: Forum material is licensed under "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International Public Licence" unless otherwise indicated ([licence terms][wef-licence-terms]).
  - Fit: a static scenario prior. Cite it; don't modify and republish its tables.
- **Adzuna** ([terms][adzuna-terms])
  - Access: needs an `app_id` and `app_key`.
  - Limits: default limits are 25 hits per minute, 250 a day, 1,000 a week and 2,500 a month.
  - Restriction: use by a commercial, government or academic organisation is limited to a 14-day trial, and aggregates such as vacancy counts may not be used for ongoing work without written consent.
  - Malaysia: not covered. The API's own spec lists 19 `country` codes, `gb, us, at, au, be, br, ca, ch, de, es, fr, in, it, mx, nl, nz, pl, sg, za`, with Singapore but not Malaysia ([API spec][adzuna-spec]).
  - Fit: ruled out for Malaysia.
- **Hacker News via Algolia** ([API](https://hn.algolia.com/api))
  - Access: no key. Endpoints are `/api/v1/search_by_date` with tags such as `story`, `comment`, `author_:USERNAME` and `story_:ID`.
  - Limits: 10,000 requests per hour per IP.
  - Fit: "Who is hiring" comments are mostly US and remote, and they contain personal posts. Use only aggregate counts of keywords.
- **Scraping forbidden**
  - JobStreet ([terms](https://www.jobstreet.com.my/terms)): "You may not use data mining, robots, screen scraping, or similar automated data gathering…".
  - LinkedIn ([User Agreement §8.2][linkedin-user-agreement]): no "bots or other unauthorized automated methods".

[opendosm-api]: https://developer.data.gov.my/static-api/opendosm
[dosm-wages-occupation]: https://open.dosm.gov.my/data-catalogue/wages_occupation
[mycol]: https://www.talentcorp.com.my/our-initiatives/data-research/mycol/
[talentcorp-press-release]: https://www.prnewswire.com/apac/news-releases/talentcorp-launches-landmark-study-on-workforce-impact-of-ai-digitalisation-and-green-economy-302308514.html
[ilmia-kilm]: https://www.ilmia.gov.my/index.php/en/dashboard-datamart/kilm/indicators/employment-by-occupation
[wef-future-of-jobs]: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
[wef-licence-terms]: https://www.weforum.org/about/licence-terms-on-the-use-of-forum-publications-and-materials
[adzuna-terms]: https://developer.adzuna.com/docs/terms_of_service
[adzuna-spec]: https://developer.adzuna.com/swagger/spec/test2.json
[linkedin-user-agreement]: https://www.linkedin.com/legal/user-agreement

## Recommended minimal stack

1.  **Taxonomy: O\*NET 31.0 bulk downloads** (CC BY 4.0, no key). Join on O\*NET-SOC, and show ISCO-08 labels through the crosswalks, and MASCO labels only where a hand-checked ISCO-08 to MASCO match exists. Use Hot Technologies and Emerging Tasks to support the "emerging skills" claim.
1.  **Trend source A, the primary signal: the Anthropic Economic Index** monthly `soc_occupation` and `onet` rows for `MYS` and `GLOBAL`. The 2026-06-26 file already holds two months, April and May 2026, so the demo can switch snapshots and watch role scores move, with source and date shown. Role scores use the `soc_occupation` usage share. For `MYS`, the `collaboration_bucket_automation_pct` and `collaboration_bucket_augmentation_pct` metrics aren't published per detailed occupation, only by major group, work activity, request cluster and overall, so the two scenarios, automation-led versus augmentation-led, work at occupation-group level. Older releases add more snapshots.
1.  **Trend source B, the live feed: the arXiv API** for cs.AI and cs.LG, or the HF trending API. Count mentions of O\*NET Hot Technology and skill terms in the newest papers to get a skill-momentum weight, stamped with the fetch time. Re-run it in the demo to show the feed is live.
1.  Optional Malaysia context: OpenDOSM `lfs_month` and `wages_occupation` CSVs (CC BY 4.0), MyCOL 2024/2025 flags, and the World Bank and ISIS figures, all as cited static references.

## Risks and fallbacks

- **Anthropic Economic Index:** releases are irregular with no announced date, and the 219 MB file is too big to load live. The data measures Claude usage, not employment, so label it "AI usage signal". Suppression leaves gaps. For Malaysia, the automation and augmentation split exists only at occupation-group level.
  - Fallback: pre-filter to MYS and GLOBAL, commit dated snapshots (for example `data/snapshots/aei/2026-04/` and `2026-05/`) with the source URL and retrieval date, and run a `bun` refresh script that polls the HF tree API for new `release_*` folders.
- **arXiv:** 1 request per 3 seconds, and my `submittedDate:[…]` range query returned only 1 result. Keyword-to-skill mapping is heuristic.
  - Fallback: use the sorted newest listing, cache the last pull with its timestamp, publish the term list, and use the HF API as the backup feed.
- **O\*NET:** US-centric, and the Malaysian mapping is lossy.
  - Fallback: show O\*NET titles with ISCO-08 labels through the BLS or ESCO crosswalks, add MASCO labels only for hand-checked unit groups, and flag unmatched roles.
- **OpenDOSM:** 4 requests per minute, and there's no detailed-occupation series.
  - Fallback: read the storage CSVs directly and cache them.

## Open questions

MASCO, the crosswalks, SkillsFuture's terms and Adzuna's coverage were settled in [issue 20][issue-20]; see their entries above.

- O\*NET's exact 31.0 release day, and the per-day guidance in its Web Services Terms of Service.
- ESCO's API rate limits, and the official API base URL. The `/esco/api/search` path worked when tested.
- The Lightcast per-second limit for the free scope.
- The MASCO version MyCOL 2024/2025 uses (only from secondary sources), and TalentCorp's terms.
- ILMIA content (expired certificate).
- Whether there's a WEF Malaysia economy profile.
- The Stanford AI Index 2026 licence and release date.
- A LinkedIn Economic Graph or AI-skills open dataset (not researched).
- Machine-readable ILO scores.
- An official GitHub trending API.
- Whether arXiv date-range counting works.
- The Epoch licence version.
- HF `/api/daily_papers` documentation.

[issue-20]: https://github.com/TolongLabs/sdc-hack/issues/20

## See also

- [SDC Hackathon 2026 context](/docs/CONTEXT.md), which these notes support
- [SDC Hackathon 2026 brief](/docs/BRIEF.md)
- [Best practices that win marks under the SDC 2026 rubric](/docs/research/best-practices.md)
- [Comparable hackathon winners](/docs/research/comparable-winners.md)
- [Lineage, people and Malaysian precedent](/docs/research/lineage-and-local.md)
- [Prior art, SDG mapping and course catalogues](/docs/research/prior-art-sdg-courses.md)

[hf-rate-limits]: https://huggingface.co/docs/hub/rate-limits

# Official Malaysian job-demand history

This report evaluates official Malaysian sources for dated demand signals at sector (L1), occupation group (L2), role (L3), and skill (L4) layers.

## Summary

- DOSM’s Quarterly Employment Statistics (QES) is the best direct signal found: quarterly vacancies and jobs created from Q1 2015 through Q2 2026, by sector and broad skill category.
- OpenDOSM exposes four tested API series: employment_sector, wages_occupation, wages_skill, and lfs_qtr_sru_sex. They have history and CC BY 4.0 terms, but measure employment, wages, or skills mismatch rather than vacancies.
- DOSM’s Labour Force Survey tables show employment by occupation group and industry from 1982 to 2025. They measure job stocks, not openings, and occupation classifications change over time.
- MOHR and PERKESO reports provide dated vacancy and job-loss snapshots. The source systems, coverage, and definitions change, so the points do not form a clean continuous series.
- MyCOL and MyMahir help map occupations and skills, but neither offers a comparable history of role-level vacancies. Their reports and site content have no open data licence.
- MIDA and BNM add useful sector and national context. HRD Corp’s index tracks training, not job demand. No official open source found demand trends across all four layers.

## Sources

| Source                                             | Layer                              | What it measures                                                              | History (first, latest, frequency)                                                    | Access tested                                                                                     | Licence or terms                                                                                                                        | Fit (Strong, Partial or Weak, with a reason)                                               |
| -------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| DOSM Quarterly Employment Statistics (QES) [1]     | L1; broad skill category           | Jobs, filled jobs, vacancies, and jobs created                                | Q1 2015; Q2 2026; quarterly                                                           | Q2 2026 PDF, HTTP 200; no catalogue API ID found                                                  | DOSM data terms allow reuse with attribution; no separate QES report licence found                                                      | Partial: direct demand history, but no occupation or named-skill detail                    |
| DOSM LFS Tables D and E [3]                        | L1–L2                              | Employed people by occupation and industry                                    | 1982; 2025; annual, with gaps                                                         | May 2026 report PDF, HTTP 200; no catalogue API ID found for these tables                         | DOSM data terms allow data reuse with attribution; report-specific licence not shown                                                    | Partial: long occupation history, but employment stocks are not vacancies                  |
| OpenDOSM employment_sector [4]                     | L1                                 | Employment share by three broad MSIC sectors and sex                          | 2001; 2025; annual                                                                    | API, HTTP 200; earliest and latest rows returned                                                  | CC BY 4.0                                                                                                                               | Weak: sector employment share is an indirect demand proxy                                  |
| OpenDOSM wages_occupation [5]                      | L2                                 | Wage and recipient counts for nine MASCO major groups                         | 2010; 2025; annual                                                                    | API, HTTP 200; earliest and latest rows returned                                                  | CC BY 4.0                                                                                                                               | Weak: wages and employment counts are not vacancy demand                                   |
| OpenDOSM wages_skill [6]                           | Broad skill category               | Wage and recipient counts by skilled, semi-skilled, and low-skilled category  | 2010; 2025; annual                                                                    | API, HTTP 200; earliest and latest rows returned                                                  | CC BY 4.0                                                                                                                               | Weak: wage and workforce measures do not identify demand for named skills                  |
| OpenDOSM lfs_qtr_sru_sex [7]                       | Broad skill category               | Tertiary-educated workers employed in semi-skilled or low-skilled jobs        | 2017 Q1; 2026 Q2; quarterly                                                           | API, HTTP 200; earliest and latest rows returned                                                  | CC BY 4.0                                                                                                                               | Weak: measures skill mismatch, not job openings                                            |
| MOHR iStatistik / MYFutureJobs vacancy reports [8] | L1; some state detail              | Active vacancies and related portal totals                                    | 2019; 2023 confirmed in reports; issue-based, with annual and quarterly cuts          | 2019, 2022, and 2023 PDFs returned HTTP 200; later 2025 issues are listed but not sampled         | MOHR copyright notice requires permission for copying and distribution; no open licence found                                           | Partial: actual vacancies have dated points, but platform and definitions change           |
| PERKESO EIS job-loss reports [10]                  | L1 in 2018; national total in 2021 | Job losses by industry in one report; nationwide loss total in a later report | 2018; 2021; irregular report snapshots                                                | 2018 report PDF, HTTP 200; 2021 annual report PDF, HTTP 200                                       | PERKESO reports are marked all rights reserved; no open data licence found                                                              | Weak: two points use different detail and do not establish a comparable series             |
| PERKESO LMX vacancy dashboard [11]                 | L1; dashboard groups               | Vacancy, jobseeker, and placement indicators                                  | First point not exposed; latest page marker says Aug 2026; month-on-month view        | Page and dashboard shell returned HTTP 200; chart rows were not available in the fetched response | No open data licence found; PERKESO general terms apply                                                                                 | Weak: a monthly trend is advertised, but no dated history rows or export were confirmed    |
| MOHR e-MASCO job statistics [12]                   | L2                                 | MYFutureJobs vacancy totals and a major-group breakdown                       | First point not confirmed; page card says Mar 2026; frequency unclear                 | Page returned HTTP 200; detail POST returned 419 and no breakdown row                             | MOHR terms restrict copying and distribution without permission; no open licence found                                                  | Weak: one date and a blocked detail response do not establish history                      |
| MYFutureJobs live listings [13]                    | L3                                 | Current posted jobs                                                           | No dated history confirmed; live listings only                                        | Portal root returned HTTP 200; no job row or public API response confirmed                        | Robots disallow /wp-json/ and /?rest_route=. Terms limit storage to personal, non-commercial use and require SOCSO permission for reuse | Weak: listings have no confirmed history and reuse is restricted                           |
| ILMIA My Job Profile [14]                          | L1–L3                              | Occupation, industry, and vacancy indicators                                  | No consistent history confirmed; page mixes Q1 2024 source label and Q2 2025 cards    | Browser-indexed page read; curl hit a certificate error, then a 403 challenge; no data sample     | No open data licence found                                                                                                              | Weak: source vintage is unclear and no usable export was confirmed                         |
| TalentCorp MyCOL [15]                              | L3; occupation group               | Occupations reported as critical or hard to fill                              | 2015/16; 2024/25; annual by design, but archive editions have gaps                    | 2022/23 and 2024/25 PDFs returned HTTP 200                                                        | No open data licence found; TalentCorp site says all rights reserved                                                                    | Partial: repeated shortage labels help rank roles, but list scope changes between editions |
| TalentCorp MyMahir [16]                            | L3–L4                              | Role impacts, emerging roles, and skills from studies                         | 17 Nov 2024 study; later sector studies are not comparable; no role-level time series | Publication and role pages returned HTTP 200; report download link was not exposed in page HTML   | Terms prohibit automated scraping and redistribution without written consent                                                            | Weak: useful role and skill map, but not historical vacancy demand                         |
| MIDA approved investment statistics [17]           | L1; some subsectors                | Potential jobs tied to approved projects                                      | At least 2015; Jan–Jun 2026 latest page table; annual and interim releases            | Statistics page returned HTTP 200; sample table row read                                          | Public page has no open licence; e-Stats data require payment and prior written permission for reuse                                    | Partial: dated sector forecasts, not observed hiring or occupation demand                  |
| BNM EMR / SOCSO vacancy figures [18]               | National aggregate                 | Average monthly vacancies and placements reported by SOCSO                    | 2024; 2025; annual comparisons                                                        | BNM chapter page read; no raw data API or file found                                              | BNM site terms require written permission for redistribution of general site material                                                   | Weak: two national averages have no sector or role detail                                  |
| HRD Corp National Training Index [19]              | L1                                 | Training index and training activity by sector                                | 2022; 2024; annual scores shown for 2022–2024                                         | 2024 report PDF returned HTTP 200                                                                 | Report says reproduction needs publisher’s written permission, except brief quotations in a review                                      | Weak: training activity is not job demand                                                  |

## Details

### DOSM Quarterly Employment Statistics (QES)

Publisher: Department of Statistics Malaysia (DOSM). The Q2 2026 release is dated 13 August 2026. The Q4 2017 release is dated 20 July 2018. Accessed 22 October 2026. [1]

The Q4 2017 page says: “The principal statistics of employment presented in this report are positions, filled positions, vacancies and jobs created by economic activity and skill for the period of the first quarter of 2015 to the fourth quarter of 2017.” The Q2 2026 release describes “jobs, filled jobs, vacancies and jobs created by economic activity and skills category.” QES covers formal private-sector businesses in five broad activities and three skill categories. It does not name occupations or skills.

I fetched the Q2 2026 report PDF at [1]. It returned HTTP 200. A sample says: “jobs created experienced a notable decline of 3.6 per cent quarter-on-quarter to record 31.5 thousand (Q1 2026: 32.7 thousand).” The release archive lists quarterly issues. I found no QES dataset ID in the OpenDOSM catalogue, so there is no API sample to report.

DOSM’s terms page, last updated 22 October 2026, authorizes worldwide commercial and non-commercial reuse without charge. It requires the exact attribution “Data source: Department of Statistics Malaysia.” The QES PDF did not show a separate licence. This is the strongest direct input for L1 trend direction, with broad skill categories as a secondary signal. [2]

### DOSM Labour Force Survey Tables D and E

Publisher: DOSM. The Labour Force Statistics, May 2026 release is dated 10 July 2026. Its linked report PDF is the sample source. Accessed 22 October 2026. [3]

Table D is titled “Employed person by occupation, Malaysia, 1982 - 2025.” Table E is titled “Employed person by industry, Malaysia, 1982 - 2025.” The annual series starts in 1982 and ends in 2025. Some years are absent. The report uses different occupation classifications across periods: Dictionary of Occupational Classification 1980, then MASCO 1998, 2008, 2013, and 2020. Treat long-run changes with care.

The PDF returned HTTP 200. A short sample from Table D is the 1982 row: “5,249.0” employed people overall. The 2025 row reports “16,580.9” overall. These are employment stocks, not vacancies. I found no OpenDOSM API ID for Tables D and E.

DOSM’s terms page says “use the data commercially and non-commercially” and requires the attribution “Data source: Department of Statistics Malaysia.” It was last updated 22 October 2026. I found no separate licence for this report PDF. [2]

### OpenDOSM employment_sector

Publisher: DOSM via OpenDOSM. No publication date is shown. The catalogue page was last updated 8 October 2026 and reports data through 2025. Accessed 22 October 2026. [4]

The page describes an “Annual distribution of employment by MSIC sector and sex.” It has three broad sectors and annual history from 2001 to 2025. It measures employment share, not vacancies.

The catalogue ID is employment_sector. Both API requests returned HTTP 200:

- Latest: https://api.data.gov.my/data-catalogue/?id=employment_sector&limit=5&sort=-date — sample row: {"sex":"both","date":"2025-01-01","sector":"industry","proportion":26.1}
- Earliest: https://api.data.gov.my/data-catalogue/?id=employment_sector&limit=1&sort=date — sample row: {"sex":"both","date":"2001-01-01","sector":"agriculture","proportion":15.1}

The catalogue labels the licence “Creative Commons Attribution 4.0 International” (CC BY 4.0). This is open for reuse with attribution. It is only a broad L1 employment proxy. [4]

### OpenDOSM wages_occupation

Publisher: DOSM via OpenDOSM. No original publication date is shown. The catalogue was last updated 21 September 2026 and reports data through 2025. Accessed 22 October 2026. [5]

The catalogue describes “Number of recipients, median and mean monthly salaries & wages of employees who are Malaysian citizens by occupation and sex.” The series is annual from 2010 to 2025. Occupation detail is limited to nine MASCO major groups, plus overall totals.

The catalogue ID is wages_occupation. Both API requests returned HTTP 200:

- Latest: https://api.data.gov.my/data-catalogue/?id=wages_occupation&limit=5&sort=-date — sample row: {"sex":"both","date":"2025-01-01","occupation":"overall","recipients":10381.6,"wages_mean":3803,"wages_median":2940}
- Earliest: https://api.data.gov.my/data-catalogue/?id=wages_occupation&limit=1&sort=date — sample row: {"sex":"both","date":"2010-01-01","occupation":"overall","recipients":7149.2,"wages_mean":1936,"wages_median":1500}

The catalogue labels the licence “Creative Commons Attribution 4.0 International” (CC BY 4.0). Wages and recipient counts can inform role-group context, but they are not measures of vacancies. [5]

### OpenDOSM wages_skill

Publisher: DOSM via OpenDOSM. No original publication date is shown. The catalogue was last updated 21 September 2026 and reports data through 2025. Accessed 22 October 2026. [6]

The catalogue describes “Number of recipients, median and mean monthly salaries & wages of employees who are Malaysian citizens by skill category and sex.” Its annual series runs from 2010 to 2025. Skill categories map to MASCO groups: skilled (1–3), semi-skilled (4–8), and low-skilled (9).

The catalogue ID is wages_skill. Both API requests returned HTTP 200:

- Latest: https://api.data.gov.my/data-catalogue/?id=wages_skill&limit=5&sort=-date — sample row: {"sex":"both","date":"2025-01-01","skill":"skilled","recipients":3803.8,"wages_mean":5799,"wages_median":5057}
- Earliest: https://api.data.gov.my/data-catalogue/?id=wages_skill&limit=1&sort=date — sample row: {"sex":"both","date":"2010-01-01","skill":"overall","recipients":7149.2,"wages_mean":1936,"wages_median":1500}

The catalogue labels the licence “Creative Commons Attribution 4.0 International” (CC BY 4.0). It is a broad workforce and wage series, not demand for a named skill. [6]

### OpenDOSM lfs_qtr_sru_sex

Publisher: DOSM via OpenDOSM. The catalogue was last updated 11 August 2026 and reports data through Q2 2026. Accessed 22 October 2026. [7]

The page describes workers with tertiary education who are employed in semi-skilled or low-skilled jobs. It is a quarterly skills-mismatch indicator, not vacancies. The series runs from Q1 2017 through Q2 2026.

The catalogue ID is lfs_qtr_sru_sex. Both API requests returned HTTP 200:

- Latest: https://api.data.gov.my/data-catalogue/?id=lfs_qtr_sru_sex&limit=5&sort=-date — sample row: {"sex":"overall","sru":35.2,"date":"2026-04-01","variable":"rate"}
- Earliest: https://api.data.gov.my/data-catalogue/?id=lfs_qtr_sru_sex&limit=3&sort=date — sample row: {"sex":"overall","sru":29.9,"date":"2017-01-01","variable":"rate"}

The catalogue labels the licence “Creative Commons Attribution 4.0 International” (CC BY 4.0). Use it as a supply-mismatch signal, not as evidence that a particular skill is rising or declining in demand. [7]

### MOHR iStatistik and MYFutureJobs vacancy reports

Publisher: Ministry of Human Resources (MOHR), with vacancy data attributed to JobsMalaysia or MYFutureJobs / PERKESO. The report issues identify data years 2019–2023. The 2022 data is in issue 1/2023; the 2023 data is in issue 1/2024. Exact PDF publication days are not stated. Accessed 22 October 2026. [8]

The reports provide dated vacancy totals, but the series changes source and coverage. The 2019 issue uses JobsMalaysia and says “Semenanjung Malaysia sahaja” (Peninsular Malaysia only). It defines vacancies as “Kekosongan aktif–60 hari kebelakang dari tarikh laporan” (active vacancies in the 60 days before the report). From the 2021 issue, the source changes to MYFutureJobs / EIS PERKESO. The later MYFutureJobs reports are nationwide portal counts.

The 2022 issue reports 281,967 active vacancies. The 2023 issue reports 86,328 active vacancies, described as “Masih diiklankan dalam portal” (still advertised on the portal). The two figures are useful dated snapshots, but do not assume they are directly comparable.

The 2019, 2022, and 2023 PDFs returned HTTP 200. The 2023 sample contains the label “JUMLAH KEKOSONGAN AKTIF” and value “86,328” (total active vacancies). The MOHR publication page lists later 2025 issues, including Bil. 5, but I could not fetch or sample those files in this check.

MOHR’s copyright page was updated 21 October 2026. It says: “Tiada mana-mana bahagian di dalam laman sesawang ini boleh diubah, disalin, diedar, disiarkan, diterbitkan, dijual, dilesenkan, bagi tujuan komersil dalam apa bentuk sekalipun tanpa mendapat kebenaran daripada Kementerian Sumber Manusia” (no part of the site may be changed, copied, distributed, published, sold, or licensed for commercial purposes without Ministry permission). Its public reports did not show an open data licence. [9]

### PERKESO EIS job-loss reports

Publisher: PERKESO, reported in MOHR’s Statistik Pekerjaan & Perburuhan. The earliest industry breakdown I confirmed is 2018; PERKESO’s annual report gives a 2021 national total. The reports do not establish a continuous comparable series. Accessed 22 October 2026. [10]

The 2019 MOHR issue has a table titled “KEHILANGAN PEKERJAAN MENGIKUT INDUSTRI (MSIC) 2018” (job losses by industry, MSIC 2018). Its sample row records “Manufacturing,” “7,424,” and “32.0%.” PERKESO’s 2021 Annual Report says: “in 2021 alone, a total of 61,360 workers have lost their jobs nationwide.” The latter is a national total, not an industry or occupation breakdown.

The 2018 report PDF returned HTTP 200; the 2021 annual report PDF also returned HTTP 200. I did not confirm a current downloadable EIS series by occupation or a continuous annual industry series. The 2021 annual report says “All rights reserved.” No open data licence was found. [10]

### PERKESO LMX vacancy dashboard

Publisher: PERKESO. The landing page has no publication date. Its latest visible marker says Aug 2026 and it labels a month-on-month comparison. Accessed 22 October 2026. [11]

The page advertises monthly trend, vacancy, jobseeker, and placement dashboards. The page and detail view returned HTTP 200. The landing page says “Statistic Updated As of Aug 2026” and shows 368,642 vacancies with a 0.52 per cent month-on-month change. However, the embedded chart response exposed no dated data row through curl. I could not verify its first point, a public API, or a CSV export.

The LMX robots.txt returned HTTP 200 and says “Disallow: /wp-admin/”; it does not disallow the other paths. I found no data licence. The dashboard footer says “© Copyright 2026 Social Security Organization All Rights Reserved.” Treat this as a dashboard to inspect manually until PERKESO publishes a reusable export. [11]

### MOHR e-MASCO job statistics

Publisher: MOHR. The page has no publication date. Its card says the statistics are for March 2026; another page marker says August 2026, so the current vintage is unclear. Accessed 22 October 2026. [12]

The page card says “Statistik Pekerjaan setakat bulan Mac 2026” (employment statistics through March 2026) and shows 106,991 vacancies with a 10.91 per cent month-on-month change. The page HTML also contains “Statistic Updated As of Aug 2026.” Its breakdown is by “Kumpulan Utama” (major group). The page returned HTTP 200. POST https://emasco.mohr.gov.my/get-stat-details returned HTTP 419, so I could not fetch a group row or history.

The terms page says: “Tiada mana-mana bahagian di dalam laman sesawang ini boleh diubah, disalin, diedar, disiarkan, diterbitkan, dijual, dilesenkan, bagi tujuan komersil dalam apa bentuk sekalipun tanpa mendapat kebenaran daripada Kementerian Sumber Manusia” (no part of the site may be changed, copied, distributed, published, sold, or licensed for commercial purposes without Ministry permission). The page did not show an open licence. The conflicting date markers and missing history make this a weak trend source. [12]

### MYFutureJobs live listings

Publisher: PERKESO / Social Security Organisation (SOCSO). The portal has no confirmed historical listing archive. The terms PDF has no publication date printed; its file metadata shows modified 16 November 2022. Accessed 22 October 2026. [13]

The portal root returned HTTP 200. I did not confirm a job row or public API response. The portal’s robots.txt returned HTTP 200 and says “Disallow: /wp-json/” and “Disallow: /?rest_route=”. The exact candidate search route was not retained, so I do not cite it as a tested data path.

The terms define content to include “a list of jobs.” They allow one copy for “your own personal, non-commercial use” and say: “You must not reproduce, modify, copy, distribute or use for commercial purposes any of the materials or the Content on the Website without written permission from SOCSO.” The terms also require registration to use the portal. [13]

### ILMIA My Job Profile

Publisher: Institute of Labour Market Information and Analysis (ILMIA). The page has no publication date. It labels a source “Q1 2024, Job Market Insights” while some headline cards show Q2 2025. Accessed 22 October 2026. [14]

The page describes occupation and vacancy indicators using MASCO 2020. The different date labels leave the data vintage unclear. A curl request failed certificate verification; a retry returned a 403 challenge page. I found no downloadable row, API, or data licence. Do not infer a time series from the dashboard cards. [14]

### TalentCorp MyCOL

Publisher: Talent Corporation Malaysia (TalentCorp). The archive page has no publication date and says MyCOL is “Collated on an annual basis.” It links the 2015/16 to 2024/25 editions with gaps. The 2024/25 PDF does not state an exact publication day; its file metadata shows 13 March 2026, which is not a verified publication date. Accessed 22 October 2026. [15]

The 2022/23 report says MyCOL has been published “on an annual basis since 2015.” The archive links 2015/16, 2016/17, 2018/19, 2019/20, 2020/21, 2022/23, and 2024/25 editions. The linked archive is not a complete annual sequence.

Scope changes limit comparisons. MyCOL 2022/23 covered 37 occupations in three pilot sectors; 2024/25 covers 66 occupations across 18 sectors. The brochure says: “This resulted in 66 critical occupations for Malaysia, as compared to 37 in the previous cycle which only looked at 3 sectors.” It also says MyCOL 2024/25 is “Now in its 8th edition.” A count change does not prove that demand rose. The 2022/23 PDF sample starts with “MASCO 1121 — Managing Directors and Chief Executives.”

Both sampled PDFs returned HTTP 200. TalentCorp’s site says “All Rights Reserved.” I found no open data licence. The list can serve as an edition-tagged shortage prior, not a vacancy time series. [15]

### TalentCorp MyMahir

Publisher: TalentCorp. The AI, Digital, and Green Economy study is dated 17 November 2024. Its page says it “validated 949 roles across 10 sectors”; the study summary says 60 are emerging and describes a three-to-five-year outlook. Later sector studies use different scopes. Accessed 22 October 2026. [16]

The study describes “949 roles” and “60 emerging roles.” The MyMahir FAQ says role and skill information mainly comes from these studies. The pages provide role and skill mapping, but no dated history of vacancies by role or skill.

The publication page returned HTTP 200. It offers a View PDF control, but the PDF URL was not exposed in the fetched page HTML, so I could not fetch a file sample. The MyMahir robots.txt returned HTTP 200 and allows `/`. Its terms say users “may not reproduce, modify, display, sell, or distribute the Content or The Group Materials, or use them in any other way for public or commercial purpose.” They also prohibit automated means to “scrape,” “crawl,” or “spider” the site without written consent. [16]

### MIDA approved investment statistics

Publisher: Malaysian Investment Development Authority (MIDA). The statistics page is undated and includes annual and interim releases back to at least 2015. Its latest table covers January–June 2026, compared with January–June 2025 and full-year 2025. Accessed 22 October 2026. [17]

The table labels job counts “Potential Employment.” The January–June 2026 manufacturing row shows 973 projects and 64,555 potential jobs; January–June 2025 shows 46,690. This is planned employment attached to approved projects, not hires already made. Detail is by sector and some subsectors.

The statistics page returned HTTP 200. MIDA’s paid e-Stats portal says its data is for reference. Its disclaimer says: “No part of this content shall be reproduced or be used in any manner without the prior written permission from MIDA.” The page did not display an open licence. Do not include paid project data in the prototype without permission. [17]

### BNM EMR and SOCSO vacancy figures

Publisher: Bank Negara Malaysia (BNM), reporting SOCSO statistics. The Economic and Monetary Review 2025 chapter was released on 31 March 2026. Accessed 22 October 2026. [18]

The chapter reports average monthly vacancies of 127,177 for 2024 and 119,095 for 2025. It says: “the Social Security Organisation (SOCSO) reported average monthly vacancies of 119,095 (2024: 127,177).” This is a two-point national comparison with no occupation breakdown.

The chapter is an HTML page; I found no raw API or data file. BNM’s terms page was last updated in November 2023 and says “no copying, redistribution, retransmission, publication or commercial exploitation of downloaded material will be permitted without the express written permission of BNM and the relevant copyright owner.” The vacancy figures are attributed to SOCSO, so check SOCSO terms before reuse as data. [18]

### HRD Corp National Training Index

Publisher: Human Resource Development Corporation (HRD Corp). The 2024 report is marked “First Published, 2025.” It shows annual scores for 2022, 2023, and 2024. Accessed 22 October 2026. [19]

The report gives scores of 0.70 in 2022, 0.75 in 2023, and 0.79 in 2024. It says the index reflects “the learning and development performance of the workforce in Malaysia.” The measure is training activity by sector, not job openings, occupations, or named skills.

The report PDF returned HTTP 200. It says the book “may not be reproduced or used in any manner” without the publisher’s written permission, except for brief quotations in a book review. No open data licence was found. Use it as training context only. [19]

## Unconfirmed

- No OpenDOSM catalogue ID or API rows were found for QES vacancies or jobs created. DOSM’s quarterly PDF releases were accessible.
- MOHR lists Statistik Pekerjaan & Perburuhan issues through Bil. 5 2025, but its publication page timed out when opened and I could not extract the linked file URL or a data row. The latest tested vacancy snapshot remains the 2023 issue.
- MOHR’s open-data page titled “Tuntutan Kehilangan Pekerjaan” returned 404 when opened. No downloadable loss-of-employment dataset was confirmed.
- PERKESO EIS industry data is confirmed for 2018 and a national total for 2021. A continuous, current series by industry or occupation was not confirmed.
- The PERKESO LMX dashboard advertises monthly trends, but its first date and machine-readable rows were not exposed. No public export or open data terms were found.
- e-MASCO shows March 2026 vacancy statistics in its card and an August 2026 update marker elsewhere. The date conflict is unresolved.
- ILMIA My Job Profile shows a Q1 2024 source label beside Q2 2025 cards. A usable API or download was not confirmed.
- The MyCOL archive describes annual editions but does not show a complete year-by-year list. The 2024/25 report says it is the eighth edition; the archive’s visible downloads do not explain the gap.
- I found no official public source with a reusable, dated history of vacancies by individual role and named skill. No figures, dataset IDs, or working URLs were guessed.

## References

1. DOSM, [Employment Statistics Q2 2026](https://www.dosm.gov.my/portal-main/release-content/employment-statistics-Q22026), [Q4 2017 release](https://www.dosm.gov.my/portal-main/release-content/employment-statistics-fourth-quarter-2017), [Q2 2026 release archive](https://www.dosm.gov.my/portal-main/release-archive/employment-statistics-Q22026), and [Q2 2026 report PDF](https://www.dosm.gov.my/uploads/release-content/file_20260824111725.pdf).
2. DOSM, [Terms of Use](https://www.dosm.gov.my/portal-main/article/term-of-use).
3. DOSM, [Labour Force Statistics May 2026](https://www.dosm.gov.my/portal-main/release-content/labour-force-statistics-may2026) and [report PDF](https://www.dosm.gov.my/uploads/release-content/file_20260710113036.pdf).
4. OpenDOSM, [employment_sector catalogue](https://open.dosm.gov.my/data-catalogue/employment_sector); [latest API query](https://api.data.gov.my/data-catalogue/?id=employment_sector&limit=5&sort=-date); [earliest API query](https://api.data.gov.my/data-catalogue/?id=employment_sector&limit=1&sort=date).
5. OpenDOSM, [wages_occupation catalogue](https://open.dosm.gov.my/data-catalogue/wages_occupation); [latest API query](https://api.data.gov.my/data-catalogue/?id=wages_occupation&limit=5&sort=-date); [earliest API query](https://api.data.gov.my/data-catalogue/?id=wages_occupation&limit=1&sort=date).
6. OpenDOSM, [wages_skill catalogue](https://open.dosm.gov.my/data-catalogue/wages_skill); [latest API query](https://api.data.gov.my/data-catalogue/?id=wages_skill&limit=5&sort=-date); [earliest API query](https://api.data.gov.my/data-catalogue/?id=wages_skill&limit=1&sort=date).
7. OpenDOSM, [lfs_qtr_sru_sex catalogue](https://open.dosm.gov.my/data-catalogue/lfs_qtr_sru_sex); [latest API query](https://api.data.gov.my/data-catalogue/?id=lfs_qtr_sru_sex&limit=5&sort=-date); [earliest API query](https://api.data.gov.my/data-catalogue/?id=lfs_qtr_sru_sex&limit=3&sort=date).
8. MOHR, [publication archive](https://www.mohr.gov.my/index.php/sumber/penerbitan1), [2019 issue](https://myhos.mohr.gov.my/ebook/istatistik1_2020/bil1_2020.pdf), [2020 issue](https://myhos.mohr.gov.my/ebook/istatistik2_2020/bil2_2020.pdf), [2021 issue](https://jtksm.mohr.gov.my/sites/default/files/2024-01/iStatistik%20bil%201%20_2022.pdf), [2022 data issue](https://www.mohr.gov.my/en/pdf/eBook%20iStatistik%20bil%201_2023WEB.pdf), and [2023 data issue](https://www.mohr.gov.my/images/2024/iStatistik%20bil%201_2024.pdf).
9. MOHR, [Copyright Notice](https://www.mohr.gov.my/en/index.php/categories/notis-hak-cipta/copyright-notice).
10. MOHR / PERKESO, [2018 EIS job losses by industry report](https://myhos.mohr.gov.my/ebook/istatistik1_2019/bil1_2019.pdf) and PERKESO, [Annual Report 2021](https://perkeso.gov.my/images/laporan_tahunan/LAPORAN_TAHUNAN_PERKESO_2021_150223_compressed.pdf).
11. PERKESO, [LMX dashboard](https://lmx.perkeso.gov.my/), [dashboard detail](https://lmx.perkeso.gov.my/visualisation-details/?uuid=19b30ddc-d066-49ee-afa9-96c038ee9f73), [robots.txt](https://lmx.perkeso.gov.my/robots.txt), and [terms](https://www.perkeso.gov.my/terma-syarat.html).
12. MOHR, [e-MASCO job statistics](https://emasco.mohr.gov.my/statistic/jobs), [statistics-detail POST endpoint](https://emasco.mohr.gov.my/get-stat-details), and [terms](https://emasco.mohr.gov.my/tnc).
13. PERKESO, [MYFutureJobs](https://myfuturejobs.gov.my/), [robots.txt](https://myfuturejobs.gov.my/robots.txt), and [terms PDF](https://myfuturejobs.gov.my/wp-content/uploads/2024/03/TermsAndConditions.pdf).
14. ILMIA, [My Job Profile](https://www.ilmia.gov.my/bda-myjobprofile/).
15. TalentCorp, [MyCOL archive](https://www.talentcorp.com.my/mycol), [2022/23 report](https://talentcorp.com.my/images/uploads/publication/3/Critical-Occupations-List-MyCOL-20222023-1695267153.pdf), [2024/25 report](https://www.talentcorp.com.my/images/uploads/publication/204/MyMahir-Malaysia-Critical-Occupations-List-MyCOL20242025-1773385490.pdf), [2024/25 brochure](https://www.talentcorp.com.my/images/uploads/publication/205/MyMahir-MyCOL-20242025-Brochure-1773377416.pdf), and [terms](https://www.talentcorp.com.my/terms-conditions/).
16. TalentCorp / MyMahir, [AI, Digital, and Green Economy study](https://www.mymahir.my/publication/1/impact-study-of-ai-digital-and-green-economy-on-the-malaysian-workforce), [FAQ](https://www.mymahir.my/faq), [role and skill page](https://www.mymahir.my/skill-overview/details/1375), [robots.txt](https://www.mymahir.my/robots.txt), and [terms PDF](https://www.mymahir.my/assets/document/NOTICE_PRIVACY_POLICY_TERMS_OF_USE_AND_RETURN_POLICY_GROUP.pdf).
17. MIDA, [Investment Statistics](https://www.mida.gov.my/why-malaysia/investment-statistics/), [e-Stats portal](https://e-statsdata.mida.gov.my/), and [e-Stats disclaimer](https://e-statsdata.mida.gov.my/disclaimer.php).
18. BNM, [Economic and Monetary Review 2025, Chapter 1](https://www.bnm.gov.my/publications/emr2025/ch1), [publication index](https://www.bnm.gov.my/publications/emr/index), and [Terms of Use](https://www.bnm.gov.my/terms-of-use).
19. HRD Corp, [reports page](https://hrdcorp.gov.my/reports) and [National Training Index 2024 PDF](https://hrdcorp.gov.my/wp-content/uploads/2025/04/NTI.2024-upd18042025.pdf).

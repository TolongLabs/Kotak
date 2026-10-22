import type { OnetMascoMatch } from '../../packages/shared/src/data/onet'

// Hand-checked O*NET 30.1 to MASCO 2020 unit-group matches, checked on 22 October 2026. A pair is listed only
// when both hold:
//   1. Title: the O*NET 30.1 title equals the MASCO 2020 unit-group title (ignoring case, punctuation and
//      "&" against "and"), as printed in the unit-group summary of the MASCO 2020 PDF, at the page given.
//   2. Code: O*NET's ESCO to O*NET-SOC crosswalk links the occupation to the same 4-digit ISCO-08 group,
//      and no other unit group in its crosswalk links passes rule 1.
// Every other occupation gets `masco_unmatched: true`. MASCO 2020 is "@ Ministry of Human Resources 2020. No
// part of this publication may be reproduced", so this file keeps codes and page numbers, not titles.
// MASCO 2020 PDF: https://jtksm.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf
export const MASCO_SOURCE_URL = 'https://jtksm.gov.my/sites/default/files/2022-12/MASCO_2020_BI_Edaran.pdf'
export const MASCO_CHECKED_DATE = '2026-10-22'

export const MASCO_MATCHES: OnetMascoMatch[] = [
  { onet_code: '11-1031.00', masco_2020: '1111', masco_pdf_page: 2 },
  { onet_code: '11-9021.00', masco_2020: '1323', masco_pdf_page: 2 },
  { onet_code: '13-2011.00', masco_2020: '2411', masco_pdf_page: 30 },
  { onet_code: '15-1211.00', masco_2020: '2511', masco_pdf_page: 30 },
  { onet_code: '15-1252.00', masco_2020: '2512', masco_pdf_page: 30 },
  { onet_code: '17-1012.00', masco_2020: '2162', masco_pdf_page: 28 },
  { onet_code: '17-2041.00', masco_2020: '2145', masco_pdf_page: 28 },
  { onet_code: '17-2051.00', masco_2020: '2142', masco_pdf_page: 28 },
  { onet_code: '17-2071.00', masco_2020: '2151', masco_pdf_page: 28 },
  { onet_code: '17-2081.00', masco_2020: '2143', masco_pdf_page: 28 },
  { onet_code: '17-2141.00', masco_2020: '2144', masco_pdf_page: 28 },
  { onet_code: '19-2031.00', masco_2020: '2113', masco_pdf_page: 28 },
  { onet_code: '21-1094.00', masco_2020: '3253', masco_pdf_page: 103 },
  { onet_code: '23-1011.00', masco_2020: '2611', masco_pdf_page: 31 },
  { onet_code: '29-1051.00', masco_2020: '2262', masco_pdf_page: 29 },
  { onet_code: '31-9092.00', masco_2020: '3256', masco_pdf_page: 103 },
  { onet_code: '33-9032.00', masco_2020: '5414', masco_pdf_page: 173 },
  { onet_code: '35-3011.00', masco_2020: '5132', masco_pdf_page: 172 },
  { onet_code: '39-7012.00', masco_2020: '5113', masco_pdf_page: 172 },
  { onet_code: '43-2021.00', masco_2020: '4223', masco_pdf_page: 154 },
  { onet_code: '47-2121.00', masco_2020: '7125', masco_pdf_page: 210 },
  { onet_code: '47-2181.00', masco_2020: '7121', masco_pdf_page: 210 },
  { onet_code: '47-2211.00', masco_2020: '7213', masco_pdf_page: 210 },
  { onet_code: '51-2022.00', masco_2020: '8212', masco_pdf_page: 247 },
  { onet_code: '51-6031.00', masco_2020: '8153', masco_pdf_page: 246 }
]

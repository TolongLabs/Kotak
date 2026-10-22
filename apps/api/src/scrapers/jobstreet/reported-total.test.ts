import { expect, test } from 'bun:test'
import { isEnabledNextLink, isNoResultsPage, parseReportedTotal, resolveBreadthTarget } from './pipeline'

test('parses JobStreet result totals from metadata and localized number separators', () => {
  expect(
    parseReportedTotal([
      { value: 'Find your ideal job with 2,373 Software Engineer jobs found in Malaysia.', source: 'meta_description' }
    ])
  ).toEqual({ total: 2373, source: 'meta_description' })
})

test('prefers metadata totals and falls back to visible page text', () => {
  expect(
    parseReportedTotal([
      { value: 'No count here', source: 'meta_description' },
      { value: 'There are 42 Software Engineer jobs found in Malaysia.', source: 'page_text' }
    ])
  ).toEqual({ total: 42, source: 'page_text' })
})

test('ignores pages without a supported result count', () => {
  expect(
    parseReportedTotal([{ value: 'Find roles and browse the latest vacancies.', source: 'meta_description' }])
  ).toBeNull()
})

test('caps the effective target at the smaller positive site total and configured limit', () => {
  expect(resolveBreadthTarget(5000, 2373)).toBe(2373)
  expect(resolveBreadthTarget(1000, 2373)).toBe(1000)
  expect(resolveBreadthTarget(5000, null)).toBe(5000)
  expect(resolveBreadthTarget(5000, 0)).toBe(5000)
})

test('recognizes JobStreet’s explicit end-of-results page', () => {
  expect(isNoResultsPage('2,375 jobs No matching search results')).toBe(true)
  expect(isNoResultsPage('Software Engineer jobs found')).toBe(false)
})

test('rejects aria-hidden or disabled next links on the final page', () => {
  expect(isEnabledNextLink({ ariaDisabled: null, ariaHidden: null })).toBe(true)
  expect(isEnabledNextLink({ ariaDisabled: 'true', ariaHidden: null })).toBe(false)
  expect(isEnabledNextLink({ ariaDisabled: null, ariaHidden: 'true' })).toBe(false)
})

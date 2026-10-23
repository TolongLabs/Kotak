import { describe, expect, test } from 'bun:test'
import { careerFromRow, careerSearchUrl, parseCareerTitle, slugForSearchUrl, slugForTitle } from './careers'
import { parseJobstreetTask, parseQueuedJobstreetRun, queuedDepthListing } from './tasks'

const task = { career_slug: 'software-engineer', mode: 'breadth' }
const run = { ...task, id: '719b4e2b-3fb1-47c1-af3b-c20cd8cde180', source: 'manual', scheduled_for: null }
const career = careerFromRow({
  slug: 'software-engineer',
  title: 'Software Engineer',
  search_url: 'https://my.jobstreet.com/software-engineer-jobs'
})
const listing = {
  source: 'jobstreet',
  job_id: '12345',
  url: 'https://my.jobstreet.com/job/12345?tracking=test',
  title: 'Software Engineer',
  listing_text: 'A job listing',
  search_url: 'https://my.jobstreet.com/software-engineer-jobs?page=3',
  scraped_at: '2026-10-23T00:00:00Z'
}

describe('JobStreet queue capability boundary', () => {
  test('accepts only a career slug and breadth/depth', () => {
    for (const mode of ['breadth', 'depth'] as const)
      expect(parseJobstreetTask({ career_slug: 'ai-engineer', mode })).toEqual({ careerSlug: 'ai-engineer', mode })
    for (const input of [
      null,
      [],
      {},
      { ...task, mode: 'command' },
      { ...task, career_slug: '../jobs' },
      { ...task, career_slug: 'Software Engineer' },
      { ...task, career_slug: 'a'.repeat(81) }
    ]) {
      expect(() => parseJobstreetTask(input)).toThrow()
    }
  })

  test('rejects caller supplied commands, URLs, paths and browser settings', () => {
    for (const key of ['command', 'script', 'url', 'output', 'profileId', 'browserScope', 'task']) {
      expect(() => parseJobstreetTask({ ...task, [key]: 'arbitrary' })).toThrow()
    }
  })

  test('validates queue records before using their IDs as paths', () => {
    expect(parseQueuedJobstreetRun(run).id).toBe(run.id)
    for (const id of ['../escaped', 'C:\\outside', '/absolute', 'not-a-uuid', `${run.id}/child`]) {
      expect(() => parseQueuedJobstreetRun({ ...run, id })).toThrow()
    }
    for (const source of ['local_import', 'command', null])
      expect(() => parseQueuedJobstreetRun({ ...run, source })).toThrow()
    expect(() => parseQueuedJobstreetRun({ ...run, mode: 'shell' })).toThrow()
    expect(() => parseQueuedJobstreetRun({ ...run, scheduled_for: '2026-10-23' })).toThrow()
    for (const scheduled_for of ['2026-02-30', '2026-13-01', 'tomorrow', null]) {
      expect(() => parseQueuedJobstreetRun({ ...run, source: 'schedule', scheduled_for })).toThrow()
    }
    expect(parseQueuedJobstreetRun({ ...run, source: 'schedule', scheduled_for: '2026-10-23' }).source).toBe('schedule')
  })

  test('depth accepts only matching JobStreet IDs and the queued career', () => {
    const row = { job_id: '12345', career_slug: 'software-engineer', latest_payload: listing }
    expect(queuedDepthListing(row, career).url).toBe('https://my.jobstreet.com/job/12345')
    for (const changed of [
      { ...row, job_id: '999' },
      { ...row, career_slug: 'front-end-developer' },
      { ...row, latest_payload: { ...listing, search_url: 'https://my.jobstreet.com/front-end-developer-jobs' } },
      { ...row, latest_payload: { ...listing, url: 'https://outside.invalid/job/12345' } }
    ])
      expect(() => queuedDepthListing(changed, career)).toThrow()
  })
})

describe('JobStreet search titles', () => {
  test('a career row must point at its own JobStreet search page', () => {
    expect(career.searchUrl).toBe('https://my.jobstreet.com/software-engineer-jobs')
    for (const search_url of [
      'https://my.jobstreet.com/front-end-developer-jobs',
      'https://outside.invalid/software-engineer-jobs',
      'https://my.jobstreet.com/software-engineer-jobs?page=2',
      'http://my.jobstreet.com/software-engineer-jobs'
    ])
      expect(() => careerFromRow({ slug: 'software-engineer', title: 'Software Engineer', search_url })).toThrow()
    expect(() =>
      careerFromRow({ slug: '../x', title: 'X', search_url: 'https://my.jobstreet.com/../x-jobs' })
    ).toThrow()
    expect(() => careerSearchUrl('a/b')).toThrow()
  })

  test('titles become JobStreet keyword slugs', () => {
    expect(slugForTitle('UI/UX Designer')).toBe('ui-ux-designer')
    expect(slugForTitle('R&D Software Engineer')).toBe('r-d-software-engineer')
    expect(slugForTitle('Pereka Grafik Kanan')).toBe('pereka-grafik-kanan')
    expect(slugForTitle('Café Manager')).toBe('cafe-manager')
    expect(parseCareerTitle('  AI   Engineer ')).toEqual({ title: 'AI Engineer' })
    for (const value of [
      '',
      'A',
      'x'.repeat(81),
      '<script>',
      'Engineer; DROP',
      '工程师',
      'C++ Developer',
      '.NET Developer',
      42
    ])
      expect(parseCareerTitle(value)).toHaveProperty('error')
  })

  test('search URLs resolve to their career slug, page included', () => {
    expect(slugForSearchUrl('https://my.jobstreet.com/software-engineer-jobs?page=36')).toBe('software-engineer')
    for (const url of [
      'https://outside.invalid/software-engineer-jobs',
      'https://my.jobstreet.com/jobs',
      'https://my.jobstreet.com/job/12345',
      'https://my.jobstreet.com/Software_Engineer-jobs'
    ])
      expect(() => slugForSearchUrl(url)).toThrow()
  })
})

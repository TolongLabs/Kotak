import { expect, test } from 'bun:test'
import { boxOf, placePoints, trendOf } from './quadrant'

test('box by fit and trend, with unknowns left unplaced', () => {
  expect(boxOf(80, 'rising')).toBe('best')
  expect(boxOf(50, 'rising')).toBe('best')
  expect(boxOf(80, 'steady')).toBeNull()
  expect(boxOf(80, 'declining')).toBe('push')
  expect(boxOf(20, 'rising')).toBe('plan')
  expect(boxOf(20, 'declining')).toBe('rethink')
  expect(boxOf(null, 'rising')).toBeNull()
  expect(boxOf(60, null)).toBeNull()
  expect(trendOf('split')).toBeNull()
})

test('duplicates merge by id with You first, and unknown fit is never placed at 0', () => {
  const placed = placePoints([
    { id: 'a', label: 'A', fit: 70, trend: 'rising', kind: 'suggested' },
    { id: 'a', label: 'A', fit: 70, trend: 'rising', kind: 'you' },
    { id: 'b', label: 'B', fit: null, trend: 'declining', kind: 'suggested' }
  ])
  expect(placed.map((p) => [p.id, p.kind, p.x, p.y])).toEqual([
    ['a', 'you', 70, 62],
    ['b', 'suggested', null, 38]
  ])
})

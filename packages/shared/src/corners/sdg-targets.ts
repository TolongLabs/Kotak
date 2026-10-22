// The 169 UN SDG targets, as listed by the UN SDG API (https://unstats.un.org/sdgs/UNSDGAPIV5/v1/sdg/Target/List).
// Per goal: the count of numbered targets, then the lettered means-of-implementation targets.
const GOALS: [goal: number, numbered: number, lettered: string][] = [
  [1, 5, 'ab'],
  [2, 5, 'abc'],
  [3, 9, 'abcd'],
  [4, 7, 'abc'],
  [5, 6, 'abc'],
  [6, 6, 'ab'],
  [7, 3, 'ab'],
  [8, 10, 'ab'],
  [9, 5, 'abc'],
  [10, 7, 'abc'],
  [11, 7, 'abc'],
  [12, 8, 'abc'],
  [13, 3, 'ab'],
  [14, 7, 'abc'],
  [15, 9, 'abc'],
  [16, 10, 'ab'],
  [17, 19, '']
]

/** Every real SDG target code, such as `4.4` or `8.a`, in goal order. */
export const SDG_TARGETS: readonly string[] = GOALS.flatMap(([goal, numbered, lettered]) => [
  ...Array.from({ length: numbered }, (_, i) => `${goal}.${i + 1}`),
  ...[...lettered].map((letter) => `${goal}.${letter}`)
])

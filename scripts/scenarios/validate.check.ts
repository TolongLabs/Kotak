// Self-check: bun scripts/scenarios/validate.check.ts. Plants each bad item the validator must reject.
import assert from 'node:assert'
import { validateJob, type Slot } from './validate'

const corners = Array.from({ length: 6 }, (_, c) => ({ corner_id: `c${c}`, task_ids: [1, 2, 3] }))
const good = (i: number): Slot => ({
  slot: i,
  corner_id: `c${Math.floor(i / 2)}`,
  level: i % 2 === 0 ? 'basic' : 'advanced',
  situation: 'A client sends a late request with missing details.',
  options: [
    { id: 'a', text: 'Reply with a short apology and a new date', score: 2 },
    { id: 'b', text: 'Check the file and ask the client to confirm', score: 4 },
    { id: 'c', text: 'Start work on a guess about the details', score: 1 },
    { id: 'd', text: 'Ask a colleague what they usually do here', score: 3 }
  ].map((o) => (o.id === 'c' ? { ...o, text: 'Start work using last month request as the template' } : o)),
  task_ids: [1]
})
const job = () => Array.from({ length: 12 }, (_, i) => good(i))
const bad = (mutate: (s: Slot[]) => void) => {
  const j = job()
  mutate(j)
  return validateJob(j, corners)
}
assert.deepEqual(validateJob(job(), corners), [])
assert.ok(bad((j) => (j[0]!.options[0]!.score = 4)).some((m) => m.includes('scores')))
assert.ok(
  bad((j) => (j[0]!.options[0]!.text = 'Always follow the standard process')).some((m) => m.includes('giveaway'))
)
assert.ok(
  bad(
    (j) =>
      (j[3]!.options[1]!.text =
        'Check the file '.repeat(1) +
        'and list every missing detail with the client and then confirm all of them in writing today')
  ).some((m) => m.includes('differ'))
)
assert.ok(bad((j) => (j[1]!.task_ids = [99])).some((m) => m.includes('task ids')))
assert.ok(bad((j) => (j[2]!.situation = 'word '.repeat(41))).some((m) => m.includes('situation over')))
assert.ok(
  bad((j) => (j[4]!.options[2]!.text = j[4]!.options[0]!.text + ' now')).some((m) => m.includes('near-duplicate'))
)
assert.ok(
  bad((j) => j.forEach((s) => (s.options[1]!.text = s.options[1]!.text + ' today'))).some((m) => m.includes('longest'))
)
assert.ok(bad((j) => (j[0]!.situation = 'x'.repeat(251))).some((m) => m.includes('characters')))
assert.ok(bad((j) => (j[0]!.options[0]!.text = 'w'.repeat(121))).some((m) => m.includes('characters')))
assert.ok(validateJob(job().slice(1), corners).length)
console.log('validator self-check passed')

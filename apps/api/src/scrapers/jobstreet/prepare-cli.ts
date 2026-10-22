import { parseArgs } from 'node:util'
import { prepareJobs } from './prepare'
import { parseSort } from './records'

try {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      input: { type: 'string', multiple: true },
      output: { type: 'string' },
      sort: { type: 'string', default: 'newest' },
      help: { type: 'boolean', short: 'h' }
    },
    strict: true,
    allowPositionals: false
  })
  if (values.help) {
    console.info(`Usage: bun run jobs:prepare --input PATH [--input PATH ...] --output NEW_DIRECTORY [--sort MODE]
  Merge captures or observations.jsonl files; preserve observation history and a sorted latest-job view.
  Sort modes: newest (default), title, company, location, job-id, scraped-at
  Does not require a browser. Rejected rows are recorded in rejected.jsonl.`)
  } else {
    if (!values.output) throw new Error('--output must name a new directory')
    await prepareJobs(values.input ?? [], values.output, parseSort(values.sort))
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

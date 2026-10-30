// Replays the final-round dev commits into a clone of the submission repo (TolongLabs/Kotak), one target commit
// per dev commit: the filtered diff, the original message plus a Dev-Commit trailer, and the original author name,
// email and author date (#376). Commits that touch only dev-only paths are skipped. It stops on the first conflict
// and never pushes; the human checks the result and pushes from the target clone by hand.
// Run: bun scripts/submission/port-commits.ts --target <path to a clone of TolongLabs/Kotak> [--since <ISO date>] [--until <ISO date>]
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

// Paths that stay in the dev repo and never reach the submission repo: the frozen finalist sources, the generated
// knowledge graph, and the scouting reports on the other finalists.
const DEV_ONLY_PATHS = ['docs/sources/finalists/', 'graphify-out/', 'docs/analyses/finalists/']

// The preliminary freeze (7:59:59 AM MYT) and the final deadline (7:59:59 AM MYT).
const DEFAULT_SINCE = '2026-10-25T08:00:00+08:00'
const DEFAULT_UNTIL = '2026-11-01T07:59:59+08:00'

const ROOT = `${import.meta.dir}/../..`
const ENV = { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' }

function runGit(args: string[], cwd: string, stdin?: Uint8Array): { ok: boolean; out: string; err: string } {
  const proc = Bun.spawnSync(['git', ...args], { cwd, stdin, env: ENV })
  return { ok: proc.success, out: proc.stdout.toString(), err: proc.stderr.toString().trim() }
}

function mustOk(result: { ok: boolean; out: string; err: string }, what: string): string {
  if (!result.ok) throw new Error(`${what} failed: ${result.err}`)
  return result.out
}

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: { target: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' } }
})
if (!values.target) {
  console.error(
    'Usage: bun scripts/submission/port-commits.ts --target <clone of TolongLabs/Kotak> [--since <ISO>] [--until <ISO>]'
  )
  process.exit(1)
}
const target = resolve(values.target)
const since = values.since ?? DEFAULT_SINCE
const until = values.until ?? DEFAULT_UNTIL
if (target === resolve(ROOT)) {
  console.error('Refusing: the target must be a separate clone of the submission repo, not the dev repo itself.')
  process.exit(1)
}

const started = performance.now()
const elapsed = () => ((performance.now() - started) / 1000).toFixed(1)
const replayed: { sha: string; subject: string }[] = []
const skipped: { sha: string; subject: string }[] = []

try {
  mustOk(runGit(['rev-parse', '--verify', 'origin/main'], ROOT), 'source origin/main lookup')
  mustOk(runGit(['rev-parse', '--git-dir'], target), `target repo lookup in ${target}`)
  if (mustOk(runGit(['status', '--porcelain'], target), `target status check`).trim() !== '') {
    console.error(`Refusing: the target ${target} has uncommitted changes. Commit, stash or discard them first.`)
    process.exit(1)
  }
  if (mustOk(runGit(['log', `--since=${until}`, '--format=%H'], target), 'target date check').trim() !== '') {
    console.error(`Refusing: the target already has a commit after ${until}.`)
    process.exit(1)
  }

  const shas = mustOk(
    runGit(
      ['log', 'origin/main', '--first-parent', '--reverse', '--format=%H', `--since=${since}`, `--until=${until}`],
      ROOT
    ),
    'source commit list'
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  console.log(`${shas.length} dev commit(s) on origin/main since ${since} until ${until}`)

  // A trailing slash alone excludes nothing (verified: the files still apply), so each dev-only path becomes a
  // glob: --exclude=<path>* leaves out everything under the path, including nested files.
  const excludes = DEV_ONLY_PATHS.map((dir) => `--exclude=${dir}*`)

  for (const sha of shas) {
    const [authorName, authorEmail, authorDate, subject, ...rest] = mustOk(
      runGit(['log', '-1', '--format=%an%x00%ae%x00%aI%x00%s%x00%B', sha], ROOT),
      `metadata for ${sha}`
    ).split('\0')
    const message = `${rest.join('\0').trimEnd()}\n\nDev-Commit: ${sha}`
    // A merge commit (a pull request merged without squashing) is replayed as its net change against its first
    // parent: diff-tree lists no files for a merge, and format-patch skips merges, so both would drop it silently.
    const isMerge =
      mustOk(runGit(['rev-list', '--parents', '-n', '1', sha], ROOT), `parents of ${sha}`)
        .trim()
        .split(' ').length > 2
    const files = mustOk(
      runGit(
        isMerge ? ['diff', '--name-only', `${sha}^1`, sha] : ['diff-tree', '--no-commit-id', '--name-only', '-r', sha],
        ROOT
      ),
      `file list for ${sha}`
    )
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (files.length > 0 && files.every((file) => DEV_ONLY_PATHS.some((dir) => file.startsWith(dir)))) {
      skipped.push({ sha, subject: subject! })
      console.log(`skip ${sha.slice(0, 7)} ${subject} (${files.length} file(s), all dev-only)`)
      continue
    }
    if (files.length === 0) {
      skipped.push({ sha, subject: subject! })
      console.log(`skip ${sha.slice(0, 7)} ${subject} (empty commit)`)
      continue
    }
    const patch = Bun.spawnSync(
      isMerge
        ? ['git', 'diff', '--binary', '--full-index', `${sha}^1`, sha]
        : ['git', 'format-patch', '-1', '--stdout', sha],
      { cwd: ROOT, env: ENV }
    )
    if (!patch.success) throw new Error(`patch for ${sha} failed: ${patch.stderr.toString().trim()}`)
    const am = Bun.spawnSync(
      isMerge ? ['git', 'apply', '--3way', '--index', ...excludes] : ['git', 'am', '--3way', ...excludes],
      { cwd: target, stdin: patch.stdout, env: ENV }
    )
    if (!am.success) {
      const unmerged = runGit(['diff', '--name-only', '--diff-filter=U'], target)
        .out.split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      console.error(`Stopped on conflict at dev commit ${sha}\n  subject: ${subject}`)
      console.error(`  conflicting files:\n${unmerged.map((file) => `    ${file}`).join('\n') || '    (none listed)'}`)
      console.error(`  am said: ${am.stderr.toString().trim().split('\n').slice(0, 3).join('\n')}`)
      console.error(
        `Replayed ${replayed.length}, skipped ${skipped.length} so far in ${elapsed()} s. The target is left as it is; resolve it there by hand.`
      )
      process.exit(1)
    }
    const amend = Bun.spawnSync(
      ['git', 'commit', ...(isMerge ? [] : ['--amend']), `--author=${authorName} <${authorEmail}>`, '-m', message],
      { cwd: target, env: { ...ENV, GIT_AUTHOR_DATE: authorDate } }
    )
    if (!amend.success)
      throw new Error(
        `message amend for ${sha} failed: ${amend.stderr.toString().trim()}. The target is left as it is.`
      )
    replayed.push({ sha, subject: subject! })
    console.log(`port ${sha.slice(0, 7)} ${subject}`)
  }

  console.log(`Replayed ${replayed.length} commit(s), skipped ${skipped.length} commit(s) in ${elapsed()} s.`)
  for (const { sha, subject } of skipped) console.log(`  skipped ${sha.slice(0, 7)} ${subject}`)
  console.log(`Next: check the target log and files, then push from the target clone by hand: git push origin main`)
} catch (error) {
  console.error(`port-commits: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}

# Agent workspace

Keep session notes and execution artifacts in the shared workspace beside the main checkout. Resolve that location from Git so linked worktrees use the same storage.

Contents:

1. [Find prior work](#find-prior-work)
1. [Start a turn](#start-a-turn)
1. [Write a handoff](#write-a-handoff)
1. [Clean up](#clean-up)

## Find prior work

Run this from the main checkout or any linked worktree:

```sh
repository="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
workspace="$(dirname "$repository")"
cat "$workspace/.notes/README.md"
```

The notes index points to short session handoffs. Open only the relevant handoff, then its linked evidence in `.orchestration`. Read historical results against their recorded revision; check the current repository before reusing a result or generated asset.

The local `.ignore` files keep generated artifacts out of ordinary ripgrep searches. Search handoffs and completion records first:

```sh
rg -n 'architecture|appendix' "$workspace/.notes" "$workspace/.orchestration"
```

For an artifact lookup, explicitly include ignored and hidden files within the selected turn:

```sh
rg --files --hidden --no-ignore "$workspace/.orchestration/architecture-docs-20261101/01" -g '*.html'
```

These sibling directories are local files outside the repository. A clone does not contain them. If the index is absent, create the two roots and add an index as sessions accumulate; the procedure below still applies.

## Start a turn

Choose a unique session ID, reusing it only when resuming that session. Keep the same turn name in both roots. With `workspace` resolved above:

```sh
session_id=agent-workspace-20261101
turn=01
notes="$workspace/.notes/$session_id/$turn"
artifacts="$workspace/.orchestration/$session_id/$turn"
mkdir -p "$notes" "$artifacts"
```

Use `.notes/<session_id>/<turn>/` for plans, decisions, and a concise `README.md` handoff. Use `.orchestration/<session_id>/<turn>/` for logs, captures, review output, generated files, and verification records. Pass the absolute artifact directory to tools; for architecture generation, set `ARCHIFY_ARTIFACT_DIR="$artifacts/archify"`.

## Write a handoff

Update the turn's `README.md` when work stops or completes. Include:

- Objective and status, with remaining work when incomplete.
- Repository revision, outcome, and decisions that explain the result.
- Exact paths to the sources and evidence needed to continue.
- Verification performed and its limits, including which older result was superseded.

Add the handoff to `.notes/README.md`. Keep reusable lessons in the relevant repository document and link it from the handoff. A reconstructed historical handoff should say which records it summarizes and distinguish a reviewed head from the merged revision.

For a completed session, keep a `completion-audit.json` beside its execution evidence and link it from the handoff. Record the revision actually checked, verification results, and integration outcome where applicable. Completion records describe historical work; check a live process handle or current external state before treating an interrupted job as finished.

## Clean up

Work within the requested sessions and preserve other sessions' processes, branches, and worktrees. Leave evidence at its recorded paths: generated HTML, receipts, and review records can contain absolute references to one another.

For completed sessions, remove Finder metadata and reinstallable dependency directories only after checking their manifests and lockfiles remain, a frozen install reproduces the dependencies, and current process/open-file checks show they are unused. Enumerate exact cleanup paths, skip symlinks, and record removals and bytes reclaimed in the current turn's artifacts. Keep unknown or incomplete sessions intact.

Preserve unique sources, completion records, logs, and delivery receipts. Before a bulk cleanup, record the retained paths and hashes; afterward, verify both the paths and bytes. Keep generated material filtered from default searches, with the explicit lookup above available when needed.

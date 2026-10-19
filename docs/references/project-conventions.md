# Project conventions

- Refer to [markdown-style.md](/docs/references/markdown-style.md) before creating markdowns, root README.md bypass this rule.
- Use `bun` and `bunx`, never `npm`, `npx`, or `pnpm`.
- Issue and PR titles follow [commitlint.config.mjs](/commitlint.config.mjs). Check each title with `bunx commitlint <<< "<title>"` before creating it.
- Record follow-ups as GitHub issues per [issue-tracker.md](/docs/agents/issue-tracker.md), never as terminal output or checklists.
- Before using a tool or API, read its official docs in the same session and follow their auth, rate-limit, and pagination guidance. Link the docs you used in the PR body.
- Avoid unit tests: agent-written tests mostly repeat the implementation ([source](https://x.com/kunchenguid/status/2108030810691629403)). Verify by running the app instead, and write tests only for cases the user specifies.
- Add a rule here only after an agent repeats a mistake, and include why. Delete rules that no longer apply.

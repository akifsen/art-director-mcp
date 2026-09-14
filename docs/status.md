# Development status — 2026-09-14

The original master prompt and project requirements remain unchanged. This is a working initial slice, **not complete M0/M1 or a release**.

Implemented: strict TS workspaces; official SDK v2 stdio; six tool inputs and common output envelope; fixed project root with traversal/drive/junction checks; bounded source inventory; deterministic recipes with structured preference priority; three original packs/six compositions; escaped HTML boards; optimistic contract lock + atomic rename; typed token/CSS/Tailwind outputs; targeted blueprints; optional isolated Chromium worker with numeric-loopback allowlist, redirect/subresource blocking, masks, axe/overflow and two viewports; real React/Vite product demo; local tarball packaging.

Executed on native Windows, Node 24.13.0, npm 11.6.2:

```powershell
npm run typecheck
npm run build
$env:AD_BROWSER_TEST='1'
npm test
node scripts/demo-evidence.mjs
node scripts/pack-smoke.mjs
```

Initial suite: **12/12 passed**, no skips, including live Chromium detection of intentional overflow and missing labels, redirect/subresource denial, revision conflict, real stdio calls and stdio-to-browser-worker integration. Product demo captures at 1440×1000 and 390×844 had no axe violations or page overflow. This does not establish WCAG compliance. The host visually inspected both above-the-fold captures: clear hierarchy and mobile stacking; the focused skip link overlaps the wordmark while active, a nonblocking visual refinement to consider. Lower-page and full state visual review remains pending.

Clean tarball install passed outside the repository: CLI doctor and real stdio tools/list + inspect. The main tarball contains only LICENSE, README, dist/cli.js and package.json, and correctly reports no browser worker. No npm/GitHub/Registry publication occurred.

## Remaining acceptance gates

- Actual IDE session validation remains pending; `init --apply` merge/backup/rollback and managed rules now have regression tests.
- Actual Cursor/Codex/VS Code sessions and clean Windows/macOS/Linux CI runs.
- Fully specific tool output/error schemas, response-budget fuzzing, image content retrieval and image capability negotiation. Screenshots currently reside as base64 in audit artifacts; paginated text is available.
- Generic DTCG alias resolution/validation, more token categories, tested Tailwind integration and stronger pack semantics/examples.
- Incremental content-hash cache, corruption recovery, all performance benchmarks.
- Per-workspace cross-process browser quota, cancellation/crash/SIGTERM stress tests, complete fixed IPC output validation, retention cleanup and screenshot lifecycle.
- Contract-based token/state drift, menu/focus scenarios, heuristic composition findings, full source adapter confidence and line evidence.
- Third compatible dashboard recipe if warranted, editorial and dense dashboard applications; only the React/Vite product application exists so far.
- Blind comparison harness implementation and real aesthetic evaluation; protocol documented only.
- Registry schema validation, release OIDC workflow, account/namespace verification and explicit publication authorization.

Next priority: strengthen worker lifecycle and image artifacts, finish safe IDE install adapters, then add remaining demos and acceptance tests. Do not present the above pending items as implemented.

## GitHub distribution preparation

The suite now passes 16/16 tests, including all three config adapters, dry-run behavior, preservation of comments and other servers, backup creation, idempotent reruns, malformed configuration refusal and junction rejection. Version-pinned npx launch configuration and durable npm-local mode are implemented. Actual IDE sessions remain untested. GitHub release tarballs provide installation while npm login/publication is pending.

Assistant expansion: 13 project adapters plus vscode alias and all. 30/30 local tests passed. Original GitHub CI run 34803710376 passed on Windows, Linux and macOS; expanded adapter CI is being rerun. Real IDE sessions remain untested. See clients.md for official sources and five skipped clients.

## Independent review — 0.2.0

See `docs/reviews/2026-09-14-independent-review.md` for findings, evidence and verification. Summary: boards were structurally similar and typographically identical across recipes (fixed: recipe-driven type system, navigation pattern and composition structure); previews were not openable (fixed: `previewPath`); audit findings were mislabeled as `labels` (fixed: requirement mapping + `requirementResults`); origin refusal and stale-lock messages gave no resolution (fixed); inline budget/pagination were too small (raised to 40 KB / 12000 chars with summaries). 44/44 tests pass on Windows with Node 24.21.0 including browser fixtures. Status of the earlier gates is unchanged unless listed there.

## npm distribution verification

Published @akifsen/art-director-mcp@0.1.1 and @akifsen/art-director-browser@0.1.0 with public access. The main patch fixes Windows npx quoting; worker IPC remains 0.1.0. CI run 34806016474 passed on Windows, Linux and macOS. Registry-downloaded 0.1.1 generated its default npx launcher and passed real MCP initialize, six-tool listing and inspect_project with a space/Unicode project path on Windows. Both npm packages also installed together and worker detection succeeded.

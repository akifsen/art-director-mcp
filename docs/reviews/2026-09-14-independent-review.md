# Independent review and release — 2026-09-14

Reviewer role: senior reviewer / release engineer, independent of the original Codex/Astra development. Scope: `@akifsen/art-director-mcp` 0.1.1 as published, repository `akifsen/art-director-mcp` at `483f6e0`.

Environment: Windows 11 (win32 10.0.26200), PowerShell. The machine had only Node 22.20 (its nvm "v24.10.0" folder contained a 22.20 binary), so a SHA-256-verified portable Node 24.21.0 / npm 11.19.0 was used from a user-local folder without changing the system PATH. Chromium headless shell was installed opt-in through `art-director browser install`. Not tested here: macOS, Linux, real IDE sessions (see CI and the "not verified" list).

## 1. Starting state

Verified, not taken from prior status notes:

- Git: `main` == `origin/main`, clean tree; tags `v0.1.0`, `v0.1.1`; no GitHub Releases, no publish workflow (`ci.yml` runs checks only). npm publication was manual from a maintainer machine (`_resolved` path in registry metadata).
- npm: `@akifsen/art-director-mcp` 0.1.0, 0.1.1 (latest); `@akifsen/art-director-browser` 0.1.0. Maintainer `akifsen`; local `npm whoami` = `akifsen`.
- Baseline on Node 24.21.0: `npm ci` clean (0 vulnerabilities), typecheck and build pass, **31/31 tests pass** with `AD_BROWSER_TEST=1`.
- Raw stdio check (7 runs): only JSON-RPC lines on stdout, 0 bytes on stderr, process exits with code 0 when stdin closes. Initialize first response median 134 ms.
- Security probes (traversal, drive/UNC, `.env*`, denied directories, junctions, artifact id shapes, Windows trailing-space/dot path components, tampered direction, corrupted `contract.json`): all refused or contained. No P0 found.

Feature inventory against the master prompt (implemented / partial / deferred / unverifiable):

| Area | State |
|---|---|
| Six tools, stdio, schemas, artifacts, pagination | Implemented |
| Project inspection | Partial — file/hash/token inventory and a 3-package stack detector; no design-system summary |
| Distinct directions | Partial — six structural variants existed, but boards shared one typeface, size scale and rhythm; visually they differed mostly by color |
| Contract → blueprint → audit linkage | Partial — blueprint returned static semantics + recipe copy; audit did not evaluate contract requirements |
| Mobile menu / states | Partial — states text present; boards had no navigation element at all |
| Honest capability reporting | Implemented (`visualReview: not-performed`, `BROWSER_NOT_INSTALLED`, two-direction warning for dashboards) |
| IDE adapters | Config generation + merge tests implemented; real IDE sessions unverified (unchanged) |
| Blind aesthetic evaluation, registry publication, OIDC | Deferred by the project; unchanged |

## 2. Findings

Severity: P0 critical, P1 core promise broken, P2 quality/usability, P3 minor.

| # | Sev | Finding | Evidence | Root cause | Fix | Verification |
|---|---|---|---|---|---|---|
| 1 | P1 | Directions were "same template, different colors": all six boards used `font:18px/1.6 system-ui`, identical h1 scale and section rhythm; dashboard `workbench` board looked like a portfolio page with no toolbar/table. | Screenshots of 8 boards at 1440/390 before the change | `board()` had one CSS block; recipe `typography`/`density`/`navigation` were prose only | Recipe `type` system + `styleFor()`; board CSS and structure derived from navigation, density, type and composition; native `<details>` disclosure on mobile | `review.test.mjs` "boards differ…", visual re-check of 8 boards, boards audited clean in `fixtures.test.mjs` |
| 2 | P1 | Boards could not be opened: HTML lived only inside `.art-director/reports/<sha>.json`; `previews/` was gitignored but never written | Code path `Service.call('propose_directions')` | Missing write | `previewPath` = `.art-director/previews/<directionId>.html` | Test asserts file equals `board(d)`; clean-install smoke opened paths |
| 3 | P2 | Audit findings all labeled `contractRequirementId: 'labels'` except contrast; e.g. `region`/`heading-order` reported as label failures; contract requirements never evaluated | `worker.ts` mapping ternary; `service.ts` returned raw run | Hard-coded default | `requirementFor()` mapping in the server (works with worker 0.1.0); `requirementResults` per requirement with pass/fail/needs-human-review; new deterministic `accessibility` requirement | Unit test with synthetic runs; live fixture test (broken → overflow/labels fail; fixed → pass) |
| 4 | P2 | Results > 8.5 KB returned only "Read the full result using get_artifact"; page max 1800 chars. A 6×1500-char brief needed ~17 calls to read one response | Measured: response 308 B, artifact 30 KB | Conservative constants | Inline budget 40 KB; page limit 12000 (default 6000, old 1800 still valid); typed `summary` on truncation | Test reads a 12-section brief result in ≤10 pages; audit summary carries `requirementResults` |
| 5 | P2 | `ORIGIN_NOT_ALLOWED` surfaced as a bare code after forking a browser; no hint that `--allow-origin` is a server start argument | Manual call with unlisted origin | Check lived only in the worker | Pre-check in `Service` with the exact flag to add; no browser launched | Test asserts message and that the runner was not invoked |
| 6 | P2 | Stale `contract.lock` after a crash blocked compilation forever with "requires explicit recovery" and no path | Simulated 1 h-old lock → `CONTRACT_CONFLICT` | No age check | Locks older than 60 s reclaimed once; fresh locks conflict with the file path in the message | Test covers both branches |
| 7 | P2 | Blueprint was generic: same `semantics` string for `navigation` regardless of top/rail/inline; contract typography and density had no effect | Output compared across three portfolio directions | Static map | `blueprint()` derives `decisions`, `stackNotes`, `cssVariables` from recipe, style and requirements; legacy contracts without `style` recomputed | Test: navigation guidance count equals distinct navigation types; table guidance includes `tabular-nums` for dense recipes |
| 8 | P2 | Tokens/CSS carried only three colors and one spacing unit; the "typography" decision never reached the implementation | `tokenCss()` output | Thin token model | Font families, heading weight, section/gap spacing, body size, line height in DTCG JSON and `--ad-*` CSS; `tokens.css` persisted; Tailwind theme extended | Test checks variables; clean install lists written files |
| 9 | P2 | Compiling required resending the exact generated object; the README instruction ("without previewArtifactId") is easy to get wrong and the error did not say how | Manual test with response object → Zod error | Strict schema only | `directionId` + `brief` + `seed` alternative; explicit guidance in `INVALID_DIRECTION` | Tests for both paths, tampering and mixed input |
| 10 | P2 | `inspect_project` detected only react/vite/tailwindcss and ignored `.vue/.svelte/.astro/.scss`; no summary for the agent | Inspect on synthetic Next+Vue project | Narrow lists | 23 stack packages, Tailwind config detection, more extensions, `summary` with counts, token files and design-system note; file scope rejected with `INVALID_INPUT` | Test |
| 11 | P2 | `doctor` reported `browserWorker:true` even when Chromium was absent; no `--version`; missing project root gave a raw `ENOENT` | Manual runs | Missing checks | Chromium install marker check (`chromium-<rev>` or `chromium_headless_shell-<rev>`), `hints`, `--version`, clear root error | Test + manual runs with present/absent browsers directory |
| 12 | P3 | Worker stderr pipe was never drained (potential block on a chatty worker); crash errors lost diagnostics | Code reading | — | Drain + attach last 1000 chars on `BROWSER_CRASH` | Code review; browser tests pass |
| 13 | P3 | `CHANGELOG.md` said "0.1.0 – Unreleased" while 0.1.1 was on npm | File | Not updated | Rewritten for 0.1.0, 0.1.1, 0.2.0 | — |

Not defects, confirmed working: path/junction/UNC/drive controls; artifact integrity; optimistic revision conflict; exclusive lock under concurrency; worker origin allowlist, redirect and subresource blocking; stdout hygiene; exit on stdin close; 13 installer adapters idempotent with backups; Windows npx quoting; tarball content (4 files).

## 3. Product-value questions (answers with outputs)

1. Project analysis: real file walk with hashes, sizes, CSS custom properties and manifest-based stack detection; it does not read component semantics or infer a design system beyond tokens. Now reports a summary and 23 stack packages. Still bounded (2000 files / 20 MiB) and honest about `confidence`.
2. Three directions differ on ≥3 of six axes (existing test) and now also in rendered typography, navigation pattern and composition structure (new test + screenshots).
3. Before: yes, effectively one template. After: no — see boards `folio` (condensed uppercase masthead, inline ruled nav, alternating 8/4 rows), `margin-notes` (serif, sticky rail, 3/7 margin index), `workbench` (rail, toolbar, table skeleton, details), `ledger` (top bar, inset summary, grouped records), `product-stage` (top bar, split stage, inverted band, numbered steps), `guided-path` (rail, oversized step numbers, reference column).
4. Brief content, primary task, audience and constraints appear in boards, rationales and blueprints; structured preferences override recipe axes and the rationale says so. Free-text constraints are preserved for review, not "solved" — unchanged and honest.
5. Contract now drives blueprint decisions, token CSS and audit `requirementResults`; `contractRevision` is echoed in blueprint and audit outputs.
6. Blueprints give concrete, recipe-specific decisions (widths, breakpoints, variables, ARIA patterns, state handling) plus stack notes; still deterministic text, not code generation.
7. Mobile menu: boards use `<details>` for rail/top navigation below 700 px; blueprints specify `aria-expanded`/Escape behavior; states remain textual requirements. Loading/empty/error/focus are described, not measured.
8. Unsupported capabilities remain explicit: `visualReview: not-performed`, `capabilities.vision:false`, `BROWSER_NOT_INSTALLED` with resolution, two-direction warning, human-review requirements never auto-passed.

Contexts evaluated: portfolio (`examples/fixtures/portfolio`), product (`examples/expressive-product`), dashboard (`examples/fixtures/dashboard`). Deliberate-defect check: `dashboard/broken.html` (1800 px table → page overflow at 1440 and 390; unassociated visible label → axe `label`) is flagged on both requirements; `fixed.html` and the healthy portfolio page produce zero deterministic findings; all six generated boards audit clean. A subtlety found on the way: axe accepts `placeholder` as an accessible name, so the fixture uses a non-associated `<span>` instead.

## 4. Not changed / deferred

- `@akifsen/art-director-browser` stays 0.1.0; IPC `version:'0.1.0'` unchanged; the mislabeling is corrected server-side so no second publish is needed.
- No new packs. A third dashboard recipe is still deferred (ADR 001); the two-direction warning stands.
- Board audit in the worker still performs one Tab press and axe; no menu interaction or state simulation.
- Artifact retention is still manual (`.art-director/reports` grows per call).
- Real IDE sessions, macOS/Linux local runs, MCP Registry submission, trusted publishing: not performed here; CI covers the three OSes.
- `doctor` now loads Playwright to locate the browsers directory (~330 ms vs ~140 ms); `serve` startup is unaffected (median 138 ms vs 134 ms, 7 samples each).

## 5. Commands run and results

```powershell
npm ci --ignore-scripts            # 29 packages, 0 vulnerabilities
npm run typecheck && npm run build # pass
$env:AD_BROWSER_TEST='1'; npm test # baseline 31/31; after changes 44/44, 0 skipped
npm run smoke:pack                 # akifsen-art-director-mcp-0.2.0.tgz: LICENSE, README.md, dist/cli.js, package.json; 87,282 B unpacked; clean install + stdio list/inspect passed
node scripts/export-packs.mjs      # design-packs/*.json regenerated (pack 1.1.0 with type blocks)
```

Clean-install smoke outside the repository (temp project path with a space and Turkish characters, local 0.2.0 tarball plus registry `@akifsen/art-director-browser@0.1.0`): `--version` → 0.2.0; `doctor` detects worker and Chromium marker; `init --client cursor --apply` writes the pinned `cmd /d /c npx -y @akifsen/art-director-mcp@0.2.0 serve --project …` launcher; `--local` merge and idempotent rerun; `directions` → 3 previews on disk; `contract` → 4 files; stdio `tools/list` 6 tools; `get_blueprint` recipe-specific decisions; unlisted origin refused with guidance; live `audit_ui` on the broken fixture → overflow/labels/accessibility fail, human requirements marked for review.

Performance (7 samples, same machine, same session): serve initialize first response median 134 ms before / 138 ms after; repository inspect 14 ms; no bottleneck requiring optimization was measured. No percentage claims are made.

## 6. Release

Version: 0.2.0 (minor — additive tool inputs/outputs, no removals; 0.1.x direction objects are rejected by design because the version participates in the direction id, as before). Release path: existing manual flow — commit to `main`, CI `checks` on Windows/Linux/macOS, tag `v0.2.0`, `npm publish` from `packages/mcp` with the tested tarball, GitHub Release notes from CHANGELOG. Post-publish verification is recorded below once complete.

### Release log

_Filled in at the end of the process; see the final section._

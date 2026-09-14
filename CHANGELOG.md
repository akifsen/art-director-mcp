# Changelog

## 0.3.0 - 2026-09-14

Design decisions now adapt to the brief instead of the pack. `@akifsen/art-director-browser` 0.2.0 adds stage budgets; 0.1.0 workers keep working with this server.

Added
- Brief fields (all optional, 0.1/0.2 briefs still validate): `purpose`, `secondaryTasks`, `preserve`, `brand` (`name`, `colors`, `fonts`, `designSystem`), `character` (`prefer`, `avoid`), `assets`, `content[].role/priority/group/evidence`, and `preferences.heading/body/headingWeight/palette/source`. `pageType` accepts `landing`, `company`, `article` and `docs` in addition to `portfolio`, `product` and `dashboard`.
- Identity resolution: palette and type are resolved per direction with the precedence preferences → brand → character → pack. Every decision records its `provenance`; brand fonts lead the CSS font stacks; low-contrast brand colors, unreadable accent fills and contradictory character words are returned as `identity.conflicts` instead of being changed silently. Tokens carry `$extensions['art-director'].source`, a new `color.onAccent` token and `--ad-on-accent`/`--ad-heading-max` CSS variables.
- Content architecture: brief items are given roles (inferred from headings when absent), priorities and groups; same-group and same-role offering/work/proof/data items merge into one section; presentations are `feature`, `prose`, `grouped-list`, `work-list`, `steps`, `table`, `records`, `aside`, `contact` and `evidence-pending`. Proof without real evidence is rendered as an explicit gap; `architecture.missing` lists what is absent. Boards, contracts (`schemaVersion` 1.1 with `identity`, `architecture`, `preservedBehaviors`) and blueprints all use the same architecture.
- Fit-first candidate selection: every recipe is scored against the brief (data roles, declared assets, process content, offering count, page type, avoid list, explicit navigation) and only recipes within two points of the best fit compete on structural diversity; lower-fit fill-ins and excluded recipes are explained in `warnings`. Each direction returns `fit` and `rationaleDetail` (fit, emphasis, visualDriver, mobile, wrongWhen, identity). Recipes gained `features` and `wrongWhen` (pack version 1.2.0).
- `get_blueprint` section `page` (section order, hero source, frame, identity with provenance, responsive rules, explicit gaps, preserved behaviors). `content`, `hero`, `navigation` and `table` guidance is derived from the architecture and identity rather than from the recipe alone. Contracts from 0.1/0.2 are upgraded on read.
- `audit_ui`: `coverage` (elements evaluated, contrast nodes, timed-out stages, unmeasured requirements), result `classes`, `not-measured` and `partial` requirement statuses (a requirement passes only when every viewport measured it), `partial-timeout` status, and an optional `hostReview` (structured verdicts from the IDE agent or a person) stored with the contract revision and never merged into measured findings.
- Browser worker 0.2.0: total budget (`budgetMs`, default 40 s) split into named stages (launch, navigate, fonts, measure, axe, focus, screenshot); a timed-out stage yields a `partial` result naming the stage and keeps the completed viewport; `measured` and `stages` per run; `elementsChecked` and `contrastNodes` coverage counts.
- CLI: `blueprint`, `artifact`, `contract --direction-id --brief --seed`, `directions --seed`, `--audit-budget`; `doctor --client <assistant>` launches the command written in that assistant's project configuration and verifies the stdio MCP handshake (initialize, tools/list) with timings and hints for slow npx downloads, unsupported Node and unstartable commands. Zod validation errors are reported as `INVALID_INPUT` with field paths.
- Fixture matrix under `examples/fixtures/matrix` and `tests/design.test.mjs` covering brand/identity separation, preference precedence, grouped multi-domain content, missing evidence, cross-tool consistency, legacy inputs, CLI/MCP parity, audit result classes and the config-versus-handshake distinction.

Changed
- Supported Node range is `>=22 <27`; the full suite (including browser and stdio handshake tests) runs on Node 22 and 24 in CI. Starting on an unsupported version prints an `UNSUPPORTED_NODE` warning to stderr instead of failing silently later.
- Direction ids include the server version and the resolved identity, so 0.2.0 direction ids must be regenerated with `propose_directions` (compile reports this).
- Directions no longer duplicate brief text in `architecture.sections[].items`; items reference `brief.content` by index (`sectionItems()` resolves them).
- Tool descriptions and the optional managed workflow rule guide the agent through context → architecture → justified visual decisions → contract → evidence review.
- The hard audit timeout is budget + 15 s (default 55 s) and its message explains whether the worker supports stage budgets.

## 0.2.0 - 2026-09-14

All changes are backward compatible; `@akifsen/art-director-browser` stays at 0.1.0 (IPC protocol unchanged).

Added
- Direction boards now follow each recipe's navigation pattern (top bar, side rail, inline masthead links with a native mobile disclosure), type system (serif/sans/condensed heading, body family, weight, numerals) and density; compositions render their own structure (toolbar + table skeleton, grouped records, split stage, numbered steps, margin index, alternating folio rows). Previously all six boards shared one typeface and rhythm and differed mainly by color.
- `propose_directions` writes each board to `.art-director/previews/<directionId>.html` and returns `previewPath` plus per-direction `differences` (axes on which it diverges from the others). Rationales name the content mapping, navigation, density, type and mobile behavior.
- `compile_design_contract` accepts `directionId` + `brief` + `seed` as an alternative to resending the full direction object; error messages explain both paths. Compilation also writes `.art-director/tokens.css` and reports the written `files`, `previewPath` and derived `style`.
- Contract tokens include font families, heading weight, spacing scale and typography values; generated CSS exposes `--ad-font-heading`, `--ad-font-body`, `--ad-heading-weight`, `--ad-space-section`, `--ad-space-gap`, `--ad-body-size`, `--ad-line-height`. New contract requirements: `accessibility` (deterministic), `typography` and `mobile` (human review).
- `get_blueprint` returns recipe-specific `decisions`, `stackNotes` and `cssVariables` derived from the contract instead of static semantics only. Contracts written by 0.1.x are still readable.
- `audit_ui` returns `requirementResults` mapping measured findings to contract requirements (pass / fail / needs-human-review) and `contractRevision`; findings are labeled with the correct requirement (`labels`, `contrast`, `overflow`, `accessibility`) instead of everything defaulting to `labels`.
- `inspect_project` recognizes more stacks (Next, Vue, Nuxt, Svelte, Astro, Angular, Solid, Tailwind config, MUI, Chakra, styled-components, Sass), scans `.vue/.svelte/.astro/.scss/.less/.mdx`, and returns a `summary` (file kinds, top-level directories, token files, design-system note).
- CLI `--version`; `doctor` reports Chromium binary presence and actionable `hints`; a missing project root produces a clear error.
- Review fixtures under `examples/fixtures` and end-to-end tests that prove the audit finds two deliberate defects and reports the corrected page and a healthy page clean.

Changed
- Inline response budget raised from 8.5 KB to 40 KB; `get_artifact` pages up to 12000 characters (default 6000; the previous 1800 limit still works). Truncated responses include a typed `summary` instead of only a pointer message.
- `audit_ui` refuses a URL whose origin is not allowed before launching a browser and tells the user the exact `--allow-origin` value to add.
- Abandoned `.art-director/contract.lock` files older than 60 s are reclaimed automatically; fresh locks still return `CONTRACT_CONFLICT` with the file path.
- Browser worker stderr is drained and its tail is attached to `BROWSER_CRASH` errors.
- Pack recipes carry an optional `type` block (pack version 1.1.0); existing 0.1.x pack JSON without it still validates.

## 0.1.1 - 2026-09-14

Fixed Windows npx launch quoting in generated client configuration; documented npm installation. Published to npm.

## 0.1.0 - 2026-09-14

Initial public preview: six stdio tools, bounded workspace inspection, six composition recipes, HTML direction boards, revisioned contracts, DTCG/CSS/Tailwind outputs, optional Chromium worker (`@akifsen/art-director-browser@0.1.0`), 13 project-scoped IDE adapters, React/Vite demo and security/protocol tests.

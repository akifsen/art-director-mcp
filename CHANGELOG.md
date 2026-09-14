# Changelog

## 0.2.0 - 2026-09-14

Independent review release of `@akifsen/art-director-mcp`. All changes are backward compatible; `@akifsen/art-director-browser` stays at 0.1.0 (IPC protocol unchanged). See `docs/reviews/2026-09-14-independent-review.md`.

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

# Contributing

Use Node 24, run `npm ci --ignore-scripts`, `npm run typecheck`, `npm run build`, and `npm test`.
Browser tests are opt-in: install via the CLI, then set `AD_BROWSER_TEST=1` before `npm test`.

Keep domain logic in core; it must never import the MCP SDK or Playwright. External packs must remain validated data, never executable plugins. Add regression tests for security boundaries and protocol behavior. Never fabricate visual review, platform evidence or benchmark results.

No publish or remote account operation is part of local setup. See the release checklist.

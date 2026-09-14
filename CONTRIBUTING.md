# Contributing

## Setup

Use Node 24, then run:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
```

Browser tests are opt-in: install the worker with `node packages/mcp/dist/cli.js browser install`, then set `AD_BROWSER_TEST=1` before `npm test`.

## Guidelines

- Keep domain logic in `packages/core`; it must not import the MCP SDK or Playwright.
- Design packs are validated data (`art-director pack validate <file>`), never executable code.
- Add regression tests for security boundaries (path resolution, origin policy, artifact access) and for protocol behavior.
- Document user-visible changes in `CHANGELOG.md`.

## Releases

Releases are cut by maintainers from `main` after CI passes on Windows, Linux and macOS: bump the package versions, update the changelog, tag `vX.Y.Z` and publish `packages/mcp` (and `packages/browser` when it changes) to npm.

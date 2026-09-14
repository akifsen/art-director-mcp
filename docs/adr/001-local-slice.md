# ADR 001: Local-first architecture

Status: accepted.

## Runtime and packaging

- Node 24 LTS, strict TypeScript and the MCP TypeScript SDK v2 (`@modelcontextprotocol/server`).
- The `core` package (domain logic, workspace access, service layer) is bundled into the published `@akifsen/art-director-mcp` tarball; it is not published as a separate dependency. Core never imports the MCP SDK or Playwright.
- The browser worker (`@akifsen/art-director-browser`) is an optional, separately installed package. Without it, `audit_ui` returns a `blocked` result with the install command instead of failing the session.

## Design directions

- Directions are recipes selected from validated design packs. Packs are data, never executable plugins.
- A recipe is a composition frame (grid, rhythm, navigation, mobile behavior, structural features). Palette and type are resolved separately per direction from the brief with the precedence explicit preferences → brand facts → character words → pack defaults, and every decision records its source. The pack is a fallback, not the identity.
- Content is an architecture, not a list: brief items carry roles, priorities and groups; sections are derived from them and shared by boards, contracts and blueprints. Missing material is an explicit gap; nothing is fabricated.
- Candidates are scored for fit against the brief first; structural diversity is applied only among recipes close to the best fit. Fill-ins and exclusions are explained in the response.
- A brief may receive fewer than three directions when its page type or avoid list rules out recipes; the result explains the restriction instead of repurposing an unsuitable layout.
- The MCP never calls a model. Free creative reasoning happens in the host agent; the server accepts its structured result (`preferences`, `brand`, roles, `hostReview`), validates it, stores it and carries it through every output.

## Assistant installation

- `init` writes project-scoped configuration only. Existing files are merged, backed up and never rewritten wholesale; global home-directory settings are never touched.
- Assistants that configure MCP servers through user-level settings are reported as `skipped` rather than emulated.

## Browser policy

- Only explicitly allowed loopback origins (numeric hosts, `127.0.0.1` and `[::1]`) are audited; other origins must be enabled with `--allow-origin`. Numeric hosts avoid DNS ambiguity.
- Redirects are validated by fetching with `maxRedirects: 0` and checking the destination against the allow-list before navigation, because intercepting `route.continue` alone does not catch cross-origin redirects.

# Art Director MCP

Local art direction, versioned design contracts and rendered UI evidence for coding agents.

Early development preview. Source and installable packages are distributed on GitHub. **The npm registry and MCP Registry publications are pending.**

## Install in your IDE project

Requires Node 24 LTS and npm. Run from your project folder. Until npm registry publication, install the GitHub release package:

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-mcp-0.1.0.tgz
npx art-director init --client cursor --apply --local
# Or choose codex / vscode instead of cursor.
```

One-shot installation without adding a project dependency:

```sh
npx --yes --package=https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-mcp-0.1.0.tgz art-director init --client cursor
```

The one-shot example is a dry-run. For durable use before npm publication, use the local install above; default generated configuration references the version-pinned npm package and only becomes usable after it is published.

After npm registry publication (not available yet):

```sh
npx -y @akifsen/art-director-mcp@0.1.0 init --client cursor --apply
npx -y @akifsen/art-director-mcp@0.1.0 init --client codex --apply
npx -y @akifsen/art-director-mcp@0.1.0 init --client vscode --apply
# Optional workflow guidance: add --with-rules
```

Omit `--apply` to preview the changes. Configurations are project-scoped: Cursor `.cursor/mcp.json`, Codex `.codex/config.toml`, VS Code `.vscode/mcp.json`. Existing unrelated entries and comments are preserved; changed files receive ignored backups. `--local` uses the installed Node and CLI paths instead of npx. Restart/reload the IDE and approve the project MCP server as required by the client. Codex may require trusting the project before loading project configuration. No claim of arbitrary IDE support is made: other MCP-compatible clients can use `art-director serve --project <absolute-path>` with their own configuration.

## Run from source

Requires Node 24 LTS and npm. From this repository:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
node packages/mcp/dist/cli.js doctor
node packages/mcp/dist/cli.js serve --project /absolute/project
```

Windows accepts an absolute Windows project path as a single quoted argument. Generated IDE configuration uses the current absolute Node executable and built CLI, avoiding npx shell resolution. Rebuild before using it.

```sh
node packages/mcp/dist/cli.js init --client cursor
node packages/mcp/dist/cli.js init --client codex
node packages/mcp/dist/cli.js init --client vscode
```

These commands preview changes. Add `--apply` to merge with backups and `--with-rules` to add managed workflow guidance. Existing malformed configuration is refused.

## Tools

`inspect_project` → `propose_directions` → `compile_design_contract` → host implementation → `audit_ui`. `get_blueprint` provides focused section guidance; `get_artifact` retrieves bounded report pages. All six tools work without MCP resources, sampling or a separate model API key.

Pass the generated direction itself to contract compilation (omit the sibling `previewArtifactId`). `expectedRevision: 0` creates the first contract. Subsequent writes require the current revision. HTML boards are design studies, not application screenshots. Free-text constraints are retained for the host to interpret; only structured navigation/density preferences are automatically enforced.

Three original MIT packs contain six compositions. Dashboard context currently has two compatible recipes, and the tool reports that restriction instead of claiming a third. Generic alias resolution and full DTCG validation are not yet implemented; generated tokens use typed sRGB colors, dimensions and one tested color alias. The Tailwind output targets v4 `@theme` syntax and has not been tested in a Tailwind build.

## Real demo and browser evidence

The React/Vite product demo is in `examples/expressive-product`:

```sh
npm ci --ignore-scripts --prefix examples/expressive-product
npm run dev --prefix examples/expressive-product -- --port 5187 --strictPort
# Separate terminal, explicit browser opt-in:
node packages/mcp/dist/cli.js browser install
node scripts/demo-evidence.mjs
```

The source workspace includes the separate browser package. A standalone installation must install the matching local browser tarball first. The main tarball does not depend on Playwright and has no postinstall. Browser installation fetches Playwright's pinned Chromium headless shell and support binaries into the normal Playwright cache.

For MCP browser use, pass `--allow-origin http://127.0.0.1:5187` at server startup. Only explicitly allowed numeric loopback origins are accepted; localhost DNS, private networks, credentials, unlisted ports, redirects and subresources are restricted. WebSockets and service workers are blocked. The server never launches your dev server.

Screenshots are local and may contain private information. `maskSelectors` masks screenshots only; DOM findings can still expose page data. There is no automatic retention cleanup yet; remove local reports/screenshots manually when appropriate. The worker uses isolated browser contexts without personal profiles.

## Verification and limits

Native Windows / Node 24.13.0: typecheck, build, real SDK v2 stdio and live Chromium tests executed. Cursor, Codex and VS Code: configuration merge tested, actual IDE sessions **not tested**. macOS/Linux: CI configured, **not tested locally**. See `docs/status.md` for exact acceptance gaps and commands.

Browser findings include axe checks and document overflow at desktop/mobile sizes, plus one Tab focus observation. This is not full keyboard/state coverage, WCAG certification, visual quality scoring or source-line mapping. Visual review belongs to the host. Historical evidence is marked unverified, and unavailable capabilities return blocked/partial results.

No telemetry, separate cloud upload, LLM key, model download or GPU is required. Tool results sent to your IDE may be processed by its model provider. Source files and pages are untrusted data. Filesystem checks are defense in depth, not an OS sandbox against another process racing filesystem mutations.

Performance targets in the original spec are unmeasured. No superiority or aesthetic benchmark claims are made. Scan currently hashes bounded sources on demand; incremental caching is pending.

See `README.tr.md`, `SECURITY.md`, `CONTRIBUTING.md` and `docs/release-checklist.md`.

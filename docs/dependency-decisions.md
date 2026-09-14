# Dependency evidence — 2026-09-14

Runtime tested locally: Node 24.13.0, npm 11.6.2, Windows. Node 24 is an LTS line: https://nodejs.org/en/about/previous-releases

Official SDK README confirms v2 is stable: https://github.com/modelcontextprotocol/typescript-sdk . Registry `npm view @modelcontextprotocol/server version engines exports --json` returned 2.0.0, Node >=20, root export and `/stdio`. Use only v2 imports. Client 2.0.0 will exercise the real stdio transport; this does not prove IDE compatibility.

Registry versions verified: TypeScript 7.0.2, Zod 4.6.5, esbuild 0.28.2, Playwright 1.63.0, @axe-core/playwright 4.13.0, @types/node 26.5.1. Exact versions and a lockfile are required. Browser dependency belongs only to the opt-in worker.

DTCG 2025.10 https://www.designtokens.org/tr/2025.10/format/ is a Community Group specification, not a W3C Recommendation. Colors use colorSpace/components; dimensions use value/unit; aliases use brace references.

Client config evidence: https://cursor.com/docs/mcp uses `.cursor/mcp.json` / `mcpServers`; https://code.visualstudio.com/docs/agent-customization/mcp-servers uses `.vscode/mcp.json` / `servers`; https://learn.chatgpt.com/docs/extend/mcp?surface=cli documents TOML `mcp_servers`. Generated configs use an absolute local Node executable. No IDE session integration was tested.

Browser checks follow https://playwright.dev/docs/accessibility-testing . https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html specifies a 24 CSS pixel AA criterion with exceptions; no universal 44px AA rule is used. Browser install uses the exact Playwright CLI package path and downloads Chromium headless shell v1243 for Playwright 1.63.0.

npm trusted publishing documentation https://docs.npmjs.com/trusted-publishers/ currently states npm >=11.5.1 and Node >=22.14.0. Local environment meets those version floors; no publisher configuration or remote publication has occurred.

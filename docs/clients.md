# Assistant installation compatibility

Verified against official documentation on 2026-09-14. These are **config adapters tested by local fixtures**, not claims that real sessions in every IDE were exercised. All generated commands run on the user's computer and bind the supplied project root. No runtime GitHub API or Actions call is made.

```sh
art-director clients
art-director init --client claude --apply
art-director init --client all --apply
```

`all` preflights all supported adapters before writing, installs the 13 project adapters below, and reports skipped clients. It never writes global home-directory settings. If a later concurrent write causes failure, results report partial completion and the failed client; earlier installed configurations remain available with backups. `vscode` remains an alias for `copilot` and is not installed twice by `all`.

| Option | Target | Config | Official source |
|---|---|---|---|
| `claude` | Claude Code | `.mcp.json`, `mcpServers` | [MCP](https://code.claude.com/docs/en/mcp) |
| `cursor` | Cursor | `.cursor/mcp.json`, `mcpServers` | [MCP](https://cursor.com/docs/mcp) |
| `copilot` | GitHub Copilot in VS Code | `.vscode/mcp.json`, `servers` | [MCP](https://code.visualstudio.com/docs/agent-customization/mcp-servers) |
| `kiro` | Kiro | `.kiro/settings/mcp.json`, `mcpServers` | [Configuration](https://kiro.dev/docs/mcp/configuration/) |
| `codex` | Codex CLI | `.codex/config.toml`, `mcp_servers` | [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) |
| `qoder` | Qoder CLI | `.mcp.json`, `mcpServers` | [Reference](https://docs.qoder.com/cli/mcp-reference) |
| `roocode` | Roo Code | `.roo/mcp.json`, `mcpServers` | [MCP](https://docs.roocode.com/features/mcp/using-mcp-in-roo) |
| `gemini` | Gemini CLI | `.gemini/settings.json`, `mcpServers` | [MCP](https://geminicli.com/docs/tools/mcp-server/) |
| `opencode` | OpenCode | `opencode.json` or existing `opencode.jsonc`, `mcp` | [MCP](https://opencode.ai/docs/mcp-servers/) |
| `continue` | Continue IDE extension | `.continue/mcpServers/art-director.json`, `mcpServers` | [MCP](https://docs.continue.dev/customize/deep-dives/mcp) |
| `codebuddy` | CodeBuddy CLI | `.mcp.json`, `mcpServers` | [MCP](https://www.codebuddy.ai/docs/cli/mcp) |
| `droid` | Droid (Factory) | `.factory/mcp.json`, `mcpServers` | [MCP](https://docs.factory.ai/harness/mcp) |
| `kilocode` | Current Kilo Code | `.kilo/kilo.json` or existing root/hidden JSONC config, `mcp` | [MCP](https://kilo.ai/docs/automate/mcp/using-in-kilo-code) |

OpenCode and current Kilo use `{type:"local", command:[executable,...args]}` rather than a `command` string plus `args`. Ambiguous multiple config files are refused. Claude, Qoder and CodeBuddy share `.mcp.json`; identical repeat writes are no-ops. Client trust and tool approval settings are not disabled. Existing user/global overrides may still affect discovery.

Managed workflow rules are currently implemented only for Cursor, Copilot/VS Code and Codex. `--with-rules` on other clients installs MCP configuration and reports a rules warning; it does not invent a rule-file convention.

## Skipped

- `windsurf`: [official docs](https://docs.windsurf.com/windsurf/cascade/mcp) describe user-global `~/.codeium/windsurf/mcp_config.json`.
- `antigravity`: [official docs](https://antigravity.google/docs/mcp) describe UI-managed `mcp_config.json`; stable project auto-discovery was not established.
- `trae`: project path/schema could not be verified from official documentation in this pass.
- `warp`: [official docs](https://docs.warp.dev/reference/cli/mcp-servers) use application/CLI registration and account sync, not a verified project file.
- `augment`: [official docs](https://docs.augmentcode.com/setup-augment/mcp) use UI import/user settings; no verified project auto-discovery adapter.

Skipped names are recognized and return `status: skipped` without file changes. This is not a claim that those products lack MCP support.

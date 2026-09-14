# Assistant installation reference

`art-director init` writes a project-scoped MCP server entry for the selected assistant. Every generated command runs on your computer and binds the supplied project root; nothing is written to home-directory settings.

```sh
art-director clients
art-director init --client claude --apply
art-director init --client all --apply
```

`all` checks every supported adapter before writing, then installs the 13 project adapters below. If a later write fails, the result reports which adapter failed; adapters installed earlier keep their backups. `vscode` is an alias for `copilot` and is not installed twice by `all`.

| Option | Assistant | Configuration file and key | Documentation |
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
| `kilocode` | Kilo Code | `.kilo/kilo.json` or existing root/hidden JSONC config, `mcp` | [MCP](https://kilo.ai/docs/automate/mcp/using-in-kilo-code) |

OpenCode and Kilo Code use `{type:"local", command:[executable, ...args]}` rather than a `command` string plus `args`. When more than one candidate configuration file exists, the installer stops and asks you to consolidate them. Claude Code, Qoder and CodeBuddy share `.mcp.json`; repeated installs are no-ops. The installer never changes an assistant's trust or tool-approval settings, and user-level settings in the assistant may still take precedence over project files.

Managed workflow rules (`--with-rules`) are available for Cursor (`.cursor/rules/art-director.mdc`), Copilot in VS Code (`.github/instructions/art-director.instructions.md`) and Codex (`AGENTS.md`). Other assistants receive the MCP configuration only.

Configuration generation, merging, backups and idempotence are covered by the automated test suite on Windows, Linux and macOS. How each assistant discovers and approves the server is defined by that assistant; consult its documentation if the server does not appear after reloading.

If the server does not appear, run `art-director doctor --client <option>`. It reads the entry written for that assistant, launches the same command and completes the MCP handshake over stdio (`initialize`, `tools/list`), reporting the startup time, the tool list and diagnostics: a cold `npx` download that exceeds the assistant's startup timeout, an unsupported Node version inherited by the assistant, or a command that cannot be started from a GUI application's PATH. A successful probe means the process and protocol work; whether the assistant's UI lists the tools is decided by the assistant.

## Assistants configured outside the project

These assistants store MCP servers in user-level settings or through their own UI rather than a project file, so `init` reports them as `skipped` and leaves your files unchanged. Register the server there using the launch command shown by `art-director init --client cursor` (dry run) as a reference.

| Option | Assistant | Where to add the server |
|---|---|---|
| `windsurf` | Windsurf | `~/.codeium/windsurf/mcp_config.json` — [docs](https://docs.windsurf.com/windsurf/cascade/mcp) |
| `antigravity` | Antigravity | MCP settings UI (`mcp_config.json`) — [docs](https://antigravity.google/docs/mcp) |
| `trae` | Trae | MCP settings UI |
| `warp` | Warp | Warp settings or `warp mcp` CLI — [docs](https://docs.warp.dev/reference/cli/mcp-servers) |
| `augment` | Augment | MCP import in the extension settings — [docs](https://docs.augmentcode.com/setup-augment/mcp) |

# Art Director MCP

**Give your coding agent a visual direction, a design contract, and evidence to refine the result.**

Art Director MCP runs locally alongside your IDE. It turns a structured project brief into distinct visual directions, records the selected direction as a versioned contract, and collects browser evidence from your running interface.

[Installation](#installation) · [Assistants](#assistant-setup) · [Browser audit](#browser-audit) · [Türkçe](README.tr.md)

## What it does

- **Explore visual directions.** Three design packs offer six compositions with typography, layout, mobile behavior and interface states.
- **Make decisions explicit.** Generate design contracts, design tokens and CSS custom properties while preserving your project constraints.
- **Get focused implementation guidance.** Request blueprints for navigation, content, forms, tables and hero sections.
- **Check the rendered interface.** Collect desktop and mobile screenshots, accessibility findings and horizontal overflow measurements using the optional browser worker.

Your IDE agent handles implementation and visual judgment. Art Director supplies structured decisions and evidence without requiring an additional model API key.

## Installation

Requires **Node.js 24 LTS** and npm. Run these commands inside your project:

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-mcp-0.1.0.tgz
npx art-director init --client cursor --apply --local
```

The package is installed from the [GitHub release](https://github.com/akifsen/art-director-mcp/releases/tag/v0.1.0). `--local` connects your IDE to that installed copy. Reload the IDE and approve the project MCP server when prompted.

## Assistant setup

Replace `cursor` with your assistant's option:

| Assistant | Option |
|---|---|
| Claude Code | `claude` |
| Cursor | `cursor` |
| GitHub Copilot in VS Code | `copilot` |
| Kiro | `kiro` |
| Codex CLI | `codex` |
| Qoder CLI | `qoder` |
| Roo Code | `roocode` |
| Gemini CLI | `gemini` |
| OpenCode | `opencode` |
| Continue IDE extension | `continue` |
| CodeBuddy CLI | `codebuddy` |
| Droid (Factory) | `droid` |
| Kilo Code | `kilocode` |
| All supported assistants | `all` |

```sh
# Preview configuration changes
npx art-director init --client claude --local

# Configure every supported project adapter
npx art-director init --client all --apply --local

# Show available adapters and configuration details
npx art-director clients
```

Setup preserves unrelated settings and comments, creates backups, and keeps configuration inside the project. Repeated installation is idempotent. `vscode` is also accepted as an alias for `copilot`.

For Cursor, Copilot and Codex, add `--with-rules` to include workflow guidance. See the [compatibility reference](docs/clients.md) for configuration paths and client-specific behavior. Adapter tests verify configuration generation and merging; individual IDE sessions are a separate compatibility check.

## Workflow

1. **Inspect** the project's UI files, stack, tokens and asset inventory.
2. **Compare** visual direction boards built from your brief and content.
3. **Compile** the selected direction into a versioned design contract.
4. **Implement** the interface with your IDE agent.
5. **Audit** the running interface and refine it using the findings.

| MCP tool | Purpose |
|---|---|
| `inspect_project` | Inspect the authorized project's UI inventory |
| `propose_directions` | Generate context-compatible directions and HTML boards |
| `compile_design_contract` | Create a revisioned contract and token outputs |
| `get_blueprint` | Retrieve section-specific implementation guidance |
| `audit_ui` | Collect and report browser evidence |
| `get_artifact` | Read generated artifacts in bounded pages |

Direction boards are design studies. The number of compatible directions depends on the project context. Contract updates use revision checks to prevent one client from silently overwriting another client's decisions.

## Browser audit

Install the matching optional worker in the same project:

```sh
npm install --save-dev https://github.com/akifsen/art-director-mcp/releases/download/v0.1.0/akifsen-art-director-browser-0.1.0.tgz
npx art-director browser install
```

Start your application's development server, then add an allowed origin to the Art Director server arguments in your IDE configuration:

```text
--allow-origin http://127.0.0.1:5187
```

Use the port belonging to your application. The worker visits explicitly allowed numeric loopback origins in an isolated browser context. Art Director does not start your application server or use your personal browser profile.

Audits capture desktop/mobile evidence and run axe accessibility and overflow checks. Automated findings support review; they are not a WCAG certification or an aesthetic score. The IDE agent performs visual evaluation.

## Local execution and privacy

The MCP server runs on the user's computer. Using it does not call this repository's GitHub API, trigger GitHub Actions, or connect to the maintainer's computer. Package installation and the explicit browser installation download their dependencies.

No separate Art Director cloud service, telemetry or model API key is used. Tool responses may be processed by your IDE's model provider under that provider's policies.

Reports and screenshots stay in the project's `.art-director/` directory. Screenshot masks affect pixels; DOM findings can still include page content. Review generated evidence before sharing it. See [SECURITY.md](SECURITY.md).

## Develop locally

```sh
git clone https://github.com/akifsen/art-director-mcp.git
cd art-director-mcp
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
```

The repository includes a React/Vite example:

```sh
npm ci --ignore-scripts --prefix examples/expressive-product
npm run dev --prefix examples/expressive-product -- --port 5187 --strictPort
```

Windows, Linux and macOS are covered by the [CI workflow](https://github.com/akifsen/art-director-mcp/actions/workflows/ci.yml), including package installation and browser checks. See [CONTRIBUTING.md](CONTRIBUTING.md) for development instructions.

## License

[MIT](LICENSE). Third-party dependencies retain their own licenses; see [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).

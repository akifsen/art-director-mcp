# Art Director MCP

**Give your coding agent a visual direction, a design contract, and evidence to refine the result.**

Art Director MCP runs locally alongside your IDE. It turns a structured project brief into distinct visual directions, records the selected direction as a versioned contract, and collects browser evidence from your running interface.

[Installation](#installation) · [Assistants](#assistant-setup) · [Browser audit](#browser-audit) · [Türkçe](README.tr.md)

## What it does

- **Explore visual directions.** Three design packs offer six compositions (frame, grid, rhythm, navigation, mobile behavior). Directions are ranked by fit to your brief first and then chosen for structural variety; each one states why it fits, what it emphasizes, what drives its visual impact, how it changes on mobile and when it would be the wrong choice.
- **Keep the brand yours.** Palette and typography come from your brand facts and explicit preferences; the pack only fills gaps. Every decision in the tokens and contract names its source (`user`, `host`, `brand`, `character`, `pack`), and conflicts such as low-contrast brand colors are reported instead of silently corrected.
- **Turn content into architecture.** Brief items carry roles, priorities and groups; related items become one grouped section, sequences become steps, data becomes tables, and missing proof stays an explicit gap. Nothing is invented.
- **Make decisions explicit.** Generate design contracts, DTCG design tokens and CSS custom properties while preserving your project constraints and behaviors.
- **Get focused implementation guidance.** Request blueprints for the whole page, navigation, content, forms, tables and hero sections, derived from the contract's architecture and identity.
- **Check the rendered interface.** Collect desktop and mobile screenshots, accessibility findings and horizontal overflow measurements using the optional browser worker, with per-stage timing, coverage counts and partial results on timeout.

Your IDE agent handles implementation and visual judgment. Art Director supplies structured decisions and evidence without requiring an additional model API key.

## Installation

Requires **Node.js 22 or 24 LTS** (the test suite runs on both; supported range `>=22 <27`) and npm. Run these commands inside your project:

```sh
npx -y @akifsen/art-director-mcp@0.3.0 init --client cursor --apply
```

The [npm package](https://www.npmjs.com/package/@akifsen/art-director-mcp) configures your IDE to run a pinned version locally. Reload the IDE and approve the project MCP server when prompted.

Alternatively, add the package to your project and bind that copy with `--local`:

```sh
npm install --save-dev @akifsen/art-director-mcp@0.3.0
npx art-director init --client cursor --apply --local
```

Both modes run on your computer. `--local` chooses the installed copy; without it the IDE launches the pinned package through npx. A written configuration file is not yet a working integration: run `npx art-director doctor --client cursor` to launch the configured command exactly as the IDE would and verify the stdio handshake (`initialize` → `tools/list`). It reports the startup time, the tool list, and hints when npx is still downloading, the IDE inherits an unsupported Node, or the command cannot be started. The IDE's own UI is outside what `doctor` can verify.

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

For Cursor, Copilot and Codex, add `--with-rules` to include workflow guidance. See the [installation reference](docs/clients.md) for configuration paths, client-specific behavior and assistants that are configured through their own settings instead of a project file.

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

Direction boards are design studies. Each board follows its recipe's frame (top bar, side rail or inline masthead links, grid and rhythm), renders the brief's content architecture (grouped offerings, work lists, steps, tables, explicit evidence gaps) and applies the resolved identity (your brand palette and fonts where supplied, pack defaults otherwise). Directions therefore differ in structure and typography, not only in color, and the same composition looks different for different brands. Boards are written to `.art-director/previews/<directionId>.html` (`previewPath`) so you can open them in a browser. Each direction returns `fit` (reasons for and against), `rationaleDetail` (fit, emphasis, visualDriver, mobile, wrongWhen, identity), `architecture` and `identity.provenance`. Fewer than three directions are returned when the page type or your `character.avoid` list rules recipes out; the result says why. Contract updates use revision checks to prevent one client from silently overwriting another client's decisions.

Audits map measured findings onto the contract's deterministic requirements (`requirementResults`: overflow, labels, accessibility, contrast) and report what was actually covered (`coverage`: elements evaluated, contrast nodes, timed-out stages). A requirement passes only when every viewport measured it; unmeasured requirements are `not-measured` and timed-out runs are `partial`. Composition, architecture, identity, typography, mobile behavior, preserved behaviors and content truth stay marked for human review, and a passing audit means "no measured defect", not a successful design. An optional `hostReview` (structured verdicts from the IDE agent or a person) is stored with the contract revision it evaluated and never merged into measured findings.

## Use it in IDE chat

After installation, reload your IDE and enable the Art Director MCP server in its tools/settings panel. Open a chat mode that can call tools. Paste a prompt below; these are natural-language requests, not slash commands. Your agent selects and calls the MCP tools.

### Explore a design direction

> Use Art Director MCP to inspect this project. I am building a portfolio for an independent designer; the primary task is finding and reading project case studies. Our brand uses a warm off-white background, near-black text and the "Fraunces" heading font; we have real project screenshots but no client logos or metrics yet. Preserve the existing routes and real content. Turn this into a structured brief (roles and priorities for each content item, brand facts, what to avoid), propose compatible visual directions, and explain for each one why it fits, what it emphasizes and when it would be the wrong choice. Show the direction boards before changing application code.

### Implement the selected direction

> Use the second direction you just proposed. Compile it into a design contract using the current revision, retrieve the page and navigation blueprints, and implement the design in this project's existing stack following the contract's section order and presentations. Preserve real content and behavior. Where the contract lists missing material, keep an explicit gap; do not invent testimonials or usage metrics.

### Audit and refine

> The application is running at http://127.0.0.1:5187. Use Art Director MCP to audit it against the contract we created. Summarize the desktop and mobile findings, distinguish measured issues from visual judgment, and fix the highest-priority issues. Run the audit again after the changes.

For this example, install the browser worker and add the application's exact origin to the server's startup arguments first; see [Browser audit](#browser-audit). Supplying a URL in chat does not grant network permission.

### Focus on one component

> Retrieve the form blueprint for our current contract. Use it to improve labels, focus behavior, loading, error and success states in this form. Explain which parts you verified and which need visual review.

Results larger than about 40 KB are stored as artifacts and returned with a `summary`; ask the agent to retrieve the `artifactId` with `get_artifact` (up to 12000 characters per page), following `nextCursor`. To compile a contract, pass `directionId` together with the same `brief` and `seed` used for `propose_directions`, or pass the generated direction object without its `previewArtifactId`, `previewPath` and `differences` fields. Use `expectedRevision: 0` for the first saved contract and the current revision for updates. Compilation writes `.art-director/contract.json`, `tokens.json`, `tokens.css` and `brief.json`. Blueprint and audit calls use the `contractId` artifact identifier returned by compilation.

## Command reference

Run terminal commands from the project where the package is installed. Prefix each command with `npx art-director`.

| Command | What it does |
|---|---|
| `--help` | Show CLI usage, assistant options and command names |
| `--version` | Print the package version |
| `clients` | List project adapters, aliases and assistants configured outside the project |
| `init --client cursor --local` | Preview project configuration changes without writing |
| `init --client cursor --apply --local` | Install the selected adapter with backups |
| `init --client all --apply --local` | Install every supported project adapter after preflight checks |
| `doctor` | Print package/Node versions, platform, project root, worker and Chromium availability, allowed origins and actionable hints |
| `doctor --client cursor` | Additionally launch the command written in the assistant's project configuration and verify the MCP handshake over stdio (initialize, tools/list) with timings and diagnostics |
| `serve --project <absolute-root>` | Start the stdio MCP server used by the IDE |
| `inspect` | Inspect the current project's UI inventory |
| `directions --brief brief.json [--seed 0]` | Generate directions from a structured JSON brief; boards are written to `.art-director/previews/` |
| `contract --direction direction.json --expected-revision 0` | Compile and save a contract from a generated direction JSON file |
| `contract --direction-id <id> --brief brief.json [--seed 0] --expected-revision 0` | Compile by direction id plus the brief and seed used to generate it |
| `blueprint --contract-id <id> --section page [--stack react]` | Implementation guidance for `page`, `hero`, `navigation`, `content`, `form` or `table` (same as `get_blueprint`) |
| `artifact <artifactId> [--cursor 0] [--limit 6000]` | Read one page of an artifact (same as `get_artifact`) |
| `audit --contract-id <id> --url http://127.0.0.1:5187 --allow-origin http://127.0.0.1:5187 [--audit-budget 40000]` | Audit a running local page against a saved contract |
| `browser install` | Download the pinned browser binaries using the installed optional worker |
| `pack validate design-pack.json` | Validate a design pack JSON file against the pack schema |

Running `npx art-director` without a command displays `doctor` output. Every command calls the same service layer as the MCP tools, so validation, error codes, pagination and output shape are identical in both interfaces.

### CLI options

| Option | Applies to | Meaning |
|---|---|---|
| `--project <absolute-root>` | Project commands | Select the project; defaults to the current directory |
| `--client <name>` | `init` | Choose an assistant, `vscode` alias or `all` |
| `--apply` | `init` | Write the planned changes; otherwise preview only |
| `--local` | `init` | Use the installed Node executable and package path |
| `--with-rules` | `init` | Add managed workflow guidance for supported rule adapters |
| `--client <name>` | `doctor` | Verify that assistant's project configuration by launching it and completing the MCP handshake |
| `--brief <file>` | `directions`, `contract` | Project-relative brief JSON path; default `brief.json` |
| `--seed <integer>` | `directions`, `contract` | Tie-break seed used for candidate ordering; default `0` |
| `--direction <file>` | `contract` | Project-relative generated direction JSON path; default `direction.json` |
| `--direction-id <id>` | `contract` | Compile by id instead of a direction file (requires `--brief`) |
| `--expected-revision <integer>` | `contract` | Expected current saved revision; default `0` |
| `--contract-id <id>` | `blueprint`, `audit` | Contract artifact ID returned by compilation |
| `--section <name>`, `--stack <react\|html>` | `blueprint` | Blueprint part (default `page`) and target stack (default `react`) |
| `--cursor <n>`, `--limit <n>` | `artifact` | Page window; limit at most 12000 characters |
| `--url <url>` | `audit` | Running application's page URL |
| `--allow-origin <origin>` | `serve`, `audit` | Allow an exact numeric-loopback origin; repeat for multiple origins |
| `--audit-budget <ms>` | `serve`, `audit` | Total browser budget handed to the worker (default 40000; the CLI waits 15 s more for launch/IPC) |
| `--help` | CLI | Show help instead of executing a command |

Brief, direction and pack file paths are relative to the selected project. They cannot read outside that root. A minimal brief file looks like this:

```json
{
  "product": "Designer portfolio",
  "primaryTask": "Find and read project case studies",
  "pageType": "portfolio",
  "audience": "Potential clients",
  "content": [
    { "heading": "Selected work", "body": "Replace this with your actual project description." }
  ],
  "constraints": ["Preserve existing routes"]
}
```

`pageType` accepts `portfolio`, `product`, `dashboard`, `landing`, `company`, `article` or `docs`. Keep real project content in the brief. CLI results are JSON; use the returned artifacts through the IDE's MCP tools when a result is paginated.

### Brief fields that shape the design

All of the following are optional and backward compatible; a 0.1/0.2 brief still works and receives pack defaults with `provenance: "pack"`.

| Field | Effect |
|---|---|
| `purpose` | One sentence about what the organization or product does; becomes the hero support line and informs fit |
| `secondaryTasks` | Listed in reference columns; never turned into sections |
| `content[].role` | `hero`, `offering`, `work`, `proof`, `process`, `technical`, `organization`, `data`, `support`, `contact`, `other`. Inferred from headings when absent |
| `content[].priority` | `primary`, `secondary`, `supporting`; drives section order and size |
| `content[].group` | Items with the same group render as one grouped section instead of one section each |
| `content[].evidence` | `real`, `placeholder`, `none`; proof without real evidence renders as an explicit "Evidence pending" gap |
| `brand.colors`, `brand.fonts`, `brand.name`, `brand.designSystem` | Existing brand facts; override pack palette and type. Brand font names lead the CSS font stacks and are classified (serif/sans/condensed/mono) for the type system |
| `character.prefer` | Adjectives mapped to concrete decisions (for example `premium` → serif heading, weight 400, restrained accent; `technical` → tabular numerals, sans, weight 600). Applied only where brand and preferences did not decide; unmapped words are reported, contradictions are reported |
| `character.avoid` | Structural patterns to exclude (`sidebar`, `hero-image`, `numbered-steps`, `tables`, `masthead`, …). Recipes relying on them are excluded; unmapped words become a human-review requirement |
| `assets` | Which material exists (`screenshots`, `photography`, `illustration`, `logos`); a product stage without screenshots is penalized and labeled as a placeholder |
| `preserve` | Behaviors that must survive implementation; carried into the contract as a requirement |
| `preferences` | Explicit decisions (`navigation`, `density`, `heading`, `body`, `headingWeight`, `palette`) with `source: "user"` or `"host"`; highest precedence |

Precedence is preferences → brand → character → pack. The resolved `identity` records the source of every decision and lists `conflicts` (for example brand text/background contrast below 4.5:1) instead of silently changing your colors.


## Browser audit

Install the matching optional worker in the same project:

```sh
npm install --save-dev @akifsen/art-director-browser@0.2.0
npx -y @akifsen/art-director-mcp@0.3.0 browser install
```

Start your application's development server, then add an allowed origin to the Art Director server arguments in your IDE configuration:

```text
--allow-origin http://127.0.0.1:5187
```

Use the port belonging to your application. The worker visits explicitly allowed numeric loopback origins in an isolated browser context. A URL whose origin is not allowed is refused before any browser starts, with the exact `--allow-origin` value to add. Art Director does not start your application server or use your personal browser profile.

Audits capture desktop/mobile evidence and run axe accessibility, focus and overflow checks within a total budget (default 40 s) split into named stages (launch, navigate, fonts, measure, axe, focus, screenshot). When a stage exceeds its share, the worker returns the completed viewports as `partial` and names the stage that timed out instead of failing the whole audit; the response's `coverage` lists timed-out stages and requirements that were not measured. Automated findings support review; they are not a WCAG certification or an aesthetic score. The IDE agent performs visual evaluation and may record it through `audit_ui`'s `hostReview` field, which is stored alongside the measured findings. Worker 0.1.0 still works with this server (without stage budgets); `doctor` recommends the upgrade.

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

The repository includes static review fixtures in `examples/fixtures` (portfolio and dashboard briefs, a page with two deliberate defects and its corrected version, and a `matrix/` of briefs that exercise brand facts, grouped content, missing evidence and avoid lists) and a React/Vite example:

```sh
npm ci --ignore-scripts --prefix examples/expressive-product
npm run dev --prefix examples/expressive-product -- --port 5187 --strictPort
```

Windows, Linux and macOS are covered by the [CI workflow](https://github.com/akifsen/art-director-mcp/actions/workflows/ci.yml), including package installation and browser checks. See [CONTRIBUTING.md](CONTRIBUTING.md) for development instructions.

## License

[MIT](LICENSE). Third-party dependencies retain their own licenses; see [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).

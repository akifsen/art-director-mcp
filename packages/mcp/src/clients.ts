export type ClientSpec={label:string;path:string;format:'toml'|'standard'|'vscode'|'local-array';alternates?:string[]};
export const clients:Record<string,ClientSpec>={
  claude:{label:'Claude Code',path:'.mcp.json',format:'standard'},
  cursor:{label:'Cursor',path:'.cursor/mcp.json',format:'standard'},
  copilot:{label:'GitHub Copilot (VS Code)',path:'.vscode/mcp.json',format:'vscode'},
  kiro:{label:'Kiro',path:'.kiro/settings/mcp.json',format:'standard'},
  codex:{label:'Codex CLI',path:'.codex/config.toml',format:'toml'},
  qoder:{label:'Qoder CLI',path:'.mcp.json',format:'standard'},
  roocode:{label:'Roo Code',path:'.roo/mcp.json',format:'standard'},
  gemini:{label:'Gemini CLI',path:'.gemini/settings.json',format:'standard'},
  opencode:{label:'OpenCode',path:'opencode.json',alternates:['opencode.jsonc'],format:'local-array'},
  continue:{label:'Continue IDE extension',path:'.continue/mcpServers/art-director.json',format:'standard'},
  codebuddy:{label:'CodeBuddy CLI',path:'.mcp.json',format:'standard'},
  droid:{label:'Droid (Factory)',path:'.factory/mcp.json',format:'standard'},
  kilocode:{label:'Kilo Code (current config format)',path:'.kilo/kilo.json',alternates:['kilo.json','kilo.jsonc','.kilo/kilo.jsonc'],format:'local-array'}
};
export const skippedClients:Record<string,string>={
  windsurf:'Official configuration is user-global (~/.codeium/windsurf/mcp_config.json); project-only installer skips global settings.',
  antigravity:'Official UI manages mcp_config.json; a stable project-scoped auto-discovery path was not verified.',
  trae:'A project-scoped configuration path and schema could not be verified from official documentation.',
  warp:'MCP registration uses Warp settings/CLI and may sync with the account; no project file adapter is installed.',
  augment:'Official setup uses UI import or user-global settings; no verified project auto-discovery adapter.'
};
export const supportedClientNames=[...Object.keys(clients),'vscode','all'];

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
// Assistants that store MCP servers in user-level settings or their own UI. The installer only writes project files.
export const skippedClients:Record<string,string>={
  windsurf:'Windsurf reads MCP servers from the user-level ~/.codeium/windsurf/mcp_config.json; add the art-director entry there.',
  antigravity:'Antigravity manages mcp_config.json through its MCP settings UI; add the art-director server there.',
  trae:'Trae registers MCP servers through its settings UI; add the art-director server there.',
  warp:'Warp registers MCP servers through its settings or the warp mcp CLI; add the art-director server there.',
  augment:'Augment registers MCP servers through its extension settings; import the art-director server there.'
};
export const supportedClientNames=[...Object.keys(clients),'vscode','all'];

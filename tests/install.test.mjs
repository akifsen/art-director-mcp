import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const cli=path.resolve('packages/mcp/dist/cli.js');
const run=(root,client,...args)=>JSON.parse(execFileSync(process.execPath,[cli,'init','--project',root,'--client',client,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const newClients={claude:['.mcp.json','mcpServers'],copilot:['.vscode/mcp.json','servers'],kiro:['.kiro/settings/mcp.json','mcpServers'],qoder:['.mcp.json','mcpServers'],roocode:['.roo/mcp.json','mcpServers'],gemini:['.gemini/settings.json','mcpServers'],opencode:['opencode.json','mcp'],continue:['.continue/mcpServers/art-director.json','mcpServers'],codebuddy:['.mcp.json','mcpServers'],droid:['.factory/mcp.json','mcpServers'],kilocode:['.kilo/kilo.json','mcp']};
for(const [client,[file,key]] of Object.entries(newClients))test(`${client}: documented schema, root binding and repeat-safe install`,async()=>{
  await fs.mkdir('.test-output',{recursive:true});const root=await fs.mkdtemp(path.resolve('.test-output/assistant-'));
  assert.equal(run(root,client).status,'dry-run');await assert.rejects(fs.stat(path.join(root,file)));
  run(root,client,'--apply','--local');const data=JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
  const entry=data[key]['art-director'];
  if(key==='mcp'){assert.equal(entry.type,'local');assert.equal(entry.command[0],process.execPath);assert.equal(entry.command.at(-1),root);}
  else{assert.equal(entry.command,process.execPath);assert.equal(entry.args.at(-1),root);}
  assert.deepEqual(run(root,client,'--apply','--local').changes,[]);
});
test('all installs supported project configs, reports skips and remains idempotent',async()=>{
  const root=await fs.mkdtemp(path.resolve('.test-output/all-'));
  const result=run(root,'all','--apply','--local','--with-rules');assert.equal(result.results.length,13);assert.equal(Object.keys(result.skipped).length,5);
  assert.ok(run(root,'all','--apply','--local','--with-rules').results.every(r=>r.changes.length===0));
  for(const client of Object.keys(result.skipped)){assert.equal(run(root,client,'--apply').status,'skipped');}
});
test('all preflight refuses malformed existing config before any mutation',async()=>{
  const root=await fs.mkdtemp(path.resolve('.test-output/preflight-'));await fs.mkdir(path.join(root,'.factory'));await fs.writeFile(path.join(root,'.factory/mcp.json'),'invalid');
  assert.throws(()=>run(root,'all','--apply','--local'));await assert.rejects(fs.stat(path.join(root,'.mcp.json')));
});
test('OpenCode and Kilo preserve existing alternate JSONC files',async()=>{
  for(const [client,file] of [['opencode','opencode.jsonc'],['kilocode','kilo.jsonc']]){
    const root=await fs.mkdtemp(path.resolve('.test-output/jsonc-'));await fs.writeFile(path.join(root,file),'{\n// Keep this comment\n"mcp":{"other":{"type":"local","command":["node","other.js"]}}\n}');
    run(root,client,'--apply','--local');const content=await fs.readFile(path.join(root,file),'utf8');assert.ok(content.includes('Keep this comment'));assert.ok(content.includes('other.js'));
  }
});
for(const client of ['cursor','vscode','codex'])test(`${client} installer: dry-run, preserve settings, backup, rules, idempotence`,async()=>{
  await fs.mkdir('.test-output',{recursive:true});const root=await fs.mkdtemp(path.resolve('.test-output/Kurulum alanı-'));
  const file=client==='codex'?'.codex/config.toml':client==='cursor'?'.cursor/mcp.json':'.vscode/mcp.json';
  await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});
  const original=client==='codex'?'# User comment\n[mcp_servers.other]\ncommand="other"\n':'{\n// User comment\n"'+(client==='cursor'?'mcpServers':'servers')+'":{"other":{"command":"other"}}\n}';
  await fs.writeFile(path.join(root,file),original);
  assert.equal(run(root,client).status,'dry-run');assert.equal(await fs.readFile(path.join(root,file),'utf8'),original);
  const r=run(root,client,'--apply','--with-rules','--local');assert.equal(r.status,'installed');assert.equal(r.backups.length,1);
  const updated=await fs.readFile(path.join(root,file),'utf8');assert.ok(updated.includes('User comment'));assert.ok(updated.includes('other'));
  assert.deepEqual(run(root,client,'--apply','--with-rules','--local').changes,[]);
  await fs.writeFile(path.join(root,file),'not a valid configuration');assert.throws(()=>run(root,client,'--apply'));assert.equal(await fs.readFile(path.join(root,file),'utf8'),'not a valid configuration');
});
test('installer rejects linked config directories',async()=>{
  const root=await fs.mkdtemp(path.resolve('.test-output/linked-'));const outside=await fs.mkdtemp(path.resolve('.test-output/outside-'));
  await fs.symlink(outside,path.join(root,'.cursor'),'junction');assert.throws(()=>run(root,'cursor','--apply'));
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const cli=path.resolve('packages/mcp/dist/cli.js');
const run=(root,client,...args)=>JSON.parse(execFileSync(process.execPath,[cli,'init','--project',root,'--client',client,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
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

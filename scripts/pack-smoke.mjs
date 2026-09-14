import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
const repo=process.cwd();
// npm_execpath is provided by npm run; direct invocation resolves npm next to Node on Windows.
const npmCli=process.env.npm_execpath??(process.platform==='win32'?path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'):createRequire(import.meta.url).resolve('npm/bin/npm-cli.js'));
const npm=(args,cwd)=>execFileSync(process.execPath,[npmCli,...args],{cwd,encoding:'utf8',windowsHide:true});
await fs.copyFile('README.md','packages/mcp/README.md');await fs.copyFile('LICENSE','packages/mcp/LICENSE');
const pack=JSON.parse(npm(['pack','--json','--ignore-scripts'],path.join(repo,'packages/mcp')))[0];
assert.ok(pack.files.every(f=>!/(\.env|tests\/|examples\/|src\/)/.test(f.path)));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'art-director-clean-'));
await fs.writeFile(path.join(temp,'package.json'),'{"private":true}');
npm(['install','--ignore-scripts','--no-audit','--no-fund',path.join(repo,'packages/mcp',pack.filename)],temp);
const cli=path.join(temp,'node_modules/@akifsen/art-director-mcp/dist/cli.js');
const doctor=JSON.parse(execFileSync(process.execPath,[cli,'doctor','--project',temp],{encoding:'utf8'}));assert.equal(doctor.browserWorker,false);
const client=new Client({name:'tarball-smoke',version:'1.0.0'},{capabilities:{}});
try{await client.connect(new StdioClientTransport({command:process.execPath,args:[cli,'serve','--project',temp],cwd:temp,stderr:'pipe'}));assert.equal((await client.listTools()).tools.length,6);const result=await client.callTool({name:'inspect_project',arguments:{}});assert.ok(!result.isError);}finally{await client.close();}
console.log(JSON.stringify({status:'passed',tarball:pack.filename,files:pack.files.map(f=>f.path),unpackedSize:pack.unpackedSize,cleanInstall:temp,browserWorker:false},null,2));

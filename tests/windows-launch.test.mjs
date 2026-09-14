import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

test('generated Windows npx launch preserves shell arguments and Unicode project paths',{skip:process.platform!=='win32',timeout:15000},async()=>{
  await fs.mkdir('.test-output',{recursive:true});
  const root=await fs.mkdtemp(path.resolve('.test-output/Npx İş alanı-'));
  const cli=path.resolve('packages/mcp/dist/cli.js');
  const {launch}=JSON.parse(execFileSync(process.execPath,[cli,'init','--client','cursor','--project',root],{encoding:'utf8'}));
  // Controlled npx stand-in exercises the actual cmd boundary without registry access.
  await fs.writeFile(path.join(root,'npx.cmd'),`@echo off\r\n"${process.execPath}" "${cli}" %3 %4 %5\r\n`);
  const client=new Client({name:'windows-launch-test',version:'1'},{capabilities:{}});
  try{
    await client.connect(new StdioClientTransport({...launch,cwd:root,stderr:'pipe'}));
    assert.equal((await client.listTools()).tools.length,6);
    const result=await client.callTool({name:'inspect_project',arguments:{}});
    assert.ok(!result.isError);
  }finally{await client.close();}
});

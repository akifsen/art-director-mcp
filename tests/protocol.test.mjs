import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import path from 'node:path';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import {briefSchema,propose} from '../packages/core/dist/index.js';
test('real stdio initialize, list, call, schema rejection and pagination',{timeout:15000},async()=>{
  const client=new Client({name:'smoke',version:'1.0.0'},{capabilities:{}});
  const transport=new StdioClientTransport({command:process.execPath,args:[path.resolve('packages/mcp/dist/cli.js'),'serve','--project',process.cwd()],stderr:'pipe'});
  try{await client.connect(transport);const list=await client.listTools();assert.equal(list.tools.length,6);
    const r=await client.callTool({name:'inspect_project',arguments:{}});assert.ok(!r.isError);const data=JSON.parse(r.content[0].text);assert.ok(data.artifactId);
    const p=await client.callTool({name:'get_artifact',arguments:{artifactId:data.artifactId,limit:100}});assert.ok(JSON.parse(p.content[0].text).content);
    const invalid=await client.callTool({name:'get_artifact',arguments:{artifactId:'../.env'}});assert.equal(invalid.isError,true);
  }finally{await client.close();}
});
test('stdio browser worker returns real evidence through audit_ui',{skip:!process.env.AD_BROWSER_TEST,timeout:45000},async()=>{
  const http=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><title>Protocol fixture</title><main><h1>Audit</h1><input></main></html>');});
  await new Promise(r=>http.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${http.address().port}`;
  await fs.mkdir('.test-output',{recursive:true});const root=await fs.mkdtemp(path.resolve('.test-output/mcp-browser-'));
  const client=new Client({name:'browser-smoke',version:'1.0.0'},{capabilities:{}});
  try{await client.connect(new StdioClientTransport({command:process.execPath,args:[path.resolve('packages/mcp/dist/cli.js'),'serve','--project',root,'--allow-origin',url],stderr:'pipe'}));
    const brief=briefSchema.parse({product:'Audit fixture',primaryTask:'Enter text',pageType:'product',audience:'Testers',content:[{heading:'Input',body:'Test fixture'}]});
    const c=await client.callTool({name:'compile_design_contract',arguments:{direction:propose(brief)[0],expectedRevision:0}});assert.ok(!c.isError);
    const contractId=JSON.parse(c.content[0].text).data.contractId;
    const r=await client.callTool({name:'audit_ui',arguments:{contractId,url}});assert.ok(!r.isError,JSON.stringify(r));
    const data=JSON.parse(r.content[0].text);const record=JSON.parse(await fs.readFile(path.join(root,'.art-director/reports',data.artifactId+'.json'),'utf8'));const result=JSON.parse(record.content);
    assert.equal(result.run.runs.length,2);assert.ok(result.run.runs[0].findings.some(f=>f.ruleId==='label'));
  }finally{await client.close();http.closeAllConnections();await new Promise(r=>http.close(r));}
});

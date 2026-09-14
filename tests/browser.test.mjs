import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {audit,allowed} from '../packages/browser/dist/worker.js';
test('browser origin policy rejects private networks, credentials and unauthorized ports',()=>{
  const origins=['http://127.0.0.1:3210'];
  assert.equal(allowed(origins[0]+'/page',origins),true);
  for(const u of ['http://127.0.0.1:3211','http://localhost:3210','http://169.254.169.254','http://192.168.1.1','file:///etc/passwd','http://a:b@127.0.0.1:3210'])assert.equal(allowed(u,origins),false);
});
test('real desktop/mobile audit finds overflow and labels; blocks subresources and redirects',{skip:!process.env.AD_BROWSER_TEST,timeout:45000},async()=>{
  let prohibitedHits=0;const remote=createServer((req,res)=>{prohibitedHits++;res.end('blocked');});await new Promise(r=>remote.listen(0,'127.0.0.1',r));
  const forbidden=`http://127.0.0.1:${remote.address().port}`;
  const server=createServer((req,res)=>{if(req.url==='/redirect'){res.writeHead(302,{location:forbidden});res.end();return;}res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html lang="en"><title>Audit fixture</title><main><h1>Fixture</h1><div style="width:2000px">Too wide</div><input><img src="${forbidden}/image"></main></html>`);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
  try{const result=await audit({version:'0.1.0',url,origins:[url],masks:[]});assert.equal(result.runs.length,2);assert.ok(result.runs.every(r=>r.findings.some(f=>f.ruleId==='overflow')));assert.ok(result.runs.some(r=>r.findings.some(f=>f.ruleId==='label')));assert.ok(result.runs.every(r=>r.screenshot.length>1000));assert.equal(prohibitedHits,0);
    // 0.2.0: what was measured, how long each stage took, and a complete status.
    assert.equal(result.status,'complete');assert.equal(result.timedOut,null);assert.ok(result.stages.launch>0);
    for(const r of result.runs){assert.deepEqual([r.measured.axe,r.measured.overflow,r.measured.focus],[true,true,true]);assert.ok(r.measured.elementsChecked>0);assert.ok(r.measured.contrastNodes>0);assert.ok(r.stages.navigate>=0&&r.stages.axe>0&&r.stages.screenshot>0);}
    await assert.rejects(audit({version:'0.1.0',url:url+'/redirect',origins:[url],masks:[]}));assert.equal(prohibitedHits,0);
  }finally{server.closeAllConnections();remote.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>remote.close(r))]);}
});
test('a slow page exhausts the stage budget: the worker returns partial results naming the stage instead of failing',{skip:!process.env.AD_BROWSER_TEST,timeout:60000},async()=>{
  const timers=[];const server=createServer((req,res)=>{timers.push(setTimeout(()=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><title>Slow</title><main><h1>Late</h1></main></html>');},9000));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
  try{const started=Date.now();const result=await audit({version:'0.2.0',url,origins:[url],masks:[],budgetMs:6000});
    assert.ok(Date.now()-started<30000,'budget bounds total time');
    assert.equal(result.status,'partial');assert.match(result.timedOut,/navigate|budget/);
    assert.equal(result.runs.length,2);assert.ok(result.runs.every(r=>r.measured.timedOut&&r.measured.axe===false&&r.findings.length===0));
  }finally{for(const t of timers)clearTimeout(t);server.closeAllConnections();await new Promise(r=>server.close(r));}
});

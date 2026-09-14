// End-to-end flow on the review fixtures: brief → directions → contract → live audit → requirement results.
// Deliberate defects in dashboard/broken.html must be found; dashboard/fixed.html and the healthy portfolio must not raise false alarms.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {Workspace,Service,briefSchema,propose,board} from '../packages/core/dist/index.js';

const browser=process.env.AD_BROWSER_TEST?(await import('../packages/browser/dist/worker.js')).audit:null;
const runner=(url,origins,masks)=>browser({version:'0.1.0',url,origins,masks});
async function serveDir(dir,extra={}){
  const http=createServer(async(req,res)=>{
    const name=decodeURIComponent(req.url.split('?')[0].slice(1))||'index.html';
    if(extra[name]){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(extra[name]);return;}
    try{const body=await fs.readFile(path.join(dir,path.basename(name)));res.setHeader('Content-Type','text/html; charset=utf-8');res.end(body);}catch{res.statusCode=404;res.end('not found');}
  });
  await new Promise(r=>http.listen(0,'127.0.0.1',r));
  return {url:`http://127.0.0.1:${http.address().port}`,close:()=>{http.closeAllConnections();return new Promise(r=>http.close(r));}};
}
// Inline data or, when screenshots push the result over the inline budget, the summary: both expose the same requirement results.
const view=a=>a.truncated?{requirementResults:a.data.summary.requirementResults,runs:a.data.summary.runs}:{requirementResults:a.data.requirementResults,runs:a.data.run.runs.map(r=>({...r,overflow:r.observed.overflow}))};

test('dashboard fixture: audit finds the two deliberate defects and reports the fixed page clean',{skip:!browser,timeout:90000},async()=>{
  const dir=path.resolve('examples/fixtures/dashboard');const server=await serveDir(dir);
  try{
    await fs.mkdir('.test-output',{recursive:true});const root=await fs.mkdtemp(path.resolve('.test-output/fixture-dashboard-'));
    const s=new Service(await Workspace.open(root),runner,[server.url]);
    const brief=briefSchema.parse(JSON.parse(await fs.readFile(path.join(dir,'brief.json'),'utf8')));
    const ds=(await s.call('propose_directions',{brief})).data;assert.equal(ds.length,2,'dashboard context has two compatible recipes');
    const workbench=ds.find(d=>d.recipe.id==='workbench');
    const c=await s.call('compile_design_contract',{directionId:workbench.id,brief,expectedRevision:0});
    const broken=view(await s.call('audit_ui',{contractId:c.data.contractId,url:`${server.url}/broken.html`}));
    const by=Object.fromEntries(broken.requirementResults.map(r=>[r.id,r]));
    assert.equal(by.overflow.status,'fail');assert.equal(by.labels.status,'fail');
    assert.ok(broken.runs.every(r=>r.overflow===true),'overflow measured at both viewports');
    assert.ok(broken.runs.some(r=>r.findings.some(f=>f.ruleId==='label'&&f.contractRequirementId==='labels')));
    const fixed=view(await s.call('audit_ui',{contractId:c.data.contractId,url:`${server.url}/fixed.html`}));
    const fixedBy=Object.fromEntries(fixed.requirementResults.map(r=>[r.id,r]));
    assert.equal(fixedBy.overflow.status,'pass');assert.equal(fixedBy.labels.status,'pass');assert.equal(fixedBy.accessibility.status,'pass');
    assert.ok(fixed.runs.every(r=>r.findings.length===0),JSON.stringify(fixed.runs));
    assert.equal(fixedBy.composition.status,'needs-human-review','visual judgment is never auto-passed');
    // The full run, including screenshots, is always retrievable through the artifact regardless of inline truncation.
    const record=JSON.parse(await fs.readFile(path.join(root,'.art-director/reports',(await s.call('audit_ui',{contractId:c.data.contractId,url:`${server.url}/fixed.html`})).artifactId+'.json'),'utf8'));
    assert.ok(JSON.parse(record.content).run.runs.every(r=>r.screenshot.length>1000));
  }finally{await server.close();}
});
test('healthy portfolio fixture and generated boards produce no deterministic findings',{skip:!browser,timeout:120000},async()=>{
  const dir=path.resolve('examples/fixtures/portfolio');
  const brief=briefSchema.parse(JSON.parse(await fs.readFile(path.join(dir,'brief.json'),'utf8')));
  const boards=Object.fromEntries(propose(brief).map(d=>[`board-${d.recipe.id}.html`,board(d)]));
  // Worst-case brief: maximum sections with long unbreakable strings must still not overflow the page.
  const stress=briefSchema.parse({...brief,pageType:'dashboard',content:Array.from({length:12},(_,i)=>({heading:`Bölüm ${i+1}`,body:'x'.repeat(400)}))});
  for(const d of propose(stress))boards[`stress-${d.recipe.id}.html`]=board(d);
  const server=await serveDir(dir,boards);
  try{
    const root=await fs.mkdtemp(path.resolve('.test-output/fixture-portfolio-'));
    const s=new Service(await Workspace.open(root),runner,[server.url]);
    const c=await s.call('compile_design_contract',{direction:propose(brief)[0],expectedRevision:0});
    for(const page of ['index.html',...Object.keys(boards)]){
      const a=await s.call('audit_ui',{contractId:c.data.contractId,url:`${server.url}/${page}`});
      const results=a.truncated?a.data.summary.requirementResults:a.data.requirementResults;
      const runs=a.truncated?a.data.summary.runs:a.data.run.runs;
      assert.ok(runs.every(r=>r.findings.length===0),`${page}: ${JSON.stringify(runs.map(r=>r.findings))}`);
      assert.ok(results.filter(r=>r.verification==='deterministic').every(r=>r.status==='pass'),page);
    }
  }finally{await server.close();}
});
test('fixture briefs validate and drive the three review contexts without a browser',async()=>{
  for(const [dir,pageType,count] of [['examples/fixtures/portfolio','portfolio',3],['examples/fixtures/dashboard','dashboard',2],['examples/expressive-product','product',3]]){
    const brief=briefSchema.parse(JSON.parse(await fs.readFile(path.join(dir,'brief.json'),'utf8')));assert.equal(brief.pageType,pageType);
    const ds=propose(brief);assert.equal(ds.length,count);
    assert.equal(new Set(ds.map(d=>d.recipe.id)).size,count,'no repeated recipe');
    for(const d of ds)assert.ok(d.rationale.includes(String(brief.content.length))&&d.rationale.includes(d.recipe.mobile.slice(0,20)),'rationale references content and mobile behavior');
  }
});

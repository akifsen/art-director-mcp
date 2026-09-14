// Regression tests added by the 2026-09-14 independent review. Each test names the defect it guards against.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {Workspace,Service,briefSchema,propose,board,contract,packSchema,packs,styleFor,requirementResults,requirementFor,blueprint,tokenCss,VERSION,PAGE_LIMIT,INLINE_BUDGET} from '../packages/core/dist/index.js';

const cli=path.resolve('packages/mcp/dist/cli.js');
const briefs={
  portfolio:briefSchema.parse(JSON.parse(await fs.readFile('examples/fixtures/portfolio/brief.json','utf8'))),
  dashboard:briefSchema.parse(JSON.parse(await fs.readFile('examples/fixtures/dashboard/brief.json','utf8'))),
  product:briefSchema.parse(JSON.parse(await fs.readFile('examples/expressive-product/brief.json','utf8')))
};
async function workspace(){await fs.mkdir('.test-output',{recursive:true});return Workspace.open(await fs.mkdtemp(path.resolve('.test-output/review-')));}

test('boards differ by typography and navigation pattern, not only by color',()=>{
  for(const brief of Object.values(briefs)){
    const ds=propose(brief);const boards=ds.map(board);
    // Type system = heading family/weight/transform plus body font; two boards must never share the whole system.
    const fonts=new Set(boards.map(b=>/body\{[^}]*font:[^;]*;/.exec(b)[0]+/\.num\{font-family:[^}]*\}/.exec(b)[0]));
    const navs=boards.map(b=>b.includes('class="topbar"')?'top':b.includes('class="rail"')?'rail':b.includes('class="inline"')?'inline':'none');
    assert.equal(fonts.size,ds.length,`same body font across ${brief.pageType} boards`);
    ds.forEach((d,i)=>assert.equal(navs[i],d.recipe.navigation,'board navigation must follow the recipe'));
    boards.forEach((b,i)=>{if(ds[i].recipe.navigation!=='inline')assert.ok(b.includes('<details'),'top/rail navigation collapses to a native disclosure on mobile');assert.ok(!/<script/i.test(b));assert.ok(b.includes("default-src 'none'"));});
  }
  // Composition-specific structure rather than one shared template.
  const byRecipe=Object.fromEntries(propose(briefs.dashboard).map(d=>[d.recipe.id,board(d)]));
  assert.ok(byRecipe.workbench.includes('<table>')&&byRecipe.workbench.includes('role="toolbar"'));
  assert.ok(byRecipe.ledger.includes('class="record"')&&!byRecipe.ledger.includes('<table>'));
});
test('every built-in recipe has a type system; exported pack JSON stays valid with and without it',async()=>{
  for(const p of packs)for(const r of p.recipes){assert.ok(r.type,`${r.id} lacks type`);const s=styleFor(r);assert.ok(s.headingFamily&&s.bodyFamily&&s.bodySize>0);}
  for(const file of await fs.readdir('design-packs'))if(file.endsWith('.json'))packSchema.parse(JSON.parse(await fs.readFile(path.join('design-packs',file),'utf8')));
  const legacy=structuredClone(packs[0]);for(const r of legacy.recipes)delete r.type;packSchema.parse(legacy);
});
test('contract tokens and CSS carry typography and spacing decisions; blueprints differ per recipe',()=>{
  const ds=propose(briefs.product);const c=contract(ds[0],1);
  assert.equal(c.tokens.font.heading.$type,'fontFamily');assert.ok(c.tokens.spacing.section.$value.value>0);assert.ok(c.requirements.some(r=>r.id==='accessibility'&&r.verification==='deterministic'));
  const css=tokenCss(ds[0]);for(const v of ['--ad-font-heading','--ad-font-body','--ad-space-section','--ad-heading-weight'])assert.ok(css.includes(v),v);
  const navs=ds.map(d=>blueprint(contract(d,1),'navigation','react').decisions.join(' '));
  assert.equal(new Set(navs).size,new Set(ds.map(d=>d.recipe.navigation)).size,'navigation guidance must follow the recipe navigation');
  assert.ok(blueprint(contract(propose(briefs.dashboard)[0],1),'table','html').decisions.some(x=>x.includes('tabular-nums')));
  // Contracts written by 0.1.x have no style field; blueprint recomputes it.
  const legacy={...c};delete legacy.style;assert.ok(blueprint(legacy,'hero','html').style.headingFamily);
});
test('propose_directions writes browser-openable previews and explains axis differences',async()=>{
  const s=new Service(await workspace());const r=await s.call('propose_directions',{brief:briefs.portfolio});
  assert.equal(r.truncated,false);
  for(const d of r.data){
    assert.match(d.previewPath,/^\.art-director\/previews\/[a-f0-9]{24}\.html$/);
    assert.equal(await s.ws.read(d.previewPath),board(propose(briefs.portfolio).find(x=>x.id===d.id)));
    for(const diff of Object.values(d.differences))assert.ok(diff.length>=3);
  }
});
test('compile accepts directionId plus brief; tampered or unknown directions are refused with guidance',async()=>{
  const s=new Service(await workspace());const d=propose(briefs.dashboard,7)[1];
  const c=await s.call('compile_design_contract',{directionId:d.id,brief:briefs.dashboard,seed:7,expectedRevision:0});
  assert.equal(c.data.revision,1);assert.ok(c.data.files.includes('.art-director/tokens.css'));assert.ok(c.data.previewPath);
  await assert.rejects(s.call('compile_design_contract',{directionId:d.id,brief:briefs.dashboard,seed:8,expectedRevision:1}),e=>e.code==='INVALID_DIRECTION'&&/propose_directions again/.test(e.message));
  await assert.rejects(s.call('compile_design_contract',{direction:{...d,rationale:'edited'},expectedRevision:1}),e=>e.code==='INVALID_DIRECTION'&&/previewArtifactId/.test(e.message));
  await assert.rejects(s.call('compile_design_contract',{direction:d,directionId:d.id,brief:briefs.dashboard,expectedRevision:1}));
  // Passing the response object as returned (with preview fields) is a common client mistake; it must fail loudly, not silently.
  const returned=(await s.call('propose_directions',{brief:briefs.dashboard,seed:7})).data[1];
  await assert.rejects(s.call('compile_design_contract',{direction:returned,expectedRevision:1}));
});
test('abandoned contract locks are reclaimed; fresh locks still conflict with an actionable message',async()=>{
  const s=new Service(await workspace());const d=propose(briefs.portfolio)[0];const lock=path.join(s.ws.root,'.art-director/contract.lock');
  await fs.mkdir(path.dirname(lock),{recursive:true});await fs.writeFile(lock,'');const old=new Date(Date.now()-Workspace.STALE_LOCK_MS-5000);await fs.utimes(lock,old,old);
  assert.equal((await s.call('compile_design_contract',{direction:d,expectedRevision:0})).data.revision,1);
  await fs.writeFile(lock,'');
  await assert.rejects(s.call('compile_design_contract',{direction:d,expectedRevision:1}),e=>e.code==='CONTRACT_CONFLICT'&&/contract\.lock/.test(e.message));
});
test('audit refuses unlisted origins before launching a browser and maps findings onto contract requirements',async()=>{
  let launched=false;const runs=[{viewport:{width:1440,height:1000},findings:[{id:'1440-overflow',ruleId:'overflow'},{id:'1440-label',ruleId:'label'},{id:'1440-region',ruleId:'region'},{id:'1440-cc',ruleId:'color-contrast'}]},{viewport:{width:390,height:844},findings:[]}];
  const s=new Service(await workspace(),async()=>{launched=true;return {runs};},['http://127.0.0.1:5187']);
  const c=await s.call('compile_design_contract',{direction:propose(briefs.product)[0],expectedRevision:0});
  await assert.rejects(s.call('audit_ui',{contractId:c.data.contractId,url:'http://127.0.0.1:5188/'}),e=>e.code==='ORIGIN_NOT_ALLOWED'&&/--allow-origin http:\/\/127\.0\.0\.1:5188/.test(e.message));
  assert.equal(launched,false);
  const a=await s.call('audit_ui',{contractId:c.data.contractId,url:'http://127.0.0.1:5187/page'});assert.equal(launched,true);
  const by=Object.fromEntries(a.data.requirementResults.map(r=>[r.id,r]));
  assert.equal(by.overflow.status,'fail');assert.equal(by.labels.status,'fail');assert.deepEqual(by.labels.findingIds,['1440-label']);
  assert.equal(by.accessibility.status,'fail');assert.equal(by.contrast.status,'fail');assert.equal(by.composition.status,'needs-human-review');
  assert.equal(a.data.run.runs[0].findings[2].contractRequirementId,'accessibility');
  assert.equal(requirementFor('button-name'),'labels');
  const clean=requirementResults(await s.savedContract(c.data.contractId),[{viewport:{width:1,height:1},findings:[]}]);
  assert.equal(clean.find(r=>r.id==='overflow').status,'pass');assert.equal(clean.find(r=>r.id==='contrast').status,'automated-pass-needs-human-review');
  assert.equal(clean.find(r=>r.id==='truth').status,'needs-human-review');
});
test('large results are summarized instead of dropped and pages can be read in 12000-character slices',async()=>{
  const s=new Service(await workspace());
  const big=briefSchema.parse({...briefs.product,content:Array.from({length:12},(_,i)=>({heading:'Section '+i,body:'b'.repeat(2000)}))});
  const r=await s.call('propose_directions',{brief:big});
  assert.equal(r.truncated,true);assert.equal(r.data.summary.directions.length,3);assert.ok(r.data.summary.directions[0].previewPath);
  let text='';let cursor=0;let pages=0;do{const p=await s.call('get_artifact',{artifactId:r.artifactId,cursor,limit:PAGE_LIMIT});text+=p.content;cursor=p.nextCursor;pages++;}while(cursor!==null);
  assert.ok(Buffer.byteLength(text)>INLINE_BUDGET);assert.equal(JSON.parse(text).length,3);assert.ok(pages<=10,'pagination should not require dozens of calls');
  await assert.rejects(s.call('get_artifact',{artifactId:r.artifactId,limit:PAGE_LIMIT+1}));
  assert.ok((await s.call('get_artifact',{artifactId:r.artifactId,limit:1800})).content.length===1800);
});
test('inspection recognizes more stacks, reports a design-system summary and rejects file scopes',async()=>{
  const ws=await workspace();
  await ws.write('package.json',JSON.stringify({dependencies:{next:'15.0.0',react:'19.0.0'},devDependencies:{tailwindcss:'4.0.0'}}));
  await ws.write('app/page.tsx','export default function Page(){return <main/>}');await ws.write('app/globals.css',':root{--brand:#123456;--space-2:8px}');
  await ws.write('components/Card.vue','<template><div/></template>');await ws.write('styles/theme.scss','$x: 1;');
  const r=await ws.inspect();
  assert.deepEqual(r.stack.sort(),['next','react','tailwindcss']);assert.deepEqual(r.tokens.sort(),['--brand','--space-2']);
  assert.equal(r.summary.componentFiles,2);assert.equal(r.summary.styleFiles,2);assert.deepEqual(r.summary.tokenFiles,['app/globals.css']);assert.match(r.summary.designSystem,/2 CSS custom properties/);
  await assert.rejects(ws.inspect('package.json'),e=>e.code==='INVALID_INPUT');
});
test('CLI exposes --version, doctor hints and a clear error for a missing project root',async()=>{
  assert.equal(execFileSync(process.execPath,[cli,'--version'],{encoding:'utf8'}).trim(),VERSION);
  const doctor=JSON.parse(execFileSync(process.execPath,[cli,'doctor','--project',(await workspace()).root],{encoding:'utf8'}));
  assert.ok(Array.isArray(doctor.hints));assert.ok('browserBinary' in doctor);
  assert.throws(()=>execFileSync(process.execPath,[cli,'doctor','--project',path.resolve('.test-output/does-not-exist-'+Date.now())],{encoding:'utf8',stdio:['ignore','pipe','pipe']}),e=>/Pass --project/.test(e.stderr));
});

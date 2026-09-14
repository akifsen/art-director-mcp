// Design decision layer: identity resolution, content architecture, fit-first candidates, cross-tool consistency.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {Workspace,Service,briefSchema,packSchema,propose,board,contract,tokens,tokenCss,blueprint,resolveIdentity,architecture,fit,packs,requirementResults,contrast,classifyFamily,sectionItems,VERSION} from '../packages/core/dist/index.js';

const cli=path.resolve('packages/mcp/dist/cli.js');
const load=async f=>briefSchema.parse(JSON.parse(await fs.readFile(path.join('examples/fixtures/matrix',f),'utf8')));
const matrix={studio:await load('studio-multi-domain.json'),branded:await load('branded-product.json'),plain:await load('product-no-brand.json'),docs:await load('docs-reference.json'),landing:await load('landing-launch.json')};
const legacyBrief=briefSchema.parse(JSON.parse(await fs.readFile('examples/fixtures/portfolio/brief.json','utf8')));
async function workspace(){await fs.mkdir('.test-output',{recursive:true});return Workspace.open(await fs.mkdtemp(path.resolve('.test-output/design-')));}
const out=path.resolve('.test-output/matrix-boards');await fs.mkdir(out,{recursive:true});

test('1. same composition, different brand facts: identity and tokens differ, layout guidance stays the same',async()=>{
  const a=propose(matrix.branded),b=propose(matrix.plain);
  const shared=a.map(d=>d.recipe.id).filter(id=>b.some(d=>d.recipe.id===id));
  assert.ok(shared.length>=1,'the two product briefs must share at least one recipe');
  for(const id of shared){
    const da=a.find(d=>d.recipe.id===id),db=b.find(d=>d.recipe.id===id);
    assert.equal(da.identity.provenance['palette.accent'],'brand');assert.equal(db.identity.provenance['palette.accent'],'pack');
    assert.equal(da.identity.palette.accent,'#0b6e4f');assert.notEqual(da.identity.palette.accent,db.identity.palette.accent);
    assert.ok(tokenCss(da).includes('Söhne')&&!tokenCss(db).includes('Söhne'));
    assert.equal(tokens(da).color.accent.$extensions['art-director'].source,'brand');
    const ca=contract(da,1),cb=contract(db,1);
    assert.deepEqual(blueprint(ca,'navigation','react').decisions.slice(1),blueprint(cb,'navigation','react').decisions.slice(1),'navigation structure is a composition decision, not a brand decision');
    assert.notEqual(blueprint(ca,'page','react').decisions.join(),blueprint(cb,'page','react').decisions.join(),'page guidance carries the brand palette/type');
    // Character words are honored only where brand/explicit layers did not decide.
    assert.equal(da.identity.accentUse,'restrained');assert.equal(da.identity.provenance.accentUse,'character');
  }
  for(const d of [...a,...b])await fs.writeFile(path.join(out,`${d.brief.brand.name?'branded':'plain'}-${d.recipe.id}.html`),board(d));
});
test('2. explicit preferences and project brand are never overridden by the pack; contrast conflicts are reported, not hidden',()=>{
  const brief=briefSchema.parse({...matrix.plain,brand:{colors:{accent:'#cc0000'}},preferences:{palette:{background:'#000000',text:'#ffffff',accent:'#00ff88'},heading:'mono',headingWeight:900,navigation:'inline',source:'host'}});
  for(const d of propose(brief)){
    assert.deepEqual(d.identity.palette,{background:'#000000',text:'#ffffff',accent:'#00ff88'});
    assert.equal(d.identity.provenance['palette.accent'],'host');assert.equal(d.identity.type.heading,'mono');assert.equal(d.identity.type.headingWeight,900);
    assert.equal(d.recipe.navigation,'inline');assert.equal(d.identity.provenance.navigation,'host');
    const html=board(d);assert.ok(html.includes('#00ff88')&&!html.includes('#9b3523')&&!html.includes('#5134bc')&&!html.includes('#17664e'),'pack colors must not leak into the board');
    assert.ok(html.includes('monospace'));
  }
  const low=resolveIdentity(briefSchema.parse({...matrix.plain,brand:{colors:{background:'#f0f0f0',text:'#c0c0c0'}}}),packs[1],packs[1].recipes[0]);
  assert.deepEqual([low.palette.background,low.palette.text],['#f0f0f0','#c0c0c0'],'brand colors are kept as supplied');
  assert.ok(low.conflicts.some(c=>/contrast is \d/.test(c)&&/below 4\.5/.test(c)),low.conflicts.join());
  assert.ok(contrast('#000000','#ffffff')===21);assert.equal(classifyFamily('Fraunces'),'serif');assert.equal(classifyFamily('IBM Plex Sans'),'sans');assert.equal(classifyFamily('JetBrains Mono'),'mono');
});
test('3. a multi-domain brief becomes grouped sections, not a list of equal stories',()=>{
  for(const d of propose(matrix.studio)){
    const s=d.architecture.sections;
    assert.equal(d.brief.content.length,7);assert.equal(s.length,5,'7 items → 5 sections');
    const services=s.find(x=>x.title==='Services');assert.equal(services.presentation,'grouped-list');assert.equal(services.items.length,3);assert.equal(services.role,'offering');
    assert.ok(!s.some(x=>x.presentation==='steps'),'unordered offerings are never numbered steps');
    assert.ok(!['guided-path','product-stage'].includes(d.recipe.id),'avoid list excludes numbered-steps and hero-image recipes');
    assert.equal(s[0].emphasis,'primary');assert.equal(s.at(-1).presentation,'contact');
    const html=board(d);assert.ok(html.includes('class="index"'));assert.equal((html.match(/<h2>/g)||[]).length,5);
    assert.equal(d.identity.palette.background,'#101418');assert.ok(html.includes('Fraunces'));
    assert.ok(d.rationaleDetail.wrongWhen&&d.rationaleDetail.visualDriver&&d.rationaleDetail.emphasis.includes('Services'));
  }
  const [first]=propose(matrix.studio);assert.equal(first.recipe.id,'folio','fit ranks the editorial masthead first for a company page with grouped offerings');
  assert.ok(fit(matrix.studio,packs[2],packs[2].recipes[0]).score<fit(matrix.studio,packs[0],packs[0].recipes[1]).score,'a workbench fits a studio page worse than an editorial folio');
});
test('4. missing evidence is rendered as a labeled gap and carried into contract and blueprint; nothing is invented',()=>{
  for(const brief of [matrix.studio,matrix.branded,matrix.landing]){
    const d=propose(brief)[0];const proof=d.architecture.sections.find(x=>x.role==='proof');
    assert.equal(proof.presentation,'evidence-pending');
    const html=board(d);assert.ok(html.includes('Evidence pending'));
    const text=html.replace(/<style>[\s\S]*<\/style>/,'').replace(/<[^>]+>/g,' ');assert.ok(!/\d+%|\d+\+ (customers|users)|★/.test(text),'no fabricated metrics or ratings in the visible text');
    assert.ok(d.architecture.missing.some(m=>m.includes('no real evidence')));
    const c=contract(d,1);assert.ok(c.requirements.find(r=>r.id==='truth').expected.includes('explicitly missing'));
    assert.ok(blueprint(c,'page','html').decisions.some(x=>x.startsWith('Explicit gaps')));
    assert.ok(blueprint(c,'content','html').decisions.some(x=>x.includes('Evidence pending')));
  }
  const stage=propose(matrix.plain).find(d=>d.recipe.id==='product-stage');
  if(stage){assert.ok(board(stage).includes('no screenshots declared'));assert.ok(stage.fit.against.some(x=>x.includes('placeholder')));}
});
test('5. the chosen identity survives preview → contract → tokens → tokens.css → blueprint → audit needsReview',async()=>{
  const s=new Service(await workspace());const r=await s.call('propose_directions',{brief:matrix.studio});
  const d=r.data[0];const accent='#f2b531';
  assert.ok((await s.ws.read(d.previewPath)).includes(accent));
  const c=await s.call('compile_design_contract',{directionId:d.id,brief:matrix.studio,expectedRevision:0});
  assert.equal(c.data.identity.palette.accent,accent);assert.equal(c.data.identity.provenance['palette.accent'],'brand');
  assert.equal(c.data.architecture.sections.length,5);
  const saved=await s.savedContract(c.data.contractId);assert.equal(saved.schemaVersion,'1.1');assert.equal(saved.tokens.color.accent.$value.hex,accent);
  assert.ok((await s.ws.read('.art-director/tokens.css')).includes(`--ad-accent: ${accent}`));
  assert.ok(JSON.parse(await s.ws.read('.art-director/tokens.json')).font.heading.$value[0]==='Fraunces');
  const bp=await s.call('get_blueprint',{contractId:c.data.contractId,componentOrSection:'page'});
  assert.equal(bp.data.identity.palette.accent,accent);assert.ok(bp.data.decisions.some(x=>x.includes('Fraunces')));assert.equal(bp.data.architecture.order.length,5);
  const a=await s.call('audit_ui',{contractId:c.data.contractId,hostReview:{reviewer:'host-agent',findings:[{requirementId:'identity',verdict:'pass',note:'Brand palette applied'}]}});
  assert.equal(a.data.hostReview.contractRevision,1);assert.equal(a.data.visualReview,'host-supplied');
  assert.ok(a.data.requirementResults.every(x=>x.status!=='pass'),'without a browser run nothing is marked as passed');
  assert.ok(saved.requirements.some(x=>x.id==='preserve'&&x.expected.includes('/work/:slug')));
});
test('6. 0.1/0.2 inputs keep working: minimal briefs, packs without new fields, contracts without identity',async()=>{
  const ds=propose(legacyBrief);assert.equal(ds.length,3);
  for(const d of ds){assert.equal(d.identity.provenance['palette.accent'],'pack');assert.ok(d.architecture.notes.some(n=>n.includes('inferred')));}
  const legacyPack=structuredClone(packs[0]);for(const r of legacyPack.recipes){delete r.type;delete r.features;delete r.wrongWhen;}legacyPack.suitable=['portfolio','product'];packSchema.parse(legacyPack);
  const c=contract(ds[0],1);const old={...c,schemaVersion:'1.0'};delete old.identity;delete old.architecture;delete old.style;delete old.preservedBehaviors;
  const bp=blueprint(old,'content','html');assert.ok(bp.identity.palette.accent&&bp.architecture.order.length===3);
  // Direction ids change with the server version, and compile says so instead of failing silently.
  const s=new Service(await workspace());
  await assert.rejects(s.call('compile_design_contract',{directionId:'0'.repeat(24),brief:legacyBrief,expectedRevision:0}),e=>e.code==='INVALID_DIRECTION'&&/propose_directions again/.test(e.message));
  const compiled=await s.call('compile_design_contract',{direction:ds[0],expectedRevision:0});assert.equal(compiled.data.revision,1);assert.equal(compiled.version,VERSION);
});
test('7. CLI and MCP service produce the same directions, blueprint and artifact pages',async()=>{
  const ws=await workspace();const s=new Service(ws);
  await ws.write('brief.json',JSON.stringify(matrix.docs));
  const run=(...args)=>JSON.parse(execFileSync(process.execPath,[cli,...args,'--project',ws.root],{encoding:'utf8'}));
  const viaCli=run('directions','--brief','brief.json','--seed','3');const viaMcp=await s.call('propose_directions',{brief:matrix.docs,seed:3});
  assert.deepEqual(viaCli.data.map(d=>d.id),viaMcp.data.map(d=>d.id));
  const c=run('contract','--direction-id',viaCli.data[0].id,'--brief','brief.json','--seed','3','--expected-revision','0');
  const bpCli=run('blueprint','--contract-id',c.data.contractId,'--section','content','--stack','html');
  const bpMcp=await s.call('get_blueprint',{contractId:c.data.contractId,componentOrSection:'content',stack:'html'});
  assert.deepEqual(bpCli.data,bpMcp.data);
  const page=run('artifact',c.data.contractId,'--limit','500');assert.equal(page.content.length,500);assert.equal(page.nextCursor,500);
  const bad=(()=>{try{execFileSync(process.execPath,[cli,'blueprint','--contract-id','nope','--project',ws.root],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){return JSON.parse(e.stderr);}})();
  assert.equal(bad.code,'INVALID_INPUT');assert.match(bad.message,/contractId/);
  const docsFirst=viaMcp.data[0];assert.ok(['margin-notes','workbench','guided-path'].includes(docsFirst.recipe.id),'docs pages prefer a persistent index');
});
test('8. audit result classes: not-measured, partial (timeout), fail, blocked, imported evidence and host review',async()=>{
  const runs=(measured,findings=[])=>[{viewport:{width:1440,height:1000},findings,measured}];
  const s=new Service(await workspace());const c=await s.call('compile_design_contract',{direction:propose(matrix.plain)[0],expectedRevision:0});const saved=await s.savedContract(c.data.contractId);
  const by=r=>Object.fromEntries(r.map(x=>[x.id,x.status]));
  const none=by(requirementResults(saved,[]));assert.equal(none.overflow,'not-measured');assert.equal(none.accessibility,'not-measured');assert.equal(none.composition,'needs-human-review');
  const timeout=by(requirementResults(saved,runs({axe:true,overflow:true,focus:false,elementsChecked:40,contrastNodes:12,timedOut:'screenshot'})));assert.equal(timeout.overflow,'partial');assert.equal(timeout.accessibility,'partial');
  const noAxe=by(requirementResults(saved,runs({axe:false,overflow:true,focus:false,elementsChecked:null,contrastNodes:null,timedOut:'axe'})));assert.equal(noAxe.overflow,'partial');assert.equal(noAxe.labels,'not-measured');assert.equal(noAxe.contrast,'not-measured');
  const noText=by(requirementResults(saved,runs({axe:true,overflow:true,focus:true,elementsChecked:5,contrastNodes:0})));assert.equal(noText.contrast,'not-measured');assert.equal(noText.accessibility,'pass');
  const failing=by(requirementResults(saved,runs({axe:true,overflow:true,focus:true,elementsChecked:5,contrastNodes:3},[{id:'x',ruleId:'color-contrast'}])));assert.equal(failing.contrast,'fail');
  const legacyWorker=by(requirementResults(saved,[{viewport:{width:1,height:1},findings:[]}]));assert.equal(legacyWorker.overflow,'pass');
  const blocked=await s.call('audit_ui',{contractId:c.data.contractId,url:'http://127.0.0.1:1/'});assert.equal(blocked.data.status,'blocked');assert.equal(blocked.data.code,'BROWSER_NOT_INSTALLED');
  const evidence=await s.ws.artifact('{"historical":true}');const imported=await s.call('audit_ui',{contractId:c.data.contractId,evidenceArtifactId:evidence});
  assert.equal(imported.data.status,'partial');assert.equal(by(imported.data.requirementResults).overflow,'not-measured');
  const partial=new Service(s.ws,async()=>({status:'partial',timedOut:'viewport 390: Stage axe exceeded 4000 ms',runs:[{viewport:{width:1440,height:1000},findings:[],measured:{axe:true,overflow:true,focus:true,elementsChecked:30,contrastNodes:9,timedOut:null},stages:{navigate:120,axe:900}},{viewport:{width:390,height:844},findings:[],measured:{axe:false,overflow:true,focus:false,elementsChecked:null,contrastNodes:null,timedOut:'axe'},stages:{navigate:100,axe:4000}}]}),['http://127.0.0.1:4000']);
  const a=await partial.call('audit_ui',{contractId:c.data.contractId,url:'http://127.0.0.1:4000/'});
  assert.equal(a.data.status,'partial-timeout');assert.deepEqual(a.data.coverage.timedOut,['axe']);assert.ok(a.data.coverage.notMeasured.includes('accessibility'));assert.equal(a.data.classes.heuristic.split(' ')[0],'none');
  await assert.rejects(s.call('audit_ui',{contractId:c.data.contractId}),/hostReview|evidence/);
});
test('9. configuration writing and the real stdio handshake are verified separately by doctor --client',async()=>{
  const ws=await workspace();
  const init=JSON.parse(execFileSync(process.execPath,[cli,'init','--client','cursor','--apply','--local','--project',ws.root],{encoding:'utf8'}));
  assert.equal(init.status,'installed');assert.ok(init.changes.some(c=>c.path==='.cursor/mcp.json'));
  const before=JSON.parse(execFileSync(process.execPath,[cli,'doctor','--client','codex','--project',ws.root],{encoding:'utf8'}));
  assert.equal(before.client.status,'not-configured');assert.match(before.client.error,/init --client codex/);
  const doctor=JSON.parse(execFileSync(process.execPath,[cli,'doctor','--client','cursor','--project',ws.root],{encoding:'utf8',timeout:90000}));
  assert.equal(doctor.client.configFile,'.cursor/mcp.json');assert.equal(doctor.client.ok,true,JSON.stringify(doctor.client));
  assert.equal(doctor.client.tools.length,6);assert.equal(doctor.client.serverVersion,VERSION);assert.ok(doctor.client.elapsedMs.initialize>0);
  assert.ok(doctor.hints.some(h=>h.includes('IDE UI itself is not verified')));
  await fs.writeFile(path.join(ws.root,'.cursor/mcp.json'),JSON.stringify({mcpServers:{'art-director':{command:'definitely-not-a-command-xyz',args:[]}}}));
  const broken=JSON.parse(execFileSync(process.execPath,[cli,'doctor','--client','cursor','--project',ws.root],{encoding:'utf8',timeout:90000}));
  assert.equal(broken.client.ok,false);assert.ok(broken.hints.some(h=>/handshake failed/.test(h)));
  assert.equal(doctor.supportedNode,'>=22 <27');
});
test('fixture matrix boards are generated for review and every direction answers the six rationale questions',async()=>{
  for(const [name,brief] of Object.entries(matrix)){
    const ds=propose(brief);assert.ok(ds.length>=2,name);
    for(const d of ds){
      for(const k of ['fit','emphasis','visualDriver','mobile','wrongWhen','identity'])assert.ok(d.rationaleDetail[k]&&d.rationaleDetail[k].length,`${name}/${d.recipe.id} lacks ${k}`);
      for(const sec of d.architecture.sections)assert.equal(sectionItems(brief.content,sec).length,sec.items.length);
      await fs.writeFile(path.join(out,`${name}-${d.recipe.id}.html`),board(d));
    }
    const ids=new Set(ds.map(d=>d.recipe.id));assert.equal(ids.size,ds.length,'no duplicate recipes');
  }
  const landing=propose(matrix.landing);
  for(const d of landing){assert.equal(d.recipe.navigation,'top');assert.equal(d.identity.provenance.navigation,'user');assert.equal(d.architecture.hero.source,'content[role=hero]');assert.equal(d.architecture.hero.lede,'Every message is a case with an owner and a due date.');}
});

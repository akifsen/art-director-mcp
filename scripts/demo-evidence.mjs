import fs from 'node:fs/promises';
import path from 'node:path';
import {Workspace,Service,briefSchema,propose} from '../packages/core/dist/index.js';
import {audit} from '../packages/browser/dist/worker.js';
const root=path.resolve('examples/expressive-product');const ws=await Workspace.open(root);
const brief=briefSchema.parse(JSON.parse(await fs.readFile(path.join(root,'brief.json'),'utf8')));
const service=new Service(ws,audit);
const directions=propose(brief);const chosen=directions.find(d=>d.recipe.id==='product-stage')??directions[0];
await service.call('propose_directions',{brief});
let revision=0;try{revision=JSON.parse(await ws.read('.art-director/contract.json')).revision;}catch{}
const c=await service.call('compile_design_contract',{direction:chosen,expectedRevision:revision});
const result=await audit({version:'0.1.0',url:'http://127.0.0.1:5187',origins:['http://127.0.0.1:5187'],masks:[]});
await fs.mkdir(path.join(root,'.art-director/screenshots'),{recursive:true});
for(const run of result.runs){const name=`${run.viewport.width}.png`;await fs.writeFile(path.join(root,'.art-director/screenshots',name),Buffer.from(run.screenshot,'base64'));delete run.screenshot;run.screenshotPath=name;}
await ws.write('.art-director/reports/demo-audit.json',JSON.stringify({contractId:c.data.contractId,...result},null,2));
console.log(JSON.stringify({contractId:c.data.contractId,runs:result.runs.map(r=>({viewport:r.viewport,findings:r.findings,incomplete:r.incomplete}))},null,2));


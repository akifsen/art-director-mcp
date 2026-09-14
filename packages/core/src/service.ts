import {z} from 'zod';
import {briefSchema,directionSchema,propose,board,contract,tokenCss,differences,styleFor,DomainError,VERSION,hash,type Contract,type Direction} from './domain.js';
import {Workspace} from './workspace.js';

const id=z.string().regex(/^[a-f0-9]{64}$/);
/** Inline response budget in bytes. Larger results are stored as artifacts and summarized. */
export const INLINE_BUDGET=40000;
export const PAGE_LIMIT=12000;
export const toolSchemas={
  inspect_project:z.object({scope:z.string().max(300).default('')}).strict(),
  propose_directions:z.object({brief:briefSchema,seed:z.number().int().min(0).max(2147483647).default(0)}).strict(),
  // Either the unmodified generated direction, or its id plus the same brief and seed used to generate it.
  compile_design_contract:z.object({direction:directionSchema.optional(),directionId:z.string().regex(/^[a-f0-9]{24}$/).optional(),brief:briefSchema.optional(),seed:z.number().int().min(0).max(2147483647).default(0),expectedRevision:z.number().int().min(0),persist:z.boolean().default(true)}).strict()
    .refine(v=>Boolean(v.direction)!==Boolean(v.directionId),'Provide either direction or directionId').refine(v=>!v.directionId||Boolean(v.brief),'directionId requires the brief used to generate it'),
  get_blueprint:z.object({contractId:id,componentOrSection:z.enum(['hero','navigation','content','form','table']),stack:z.enum(['react','html']).default('react')}).strict(),
  audit_ui:z.object({contractId:id,url:z.string().url().max(2000).optional(),evidenceArtifactId:id.optional(),maskSelectors:z.array(z.string().min(1).max(200)).max(20).default([])}).strict().refine(v=>Boolean(v.url)!==Boolean(v.evidenceArtifactId),'Provide exactly one evidence source'),
  get_artifact:z.object({artifactId:id,cursor:z.number().int().min(0).default(0),limit:z.number().int().min(1).max(PAGE_LIMIT).default(6000)}).strict()
};
export type ToolName=keyof typeof toolSchemas;
export type BrowserRunner=(url:string,origins:string[],masks:string[],signal?:AbortSignal)=>Promise<unknown>;
type Finding={ruleId:string;id:string;contractRequirementId?:string;[k:string]:unknown};
type Run={viewport:{width:number;height:number};findings:Finding[];incomplete?:unknown[];[k:string]:unknown};
const labelRules=new Set(['label','label-title-only','select-name','button-name','link-name','input-button-name','input-image-alt','image-alt','aria-input-field-name','aria-toggle-field-name','aria-command-name','frame-title','aria-meter-name','aria-progressbar-name']);
export const requirementFor=(ruleId:string)=>ruleId==='overflow'?'overflow':ruleId==='color-contrast'?'contrast':labelRules.has(ruleId)?'labels':'accessibility';
/** Map measured findings onto the contract's deterministic requirements. Human-review requirements are never marked as passed. */
export function requirementResults(c:Contract,runs:Run[]){
  const findings=runs.flatMap(r=>r.findings.map(f=>({...f,contractRequirementId:requirementFor(f.ruleId)})));
  return c.requirements.map(req=>{
    const ids=findings.filter(f=>f.contractRequirementId===req.id||req.id==='accessibility'&&f.ruleId!=='overflow').map(f=>f.id);
    const status=req.verification==='human-review'?'needs-human-review':ids.length?'fail':req.verification==='deterministic'?'pass':'automated-pass-needs-human-review';
    return {id:req.id,verification:req.verification,status,findingIds:[...new Set(ids)]};
  });
}
function summarize(name:ToolName,result:unknown){
  const r=result as Record<string,unknown>;
  switch(name){
    case 'propose_directions':return {directions:(r as unknown as Array<Record<string,unknown>>).map(d=>({id:d.id,packId:d.packId,recipeId:(d.recipe as {id:string}).id,previewPath:d.previewPath,previewArtifactId:d.previewArtifactId,differences:d.differences}))};
    case 'inspect_project':return {stack:r.stack,confidence:r.confidence,fileCount:(r.files as unknown[]).length,assetCount:(r.assets as unknown[]).length,tokens:(r.tokens as string[]).slice(0,20),summary:r.summary,truncated:r.truncated};
    case 'audit_ui':return {status:r.status,code:r.code,contractId:r.contractId,requirementResults:r.requirementResults,runs:((r.run as {runs?:Run[]})?.runs??[]).map(x=>({viewport:x.viewport,findings:x.findings.map(f=>({id:f.id,ruleId:f.ruleId,severity:f.severity,contractRequirementId:f.contractRequirementId,observed:f.observed})),incomplete:(x.incomplete??[]).length,blockedOrigins:x.blockedOrigins,overflow:(x.observed as {overflow?:boolean}|undefined)?.overflow})),visualReview:r.visualReview,limitations:(r.run as {limitations?:unknown})?.limitations};
    default:return undefined;
  }
}
export class Service {
  constructor(public ws:Workspace,private browser?:BrowserRunner,private origins:string[]=[]){ }
  async savedContract(id:string):Promise<Contract> {
    const raw=await this.ws.read(`.art-director/reports/${id}.json`,8*1024*1024);
    const record=JSON.parse(raw);if(hash([record.mimeType,record.content])!==id)throw new DomainError('ARTIFACT_NOT_FOUND','Invalid contract artifact');
    const data=JSON.parse(record.content) as Contract;
    if(!data.requirements||!data.direction)throw new DomainError('INVALID_CONTRACT','Artifact is not a contract');return data;
  }
  private async preview(d:Direction){
    const html=board(d);const previewArtifactId=await this.ws.artifact(html,'text/html');
    const previewPath=`.art-director/previews/${d.id}.html`;await this.ws.write(previewPath,html);
    return {previewArtifactId,previewPath};
  }
  async call(name:ToolName,input:unknown,signal?:AbortSignal) {
    if(Buffer.byteLength(JSON.stringify(input))>32768)throw new DomainError('SIZE_LIMIT','Input exceeds 32 KiB');
    signal?.throwIfAborted();
    let result:unknown;let warnings:string[]=[];
    switch(name){
      case 'inspect_project':{const a=toolSchemas[name].parse(input);result=await this.ws.inspect(a.scope);break;}
      case 'propose_directions':{const a=toolSchemas[name].parse(input);const directions=propose(a.brief,a.seed);
        result=await Promise.all(directions.map(async d=>({...d,...await this.preview(d),differences:Object.fromEntries(directions.filter(o=>o.id!==d.id).map(o=>[o.recipe.id,differences(d.recipe,o.recipe)]))})));
        warnings=[...new Set(directions.flatMap(d=>d.warnings))];warnings.push('Open previewPath files in a browser to compare boards; boards are design studies, not screenshots of an implementation.');break;}
      case 'compile_design_contract':{const a=toolSchemas[name].parse(input);
        const source=a.direction??{brief:a.brief!,seed:a.seed,id:a.directionId!};
        const verified=propose(source.brief,source.seed).find(d=>d.id===source.id);
        if(!verified||a.direction&&hash(verified)!==hash(a.direction))throw new DomainError('INVALID_DIRECTION',a.direction?'Use an unmodified generated direction (pass the object without previewArtifactId, previewPath and differences), or pass directionId with the original brief and seed':'No direction with this id exists for the supplied brief, seed and server version; call propose_directions again');
        const compile=async()=>{let revision=0;
          try{revision=(JSON.parse(await this.ws.read('.art-director/contract.json')) as Contract).revision;if(!Number.isInteger(revision))throw new Error('Invalid revision');}
          catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw new DomainError('INVALID_CONTRACT','Existing .art-director/contract.json cannot be read; it was not replaced. Repair or remove it explicitly, then retry');}
          if(revision!==a.expectedRevision)throw new DomainError('CONTRACT_CONFLICT',`Expected ${a.expectedRevision}; current revision is ${revision}`);
          const c=contract(verified,revision+1);const contractId=await this.ws.artifact(JSON.stringify(c));
          const css=tokenCss(verified);const cssId=await this.ws.artifact(css,'text/css');
          const tailwindId=await this.ws.artifact('@theme {\n  --color-ad-background: var(--ad-background);\n  --color-ad-text: var(--ad-text);\n  --color-ad-accent: var(--ad-accent);\n  --font-ad-heading: var(--ad-font-heading);\n  --font-ad-body: var(--ad-font-body);\n}','text/css');
          const files:string[]=[];
          if(a.persist){for(const [file,text] of [['.art-director/tokens.json',JSON.stringify(c.tokens,null,2)],['.art-director/tokens.css',css],['.art-director/brief.json',JSON.stringify(c.direction.brief,null,2)],['.art-director/contract.json',JSON.stringify(c,null,2)]] as const){await this.ws.write(file,text);files.push(file);}}
          const {previewPath}=await this.preview(verified);
          return {contractId,revision:c.revision,cssArtifactId:cssId,tailwindArtifactId:tailwindId,files,previewPath,style:c.style,guide:'Load the contract artifact and implement within the existing stack. Use tokens.css variables (--ad-*) for color, type and spacing. Preserve routes, SSR, real content and user constraints. Review all human requirements.'};};
        result=a.persist?await this.ws.lock(compile):await compile();break;}
      case 'get_blueprint':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);result=blueprint(c,a.componentOrSection,a.stack);break;}
      case 'audit_ui':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);
        if(a.evidenceArtifactId){result={status:'partial',contractId:a.contractId,evidence:await this.ws.getArtifact(a.evidenceArtifactId),visualReview:'not-performed',warnings:['Imported evidence is historical/unverified; no current browser checks executed.']};}
        else if(!this.browser){result={status:'blocked',code:'BROWSER_NOT_INSTALLED',visualReview:'not-performed',findings:[],resolution:'Install @akifsen/art-director-browser in the project, run `art-director browser install`, then restart the MCP server.'};}
        else{
          const origin=new URL(a.url!).origin;
          if(!this.origins.includes(origin))throw new DomainError('ORIGIN_NOT_ALLOWED',`${origin} is not an allowed origin. Start the server with --allow-origin ${origin} (numeric loopback origins only, e.g. http://127.0.0.1:PORT) and restart the MCP server. Supplying a URL in chat does not grant network permission. Currently allowed: ${this.origins.length?this.origins.join(', '):'none'}`);
          const run=await this.browser(a.url!,this.origins,a.maskSelectors,signal) as {runs?:Run[]};
          if(Array.isArray(run.runs))for(const r of run.runs)for(const f of r.findings)f.contractRequirementId=requirementFor(f.ruleId);
          result={status:'partial',contractId:a.contractId,contractHash:hash(c),contractRevision:c.revision,run,requirementResults:requirementResults(c,run.runs??[]),visualReview:'not-performed',needsReview:c.requirements.filter(r=>r.verification!=='deterministic')};}break;}
      case 'get_artifact':{const a=toolSchemas[name].parse(input);return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId:a.artifactId,capabilities:{vision:false},warnings:[],...await this.ws.getArtifact(a.artifactId,a.cursor,a.limit)};}
    }
    signal?.throwIfAborted();
    const text=JSON.stringify(result);const artifactId=await this.ws.artifact(text);
    const truncated=Buffer.byteLength(text)>INLINE_BUDGET;
    return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId,version:VERSION,capabilities:{browser:Boolean(this.browser),vision:false},warnings,truncated,nextCursor:truncated?0:null,data:truncated?{message:`Full result is ${text.length} characters; read it with get_artifact (limit up to ${PAGE_LIMIT}) following nextCursor.`,summary:summarize(name,result)}:result};
  }
}
type Section='hero'|'navigation'|'content'|'form'|'table';
/** Deterministic, contract-specific implementation guidance. Decisions come from the recipe, its derived style and the contract requirements. */
export function blueprint(c:Contract,section:Section,stack:'react'|'html'){
  // Contracts saved by 0.1.x have no derived style; recompute it from the recipe.
  const r=c.layout;const s=c.style??styleFor(r);const n=c.contentTruths.length;
  const semantics={hero:'header > h1 + p + task link',navigation:'nav[aria-label] + button[aria-expanded] + list of links',content:'main > section with h2 and real paragraphs',form:'form > label + native control + associated error message + submit button',table:'region[aria-label] > table > caption + thead + tbody'}[section];
  const navDecisions={
    top:['Persistent header bar: wordmark (product name) left, <nav aria-label="Main"> links, primary task as the header action on the right.','Below 700px collapse links behind a labeled <button aria-expanded aria-controls>; Escape closes and returns focus to the trigger (contract state: menu).','Header height stays constant across pages; do not hide it on scroll.'],
    rail:[`Sticky side rail, 14rem wide, containing the wordmark, <nav aria-label="Sections"> and the primary task action ("${c.primaryTask}").`,'Below 700px the rail becomes a top disclosure (button with aria-expanded or <details>); content follows in one column in source order.','Rail links are section anchors; current section is marked with aria-current="true".'],
    inline:['No separate navigation bar: links sit inline beneath the masthead title as a ruled row.','Links wrap naturally on narrow screens; no hamburger is needed when there are fewer than six links.','Give the row top and bottom 1px rules so it reads as navigation, not body text.']
  }[r.navigation];
  const decisions:Record<Section,string[]>={
    hero:r.id==='workbench'?['This composition has no marketing hero. Use a compact context header: product name, current view label and the toolbar directly below.','Primary task appears as the first toolbar action, not as a headline.']
      :[`Heading uses var(--ad-font-heading) (${s.headingFamily.split(',')[0]}) at weight ${s.headingWeight}${r.id==='folio'?', full-width masthead with clamp(2.4rem, 9vw, 8rem) and uppercase':`, size clamp(2.4rem, 6vw, 5rem), max-width 16ch`}.`,`Lede is the primary task in the user's words ("${c.primaryTask}"), max-width 48ch, 1.15em.`,r.id==='product-stage'?'Two-column split (1fr 1fr) with the product figure right; below 700px the explanation precedes the figure. The figure is a real screenshot or an explicitly labeled placeholder; never fabricated metrics.':r.id==='margin-notes'?'Title is offset into the wide (7fr) column with the section index in the narrow (3fr) column.':`Introduction padding-bottom var(--ad-space-section) (${s.sectionSpace}rem).`,'No invented testimonials, logos or numbers; every sentence comes from the brief or real product data.'],
    navigation:navDecisions,
    content:[`${n} content section${n===1?'':'s'} follow the rhythm "${r.rhythm}"; keep source order and one h2 per section.`,`Section spacing var(--ad-space-section) (${s.sectionSpace}rem) with a 1px top rule; paragraphs max-width 65ch at ${s.bodySize}px/${s.lineHeight}.`,r.id==='folio'?'Alternate story rows: odd sections span the left 8 of 12 columns, even sections the right 8; on mobile all sections stack full width.':r.id==='margin-notes'?'Two-column grid 3fr/7fr: section numbers and labels in the margin column, reading text in the wide column; a single column below 700px.':r.id==='ledger'?'Content renders as grouped records: <dl> with serif <dt> labels, tabular data and an inline action per record.':r.id==='guided-path'?'Sections are numbered steps with oversized step numbers (3.5rem) in a 5fr/3fr grid; the reference column lists audience and constraints.':r.id==='workbench'?'Content is the details panel beside the data region; keep it secondary in size (0.9em).':'Feature band uses inverted colors (text on accent or text as background) for the first content item; later items are numbered steps.',`Empty, loading and error states: ${c.states.empty} ${c.states.loading} ${c.states.error}`],
    form:['Every control has a visible <label for>; placeholder text is never the only label (contract requirement: labels).',`Focus ring 2px solid var(--ad-accent) with 3px offset, never clipped by overflow containers (${c.states.focus}).`,`Error: ${c.states.error} Success: ${c.states.success} Disabled: ${c.states.disabled}`,`Submit button label names the task ("${c.primaryTask}" or a shorter imperative), not "Submit".`,'Loading: keep control geometry, set aria-busy on the form region and disable double submission.'],
    table:r.density==='dense'||r.id==='ledger'?[`Wrap in <div role="region" aria-label tabindex="0" style="overflow-x:auto"> so the table scrolls inside a named region without page overflow (${r.mobile}).`,'<caption> states what the rows are; every <th> has scope; row header is the first cell.',`Numbers use font-variant-numeric: ${s.numerals==='tabular'?'tabular-nums':'proportional'}; cell padding .5rem .75rem in this ${r.density} density.`,'Empty cells show an explicit dash or "No data" text; never sample data. Status cells include readable text, not color alone.',`Loading: ${c.states.loading} Empty: ${c.states.empty}`]
      :['A data table is not part of this composition rhythm. If real tabular data exists, place it inside a named scroll region under its own h2 and keep the reading measure for surrounding text.','Use <caption>, scoped <th> and readable status text; do not fabricate rows.']
  };
  const stackNotes=stack==='react'?['Menu/disclosure state: useState for aria-expanded, onKeyDown Escape closes and refocuses the trigger via ref.','Import .art-director/tokens.css once at the root; do not hardcode pack colors in components.','Preserve existing routes and data fetching; this guidance changes presentation only.']
    :['Disclosures may use <details>/<summary> without JavaScript; ensure summary text names the menu.','Load .art-director/tokens.css in <head>; use the --ad-* variables.','Keep server-rendered markup and existing links intact.'];
  return {section,stack,semantics,decisions:decisions[section],stackNotes,cssVariables:['--ad-background','--ad-text','--ad-accent','--ad-space','--ad-space-section','--ad-space-gap','--ad-font-heading','--ad-font-body','--ad-heading-weight','--ad-body-size','--ad-line-height'],layout:r,style:s,mobile:r.mobile,states:c.states,verification:c.requirements,contractRevision:c.revision};
}

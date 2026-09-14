import {z} from 'zod';
import {briefSchema,directionSchema,propose,contract,tokenCss,differences,styleFor,resolveIdentity,architecture,sectionItems,packs,DomainError,VERSION,hash,type Contract,type Direction,type Identity,type Architecture,type Section} from './domain.js';
import {board} from './board.js';
import {Workspace} from './workspace.js';

const id=z.string().regex(/^[a-f0-9]{64}$/);
/** Inline response budget in bytes. Larger results are stored as artifacts and summarized. */
export const INLINE_BUDGET=40000;
export const PAGE_LIMIT=12000;
export const blueprintSections=['page','hero','navigation','content','form','table'] as const;
export type BlueprintSection=typeof blueprintSections[number];
const hostReviewSchema=z.object({
  reviewer:z.enum(['host-agent','human']),
  evidenceArtifactId:id.optional(),
  findings:z.array(z.object({requirementId:z.string().min(1).max(60),verdict:z.enum(['pass','fail','unsure']),note:z.string().max(1000)}).strict()).max(40)
}).strict();
export const toolSchemas={
  inspect_project:z.object({scope:z.string().max(300).default('')}).strict(),
  propose_directions:z.object({brief:briefSchema,seed:z.number().int().min(0).max(2147483647).default(0)}).strict(),
  // Either the unmodified generated direction, or its id plus the same brief and seed used to generate it.
  compile_design_contract:z.object({direction:directionSchema.optional(),directionId:z.string().regex(/^[a-f0-9]{24}$/).optional(),brief:briefSchema.optional(),seed:z.number().int().min(0).max(2147483647).default(0),expectedRevision:z.number().int().min(0),persist:z.boolean().default(true)}).strict()
    .refine(v=>Boolean(v.direction)!==Boolean(v.directionId),'Provide either direction or directionId').refine(v=>!v.directionId||Boolean(v.brief),'directionId requires the brief used to generate it'),
  get_blueprint:z.object({contractId:id,componentOrSection:z.enum(blueprintSections),stack:z.enum(['react','html']).default('react')}).strict(),
  /** Live URL or imported evidence; an optional structured host review is stored alongside, never merged into measured findings. */
  audit_ui:z.object({contractId:id,url:z.string().url().max(2000).optional(),evidenceArtifactId:id.optional(),maskSelectors:z.array(z.string().min(1).max(200)).max(20).default([]),hostReview:hostReviewSchema.optional()}).strict().refine(v=>Boolean(v.url)!==Boolean(v.evidenceArtifactId)||Boolean(v.hostReview)&&!v.url&&!v.evidenceArtifactId,'Provide a url, an evidenceArtifactId, or a hostReview'),
  get_artifact:z.object({artifactId:id,cursor:z.number().int().min(0).default(0),limit:z.number().int().min(1).max(PAGE_LIMIT).default(6000)}).strict()
};
export type ToolName=keyof typeof toolSchemas;
export type BrowserRunner=(url:string,origins:string[],masks:string[],signal?:AbortSignal)=>Promise<unknown>;
type Finding={ruleId:string;id:string;contractRequirementId?:string;[k:string]:unknown};
/** What a run actually measured. Workers before 0.2.0 do not report it; their runs are treated as fully measured. */
type Measured={axe:boolean;overflow:boolean;focus:boolean;elementsChecked:number|null;contrastNodes:number|null;timedOut?:string|null};
type Run={viewport:{width:number;height:number};findings:Finding[];incomplete?:unknown[];measured?:Measured;stages?:Record<string,number>;[k:string]:unknown};
const labelRules=new Set(['label','label-title-only','select-name','button-name','link-name','input-button-name','input-image-alt','image-alt','aria-input-field-name','aria-toggle-field-name','aria-command-name','frame-title','aria-meter-name','aria-progressbar-name']);
export const requirementFor=(ruleId:string)=>ruleId==='overflow'?'overflow':ruleId==='color-contrast'?'contrast':labelRules.has(ruleId)?'labels':'accessibility';
const measuredOf=(r:Run):Measured=>r.measured??{axe:true,overflow:true,focus:true,elementsChecked:null,contrastNodes:null,timedOut:null};
/**
 * Map measured findings onto contract requirements. A requirement passes only when every run actually measured it;
 * unmeasured or timed-out coverage yields `not-measured`/`partial`, never a silent pass. Human-review requirements are never passed automatically.
 */
export function requirementResults(c:Contract,runs:Run[]){
  const findings=runs.flatMap(r=>r.findings.map(f=>({...f,contractRequirementId:requirementFor(f.ruleId)})));
  const measured=runs.map(measuredOf);const anyTimeout=measured.some(m=>m.timedOut);
  const coverageFor=(reqId:string)=>reqId==='overflow'?measured.every(m=>m.overflow):reqId==='contrast'?measured.every(m=>m.axe&&m.contrastNodes!==0):measured.every(m=>m.axe);
  return c.requirements.map(req=>{
    const ids=findings.filter(f=>f.contractRequirementId===req.id||req.id==='accessibility'&&f.ruleId!=='overflow').map(f=>f.id);
    let status:string;
    if(req.verification==='human-review')status='needs-human-review';
    else if(ids.length)status='fail';
    else if(!runs.length||!coverageFor(req.id))status='not-measured';
    else if(anyTimeout)status='partial';
    else status=req.verification==='deterministic'?'pass':'automated-pass-needs-human-review';
    return {id:req.id,verification:req.verification,status,findingIds:[...new Set(ids)],coverage:req.id==='contrast'?{contrastNodes:measured.map(m=>m.contrastNodes)}:req.verification==='deterministic'?{elementsChecked:measured.map(m=>m.elementsChecked),runs:runs.length}:undefined};
  });
}
function summarize(name:ToolName,result:unknown){
  const r=result as Record<string,unknown>;
  switch(name){
    case 'propose_directions':return {directions:(r as unknown as Array<Record<string,unknown>>).map(d=>({id:d.id,packId:d.packId,recipeId:(d.recipe as {id:string}).id,previewPath:d.previewPath,previewArtifactId:d.previewArtifactId,differences:d.differences,rationaleDetail:d.rationaleDetail,sections:((d.architecture as Architecture).sections).map(s=>`${s.title} (${s.presentation})`),identity:(d.identity as Identity).provenance,warnings:d.warnings}))};
    case 'inspect_project':return {stack:r.stack,confidence:r.confidence,fileCount:(r.files as unknown[]).length,assetCount:(r.assets as unknown[]).length,tokens:(r.tokens as string[]).slice(0,20),summary:r.summary,truncated:r.truncated};
    case 'audit_ui':return {status:r.status,code:r.code,contractId:r.contractId,contractRevision:r.contractRevision,requirementResults:r.requirementResults,coverage:r.coverage,runs:((r.run as {runs?:Run[]})?.runs??[]).map(x=>({viewport:x.viewport,findings:x.findings.map(f=>({id:f.id,ruleId:f.ruleId,severity:f.severity,contractRequirementId:f.contractRequirementId,observed:f.observed})),incomplete:(x.incomplete??[]).length,blockedOrigins:x.blockedOrigins,overflow:(x.observed as {overflow?:boolean}|undefined)?.overflow,measured:x.measured,stages:x.stages})),hostReview:r.hostReview,visualReview:r.visualReview,limitations:(r.run as {limitations?:unknown})?.limitations};
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
          const tailwindId=await this.ws.artifact('@theme {\n  --color-ad-background: var(--ad-background);\n  --color-ad-text: var(--ad-text);\n  --color-ad-accent: var(--ad-accent);\n  --color-ad-on-accent: var(--ad-on-accent);\n  --font-ad-heading: var(--ad-font-heading);\n  --font-ad-body: var(--ad-font-body);\n}','text/css');
          const files:string[]=[];
          if(a.persist){for(const [file,text] of [['.art-director/tokens.json',JSON.stringify(c.tokens,null,2)],['.art-director/tokens.css',css],['.art-director/brief.json',JSON.stringify(c.direction.brief,null,2)],['.art-director/contract.json',JSON.stringify(c,null,2)]] as const){await this.ws.write(file,text);files.push(file);}}
          const {previewPath}=await this.preview(verified);
          return {contractId,revision:c.revision,cssArtifactId:cssId,tailwindArtifactId:tailwindId,files,previewPath,style:c.style,identity:{palette:c.identity.palette,type:c.identity.type,provenance:c.identity.provenance,conflicts:c.identity.conflicts},architecture:{hero:c.architecture.hero,sections:c.architecture.sections.map(s=>({id:s.id,title:s.title,role:s.role,presentation:s.presentation,emphasis:s.emphasis,items:s.items.length})),missing:c.architecture.missing},guide:'Load the contract artifact and implement within the existing stack. Build sections in the contract architecture order using the stated presentations. Use tokens.css variables (--ad-*) for color, type and spacing. Preserve routes, SSR, real content and listed behaviors. Review all human requirements; anything listed under architecture.missing stays an explicit gap, not invented content.'};};
        result=a.persist?await this.ws.lock(compile):await compile();break;}
      case 'get_blueprint':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);result=blueprint(c,a.componentOrSection,a.stack);break;}
      case 'audit_ui':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);
        const hostReview=a.hostReview?{...a.hostReview,contractRevision:c.revision,contractHash:hash(c),class:'host-review',note:'Structured judgment supplied by the host or a human; it does not replace measured findings and is stored with the contract revision it evaluated.'}:undefined;
        if(hostReview&&hostReview.evidenceArtifactId)await this.ws.getArtifact(hostReview.evidenceArtifactId,0,1);
        if(a.evidenceArtifactId){result={status:'partial',contractId:a.contractId,contractRevision:c.revision,evidence:await this.ws.getArtifact(a.evidenceArtifactId),requirementResults:requirementResults(c,[]),hostReview,visualReview:hostReview?'host-supplied':'not-performed',warnings:['Imported evidence is historical/unverified; no current browser checks executed.']};}
        else if(!a.url){result={status:'partial',contractId:a.contractId,contractRevision:c.revision,requirementResults:requirementResults(c,[]),hostReview,visualReview:'host-supplied',warnings:['No browser measurement was requested; only the host review is recorded.']};}
        else if(!this.browser){result={status:'blocked',code:'BROWSER_NOT_INSTALLED',visualReview:'not-performed',findings:[],hostReview,resolution:'Install @akifsen/art-director-browser in the project, run `art-director browser install`, then restart the MCP server.'};}
        else{
          const origin=new URL(a.url).origin;
          if(!this.origins.includes(origin))throw new DomainError('ORIGIN_NOT_ALLOWED',`${origin} is not an allowed origin. Start the server with --allow-origin ${origin} (numeric loopback origins only, e.g. http://127.0.0.1:PORT) and restart the MCP server. Supplying a URL in chat does not grant network permission. Currently allowed: ${this.origins.length?this.origins.join(', '):'none'}`);
          const run=await this.browser(a.url,this.origins,a.maskSelectors,signal) as {runs?:Run[];status?:string;stages?:unknown;timedOut?:string|null};
          const runs=Array.isArray(run.runs)?run.runs:[];
          for(const r of runs)for(const f of r.findings)f.contractRequirementId=requirementFor(f.ruleId);
          const results=requirementResults(c,runs);
          const coverage={viewports:runs.length,elementsChecked:runs.map(r=>measuredOf(r).elementsChecked),contrastNodes:runs.map(r=>measuredOf(r).contrastNodes),incomplete:runs.reduce((n,r)=>n+(r.incomplete?.length??0),0),timedOut:runs.map(r=>measuredOf(r).timedOut??null).filter(Boolean),notMeasured:results.filter(r=>r.status==='not-measured'||r.status==='partial').map(r=>r.id)};
          result={status:run.status==='partial'||coverage.timedOut.length?'partial-timeout':'partial',contractId:a.contractId,contractHash:hash(c),contractRevision:c.revision,run,requirementResults:results,coverage,
            classes:{measured:'run.runs[].findings — deterministic checks in live Chromium',compliance:'requirementResults — contract requirements evaluated against measured findings and coverage',heuristic:'none — no aesthetic scoring is produced',needsReview:c.requirements.filter(r=>r.verification!=='deterministic').map(r=>r.id)},
            hostReview,visualReview:hostReview?'host-supplied':'not-performed',needsReview:c.requirements.filter(r=>r.verification!=='deterministic'),
            meaning:'Passing deterministic checks means no measured defect in the covered elements, not a successful design. Composition, architecture, identity and truth remain human/host judgments.'};}break;}
      case 'get_artifact':{const a=toolSchemas[name].parse(input);return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId:a.artifactId,capabilities:{vision:false},warnings:[],...await this.ws.getArtifact(a.artifactId,a.cursor,a.limit)};}
    }
    signal?.throwIfAborted();
    const text=JSON.stringify(result);const artifactId=await this.ws.artifact(text);
    const truncated=Buffer.byteLength(text)>INLINE_BUDGET;
    return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId,version:VERSION,capabilities:{browser:Boolean(this.browser),vision:false},warnings,truncated,nextCursor:truncated?0:null,data:truncated?{message:`Full result is ${text.length} characters; read it with get_artifact (limit up to ${PAGE_LIMIT}) following nextCursor.`,summary:summarize(name,result)}:result};
  }
}
/** Contracts written before 1.1 carry neither identity nor architecture; derive both from the stored direction so blueprints stay usable. */
function upgrade(c:Contract):{identity:Identity;architecture:Architecture}{
  if(c.identity&&c.architecture)return {identity:c.identity,architecture:c.architecture};
  const brief=briefSchema.parse(c.direction.brief);const pack=packs.find(p=>p.id===c.direction.packId)??packs[0]!;
  const identity=c.identity??resolveIdentity(brief,pack,c.layout);
  return {identity,architecture:c.architecture??architecture(brief,c.layout)};
}
const presentationGuide:Record<Section['presentation'],string>={
  feature:'one heading (h2) with its paragraph(s); full measure, no card chrome',
  prose:'h2 followed by reading text; h3 per item when the section has several items; 65ch measure',
  'grouped-list':'one h2 for the group, then a ruled index list (<ul>) with h3 + paragraph per item in a name/description grid — not equal cards, not numbered',
  'work-list':'ordered list of named work items with a small index number, h3 and a one-paragraph description; evidence status shown when missing',
  steps:'ordered list with oversized step numbers; use only for sequential content',
  table:'named scroll region (role=region, aria-label, tabindex=0) > table with caption, scoped headers and explicit empty cells',
  records:'definition list of grouped records: dt label, dd value, inline action',
  aside:'secondary aside at 0.9em beside or after the main flow',
  contact:'closing footer with contact facts and the primary task action',
  'evidence-pending':'a labeled gap ("Evidence pending") — render no metrics, logos or testimonials until real material exists'
};
/** Deterministic, contract-specific implementation guidance. Decisions come from the recipe, the resolved identity, the content architecture and the contract requirements. */
export function blueprint(c:Contract,section:BlueprintSection,stack:'react'|'html'){
  const r=c.layout;const {identity:i,architecture:arch}=upgrade(c);const s=c.style??styleFor(r,i);const n=c.contentTruths.length;const items=(x:Section)=>sectionItems(c.contentTruths,x);
  const semantics={page:'header/nav + main > (header.intro, section[id]…) + footer; one h1, one h2 per section',hero:'header > h1 + p + task link',navigation:'nav[aria-label] + button[aria-expanded] + list of links',content:'main > section with h2 and real paragraphs',form:'form > label + native control + associated error message + submit button',table:'region[aria-label] > table > caption + thead + tbody'}[section];
  const prov=(k:string)=>i.provenance[k]??'pack';
  const navDecisions={
    top:['Persistent header bar: wordmark (product name) left, <nav aria-label="Main"> links, primary task as the header action on the right.','Below 700px collapse links behind a labeled <button aria-expanded aria-controls>; Escape closes and returns focus to the trigger (contract state: menu).','Header height stays constant across pages; do not hide it on scroll.'],
    rail:[`Sticky side rail, 14rem wide, containing the wordmark, <nav aria-label="Sections"> and the primary task action ("${c.primaryTask}").`,'Below 700px the rail becomes a top disclosure (button with aria-expanded or <details>); content follows in one column in source order.','Rail links are section anchors; current section is marked with aria-current="true".'],
    inline:['No separate navigation bar: links sit inline beneath the masthead title as a ruled row.','Links wrap naturally on narrow screens; no hamburger is needed when there are fewer than six links.','Give the row top and bottom 1px rules so it reads as navigation, not body text.']
  }[r.navigation];
  const navTargets=`Navigation targets are the ${arch.sections.length} architecture sections: ${arch.sections.map(x=>x.title).join(', ')} (source ${prov('navigation')}).`;
  const primary=arch.sections.find(x=>x.emphasis==='primary');
  const identityDecisions=[`Palette: background ${i.palette.background} (${prov('palette.background')}), text ${i.palette.text} (${prov('palette.text')}), accent ${i.palette.accent} (${prov('palette.accent')}); text on accent fills is ${i.onAccent}. Accent use is ${i.accentUse}${i.accentUse==='restrained'?': outlined primary action, accent only on focus rings and thin rules':i.accentUse==='expressive'?': filled primary action, accent on the h1 and index numbers':': filled primary action, accent on labels and index numbers'}.`,
    `Type: heading ${i.type.heading} at weight ${i.type.headingWeight} (${prov('type.heading')}/${prov('type.headingWeight')}), body ${i.type.body} (${prov('type.body')}), numerals ${i.type.numerals}${i.families.heading?`; brand family "${i.families.heading}" leads the heading stack`:''}${i.families.body?`; brand family "${i.families.body}" leads the body stack`:''}. Use var(--ad-font-heading)/var(--ad-font-body); do not hardcode pack fonts.`,
    ...(i.conflicts.length?[`Unresolved identity conflicts to settle with the user before shipping: ${i.conflicts.join(' | ')}`]:[])];
  const decisions:Record<BlueprintSection,string[]>={
    page:[`Section order (contract architecture): ${arch.sections.map((x,k)=>`${k+1}. ${x.title} — ${x.role}, ${x.presentation}, ${x.emphasis}`).join('; ')}.`,
      `Hero comes from ${arch.hero.source}: title "${arch.hero.title}", lede "${arch.hero.lede}"${arch.hero.support?`, support "${arch.hero.support}"`:''}.`,
      `Frame: ${r.composition} Grid: ${r.grid}. Rhythm: ${r.rhythm}. Navigation ${r.navigation} (${prov('navigation')}), density ${r.density} (${prov('density')}).`,
      ...identityDecisions,
      `Responsive: ${r.mobile} Below 700px every multi-column presentation becomes one column in architecture order; tables scroll inside their named region.`,
      ...(arch.missing.length?[`Explicit gaps (never fill with invented material): ${arch.missing.join(' | ')}`]:[]),
      ...(arch.notes.length?[`Architecture notes: ${arch.notes.join(' ')}`]:[]),
      ...(c.preservedBehaviors?.length?[`Preserve: ${c.preservedBehaviors.join('; ')}`]:[])],
    hero:r.id==='workbench'?['This composition has no marketing hero. Use a compact context header: product name, current view label and the toolbar directly below.','Primary task appears as the first toolbar action, not as a headline.',...identityDecisions.slice(0,1)]
      :[`Heading uses var(--ad-font-heading) (${s.headingFamily.split(',')[0]}) at weight ${s.headingWeight}${r.id==='folio'?`, full-width masthead with clamp(2.4rem, ${s.h1Vw}, ${s.h1Max})${i.type.heading==='condensed'?' and uppercase':''}`:`, size clamp(2.4rem, ${s.h1Vw}, ${s.h1Max}), max-width 16ch`}.`,`Title is "${arch.hero.title}" (${arch.hero.source}); lede is "${arch.hero.lede}", max-width 48ch, 1.15em${arch.hero.support?`; support line "${arch.hero.support}" at 0.85 opacity`:''}.`,r.id==='product-stage'?`Two-column split (1fr 1fr) with the product figure right; below 700px the explanation precedes the figure. ${c.direction.brief.assets?.screenshots?'A real screenshot is declared: place it in the figure with a caption.':'No screenshots are declared: the figure is an explicitly labeled placeholder, never a fabricated mockup or metrics.'}`:r.id==='margin-notes'?'Title is offset into the wide (7fr) column with the section index in the narrow (3fr) column.':`Introduction padding-bottom var(--ad-space-section) (${s.sectionSpace}rem).`,`Primary action: "${c.primaryTask}" as ${i.accentUse==='restrained'?'an outlined button (2px var(--ad-accent))':'a filled button (var(--ad-accent) with var(--ad-on-accent) text)'}.`,'No invented testimonials, logos or numbers; every sentence comes from the brief or real product data.',...identityDecisions.slice(0,1)],
    navigation:[navTargets,...navDecisions],
    content:[`${n} brief item${n===1?'':'s'} become ${arch.sections.length} section${arch.sections.length===1?'':'s'} following "${r.rhythm}"; keep the architecture order and one h2 per section.`,
      ...arch.sections.map((x,k)=>`${k+1}. "${x.title}" (${x.role}, ${x.emphasis}): ${presentationGuide[x.presentation]}${x.items.length>1?`; ${x.items.length} items: ${items(x).map(it=>it.heading).join(', ')}`:''}${x.note?`. ${x.note}`:''}`),
      `Section spacing var(--ad-space-section) (${s.sectionSpace}rem) with a 1px top rule; paragraphs max-width 65ch at ${s.bodySize}px/${s.lineHeight}. Primary sections get the larger h2 (clamp(1.6rem,3.2vw,2.6rem)); supporting sections render at 0.9em with half spacing.`,
      r.id==='folio'?'Alternate story rows: odd sections span the left 8 of 12 columns, even sections the right 8; on mobile all sections stack full width.':r.id==='margin-notes'?'Two-column grid 3fr/7fr: section numbers and labels in the margin column, reading text in the wide column; a single column below 700px.':r.id==='ledger'?'Records render as <dl> with serif <dt> labels, tabular data and an inline action per record; the summary strip above lists the same items with explicit empty values.':r.id==='guided-path'?'Steps use oversized numbers (3.5rem) in a 5fr/3fr grid; the reference column lists audience, secondary tasks and constraints.':r.id==='workbench'?'The toolbar lists every section as a view button; the data section is the primary region and the rest are secondary panels at 0.9em.':'The first primary section becomes the inverted feature band (text color as background) directly under the split hero.',
      ...(primary?[`Lead with "${primary.title}": it carries the main visual weight after the hero.`]:[]),
      `Empty, loading and error states: ${c.states.empty} ${c.states.loading} ${c.states.error}`],
    form:['Every control has a visible <label for>; placeholder text is never the only label (contract requirement: labels).',`Focus ring 2px solid var(--ad-accent) with 3px offset, never clipped by overflow containers (${c.states.focus}).`,`Error: ${c.states.error} Success: ${c.states.success} Disabled: ${c.states.disabled}`,`Submit button label names the task ("${c.primaryTask}" or a shorter imperative), not "Submit"; ${i.accentUse==='restrained'?'outlined':'filled'} per the identity.`,'Loading: keep control geometry, set aria-busy on the form region and disable double submission.'],
    table:arch.sections.some(x=>x.presentation==='table'||x.presentation==='records')||r.density==='dense'?[`Wrap in <div role="region" aria-label tabindex="0" style="overflow-x:auto"> so the table scrolls inside a named region without page overflow (${r.mobile}).`,`Rows are the ${arch.sections.filter(x=>x.presentation==='table'||x.presentation==='records').flatMap(items).map(it=>it.heading).join(', ')||'brief data items'}; <caption> states what the rows are; every <th> has scope; row header is the first cell.`,`Numbers use font-variant-numeric: ${s.numerals==='tabular'?'tabular-nums':'proportional'}; cell padding .5rem .75rem in this ${r.density} density.`,'Empty cells show an explicit dash or "No data" text; never sample data. Status cells include readable text, not color alone.',`Loading: ${c.states.loading} Empty: ${c.states.empty}`]
      :['A data table is not part of this architecture (no data-role content). If real tabular data exists, place it inside a named scroll region under its own h2 and keep the reading measure for surrounding text.','Use <caption>, scoped <th> and readable status text; do not fabricate rows.']
  };
  const stackNotes=stack==='react'?['Menu/disclosure state: useState for aria-expanded, onKeyDown Escape closes and refocuses the trigger via ref.','Import .art-director/tokens.css once at the root; do not hardcode pack colors in components.','Preserve existing routes and data fetching; this guidance changes presentation only.']
    :['Disclosures may use <details>/<summary> without JavaScript; ensure summary text names the menu.','Load .art-director/tokens.css in <head>; use the --ad-* variables.','Keep server-rendered markup and existing links intact.'];
  return {section,stack,semantics,decisions:decisions[section],stackNotes,cssVariables:['--ad-background','--ad-text','--ad-accent','--ad-on-accent','--ad-space','--ad-space-section','--ad-space-gap','--ad-font-heading','--ad-font-body','--ad-heading-weight','--ad-heading-max','--ad-body-size','--ad-line-height'],layout:r,style:s,identity:{palette:i.palette,onAccent:i.onAccent,type:i.type,provenance:i.provenance,conflicts:i.conflicts},architecture:{hero:arch.hero,order:arch.sections.map(x=>({id:x.id,title:x.title,role:x.role,presentation:x.presentation,emphasis:x.emphasis})),missing:arch.missing},mobile:r.mobile,states:c.states,verification:c.requirements,contractRevision:c.revision};
}

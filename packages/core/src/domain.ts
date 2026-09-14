import {createHash} from 'node:crypto';
import {z} from 'zod';

export const VERSION = '0.2.0';
export class DomainError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const short = z.string().min(1).max(500);
export const briefSchema = z.object({
  product: short, primaryTask: short,
  pageType: z.enum(['portfolio', 'product', 'dashboard']),
  audience: short, language: z.string().max(20).default('en'),
  content: z.array(z.object({heading: short, body: z.string().max(2000)}).strict()).min(1).max(12),
  constraints: z.array(short).max(20).default([]),
  preferences: z.object({navigation: z.enum(['top', 'rail', 'inline']).optional(),
    density: z.enum(['spacious', 'balanced', 'dense']).optional()}).strict().default({})
}).strict();
export type Brief = z.infer<typeof briefSchema>;
// Type system is optional in the pack schema so 0.1.x pack JSON still validates; built-in recipes always define it.
const typeSystemSchema = z.object({heading: z.enum(['serif','sans','condensed']), body: z.enum(['serif','sans']), headingWeight: z.number().int().min(300).max(900), numerals: z.enum(['proportional','tabular'])}).strict();
export type TypeSystem = z.infer<typeof typeSystemSchema>;
const recipeSchema = z.object({
  id: short, composition: short, grid: short, typography: short, rhythm: short,
  navigation: z.enum(['top', 'rail', 'inline']), density: z.enum(['spacious', 'balanced', 'dense']),
  mobile: short, assetStrategy: short, type: typeSystemSchema.optional()
}).strict();
export type Recipe = z.infer<typeof recipeSchema>;
export const packSchema = z.object({
  id: short, name: short, version: short, purpose: short,
  suitable: z.array(z.enum(['portfolio','product','dashboard'])).min(1), unsuitable: short,
  colors: z.object({background:z.string().regex(/^#[\da-f]{6}$/i),text:z.string().regex(/^#[\da-f]{6}$/i),accent:z.string().regex(/^#[\da-f]{6}$/i)}).strict(),
  recipes: z.array(recipeSchema).length(2), states: z.record(z.string(),short),
  motion: short, accessibility: z.array(short), license: short, source: short
}).strict();
export type Pack = z.infer<typeof packSchema>;
export const states = {
  loading:'Preserve geometry; announce busy region without trapping focus.',
  empty:'Explain why there is no content and offer a relevant next action.',
  error:'Keep entered values; associate error text and expose retry.',
  success:'Announce completion politely without moving focus.',
  focus:'Visible 2px outline with offset, never clipped.',
  disabled:'Use native disabled where applicable; explain unavailable actions.',
  menu:'Native button with aria-expanded; Escape closes and restores trigger focus.'
};
export const packs: Pack[] = [
  {id:'editorial-signal',name:'Editorial Signal',version:'1.1.0',purpose:'Readable content with an authored typographic hierarchy.',suitable:['portfolio','product'],unsuitable:'Dense operational tables should use compact working surfaces.',colors:{background:'#f5f0e7',text:'#212620',accent:'#9b3523'},recipes:[
    {id:'margin-notes',composition:'Offset title beside an index; long-form work below.',grid:'3:7 asymmetric columns',typography:'Large serif title against compact sans labels',rhythm:'Introduction → full-width feature → ruled index',navigation:'rail',density:'spacious',mobile:'Index becomes a disclosure before a single reading column.',assetStrategy:'User-owned project figure with explicit caption; otherwise labeled placeholder.',type:{heading:'serif',body:'serif',headingWeight:400,numerals:'proportional'}},
    {id:'folio',composition:'Full-width masthead followed by numbered horizontal stories.',grid:'12-column alternating 8/4 spans',typography:'Condensed sans masthead with serif reading text',rhythm:'Masthead → alternating story rows → contact',navigation:'inline',density:'balanced',mobile:'Stories stack in source order; navigation wraps.',assetStrategy:'Figures appear between stories, never replace semantic text.',type:{heading:'condensed',body:'serif',headingWeight:800,numerals:'proportional'}}],states,motion:'No entrance animation; short color transitions, respect reduced motion.',accessibility:['Keep reading measure near 65ch.','Preserve heading order and visible links.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'vivid-product',name:'Vivid Product',version:'1.1.0',purpose:'Show a real product and make the primary task clear.',suitable:['product','portfolio'],unsuitable:'Do not substitute promotional claims for operational data.',colors:{background:'#f7f8fc',text:'#162044',accent:'#5134bc'},recipes:[
    {id:'product-stage',composition:'Split explanation and product stage with a persistent top navigation.',grid:'Equal split, then full-bleed feature band',typography:'Bold sans headline with medium explanatory text',rhythm:'Split hero → product evidence → task walkthrough',navigation:'top',density:'balanced',mobile:'Explanation precedes stage; top navigation uses a labeled disclosure.',assetStrategy:'Real application screenshot or explicit product-preview placeholder, no fabricated metrics.',type:{heading:'sans',body:'sans',headingWeight:800,numerals:'proportional'}},
    {id:'guided-path',composition:'Task sequence alongside a narrow persistent action rail.',grid:'2:5:3 task columns',typography:'Compact sans headings and oversized step numbers',rhythm:'Task summary → numbered steps → detailed reference',navigation:'rail',density:'dense',mobile:'Actions follow summary, task steps become a list.',assetStrategy:'Small diagrams explain actual steps; no decorative stock montage.',type:{heading:'sans',body:'sans',headingWeight:600,numerals:'tabular'}}],states,motion:'150ms state transitions; disable nonessential movement for reduced motion.',accessibility:['Keep CTA labels task-specific.','Accent is not the only status indicator.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'quiet-precision',name:'Quiet Precision',version:'1.1.0',purpose:'Make operational state and information retrieval legible.',suitable:['dashboard','product','portfolio'],unsuitable:'Avoid using a dense table when visitors need a narrative.',colors:{background:'#f3f6f5',text:'#182f2a',accent:'#17664e'},recipes:[
    {id:'workbench',composition:'Navigation rail, task toolbar and primary data region.',grid:'Fixed 14rem rail and flexible work area',typography:'Compact sans hierarchy with tabular numbers',rhythm:'Context → toolbar → table → details',navigation:'rail',density:'dense',mobile:'Rail becomes disclosure; table scrolls within its named region.',assetStrategy:'Prioritize real data and status text; illustrations only explain empty states.',type:{heading:'sans',body:'sans',headingWeight:600,numerals:'tabular'}},
    {id:'ledger',composition:'Horizontal context bar followed by grouped semantic records.',grid:'Single working column with inset summary',typography:'Serif section labels with tabular sans data',rhythm:'Summary → grouped records → inline actions',navigation:'top',density:'balanced',mobile:'Records reflow into labeled definition lists.',assetStrategy:'Use factual records and explicit empty cells, not invented activity.',type:{heading:'serif',body:'sans',headingWeight:500,numerals:'tabular'}}],states,motion:'No automatic reordering or animated counters; respect reduced motion.',accessibility:['Status includes readable text.','Table headers are associated; keyboard order follows DOM order.'],license:'MIT',source:'Original project-authored recipes; no external assets.'}
].map(p => packSchema.parse(p));
export const directionSchema = z.object({id:short,packId:short,packVersion:short,seed:z.number().int(),brief:briefSchema,recipe:recipeSchema,rationale:short,warnings:z.array(z.string().max(2000)).max(30)}).strict();
export type Direction = z.infer<typeof directionSchema>;
export const axes = ['composition','grid','typography','rhythm','navigation','density'] as const;
export type Axis = typeof axes[number];
export function propose(brief: Brief, seed = 0): Direction[] {
  const compatible = packs.filter(p=>p.suitable.includes(brief.pageType));
  const candidates = compatible.flatMap(p=>p.recipes.map(recipe=>({p,recipe})));
  const rank = (x: typeof candidates[number]) => hash([seed,brief,x.recipe.id]);
  candidates.sort((a,b)=>rank(a).localeCompare(rank(b)));
  const selected: typeof candidates = [];
  while (selected.length < 3 && candidates.length) {
    candidates.sort((a,b)=>{
      const score=(x:typeof a)=>selected.reduce((n,y)=>n+axes.filter(k=>x.recipe[k]!==y.recipe[k]).length,0);
      return score(b)-score(a);
    });
    selected.push(candidates.shift()!);
  }
  // A restricted context may have only two compatible recipes. Keep compatibility honest.
  return selected.map(({p,recipe})=>{
    const adjusted={...recipe,...brief.preferences};
    const warnings = selected.length<3 ? ['Only two context-compatible recipes exist; expand the pack catalog to obtain a third without changing the product context.'] : [];
    if (brief.constraints.length) warnings.push('Free-text constraints are preserved for host review, not claimed as automatically solved.');
    const overridden=(Object.keys(brief.preferences) as Axis[]).filter(k=>brief.preferences[k as 'navigation'|'density']!==undefined&&recipe[k]!==adjusted[k]);
    const t=adjusted.type;
    const rationale=`${p.name}: ${recipe.composition} Maps ${brief.content.length} content section${brief.content.length===1?'':'s'} onto "${recipe.rhythm}"; navigation ${adjusted.navigation}, density ${adjusted.density}${t?`; type ${t.heading} heading / ${t.body} body`:''}. Primary task sits ${primaryTaskPlacement(adjusted)}. Mobile: ${adjusted.mobile}${overridden.length?` Structured preferences overrode ${overridden.join(', ')}.`:''}`;
    return {id:hash([VERSION,brief,seed,p.id,adjusted]).slice(0,24),packId:p.id,packVersion:p.version,seed,brief,recipe:adjusted,rationale:rationale.slice(0,500),warnings};
  });
}
function primaryTaskPlacement(r:Recipe){return r.navigation==='rail'?'in the persistent rail and the introduction':r.navigation==='top'?'in the header action and the first section':'in the masthead line, inline with navigation';}
/** Axes on which two recipes differ; used to explain how directions actually diverge. */
export function differences(a:Recipe,b:Recipe):Axis[]{return axes.filter(k=>a[k]!==b[k]);}
export const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const families={serif:`Georgia, 'Iowan Old Style', 'Times New Roman', serif`,sans:`system-ui, 'Segoe UI', Helvetica, Arial, sans-serif`,condensed:`'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', system-ui, sans-serif`};
const densities={spacious:{body:19,section:4,gap:3,line:1.65},balanced:{body:18,section:3,gap:2,line:1.6},dense:{body:15,section:1.5,gap:1,line:1.5}};
const defaultType:TypeSystem={heading:'sans',body:'sans',headingWeight:700,numerals:'proportional'};
/** Deterministic style decisions derived from a recipe; consumed by boards, tokens and blueprints. */
export function styleFor(recipe:Recipe){
  const type=recipe.type??defaultType;const d=densities[recipe.density];
  return {headingFamily:families[type.heading],bodyFamily:families[type.body],headingWeight:type.headingWeight,numerals:type.numerals,
    headingTracking:type.heading==='condensed'?'-.01em':type.heading==='serif'?'-.02em':'-.04em',headingTransform:type.heading==='condensed'?'uppercase':'none',
    bodySize:d.body,sectionSpace:d.section,gap:d.gap,lineHeight:d.line};
}
export function board(d:Direction):string {
  const p=packs.find(p=>p.id===d.packId)!; const e=escapeHtml; const r=d.recipe; const s=styleFor(r); const c=d.brief.content;
  const links=c.map(x=>`<a href="#s${c.indexOf(x)+1}">${e(x.heading)}</a>`).join('');
  // Navigation pattern follows the recipe: persistent top bar, side rail, or inline masthead links. Mobile collapses to a native disclosure.
  const nav=r.navigation==='top'?`<header class="topbar"><a class="wordmark" href="#top">${e(d.brief.product)}</a><nav aria-label="Main" class="wide">${links}</nav><details class="narrow"><summary>Menu</summary><nav aria-label="Main">${links}</nav></details><a class="cta" href="#s1">${e(d.brief.primaryTask)}</a></header>`
    :r.navigation==='rail'?`<aside class="rail"><p class="wordmark">${e(d.brief.product)}</p><nav aria-label="Sections" class="wide">${links}</nav><details class="narrow"><summary>Sections</summary><nav aria-label="Sections">${links}</nav></details><a class="cta" href="#s1">${e(d.brief.primaryTask)}</a></aside>`
    :`<nav aria-label="Main" class="inline">${links}</nav>`;
  const intro=`<header class="intro" id="top"><small>${e(p.name)} / ${e(r.id)} · ${e(d.brief.pageType)}</small><h1>${e(d.brief.product)}</h1><p class="lede">${e(d.brief.primaryTask)}</p></header>`;
  const sections=c.map((x,i)=>`<section id="s${i+1}"><small>${String(i+1).padStart(2,'0')}</small><h2>${e(x.heading)}</h2><p>${e(x.body)}</p></section>`).join('');
  // Composition-specific structure. Table/record skeletons use only brief content; empty cells are explicit, never invented data.
  const bodyHtml=r.id==='workbench'?`${nav}<main><div class="toolbar" role="toolbar" aria-label="Filters"><span class="wordmark">${e(d.brief.product)}</span>${c.map(x=>`<button type="button">${e(x.heading)}</button>`).join('')}</div><div class="region" role="region" aria-label="${e(c[0]!.heading)}" tabindex="0"><table><caption>${e(c[0]!.heading)} — ${e(c[0]!.body)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col">Action</th></tr></thead><tbody>${c.map(x=>`<tr><th scope="row">${e(x.heading)}</th><td>—</td><td>—</td><td><button type="button">Open</button></td></tr>`).join('')}</tbody></table><p class="hint">Empty cells: the brief provides no records; do not fabricate data.</p></div><aside class="details"><h2>Details</h2>${c.slice(1).map(x=>`<h3>${e(x.heading)}</h3><p>${e(x.body)}</p>`).join('')}</aside></main>`
    :r.id==='ledger'?`${nav}<main>${intro}<section class="summary" aria-label="Summary"><dl class="inset">${c.map(x=>`<div><dt>${e(x.heading)}</dt><dd>—</dd></div>`).join('')}</dl></section><section class="records"><h2>Records</h2><dl>${c.map(x=>`<div class="record"><dt>${e(x.heading)}</dt><dd>${e(x.body)}</dd><dd class="actions"><button type="button">Open</button></dd></div>`).join('')}</dl></section></main>`
    :r.id==='product-stage'?`${nav}<main><div class="stage-grid">${intro}<figure class="stage"><p>Product visual placeholder — provide a licensed real asset or screenshot.</p><figcaption>${e(r.assetStrategy)}</figcaption></figure></div><section class="band" aria-label="Product evidence"><h2>${e(c[0]!.heading)}</h2><p>${e(c[0]!.body)}</p></section><ol class="steps">${c.slice(1).map((x,i)=>`<li id="s${i+2}"><span class="num">${String(i+1).padStart(2,'0')}</span><h2>${e(x.heading)}</h2><p>${e(x.body)}</p></li>`).join('')}</ol></main>`
    :r.id==='guided-path'?`${nav}<main class="path">${intro}<ol class="steps">${c.map((x,i)=>`<li id="s${i+1}"><span class="num">${String(i+1).padStart(2,'0')}</span><h2>${e(x.heading)}</h2><p>${e(x.body)}</p></li>`).join('')}</ol><aside class="reference"><h2>Reference</h2><p>${e(d.brief.audience)}</p>${d.brief.constraints.map(x=>`<p>${e(x)}</p>`).join('')}</aside></main>`
    :r.id==='margin-notes'?`${nav}<main>${intro}<article class="notes">${sections}</article></main>`
    :`<main><header class="masthead" id="top"><small>${e(p.name)} / ${e(r.id)}</small><h1>${e(d.brief.product)}</h1>${nav}<p class="lede">${e(d.brief.primaryTask)}</p></header><div class="folio">${sections}</div></main>`;
  const css=`*{box-sizing:border-box}html{scroll-behavior:auto}body{margin:0;overflow-wrap:anywhere;background:${p.colors.background};color:${p.colors.text};font:${s.bodySize}px/${s.lineHeight} ${s.bodyFamily};${s.numerals==='tabular'?'font-variant-numeric:tabular-nums;':''}}
a{color:inherit}a:focus-visible,button:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:2px solid ${p.colors.accent};outline-offset:3px}
h1,h2,h3,.wordmark,.num{font-family:${s.headingFamily};font-weight:${s.headingWeight};letter-spacing:${s.headingTracking};text-transform:${s.headingTransform};margin:0}
h1{font-size:clamp(2.4rem,${r.id==='folio'?'9vw,8rem':'6vw,5rem'});line-height:1.02;max-width:${r.id==='folio'?'100%':'16ch'}}h2{font-size:clamp(1.3rem,2.4vw,2rem);line-height:1.15}h3{font-size:1rem}
p{margin:.5em 0;max-width:65ch}small{color:${p.colors.accent};display:block;font-family:${families.sans};text-transform:uppercase;letter-spacing:.08em;font-size:.72rem}
.lede{font-size:1.15em;max-width:48ch}.hint{font-size:.8em;opacity:.8}
nav a{margin-right:1.25rem;text-decoration:none;border-bottom:1px solid transparent}nav a:hover{border-bottom-color:currentColor}
.cta{display:inline-block;background:${p.colors.accent};color:#fff;padding:.7rem 1rem;text-decoration:none;font-weight:600}
button{font:inherit;background:none;color:inherit;border:1px solid currentColor;padding:.35em .8em;cursor:pointer}
details.narrow{display:none}details summary{cursor:pointer;padding:.5rem 0}details nav a{display:block;padding:.5rem 0;margin:0}
.topbar{display:flex;align-items:center;gap:${s.gap}rem;padding:1rem clamp(1rem,4vw,4rem);border-bottom:1px solid currentColor}.topbar .wordmark{margin-right:auto;text-decoration:none;font-size:1.1rem}
.rail{position:sticky;top:0;align-self:start;width:14rem;flex:none;padding:${s.sectionSpace}rem 1.5rem;border-right:1px solid currentColor;min-height:100vh;font-size:.9rem}.rail nav a{display:block;margin:0 0 .6rem}.rail .cta{margin-top:2rem;display:block;text-align:center}
nav.inline{display:flex;flex-wrap:wrap;gap:.5rem 0;padding:1rem 0;border-top:1px solid currentColor;border-bottom:1px solid currentColor;margin:1.5rem 0}
body:has(.rail){display:flex;align-items:stretch}main{min-width:0;flex:1;padding:clamp(1rem,4vw,4rem)}
.intro{padding-bottom:${s.sectionSpace}rem}section,.steps li,.record{border-top:1px solid currentColor;padding:${s.sectionSpace}rem 0}
.notes section{display:grid;grid-template-columns:3fr 7fr;column-gap:${s.gap}rem}.notes section small{grid-column:1;grid-row:1/3;font-size:1rem;text-transform:none;letter-spacing:0;font-family:${s.headingFamily}}.notes section h2,.notes section p{grid-column:2}
.rail .wordmark{margin-bottom:1.25rem;display:block}
.folio section:nth-child(odd){width:66%}.folio section:nth-child(even){width:66%;margin-left:34%}.masthead h1{margin-bottom:1rem}
.stage-grid{display:grid;grid-template-columns:1fr 1fr;gap:${s.gap}rem;align-items:center}.stage{margin:0;background:${p.colors.accent};color:#fff;padding:3rem 2rem;min-height:22rem;display:flex;flex-direction:column;justify-content:space-between}.stage figcaption{font-size:.8rem;opacity:.9}
.band{margin:${s.sectionSpace}rem calc(-1 * clamp(1rem,4vw,4rem)) 0;padding:${s.sectionSpace}rem clamp(1rem,4vw,4rem);background:${p.colors.text};color:${p.colors.background};border:0}.band small{color:${p.colors.background}}
.steps{list-style:none;padding:0;margin:0}.steps li{display:grid;grid-template-columns:5rem 1fr;gap:1rem}.steps .num{font-size:${r.id==='guided-path'?'3.5rem':'1.5rem'};line-height:1;color:${p.colors.accent}}.steps h2,.steps p{grid-column:2}
.path{display:grid;grid-template-columns:5fr 3fr;column-gap:${s.gap}rem}.path .intro,.path .steps{grid-column:1}.reference{grid-column:2;grid-row:1/3;border-left:1px solid currentColor;padding-left:${s.gap}rem;font-size:.9rem}
.toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.75rem 0;border-bottom:1px solid currentColor}.toolbar .wordmark{margin-right:auto}
.region{overflow-x:auto;margin-top:1rem}table{border-collapse:collapse;width:100%;min-width:36rem}caption{text-align:left;font-weight:600;padding:.5rem 0}th,td{text-align:left;padding:.5rem .75rem;border-bottom:1px solid currentColor;vertical-align:top}th{font-weight:600}
.details{border-top:1px solid currentColor;margin-top:${s.sectionSpace}rem;padding-top:1rem;font-size:.9rem}
.summary .inset{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin:0;background:${p.colors.text};color:${p.colors.background};padding:1.25rem}.summary dt{font-family:${s.headingFamily};font-size:.85rem}.summary dd{margin:0;font-size:1.5rem}
.records dl{margin:0}.record{display:grid;grid-template-columns:2fr 5fr 1fr;gap:1rem}.record dt{font-family:${s.headingFamily};font-weight:${s.headingWeight}}.record dd{margin:0}.record .actions{text-align:right}
.notice{position:fixed;bottom:0;left:0;background:${p.colors.text};color:${p.colors.background};padding:.25rem 1rem;font-size:12px;font-family:${families.sans}}
@media(max-width:700px){body:has(.rail){display:block}.rail{position:static;width:auto;min-height:0;border-right:0;border-bottom:1px solid currentColor;padding:1rem}.wide{display:none}details.narrow{display:block}.topbar{flex-wrap:wrap}.topbar .cta{order:3}.notes section,.stage-grid,.path,.record{display:block}.folio section:nth-child(odd),.folio section:nth-child(even){width:auto;margin-left:0}.reference{border-left:0;border-top:1px solid currentColor;padding:1rem 0 0}.steps li{grid-template-columns:3rem 1fr}}
@media(prefers-reduced-motion:no-preference){a,button{transition:color 120ms,background-color 120ms}}`;
  return `<!doctype html><html lang="${e(d.brief.language)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${e(d.brief.product)} — Direction board (${e(r.id)})</title><style>${css}</style>${bodyHtml}<footer class="notice">Direction board • ${e(p.name)} / ${e(r.id)} • not an implemented application or screenshot</footer></html>`;
}
const rgb=(v:string)=>[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)/255);
export function tokens(d:Direction) {
  const p=packs.find(p=>p.id===d.packId);
  if(!p) throw new DomainError('INVALID_DIRECTION','Unknown pack');
  const s=styleFor(d.recipe);
  return {
    color:Object.fromEntries(Object.entries(p.colors).map(([k,v])=>[k,{$type:'color',$value:{colorSpace:'srgb',components:rgb(v),alpha:1}}])),
    font:{heading:{$type:'fontFamily',$value:s.headingFamily.split(',').map(f=>f.trim().replace(/^'|'$/g,''))},body:{$type:'fontFamily',$value:s.bodyFamily.split(',').map(f=>f.trim().replace(/^'|'$/g,''))},headingWeight:{$type:'fontWeight',$value:s.headingWeight}},
    spacing:{unit:{$type:'dimension',$value:{value:8,unit:'px'}},section:{$type:'dimension',$value:{value:s.sectionSpace,unit:'rem'}},gap:{$type:'dimension',$value:{value:s.gap,unit:'rem'}}},
    typography:{bodySize:{$type:'dimension',$value:{value:s.bodySize,unit:'px'}},lineHeight:{$type:'number',$value:s.lineHeight},numerals:{$type:'string',$value:s.numerals}},
    semantic:{action:{$type:'color',$value:'{color.accent}'}}
  };
}
export function tokenCss(d:Direction) {const p=packs.find(p=>p.id===d.packId)!;const s=styleFor(d.recipe);return `:root {\n${Object.entries(p.colors).map(([k,v])=>`  --ad-${k}: ${v};`).join('\n')}\n  --ad-space: 8px;\n  --ad-space-section: ${s.sectionSpace}rem;\n  --ad-space-gap: ${s.gap}rem;\n  --ad-font-heading: ${s.headingFamily};\n  --ad-font-body: ${s.bodyFamily};\n  --ad-heading-weight: ${s.headingWeight};\n  --ad-body-size: ${s.bodySize}px;\n  --ad-line-height: ${s.lineHeight};\n}`;}
export function contract(d:Direction,revision:number) {
  return {schemaVersion:'1.0',id:hash([d,revision]).slice(0,24),revision,direction:d,
    contentTruths:d.brief.content,product:d.brief.product,primaryTask:d.brief.primaryTask,
    preservedConstraints:d.brief.constraints,tokens:tokens(d),layout:d.recipe,style:styleFor(d.recipe),states,
    motion:packs.find(p=>p.id===d.packId)!.motion,
    requirements:[{id:'overflow',expected:'No page-level horizontal overflow',verification:'deterministic'},
      {id:'labels',expected:'Inputs have accessible names',verification:'deterministic'},
      {id:'accessibility',expected:'No axe-core WCAG 2.x A/AA violations at desktop and mobile viewports',verification:'deterministic'},
      {id:'contrast',expected:'WCAG 2.2 text contrast; complex backgrounds require review',verification:'automated-and-human'},
      {id:'composition',expected:d.recipe.composition,verification:'human-review'},
      {id:'typography',expected:d.recipe.typography,verification:'human-review'},
      {id:'mobile',expected:d.recipe.mobile,verification:'human-review'},
      {id:'truth',expected:'No invented claims; preserve routing, SSR and semantic content',verification:'human-review'}]};
}
export type Contract = ReturnType<typeof contract>;

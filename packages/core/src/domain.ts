import {createHash} from 'node:crypto';
import {z} from 'zod';

export const VERSION = '0.1.1';
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
const recipeSchema = z.object({
  id: short, composition: short, grid: short, typography: short, rhythm: short,
  navigation: z.enum(['top', 'rail', 'inline']), density: z.enum(['spacious', 'balanced', 'dense']),
  mobile: short, assetStrategy: short
}).strict();
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
  {id:'editorial-signal',name:'Editorial Signal',version:'1.0.0',purpose:'Readable content with an authored typographic hierarchy.',suitable:['portfolio','product'],unsuitable:'Dense operational tables should use compact working surfaces.',colors:{background:'#f5f0e7',text:'#212620',accent:'#9b3523'},recipes:[
    {id:'margin-notes',composition:'Offset title beside an index; long-form work below.',grid:'3:7 asymmetric columns',typography:'Large serif title against compact sans labels',rhythm:'Introduction → full-width feature → ruled index',navigation:'rail',density:'spacious',mobile:'Index becomes a disclosure before a single reading column.',assetStrategy:'User-owned project figure with explicit caption; otherwise labeled placeholder.'},
    {id:'folio',composition:'Full-width masthead followed by numbered horizontal stories.',grid:'12-column alternating 8/4 spans',typography:'Condensed sans masthead with serif reading text',rhythm:'Masthead → alternating story rows → contact',navigation:'inline',density:'balanced',mobile:'Stories stack in source order; navigation wraps.',assetStrategy:'Figures appear between stories, never replace semantic text.'}],states,motion:'No entrance animation; short color transitions, respect reduced motion.',accessibility:['Keep reading measure near 65ch.','Preserve heading order and visible links.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'vivid-product',name:'Vivid Product',version:'1.0.0',purpose:'Show a real product and make the primary task clear.',suitable:['product','portfolio'],unsuitable:'Do not substitute promotional claims for operational data.',colors:{background:'#f7f8fc',text:'#162044',accent:'#5134bc'},recipes:[
    {id:'product-stage',composition:'Split explanation and product stage with a persistent top navigation.',grid:'Equal split, then full-bleed feature band',typography:'Bold sans headline with medium explanatory text',rhythm:'Split hero → product evidence → task walkthrough',navigation:'top',density:'balanced',mobile:'Explanation precedes stage; top navigation uses a labeled disclosure.',assetStrategy:'Real application screenshot or explicit product-preview placeholder, no fabricated metrics.'},
    {id:'guided-path',composition:'Task sequence alongside a narrow persistent action rail.',grid:'2:5:3 task columns',typography:'Compact sans headings and oversized step numbers',rhythm:'Task summary → numbered steps → detailed reference',navigation:'rail',density:'dense',mobile:'Actions follow summary, task steps become a list.',assetStrategy:'Small diagrams explain actual steps; no decorative stock montage.'}],states,motion:'150ms state transitions; disable nonessential movement for reduced motion.',accessibility:['Keep CTA labels task-specific.','Accent is not the only status indicator.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'quiet-precision',name:'Quiet Precision',version:'1.0.0',purpose:'Make operational state and information retrieval legible.',suitable:['dashboard','product','portfolio'],unsuitable:'Avoid using a dense table when visitors need a narrative.',colors:{background:'#f3f6f5',text:'#182f2a',accent:'#17664e'},recipes:[
    {id:'workbench',composition:'Navigation rail, task toolbar and primary data region.',grid:'Fixed 14rem rail and flexible work area',typography:'Compact sans hierarchy with tabular numbers',rhythm:'Context → toolbar → table → details',navigation:'rail',density:'dense',mobile:'Rail becomes disclosure; table scrolls within its named region.',assetStrategy:'Prioritize real data and status text; illustrations only explain empty states.'},
    {id:'ledger',composition:'Horizontal context bar followed by grouped semantic records.',grid:'Single working column with inset summary',typography:'Serif section labels with tabular sans data',rhythm:'Summary → grouped records → inline actions',navigation:'top',density:'balanced',mobile:'Records reflow into labeled definition lists.',assetStrategy:'Use factual records and explicit empty cells, not invented activity.'}],states,motion:'No automatic reordering or animated counters; respect reduced motion.',accessibility:['Status includes readable text.','Table headers are associated; keyboard order follows DOM order.'],license:'MIT',source:'Original project-authored recipes; no external assets.'}
].map(p => packSchema.parse(p));
export const directionSchema = z.object({id:short,packId:short,packVersion:short,seed:z.number().int(),brief:briefSchema,recipe:recipeSchema,rationale:short,warnings:z.array(z.string().max(2000)).max(30)}).strict();
export type Direction = z.infer<typeof directionSchema>;
export function propose(brief: Brief, seed = 0): Direction[] {
  const compatible = packs.filter(p=>p.suitable.includes(brief.pageType));
  const candidates = compatible.flatMap(p=>p.recipes.map(recipe=>({p,recipe})));
  const rank = (x: typeof candidates[number]) => hash([seed,brief,x.recipe.id]);
  candidates.sort((a,b)=>rank(a).localeCompare(rank(b)));
  const selected: typeof candidates = [];
  const axes = ['composition','grid','typography','rhythm','navigation','density'] as const;
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
    return {id:hash([VERSION,brief,seed,p.id,adjusted]).slice(0,24),packId:p.id,packVersion:p.version,seed,brief,recipe:adjusted,rationale:`${p.purpose} Selected for ${brief.pageType}; explicit structured preferences override recipe defaults.`,warnings};
  });
}
export const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function board(d:Direction):string {
  const p=packs.find(p=>p.id===d.packId)!; const e=escapeHtml;
  const blocks=d.brief.content.map((c,i)=>`<section><small>${String(i+1).padStart(2,'0')}</small><h2>${e(c.heading)}</h2><p>${e(c.body)}</p></section>`).join('');
  const title=`<header><small>${e(p.name)} / ${e(d.recipe.id)}</small><h1>${e(d.brief.product)}</h1><p>${e(d.brief.primaryTask)}</p></header>`;
  const body=d.recipe.id==='workbench'?`<aside>Project index</aside><main>${title}<div class="records">${blocks}</div></main>`:
    d.recipe.id==='ledger'?`<main>${title}<dl>${d.brief.content.map(c=>`<dt>${e(c.heading)}</dt><dd>${e(c.body)}</dd>`).join('')}</dl></main>`:
    d.recipe.id==='product-stage'?`<main><div class="stage">${title}<figure>Product visual placeholder — provide a licensed real asset.</figure></div>${blocks}</main>`:
    d.recipe.id==='guided-path'?`<aside>${e(d.brief.primaryTask)}</aside><main>${title}<ol>${d.brief.content.map(c=>`<li><h2>${e(c.heading)}</h2><p>${e(c.body)}</p></li>`).join('')}</ol></main>`:
    d.recipe.id==='margin-notes'?`<aside>Contents<br>${d.brief.content.map(c=>e(c.heading)).join('<br>')}</aside><main>${title}<article>${blocks}</article></main>`:
    `<main>${title}<div class="folio">${blocks}</div></main>`;
  return `<!doctype html><html lang="${e(d.brief.language)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${e(d.brief.product)} — Direction board</title><style>*{box-sizing:border-box}body{margin:0;padding:clamp(1rem,4vw,4rem);background:${p.colors.background};color:${p.colors.text};font:18px/1.6 system-ui;display:flex;gap:4rem}main{min-width:0;flex:1}aside{width:13rem;padding-top:2rem;font-size:.85rem}h1{font-size:clamp(2.5rem,7vw,6rem);line-height:1.02;letter-spacing:-.05em;max-width:14ch}h2{line-height:1.2}small{color:${p.colors.accent}}p{max-width:65ch}section,li,dt{border-top:1px solid;padding:1.5rem 0}.stage{display:grid;grid-template-columns:1fr 1fr;gap:2rem}figure{background:${p.colors.accent};color:white;padding:3rem;align-content:center}.folio section:nth-child(even){margin-left:20%}.records{font-size:.9rem}dt{font-weight:bold}header{padding-bottom:3rem}.notice{position:fixed;bottom:0;left:0;background:${p.colors.text};color:${p.colors.background};padding:.25rem 1rem;font-size:12px}@media(max-width:700px){body{display:block}aside{width:auto}.stage{display:block}.folio section:nth-child(even){margin-left:0}}</style>${body}<footer class="notice">Direction board • not an implemented application or screenshot</footer></html>`;
}
export function tokens(d:Direction) {
  const p=packs.find(p=>p.id===d.packId);
  if(!p) throw new DomainError('INVALID_DIRECTION','Unknown pack');
  return {
    color:Object.fromEntries(Object.entries(p.colors).map(([k,v])=>[k,{$type:'color',$value:{colorSpace:'srgb',components:[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)/255),alpha:1}}])),
    spacing:{unit:{$type:'dimension',$value:{value:8,unit:'px'}}},
    semantic:{action:{$type:'color',$value:'{color.accent}'}}
  };
}
export function tokenCss(d:Direction) {const p=packs.find(p=>p.id===d.packId)!;return `:root {\n${Object.entries(p.colors).map(([k,v])=>`  --ad-${k}: ${v};`).join('\n')}\n  --ad-space: 8px;\n}`;}
export function contract(d:Direction,revision:number) {
  return {schemaVersion:'1.0',id:hash([d,revision]).slice(0,24),revision,direction:d,
    contentTruths:d.brief.content,product:d.brief.product,primaryTask:d.brief.primaryTask,
    preservedConstraints:d.brief.constraints,tokens:tokens(d),layout:d.recipe,states,
    motion:packs.find(p=>p.id===d.packId)!.motion,
    requirements:[{id:'overflow',expected:'No page-level horizontal overflow',verification:'deterministic'},
      {id:'labels',expected:'Inputs have accessible names',verification:'deterministic'},
      {id:'contrast',expected:'WCAG 2.2 text contrast; complex backgrounds require review',verification:'automated-and-human'},
      {id:'composition',expected:d.recipe.composition,verification:'human-review'},
      {id:'truth',expected:'No invented claims; preserve routing, SSR and semantic content',verification:'human-review'}]};
}
export type Contract = ReturnType<typeof contract>;

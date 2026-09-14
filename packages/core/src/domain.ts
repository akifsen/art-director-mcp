import {createHash} from 'node:crypto';
import {z} from 'zod';

export const VERSION = '0.3.0';
export class DomainError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const short = z.string().min(1).max(500);
const hex = z.string().regex(/^#[\da-f]{6}$/i);
/** Page types. The first three are the 0.1/0.2 values; packs list which ones each recipe family serves. */
export const pageTypes = ['portfolio','product','dashboard','landing','company','article','docs'] as const;
export type PageType = typeof pageTypes[number];
/** Role of a content item in the page. A brief entry is content, not automatically a section. */
export const contentRoles = ['hero','offering','work','proof','process','technical','organization','data','support','contact','other'] as const;
export type ContentRole = typeof contentRoles[number];
export const priorities = ['primary','secondary','supporting'] as const;
export type Priority = typeof priorities[number];
export const headingFamilies = ['serif','sans','condensed','mono'] as const;
const contentItemSchema = z.object({
  heading: short, body: z.string().max(2000),
  role: z.enum(contentRoles).optional(), priority: z.enum(priorities).optional(),
  /** Items sharing a group render as one grouped section instead of one section each. */
  group: z.string().max(80).optional(),
  /** Whether real material (data, screenshots, named work) exists for this item. `none` blocks claims. */
  evidence: z.enum(['real','placeholder','none']).optional()
}).strict();
export type ContentItem = z.infer<typeof contentItemSchema>;
export const briefSchema = z.object({
  product: short, primaryTask: short,
  pageType: z.enum(pageTypes),
  audience: short, language: z.string().max(20).default('en'),
  /** What the organization or product does, in one sentence. Feeds the hero and the organization section. */
  purpose: short.optional(),
  secondaryTasks: z.array(short).max(6).default([]),
  content: z.array(contentItemSchema).min(1).max(12),
  constraints: z.array(short).max(20).default([]),
  /** Existing behaviors that must survive implementation (routes, toggles, SSR). Carried into the contract. */
  preserve: z.array(short).max(20).default([]),
  /** Facts about an existing brand or design system. Higher precedence than pack defaults, lower than explicit preferences. */
  brand: z.object({
    name: short.optional(),
    colors: z.object({background: hex.optional(), text: hex.optional(), accent: hex.optional()}).strict().optional(),
    fonts: z.object({heading: z.string().min(1).max(120).optional(), body: z.string().min(1).max(120).optional()}).strict().optional(),
    designSystem: short.optional()
  }).strict().default({}),
  /** Adjectives are mapped to concrete decisions where a mapping exists; unmapped words are reported, never guessed. */
  character: z.object({prefer: z.array(z.string().min(1).max(40)).max(8).default([]), avoid: z.array(z.string().min(1).max(40)).max(12).default([])}).strict().default({prefer: [], avoid: []}),
  /** Which visual material actually exists. Absent material is labeled, never fabricated. */
  assets: z.object({screenshots: z.boolean().optional(), photography: z.boolean().optional(), illustration: z.boolean().optional(), logos: z.boolean().optional()}).strict().default({}),
  /** Explicit structured decisions from the user or the host agent. Highest precedence. */
  preferences: z.object({
    navigation: z.enum(['top','rail','inline']).optional(),
    density: z.enum(['spacious','balanced','dense']).optional(),
    heading: z.enum(headingFamilies).optional(), body: z.enum(['serif','sans']).optional(),
    headingWeight: z.number().int().min(300).max(900).optional(),
    palette: z.object({background: hex, text: hex, accent: hex}).strict().optional(),
    source: z.enum(['user','host']).optional()
  }).strict().default({})
}).strict();
export type Brief = z.infer<typeof briefSchema>;
// Type system is optional in the pack schema so 0.1.x pack JSON still validates; built-in recipes always define it.
const typeSystemSchema = z.object({heading: z.enum(headingFamilies), body: z.enum(['serif','sans']), headingWeight: z.number().int().min(300).max(900), numerals: z.enum(['proportional','tabular'])}).strict();
export type TypeSystem = z.infer<typeof typeSystemSchema>;
/** Structural features a recipe relies on; matched against `character.avoid` and content roles. */
export const recipeFeatures = ['sidebar','topbar','masthead','split-hero','hero-image','feature-band','numbered-steps','alternating-rows','asymmetric-grid','index','tables','records','toolbar','summary-strip'] as const;
const recipeSchema = z.object({
  id: short, composition: short, grid: short, typography: short, rhythm: short,
  navigation: z.enum(['top','rail','inline']), density: z.enum(['spacious','balanced','dense']),
  mobile: short, assetStrategy: short, type: typeSystemSchema.optional(),
  features: z.array(z.enum(recipeFeatures)).max(8).optional(),
  /** When this recipe is the wrong choice; surfaced in every direction so the host can reject it. */
  wrongWhen: short.optional()
}).strict();
export type Recipe = z.infer<typeof recipeSchema>;
export const packSchema = z.object({
  id: short, name: short, version: short, purpose: short,
  suitable: z.array(z.enum(pageTypes)).min(1), unsuitable: short,
  colors: z.object({background: hex, text: hex, accent: hex}).strict(),
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
  {id:'editorial-signal',name:'Editorial Signal',version:'1.2.0',purpose:'Readable content with an authored typographic hierarchy.',suitable:['portfolio','product','company','article','docs'],unsuitable:'Dense operational tables should use compact working surfaces.',colors:{background:'#f5f0e7',text:'#212620',accent:'#9b3523'},recipes:[
    {id:'margin-notes',composition:'Offset title beside an index; long-form work below.',grid:'3:7 asymmetric columns',typography:'Large serif title against compact sans labels',rhythm:'Introduction → full-width feature → ruled index',navigation:'rail',density:'spacious',mobile:'Index becomes a disclosure before a single reading column.',assetStrategy:'User-owned project figure with explicit caption; otherwise labeled placeholder.',type:{heading:'serif',body:'serif',headingWeight:400,numerals:'proportional'},features:['sidebar','asymmetric-grid','index'],wrongWhen:'Visitors need to act quickly or scan many records; the reading pace is slow by design.'},
    {id:'folio',composition:'Full-width masthead followed by numbered horizontal stories.',grid:'12-column alternating 8/4 spans',typography:'Condensed sans masthead with serif reading text',rhythm:'Masthead → alternating story rows → contact',navigation:'inline',density:'balanced',mobile:'Stories stack in source order; navigation wraps.',assetStrategy:'Figures appear between stories, never replace semantic text.',type:{heading:'condensed',body:'serif',headingWeight:800,numerals:'proportional'},features:['masthead','alternating-rows'],wrongWhen:'There are more than six navigation targets or the page must show live data.'}],states,motion:'No entrance animation; short color transitions, respect reduced motion.',accessibility:['Keep reading measure near 65ch.','Preserve heading order and visible links.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'vivid-product',name:'Vivid Product',version:'1.2.0',purpose:'Show a real product and make the primary task clear.',suitable:['product','portfolio','landing','company'],unsuitable:'Do not substitute promotional claims for operational data.',colors:{background:'#f7f8fc',text:'#162044',accent:'#5134bc'},recipes:[
    {id:'product-stage',composition:'Split explanation and product stage with a persistent top navigation.',grid:'Equal split, then full-bleed feature band',typography:'Bold sans headline with medium explanatory text',rhythm:'Split hero → product evidence → task walkthrough',navigation:'top',density:'balanced',mobile:'Explanation precedes stage; top navigation uses a labeled disclosure.',assetStrategy:'Real application screenshot or explicit product-preview placeholder, no fabricated metrics.',type:{heading:'sans',body:'sans',headingWeight:800,numerals:'proportional'},features:['topbar','split-hero','hero-image','feature-band','numbered-steps'],wrongWhen:'No real product visual exists; the stage would stay a placeholder in production.'},
    {id:'guided-path',composition:'Task sequence alongside a narrow persistent action rail.',grid:'2:5:3 task columns',typography:'Compact sans headings and oversized step numbers',rhythm:'Task summary → numbered steps → detailed reference',navigation:'rail',density:'dense',mobile:'Actions follow summary, task steps become a list.',assetStrategy:'Small diagrams explain actual steps; no decorative stock montage.',type:{heading:'sans',body:'sans',headingWeight:600,numerals:'tabular'},features:['sidebar','numbered-steps'],wrongWhen:'Content is not a sequence; numbering unrelated offerings implies an order that does not exist.'}],states,motion:'150ms state transitions; disable nonessential movement for reduced motion.',accessibility:['Keep CTA labels task-specific.','Accent is not the only status indicator.'],license:'MIT',source:'Original project-authored recipes; no external assets.'},
  {id:'quiet-precision',name:'Quiet Precision',version:'1.2.0',purpose:'Make operational state and information retrieval legible.',suitable:['dashboard','product','portfolio','docs','company'],unsuitable:'Avoid using a dense table when visitors need a narrative.',colors:{background:'#f3f6f5',text:'#182f2a',accent:'#17664e'},recipes:[
    {id:'workbench',composition:'Navigation rail, task toolbar and primary data region.',grid:'Fixed 14rem rail and flexible work area',typography:'Compact sans hierarchy with tabular numbers',rhythm:'Context → toolbar → table → details',navigation:'rail',density:'dense',mobile:'Rail becomes disclosure; table scrolls within its named region.',assetStrategy:'Prioritize real data and status text; illustrations only explain empty states.',type:{heading:'sans',body:'sans',headingWeight:600,numerals:'tabular'},features:['sidebar','toolbar','tables'],wrongWhen:'The page must persuade or introduce; a workbench assumes returning users who know the domain.'},
    {id:'ledger',composition:'Horizontal context bar followed by grouped semantic records.',grid:'Single working column with inset summary',typography:'Serif section labels with tabular sans data',rhythm:'Summary → grouped records → inline actions',navigation:'top',density:'balanced',mobile:'Records reflow into labeled definition lists.',assetStrategy:'Use factual records and explicit empty cells, not invented activity.',type:{heading:'serif',body:'sans',headingWeight:500,numerals:'tabular'},features:['topbar','summary-strip','records'],wrongWhen:'Content is narrative or promotional; records need real, repeatable fields.'}],states,motion:'No automatic reordering or animated counters; respect reduced motion.',accessibility:['Status includes readable text.','Table headers are associated; keyboard order follows DOM order.'],license:'MIT',source:'Original project-authored recipes; no external assets.'}
].map(p => packSchema.parse(p));

// ---------------------------------------------------------------------------------------------
// Identity: palette and type resolved from explicit preferences, brand facts, character words and
// finally the pack. Every decision records where it came from; conflicts are reported, not hidden.
// ---------------------------------------------------------------------------------------------
export type Provenance = 'user'|'host'|'brand'|'character'|'pack'|'derived';
export type Palette = {background: string; text: string; accent: string};
export type Identity = {
  palette: Palette; onAccent: string; type: TypeSystem;
  /** Brand-supplied family names placed first in the font stacks. */
  families: {heading?: string; body?: string};
  navigation: 'top'|'rail'|'inline'; density: 'spacious'|'balanced'|'dense';
  accentUse: 'restrained'|'standard'|'expressive'; scale: 'compact'|'standard'|'large';
  provenance: Record<string,Provenance>; conflicts: string[];
  character: {applied: Record<string,string>; unmapped: string[]; avoidUnmapped: string[]};
};
const rgb=(v:string)=>[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)/255);
const luminance=(v:string)=>{const [r,g,b]=rgb(v).map(c=>c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4) as [number,number,number];return 0.2126*r+0.7152*g+0.0722*b;};
/** WCAG 2.x contrast ratio between two hex colors. */
export const contrast=(a:string,b:string)=>{const [l1,l2]=[luminance(a),luminance(b)].sort((x,y)=>y-x) as [number,number];return Math.round(((l1+0.05)/(l2+0.05))*100)/100;};
type CharacterRule={words:string[];decisions:Partial<{heading:TypeSystem['heading'];body:TypeSystem['body'];headingWeight:number;numerals:TypeSystem['numerals'];accentUse:Identity['accentUse'];scale:Identity['scale'];background:string}>};
/** Adjective lexicon. Only decisions not already fixed by preferences or brand are affected. */
export const characterLexicon:CharacterRule[]=[
  {words:['premium','luxury','refined','elegant','sophisticated'],decisions:{heading:'serif',headingWeight:400,accentUse:'restrained',scale:'large'}},
  {words:['editorial','literary','authored'],decisions:{heading:'serif',body:'serif',headingWeight:500}},
  {words:['modern','clean','minimal','minimalist'],decisions:{heading:'sans',headingWeight:600,accentUse:'restrained'}},
  {words:['bold','confident','expressive','loud','striking'],decisions:{headingWeight:800,scale:'large',accentUse:'expressive'}},
  {words:['technical','engineering','precise','systematic'],decisions:{heading:'sans',numerals:'tabular',headingWeight:600}},
  {words:['industrial','utilitarian','brutalist'],decisions:{heading:'condensed',headingWeight:800,numerals:'tabular'}},
  {words:['warm','friendly','human','approachable'],decisions:{body:'serif',headingWeight:500,background:'#f8f3ea'}},
  {words:['calm','quiet','trustworthy','serious','institutional'],decisions:{headingWeight:500,accentUse:'restrained',scale:'standard'}},
  {words:['playful','energetic','vibrant'],decisions:{headingWeight:800,accentUse:'expressive'}},
  {words:['compact','efficient','operational'],decisions:{scale:'compact',numerals:'tabular'}}
];
/** Avoid words that map to recipe features. Anything else is preserved as a human-review requirement. */
export const avoidLexicon:Record<string,typeof recipeFeatures[number][]>={
  sidebar:['sidebar'],rail:['sidebar'],hamburger:['topbar','sidebar'],'top-bar':['topbar'],topbar:['topbar'],
  'hero-image':['hero-image','split-hero'],'split-hero':['split-hero'],'big-hero':['split-hero','masthead'],masthead:['masthead'],
  'numbered-steps':['numbered-steps'],steps:['numbered-steps'],numbering:['numbered-steps'],
  tables:['tables'],table:['tables'],records:['records'],toolbar:['toolbar'],'feature-band':['feature-band'],'alternating-rows':['alternating-rows'],zigzag:['alternating-rows'],
  'summary-strip':['summary-strip'],'kpi-strip':['summary-strip']
};
const serifNames=/serif|garamond|georgia|times|baskerville|caslon|playfair|merriweather|lora|fraunces|spectral|literata|charter|tiempos|freight|minion|didot|bodoni|cormorant|crimson|libre/i;
const monoNames=/mono|code|courier|consolas|menlo|jetbrains|fira code|source code/i;
const condensedNames=/condensed|narrow|compressed|oswald|bebas|anton|barlow condensed/i;
/** Classify a brand font family name into a type-system category. Names are data, not fetched. */
export function classifyFamily(name:string):TypeSystem['heading']{return monoNames.test(name)?'mono':condensedNames.test(name)?'condensed':serifNames.test(name)&&!/sans/i.test(name)?'serif':'sans';}
export function resolveIdentity(brief:Brief,pack:Pack,recipe:Recipe):Identity {
  const prefs=brief.preferences;const explicit:Provenance=prefs.source??'user';const prov:Record<string,Provenance>={};const conflicts:string[]=[];
  const pick=<T,>(key:string,...layers:[Provenance,T|undefined][]):T=>{for(const [p,v] of layers)if(v!==undefined){prov[key]=p;return v;}throw new DomainError('INVALID_DIRECTION',`No value for ${key}`);};
  // Character words are a soft layer: applied before the pack, after preferences and brand.
  const applied:Record<string,string>={};const unmapped:string[]=[];const ch:CharacterRule['decisions']={};const characterConflicts:[string,string][]=[];
  const provKey:Record<keyof CharacterRule['decisions'],string>={heading:'type.heading',body:'type.body',headingWeight:'type.headingWeight',numerals:'type.numerals',accentUse:'accentUse',scale:'scale',background:'palette.background'};
  for(const word of brief.character.prefer){const rule=characterLexicon.find(r=>r.words.includes(word.toLowerCase()));if(!rule){unmapped.push(word);continue;}
    for(const [k,v] of Object.entries(rule.decisions) as [keyof CharacterRule['decisions'],never][]){
      if(ch[k]!==undefined&&ch[k]!==v){characterConflicts.push([provKey[k],`character words disagree on ${k} ("${applied[k]}" vs "${word}"); the pack value is kept for ${k}`]);delete ch[k];applied[k]='conflict';continue;}
      if(applied[k]==='conflict')continue;ch[k]=v;applied[k]=word;}}
  const recipeType=recipe.type??{heading:'sans',body:'sans',headingWeight:700,numerals:'proportional'} as TypeSystem;
  const brandHeading=brief.brand.fonts?.heading,brandBody=brief.brand.fonts?.body;
  const type:TypeSystem={
    heading:pick('type.heading',[explicit,prefs.heading],['brand',brandHeading?classifyFamily(brandHeading):undefined],['character',ch.heading],['pack',recipeType.heading]),
    body:pick('type.body',[explicit,prefs.body],['brand',brandBody?(classifyFamily(brandBody)==='serif'?'serif':'sans'):undefined],['character',ch.body],['pack',recipeType.body]),
    headingWeight:pick('type.headingWeight',[explicit,prefs.headingWeight],['character',ch.headingWeight],['pack',recipeType.headingWeight]),
    numerals:pick('type.numerals',['character',ch.numerals],['pack',recipeType.numerals])
  };
  const palette:Palette={
    background:pick('palette.background',[explicit,prefs.palette?.background],['brand',brief.brand.colors?.background],['character',ch.background],['pack',pack.colors.background]),
    text:pick('palette.text',[explicit,prefs.palette?.text],['brand',brief.brand.colors?.text],['pack',pack.colors.text]),
    accent:pick('palette.accent',[explicit,prefs.palette?.accent],['brand',brief.brand.colors?.accent],['pack',pack.colors.accent])
  };
  const textContrast=contrast(palette.text,palette.background);
  if(textContrast<4.5)conflicts.push(`text/background contrast is ${textContrast}:1 (below 4.5:1) with ${prov['palette.text']}/${prov['palette.background']} colors; kept as supplied — adjust brand.colors or preferences.palette, the audit will fail the contrast requirement otherwise`);
  const accentContrast=contrast(palette.accent,palette.background);
  if(accentContrast<3)conflicts.push(`accent/background contrast is ${accentContrast}:1 (below 3:1); accent-only indicators and thin rules will not be perceivable — pair the accent with text or choose a darker accent`);
  // Text on filled accent surfaces: choose the readable option instead of assuming white.
  const onAccent=[['#ffffff',contrast('#ffffff',palette.accent)],[palette.background,contrast(palette.background,palette.accent)],[palette.text,contrast(palette.text,palette.accent)]].sort((a,b)=>(b[1] as number)-(a[1] as number))[0]![0] as string;
  prov['palette.onAccent']='derived';if(contrast(onAccent,palette.accent)<4.5)conflicts.push(`no readable text color on the accent fill (best ${contrast(onAccent,palette.accent)}:1); use outlined buttons or a darker/lighter accent`);
  const navigation=pick('navigation',[explicit,prefs.navigation],['pack',recipe.navigation]);const density=pick('density',[explicit,prefs.density],['pack',recipe.density]);
  const accentUse=pick('accentUse',['character',ch.accentUse],['pack','standard' as Identity['accentUse']]);const scale=pick('scale',['character',ch.scale],['pack',(density==='dense'?'compact':'standard') as Identity['scale']]);
  // A character disagreement only matters where the character layer would have decided; brand/explicit layers make it moot.
  for(const [key,message] of characterConflicts)if(prov[key]==='pack')conflicts.push(message);
  const avoidUnmapped=brief.character.avoid.filter(w=>!avoidLexicon[w.toLowerCase()]);
  return {palette,onAccent,type,families:{heading:brandHeading,body:brandBody},navigation,density,accentUse,scale,provenance:prov,conflicts,character:{applied,unmapped,avoidUnmapped}};
}

// ---------------------------------------------------------------------------------------------
// Content architecture: brief items become roles, priorities and groups; sections are derived.
// ---------------------------------------------------------------------------------------------
export type Presentation='feature'|'prose'|'grouped-list'|'work-list'|'steps'|'table'|'records'|'aside'|'contact'|'evidence-pending';
/** `items` are indexes into brief.content so a direction does not duplicate the brief text. Resolve with sectionItems(). */
export type Section={id:string;role:ContentRole;title:string;items:number[];presentation:Presentation;emphasis:Priority;note?:string};
export const sectionItems=(content:ContentItem[],s:Section):ContentItem[]=>s.items.map(k=>content[k]!).filter(Boolean);
export type Architecture={hero:{title:string;lede:string;support?:string;source:string};sections:Section[];missing:string[];notes:string[];order:string[]};
const roleHints:[ContentRole,RegExp][]=[
  ['contact',/\b(contact|iletişim|kontakt|get in touch|reach|email|e-posta)\b/i],
  ['organization',/\b(about|team|company|studio|who we are|hakkında|ekip|history|mission)\b/i],
  ['offering',/\b(services?|offerings?|solutions?|hizmet|what we do|capabilit|products?|expertise|areas?)\b/i],
  ['work',/\b(work|projects?|portfolio|case stud|selected|references|projeler|çalışmalar|clients?)\b/i],
  ['process',/\b(process|how it works|steps?|approach|method|workflow|nasıl|süreç|adım)\b/i],
  ['technical',/\b(technical|architecture|api|stack|integration|spec|engineering|teknik|docs?|documentation)\b/i],
  ['proof',/\b(results?|metrics?|numbers?|testimonials?|customers?|trusted|outcomes?|impact|awards?|başarı|sonuç)\b/i],
  ['data',/\b(data|records?|table|inventory|orders?|incidents?|queue|status|log|kayıt|veri|tablo)\b/i],
  ['support',/\b(support|faq|help|pricing|plans?|questions|destek|fiyat)\b/i]
];
export function inferRole(item:ContentItem,brief:Brief):ContentRole{
  if(item.role)return item.role;const text=item.heading;
  for(const [role,re] of roleHints)if(re.test(text))return role;
  return brief.pageType==='dashboard'?'data':'other';
}
const roleLabels:Record<ContentRole,string>={hero:'Introduction',offering:'What we do',work:'Selected work',proof:'Evidence',process:'How it works',technical:'Technical notes',organization:'About',data:'Records',support:'Support',contact:'Contact',other:'More'};
const presentationFor=(role:ContentRole,count:number,recipe:Recipe,items:ContentItem[]):Presentation=>{
  if(role==='proof'&&items.every(i=>i.evidence==='none'||i.evidence==='placeholder'||!i.body.trim()))return 'evidence-pending';
  if(role==='contact')return 'contact';
  if(role==='data')return recipe.features?.includes('records')?'records':'table';
  if(role==='process')return 'steps';
  if(role==='work')return count>1?'work-list':'feature';
  if(role==='offering')return count>1?'grouped-list':'feature';
  if(role==='organization'||role==='technical'||role==='support')return 'prose';
  return count>1?'grouped-list':'feature';
};
/** Derive the page structure from the brief. Items are prioritized, grouped and given a presentation; nothing is invented. */
export function architecture(brief:Brief,recipe:Recipe):Architecture {
  const notes:string[]=[];const missing:string[]=[];
  const enriched=brief.content.map((item,i)=>({item,index:i,role:inferRole(item,brief)}));
  if(enriched.some(e=>!e.item.role))notes.push('Roles inferred from headings for items without an explicit role; set content[].role to correct them.');
  const heroItem=enriched.find(e=>e.role==='hero');
  const hero={title:brief.brand.name??brief.product,lede:heroItem?.item.body||brief.primaryTask,support:heroItem?brief.purpose:brief.purpose,source:heroItem?'content[role=hero]':'product + primaryTask'+(brief.purpose?' + purpose':'')};
  const rest=enriched.filter(e=>e!==heroItem);
  const withPriority=rest.map((e,i)=>({...e,priority:(e.item.priority??(e.role==='contact'||e.role==='support'?'supporting':i===0?'primary':'secondary')) as Priority}));
  if(rest.some(e=>!e.item.priority))notes.push('Priorities inferred: first item primary, contact/support supporting, others secondary; set content[].priority to change emphasis.');
  // Group by explicit group first, then merge same-role offering/work/proof items so a list of activities is one section, not N equal sections.
  const buckets=new Map<string,typeof withPriority>();
  for(const e of withPriority){const key=e.item.group?`group:${e.item.group}`:['offering','work','proof','data'].includes(e.role)?`role:${e.role}`:`item:${e.index}`;buckets.set(key,[...(buckets.get(key)??[]),e]);}
  const rank:Record<Priority,number>={primary:0,secondary:1,supporting:2};
  const sections:Section[]=[...buckets.entries()].map(([key,group])=>{
    const roleCounts=group.reduce<Record<string,number>>((m,e)=>{m[e.role]=(m[e.role]??0)+1;return m;},{});
    const role=(Object.entries(roleCounts).sort((a,b)=>b[1]-a[1])[0]![0]) as ContentRole;
    const emphasis=group.map(e=>e.priority).sort((a,b)=>rank[a]-rank[b])[0]!;
    const items=group.map(e=>e.item);const explicitGroup=key.startsWith('group:');
    const presentation=presentationFor(role,items.length,recipe,items);
    const title=explicitGroup?key.slice(6):items.length===1?items[0]!.heading:roleLabels[role];
    let note:string|undefined;
    if(!explicitGroup&&items.length>1)note=`Section title "${title}" is a role label, not brief text; replace it with the organization's own wording.`;
    if(presentation==='evidence-pending'){missing.push(`${title}: no real evidence supplied (content[].evidence is none/placeholder or body is empty); render as a labeled gap, never as claims.`);}
    for(const it of items)if(it.evidence==='none'&&role!=='proof')missing.push(`${it.heading}: material marked as missing; implement the structure with explicit empty state text.`);
    return {id:key.replace(/[^a-z0-9]+/gi,'-').toLowerCase(),role,title,items:group.map(e=>e.index),presentation,emphasis,note};
  });
  sections.sort((a,b)=>rank[a.emphasis]-rank[b.emphasis]||a.items[0]!-b.items[0]!);
  if(sections.map(s=>s.items[0]!).some((v,i,arr)=>i>0&&v<arr[i-1]!))notes.push('Section order follows priority (primary → secondary → supporting), not brief order.');
  if(buckets.size<withPriority.length)notes.push(`${withPriority.length} brief items became ${sections.length} sections: same-group and same-role offering/work/proof/data items were merged.`);
  if(!brief.assets.screenshots&&recipe.features?.includes('hero-image'))missing.push('Product stage: no screenshots declared (assets.screenshots); the stage stays an explicitly labeled placeholder until a real asset exists.');
  return {hero,sections,missing,notes,order:sections.map(s=>s.id)};
}

// ---------------------------------------------------------------------------------------------
// Candidate selection: fit to the brief first, structural diversity second.
// ---------------------------------------------------------------------------------------------
export type Fit={score:number;for:string[];against:string[];excluded?:string};
export function fit(brief:Brief,pack:Pack,recipe:Recipe):Fit {
  const f:Fit={score:0,for:[],against:[]};const features=recipe.features??[];
  if(!pack.suitable.includes(brief.pageType)){f.excluded=`${pack.name} does not serve ${brief.pageType} pages`;return f;}
  for(const word of brief.character.avoid){const hit=(avoidLexicon[word.toLowerCase()]??[]).filter(x=>features.includes(x));if(hit.length){f.excluded=`relies on ${hit.join('/')} which the brief avoids ("${word}")`;return f;}}
  const roles=brief.content.map(i=>inferRole(i,brief));const has=(r:ContentRole)=>roles.includes(r);const n=brief.content.length;
  const add=(delta:number,why:string)=>{f.score+=delta;(delta>0?f.for:f.against).push(why);};
  if(has('data')||brief.pageType==='dashboard'){if(features.includes('tables')||features.includes('records'))add(2,'has a real data surface for the data content');if(features.includes('split-hero'))add(-2,'a promotional split hero delays operational data');}
  else if(features.includes('tables')||features.includes('records'))add(-1,`a ${features.includes('tables')?'table':'records'} surface without data-role content would sit empty`);
  if(features.includes('hero-image')){if(brief.assets.screenshots)add(2,'declared screenshots fill the product stage');else add(-2,'no screenshots declared; the product stage would ship as a placeholder');}
  if(has('process')){if(features.includes('numbered-steps'))add(1,'process content reads as numbered steps');}
  else if(features.includes('numbered-steps')&&(has('offering')||has('work')))add(-1,'numbering unordered offerings/work implies a sequence');
  const offerings=roles.filter(r=>r==='offering').length;if(offerings>=2&&(features.includes('index')||features.includes('alternating-rows')||features.includes('records')))add(1,'several offerings can be presented as a grouped index instead of equal cards');
  if(n>=7){if(recipe.density!=='spacious')add(1,`${n} content items fit a ${recipe.density} rhythm`);else add(-1,`${n} content items make a spacious rhythm very long`);}
  if(n<=3&&recipe.density==='spacious')add(1,'few items leave room for a spacious rhythm');
  if(brief.pageType==='article'||brief.pageType==='docs'){if(features.includes('index')||features.includes('sidebar'))add(1,'reading pages benefit from a persistent index');if(features.includes('feature-band'))add(-1,'promotional bands interrupt reading');}
  if(brief.pageType==='landing'&&features.includes('split-hero'))add(1,'landing pages need the task visible in the first view');
  if(brief.pageType==='company'&&(has('organization')||has('offering'))&&features.includes('toolbar'))add(-2,'a working toolbar does not introduce an organization');
  if(brief.preferences.navigation&&brief.preferences.navigation!==recipe.navigation)add(-1,`recipe navigation ${recipe.navigation} will be overridden by the explicit ${brief.preferences.navigation} preference`);
  const prefer=brief.character.prefer.map(w=>w.toLowerCase());
  if(prefer.some(w=>['editorial','literary','premium','refined','elegant'].includes(w))&&pack.id==='editorial-signal')add(1,'editorial character matches the pack purpose');
  if(prefer.some(w=>['technical','operational','efficient','compact'].includes(w))&&pack.id==='quiet-precision')add(1,'operational character matches the pack purpose');
  if(prefer.some(w=>['bold','vibrant','energetic','confident'].includes(w))&&pack.id==='vivid-product')add(1,'expressive character matches the pack purpose');
  return f;
}
export const directionSchema = z.object({id:short,packId:short,packVersion:short,seed:z.number().int(),brief:briefSchema,recipe:recipeSchema,identity:z.any(),architecture:z.any(),fit:z.any(),rationale:short,rationaleDetail:z.any(),warnings:z.array(z.string().max(2000)).max(30)}).strict();
export type Direction = Omit<z.infer<typeof directionSchema>,'identity'|'architecture'|'fit'|'rationaleDetail'>&{identity:Identity;architecture:Architecture;fit:Fit;rationaleDetail:RationaleDetail};
export type RationaleDetail={fit:string[];against:string[];emphasis:string;visualDriver:string;mobile:string;wrongWhen:string;identity:string};
export const axes = ['composition','grid','typography','rhythm','navigation','density'] as const;
export type Axis = typeof axes[number];
export function propose(brief: Brief, seed = 0): Direction[] {
  const all=packs.flatMap(p=>p.recipes.map(recipe=>({p,recipe,fit:fit(brief,p,recipe)})));
  const excluded=all.filter(c=>c.fit.excluded);let candidates=all.filter(c=>!c.fit.excluded);
  const warnings:string[]=[];
  // Page-type incompatibility is hard; avoid-word exclusions are relaxed (with a warning) when they leave fewer than two recipes.
  const byAvoid=excluded.filter(c=>!c.fit.excluded!.includes('does not serve'));
  if(candidates.length<2&&byAvoid.length){warnings.push(`Only ${candidates.length} recipe(s) satisfy the avoid list; reconsidered: ${byAvoid.map(c=>`${c.recipe.id} (${c.fit.excluded})`).join('; ')}`);candidates=[...candidates,...byAvoid];}
  if(!candidates.length)throw new DomainError('INVALID_INPUT',`No recipe serves ${brief.pageType} pages`);
  const rank=(x:typeof all[number])=>hash([seed,brief,x.recipe.id]);
  const best=Math.max(...candidates.map(c=>c.fit.score));
  // Eligible = within 2 points of the best fit; diversity is maximized among these only. Lower-fit recipes fill in with a warning.
  const eligible=candidates.filter(c=>c.fit.score>=Math.max(best-2,0)).sort((a,b)=>b.fit.score-a.fit.score||rank(a).localeCompare(rank(b)));
  const rest=candidates.filter(c=>!eligible.includes(c)).sort((a,b)=>b.fit.score-a.fit.score||rank(a).localeCompare(rank(b)));
  const selected:typeof all=[];
  const pickDiverse=(pool:typeof all)=>{pool.sort((a,b)=>{const score=(x:typeof a)=>selected.reduce((n,y)=>n+axes.filter(k=>x.recipe[k]!==y.recipe[k]).length,0);return score(b)-score(a)||b.fit.score-a.fit.score||rank(a).localeCompare(rank(b));});return pool.shift()!;};
  while(selected.length<3&&eligible.length)selected.push(selected.length===0?eligible.shift()!:pickDiverse(eligible));
  while(selected.length<3&&rest.length){const c=pickDiverse(rest);selected.push(c);warnings.push(`${c.recipe.id} has a lower fit (${c.fit.score} vs best ${best}) and is included for structural variety: ${c.fit.against.join('; ')||'no specific objections'}`);}
  if(selected.length<3)warnings.push(`Only ${selected.length} context-compatible recipes exist for ${brief.pageType}${brief.character.avoid.length?' after applying the avoid list':''}; the host may request a different page type or relax avoid words.`);
  if(brief.constraints.length)warnings.push('Free-text constraints are preserved for host review, not claimed as automatically solved.');
  return selected.map(({p,recipe,fit:f})=>{
    const identity=resolveIdentity(brief,p,recipe);
    const adjusted:Recipe={...recipe,navigation:identity.navigation,density:identity.density,type:identity.type};
    const arch=architecture(brief,adjusted);
    const own=[...warnings];
    for(const c of identity.conflicts)own.push(`Identity conflict: ${c}`);
    if(identity.character.unmapped.length)own.push(`Character words without a decision mapping: ${identity.character.unmapped.join(', ')}. Translate them into preferences.* or brand.* to make them binding.`);
    if(identity.character.avoidUnmapped.length)own.push(`Avoid words kept as a human-review requirement (no structural mapping): ${identity.character.avoidUnmapped.join(', ')}.`);
    for(const m of arch.missing)own.push(`Missing material: ${m}`);
    const overridden=(['navigation','density'] as const).filter(k=>recipe[k]!==adjusted[k]);
    const primary=arch.sections.find(s=>s.emphasis==='primary');
    const detail:RationaleDetail={
      fit:f.for.length?f.for:[`compatible with ${brief.pageType} pages; no specific fit signals in the brief`],against:f.against,
      emphasis:`${arch.hero.title} leads with "${arch.hero.lede}"; ${primary?`the first full section is "${primary.title}" (${primary.presentation}, ${primary.items.length} item${primary.items.length===1?'':'s'})`:'no primary section'}; ${arch.sections.length} sections from ${brief.content.length} items`,
      visualDriver:visualDriver(adjusted,identity),
      mobile:adjusted.mobile,
      wrongWhen:recipe.wrongWhen??p.unsuitable,
      identity:`palette ${identity.provenance['palette.accent']} / heading ${identity.provenance['type.heading']} (${identity.type.heading} ${identity.type.headingWeight}) / body ${identity.provenance['type.body']} (${identity.type.body})${identity.families.heading?`; brand family ${identity.families.heading}`:''}`
    };
    const rationale=`${p.name} · ${recipe.id}: ${recipe.composition} ${detail.emphasis}. Visual driver: ${detail.visualDriver}. Identity: ${detail.identity}. Mobile: ${adjusted.mobile}${overridden.length?` Preferences overrode ${overridden.join(', ')}.`:''} Wrong when: ${detail.wrongWhen}`;
    return {id:hash([VERSION,brief,seed,p.id,adjusted]).slice(0,24),packId:p.id,packVersion:p.version,seed,brief,recipe:adjusted,identity,architecture:arch,fit:f,rationale:rationale.slice(0,500),rationaleDetail:detail,warnings:own};
  });
}
function visualDriver(r:Recipe,i:Identity){
  const type=`${i.type.heading} heading at weight ${i.type.headingWeight}${i.scale==='large'?', large scale':i.scale==='compact'?', compact scale':''}`;
  const structure=r.features?.includes('split-hero')?'the split hero with the product stage':r.features?.includes('masthead')?'the full-width masthead':r.features?.includes('asymmetric-grid')?'the 3:7 offset grid with a margin index':r.features?.includes('toolbar')?'the rail + toolbar + data region frame':r.features?.includes('summary-strip')?'the inverted summary strip above grouped records':'oversized step numbers beside a reference column';
  return `${structure}; ${type}; accent use ${i.accentUse}`;
}
/** Axes on which two recipes differ; used to explain how directions actually diverge. */
export function differences(a:Recipe,b:Recipe):Axis[]{return axes.filter(k=>a[k]!==b[k]);}
export const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const families={serif:`Georgia, 'Iowan Old Style', 'Times New Roman', serif`,sans:`system-ui, 'Segoe UI', Helvetica, Arial, sans-serif`,condensed:`'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', system-ui, sans-serif`,mono:`ui-monospace, 'Cascadia Code', Consolas, Menlo, monospace`};
const densities={spacious:{body:19,section:4,gap:3,line:1.65},balanced:{body:18,section:3,gap:2,line:1.6},dense:{body:15,section:1.5,gap:1,line:1.5}};
const defaultType:TypeSystem={heading:'sans',body:'sans',headingWeight:700,numerals:'proportional'};
const quote=(name:string)=>/^[\w-]+$/.test(name)?name:`'${name.replace(/'/g,'')}'`;
/** Deterministic style decisions derived from a recipe and (when available) a resolved identity; consumed by boards, tokens and blueprints. */
export function styleFor(recipe:Recipe,identity?:Identity){
  const type=identity?.type??recipe.type??defaultType;const d=densities[identity?.density??recipe.density];
  const scale=identity?.scale??(recipe.density==='dense'?'compact':'standard');
  const headingFamily=(identity?.families.heading?quote(identity.families.heading)+', ':'')+families[type.heading];
  const bodyFamily=(identity?.families.body?quote(identity.families.body)+', ':'')+families[type.body];
  return {headingFamily,bodyFamily,headingWeight:type.headingWeight,numerals:type.numerals,
    headingTracking:type.heading==='condensed'?'-.01em':type.heading==='serif'?'-.02em':type.heading==='mono'?'0':'-.04em',headingTransform:type.heading==='condensed'?'uppercase':'none',
    h1Max:scale==='large'?'7rem':scale==='compact'?'3.5rem':'5rem',h1Vw:scale==='large'?'8vw':scale==='compact'?'4.5vw':'6vw',
    bodySize:d.body,sectionSpace:d.section,gap:d.gap,lineHeight:d.line,accentUse:identity?.accentUse??'standard',scale};
}
export function tokens(d:Direction) {
  const p=packs.find(p=>p.id===d.packId);
  if(!p) throw new DomainError('INVALID_DIRECTION','Unknown pack');
  const i=d.identity;const s=styleFor(d.recipe,i);const src=(k:string)=>({source:i.provenance[k]});
  const color=(v:string)=>({colorSpace:'srgb',components:rgb(v),alpha:1,hex:v});
  return {
    color:{background:{$type:'color',$value:color(i.palette.background),$extensions:{'art-director':src('palette.background')}},text:{$type:'color',$value:color(i.palette.text),$extensions:{'art-director':src('palette.text')}},accent:{$type:'color',$value:color(i.palette.accent),$extensions:{'art-director':src('palette.accent')}},onAccent:{$type:'color',$value:color(i.onAccent),$extensions:{'art-director':src('palette.onAccent')}}},
    font:{heading:{$type:'fontFamily',$value:s.headingFamily.split(',').map(f=>f.trim().replace(/^'|'$/g,'')),$extensions:{'art-director':src('type.heading')}},body:{$type:'fontFamily',$value:s.bodyFamily.split(',').map(f=>f.trim().replace(/^'|'$/g,'')),$extensions:{'art-director':src('type.body')}},headingWeight:{$type:'fontWeight',$value:s.headingWeight,$extensions:{'art-director':src('type.headingWeight')}}},
    spacing:{unit:{$type:'dimension',$value:{value:8,unit:'px'}},section:{$type:'dimension',$value:{value:s.sectionSpace,unit:'rem'}},gap:{$type:'dimension',$value:{value:s.gap,unit:'rem'}}},
    typography:{bodySize:{$type:'dimension',$value:{value:s.bodySize,unit:'px'}},lineHeight:{$type:'number',$value:s.lineHeight},numerals:{$type:'string',$value:s.numerals},headingMax:{$type:'dimension',$value:{value:parseFloat(s.h1Max),unit:'rem'}},accentUse:{$type:'string',$value:s.accentUse}},
    semantic:{action:{$type:'color',$value:'{color.accent}'},onAction:{$type:'color',$value:'{color.onAccent}'}}
  };
}
export function tokenCss(d:Direction) {const i=d.identity;const s=styleFor(d.recipe,i);return `:root {\n  --ad-background: ${i.palette.background};\n  --ad-text: ${i.palette.text};\n  --ad-accent: ${i.palette.accent};\n  --ad-on-accent: ${i.onAccent};\n  --ad-space: 8px;\n  --ad-space-section: ${s.sectionSpace}rem;\n  --ad-space-gap: ${s.gap}rem;\n  --ad-font-heading: ${s.headingFamily};\n  --ad-font-body: ${s.bodyFamily};\n  --ad-heading-weight: ${s.headingWeight};\n  --ad-heading-max: ${s.h1Max};\n  --ad-body-size: ${s.bodySize}px;\n  --ad-line-height: ${s.lineHeight};\n}`;}
export function contract(d:Direction,revision:number) {
  const b=d.brief;const arch=d.architecture;
  const requirements:{id:string;expected:string;verification:'deterministic'|'automated-and-human'|'human-review'}[]=[
    {id:'overflow',expected:'No page-level horizontal overflow',verification:'deterministic'},
    {id:'labels',expected:'Inputs have accessible names',verification:'deterministic'},
    {id:'accessibility',expected:'No axe-core WCAG 2.x A/AA violations at desktop and mobile viewports',verification:'deterministic'},
    {id:'contrast',expected:'WCAG 2.2 text contrast; complex backgrounds require review',verification:'automated-and-human'},
    {id:'composition',expected:d.recipe.composition,verification:'human-review'},
    {id:'architecture',expected:`Sections in this order: ${arch.sections.map(s=>`${s.title} (${s.presentation})`).join(' → ')}; hero from ${arch.hero.source}`,verification:'human-review'},
    {id:'identity',expected:`Palette ${d.identity.palette.background}/${d.identity.palette.text}/${d.identity.palette.accent} (${d.identity.provenance['palette.accent']}); heading ${d.identity.type.heading} ${d.identity.type.headingWeight} (${d.identity.provenance['type.heading']}); body ${d.identity.type.body}`,verification:'human-review'},
    {id:'typography',expected:d.recipe.typography,verification:'human-review'},
    {id:'mobile',expected:d.recipe.mobile,verification:'human-review'},
    {id:'truth',expected:`No invented claims, metrics, logos or visuals${arch.missing.length?`; explicitly missing: ${arch.missing.length} item(s)`:''}; preserve routing, SSR and semantic content`,verification:'human-review'}
  ];
  if(b.preserve.length)requirements.push({id:'preserve',expected:`Existing behavior kept: ${b.preserve.join('; ')}`,verification:'human-review'});
  if(b.character.avoid.length)requirements.push({id:'avoid',expected:`Not used: ${b.character.avoid.join(', ')}`,verification:'human-review'});
  return {schemaVersion:'1.1',id:hash([d,revision]).slice(0,24),revision,direction:d,
    contentTruths:b.content,product:b.product,primaryTask:b.primaryTask,purpose:b.purpose,
    preservedConstraints:b.constraints,preservedBehaviors:b.preserve,
    identity:d.identity,architecture:arch,
    tokens:tokens(d),layout:d.recipe,style:styleFor(d.recipe,d.identity),states,
    motion:packs.find(p=>p.id===d.packId)!.motion,
    requirements};
}
export type Contract = ReturnType<typeof contract>;

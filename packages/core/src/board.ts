import {packs,styleFor,escapeHtml,families,sectionItems,type Direction,type Section,type ContentItem} from './domain.js';

/**
 * Direction board: an HTML design study generated from the resolved identity and the content architecture.
 * The recipe supplies the frame (navigation pattern, grid, rhythm); the architecture supplies what goes where;
 * the identity supplies palette and type. Nothing on the board is invented beyond the brief.
 */
export function board(d:Direction):string {
  const p=packs.find(p=>p.id===d.packId)!;const e=escapeHtml;const r=d.recipe;const i=d.identity;const s=styleFor(r,i);const arch=d.architecture;
  const pal=i.palette;const b=d.brief;
  const links=arch.sections.map(x=>`<a href="#${e(x.id)}">${e(x.title)}</a>`).join('');
  const cta=`<a class="cta" href="#${e(arch.sections[0]?.id??'top')}">${e(b.primaryTask)}</a>`;
  const nav=r.navigation==='top'?`<header class="topbar"><a class="wordmark" href="#top">${e(arch.hero.title)}</a><nav aria-label="Main" class="wide">${links}</nav><details class="narrow"><summary>Menu</summary><nav aria-label="Main">${links}</nav></details>${cta}</header>`
    :r.navigation==='rail'?`<aside class="rail"><p class="wordmark">${e(arch.hero.title)}</p><nav aria-label="Sections" class="wide">${links}</nav><details class="narrow"><summary>Sections</summary><nav aria-label="Sections">${links}</nav></details>${cta}</aside>`
    :`<nav aria-label="Main" class="inline">${links}</nav>`;
  const support=arch.hero.support?`<p class="support">${e(arch.hero.support)}</p>`:'';
  const intro=`<header class="intro" id="top"><small>${e(p.name)} / ${e(r.id)} · ${e(b.pageType)}</small><h1>${e(arch.hero.title)}</h1><p class="lede">${e(arch.hero.lede)}</p>${support}</header>`;
  const num=(n:number)=>String(n).padStart(2,'0');
  const evidence=(it:ContentItem)=>it.evidence==='none'?`<p class="hint">Material missing — implement the structure with an explicit empty state; do not invent content.</p>`:it.evidence==='placeholder'?`<p class="hint">Placeholder material — replace with the real asset before release.</p>`:'';
  const itemHtml=(it:ContentItem,tag:'h3'|'dt'='h3')=>`<${tag}>${e(it.heading)}</${tag}>${it.body.trim()?`<p>${e(it.body)}</p>`:'<p class="hint">No body text supplied.</p>'}${evidence(it)}`;
  const section=(x:Section,n:number):string=>{
    const head=`<small>${num(n)} · ${e(x.role)}</small><h2>${e(x.title)}</h2>`;const items=sectionItems(b.content,x);
    switch(x.presentation){
      case 'feature':case 'prose':return `<section id="${e(x.id)}" class="${x.presentation} ${x.emphasis}">${head}${items.map(it=>`${items.length>1?`<h3>${e(it.heading)}</h3>`:''}${it.body.trim()?`<p>${e(it.body)}</p>`:'<p class="hint">No body text supplied.</p>'}${evidence(it)}`).join('')}</section>`;
      case 'grouped-list':return `<section id="${e(x.id)}" class="grouped ${x.emphasis}">${head}${x.note?`<p class="hint">${e(x.note)}</p>`:''}<ul class="index">${items.map(it=>`<li>${itemHtml(it)}</li>`).join('')}</ul></section>`;
      case 'work-list':return `<section id="${e(x.id)}" class="work ${x.emphasis}">${head}${x.note?`<p class="hint">${e(x.note)}</p>`:''}<ol class="work-list">${items.map((it,k)=>`<li><span class="num">${num(k+1)}</span>${itemHtml(it)}</li>`).join('')}</ol></section>`;
      case 'steps':return `<section id="${e(x.id)}" class="process ${x.emphasis}">${head}<ol class="steps">${items.map((it,k)=>`<li><span class="num">${num(k+1)}</span>${itemHtml(it)}</li>`).join('')}</ol></section>`;
      case 'table':return `<section id="${e(x.id)}" class="data ${x.emphasis}">${head}<div class="region" role="region" aria-label="${e(x.title)}" tabindex="0"><table><caption>${e(x.title)}</caption><thead><tr><th scope="col">Item</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col">Action</th></tr></thead><tbody>${items.map(it=>`<tr><th scope="row">${e(it.heading)}</th><td>—</td><td>—</td><td><button type="button">Open</button></td></tr>`).join('')}</tbody></table><p class="hint">Empty cells: the brief provides no records; do not fabricate data.</p></div></section>`;
      case 'records':return `<section id="${e(x.id)}" class="records ${x.emphasis}">${head}<dl>${items.map(it=>`<div class="record"><dt>${e(it.heading)}</dt><dd>${it.body.trim()?e(it.body):'—'}</dd><dd class="actions"><button type="button">Open</button></dd></div>`).join('')}</dl></section>`;
      case 'evidence-pending':return `<section id="${e(x.id)}" class="pending ${x.emphasis}">${head}<p class="hint">Evidence pending: ${items.map(it=>e(it.heading)).join(', ')}. No metrics, logos or testimonials are shown until real material exists.</p></section>`;
      case 'contact':return `<footer id="${e(x.id)}" class="contact">${head}${items.map(it=>`<p>${e(it.body)||e(it.heading)}</p>`).join('')}${cta}</footer>`;
      default:return `<aside id="${e(x.id)}" class="aside">${head}${items.map(it=>itemHtml(it)).join('')}</aside>`;
    }
  };
  const main=arch.sections.filter(x=>x.presentation!=='contact');const contact=arch.sections.filter(x=>x.presentation==='contact');
  const sections=main.map((x,k)=>section(x,k+1)).join('')+contact.map((x,k)=>section(x,main.length+k+1)).join('');
  const summary=arch.sections.filter(x=>x.presentation==='table'||x.presentation==='records').flatMap(x=>sectionItems(b.content,x));
  const stage=`<figure class="stage"><p>${b.assets.screenshots?'Insert the real product screenshot here (declared in assets.screenshots).':'Product visual placeholder — no screenshots declared; provide a licensed real asset before release.'}</p><figcaption>${e(r.assetStrategy)}</figcaption></figure>`;
  const bodyHtml=r.id==='workbench'?`${nav}<main><div class="toolbar" role="toolbar" aria-label="Views"><span class="wordmark">${e(arch.hero.title)}</span><span class="lede">${e(arch.hero.lede)}</span>${main.map(x=>`<button type="button">${e(x.title)}</button>`).join('')}</div>${sections}</main>`
    :r.id==='ledger'?`${nav}<main>${intro}${summary.length?`<section class="summary" aria-label="Summary"><dl class="inset">${summary.map(it=>`<div><dt>${e(it.heading)}</dt><dd>—</dd></div>`).join('')}</dl></section>`:''}${sections}</main>`
    :r.id==='product-stage'?`${nav}<main><div class="stage-grid">${intro}${stage}</div>${sections}</main>`
    :r.id==='guided-path'?`${nav}<main class="path"><div class="column">${intro}${sections}</div><aside class="reference"><h2>Reference</h2><p>${e(b.audience)}</p>${b.secondaryTasks.map(x=>`<p>${e(x)}</p>`).join('')}${b.constraints.map(x=>`<p>${e(x)}</p>`).join('')}</aside></main>`
    :r.id==='margin-notes'?`${nav}<main>${intro}<article class="notes">${sections}</article></main>`
    :`<main><header class="masthead" id="top"><small>${e(p.name)} / ${e(r.id)}</small><h1>${e(arch.hero.title)}</h1>${nav}<p class="lede">${e(arch.hero.lede)}</p>${support}</header><div class="folio">${sections}</div></main>`;
  const restrained=s.accentUse==='restrained';const expressive=s.accentUse==='expressive';
  const css=`*{box-sizing:border-box}html{scroll-behavior:auto}body{margin:0;overflow-wrap:anywhere;background:${pal.background};color:${pal.text};font:${s.bodySize}px/${s.lineHeight} ${s.bodyFamily};${s.numerals==='tabular'?'font-variant-numeric:tabular-nums;':''}}
a{color:inherit}a:focus-visible,button:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:2px solid ${pal.accent};outline-offset:3px}
h1,h2,h3,.wordmark,.num{font-family:${s.headingFamily};font-weight:${s.headingWeight};letter-spacing:${s.headingTracking};text-transform:${s.headingTransform};margin:0}
h1{font-size:clamp(2.4rem,${r.id==='folio'?`${s.h1Vw},${s.h1Max}`:`${s.h1Vw},${s.h1Max}`});line-height:1.02;max-width:${r.id==='folio'?'100%':'16ch'}${expressive?`;color:${pal.accent}`:''}}h2{font-size:clamp(1.3rem,2.4vw,2rem);line-height:1.15}h3{font-size:1.05rem;margin-top:.25rem}
p{margin:.5em 0;max-width:65ch}small{color:${restrained?'inherit':pal.accent};opacity:${restrained?'.7':'1'};display:block;font-family:${families.sans};text-transform:uppercase;letter-spacing:.08em;font-size:.72rem}
.lede{font-size:1.15em;max-width:48ch}.support{max-width:56ch;opacity:.85}.hint{font-size:.8em;opacity:.8}
nav a{margin-right:1.25rem;text-decoration:none;border-bottom:1px solid transparent}nav a:hover{border-bottom-color:currentColor}
.cta{display:inline-block;${restrained?`background:none;color:${pal.accent};border:2px solid ${pal.accent};`:`background:${pal.accent};color:${i.onAccent};border:2px solid ${pal.accent};`}padding:.6rem 1rem;text-decoration:none;font-weight:600}
button{font:inherit;background:none;color:inherit;border:1px solid currentColor;padding:.35em .8em;cursor:pointer}
details.narrow{display:none}details summary{cursor:pointer;padding:.5rem 0}details nav a{display:block;padding:.5rem 0;margin:0}
.topbar{display:flex;align-items:center;gap:${s.gap}rem;padding:1rem clamp(1rem,4vw,4rem);border-bottom:1px solid currentColor}.topbar .wordmark{margin-right:auto;text-decoration:none;font-size:1.1rem}
.rail{position:sticky;top:0;align-self:start;width:14rem;flex:none;padding:${s.sectionSpace}rem 1.5rem;border-right:1px solid currentColor;min-height:100vh;font-size:.9rem}.rail nav a{display:block;margin:0 0 .6rem}.rail .cta{margin-top:2rem;display:block;text-align:center}
nav.inline{display:flex;flex-wrap:wrap;gap:.5rem 0;padding:1rem 0;border-top:1px solid currentColor;border-bottom:1px solid currentColor;margin:1.5rem 0}
body:has(.rail){display:flex;align-items:stretch}main{min-width:0;flex:1;padding:clamp(1rem,4vw,4rem)}
.intro{padding-bottom:${s.sectionSpace}rem}section,.contact,.aside{border-top:1px solid currentColor;padding:${s.sectionSpace}rem 0}
section.supporting,.aside{font-size:.9em;padding:${s.sectionSpace/2}rem 0}section.primary h2{font-size:clamp(1.6rem,3.2vw,2.6rem)}
.index{list-style:none;margin:1rem 0 0;padding:0}.index li{display:grid;grid-template-columns:minmax(10rem,1fr) 2fr;gap:${s.gap/2}rem ${s.gap}rem;padding:1rem 0;border-top:1px solid currentColor}.index li:first-child{border-top:0}.index h3{grid-column:1}.index p{grid-column:2;margin:0}
.rail .wordmark{margin-bottom:1.25rem;display:block}
.notes section{display:grid;grid-template-columns:3fr 7fr;column-gap:${s.gap}rem}.notes section small{grid-column:1;grid-row:1/4;font-size:1rem;text-transform:none;letter-spacing:0;font-family:${s.headingFamily}}.notes section>*:not(small){grid-column:2}
.folio section:nth-child(odd){width:66%}.folio section:nth-child(even){width:66%;margin-left:34%}.masthead h1{margin-bottom:1rem}
.stage-grid{display:grid;grid-template-columns:1fr 1fr;gap:${s.gap}rem;align-items:center}.stage{margin:0;background:${pal.accent};color:${i.onAccent};padding:3rem 2rem;min-height:22rem;display:flex;flex-direction:column;justify-content:space-between}.stage figcaption{font-size:.8rem;opacity:.9}
.stage-grid + section.primary{margin:${s.sectionSpace}rem calc(-1 * clamp(1rem,4vw,4rem)) 0;padding:${s.sectionSpace}rem clamp(1rem,4vw,4rem);background:${pal.text};color:${pal.background};border:0}.stage-grid + section.primary small{color:${pal.background}}
.steps,.work-list{list-style:none;padding:0;margin:1rem 0 0}.steps li,.work-list li{display:grid;grid-template-columns:5rem 1fr;gap:0 1rem;padding:1rem 0;border-top:1px solid currentColor}.steps .num,.work-list .num{font-size:${r.id==='guided-path'?'3.5rem':'1.5rem'};line-height:1;color:${restrained?'inherit':pal.accent};grid-row:1/4}.steps h3,.steps p,.work-list h3,.work-list p{grid-column:2}
.path{display:grid;grid-template-columns:5fr 3fr;column-gap:${s.gap}rem}.reference{border-left:1px solid currentColor;padding-left:${s.gap}rem;font-size:.9rem}
.toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.75rem 0;border-bottom:1px solid currentColor}.toolbar .wordmark{margin-right:1rem}.toolbar .lede{font-size:.9em;margin:0 auto 0 0;opacity:.8}
.region{overflow-x:auto;margin-top:1rem}table{border-collapse:collapse;width:100%;min-width:36rem}caption{text-align:left;font-weight:600;padding:.5rem 0}th,td{text-align:left;padding:.5rem .75rem;border-bottom:1px solid currentColor;vertical-align:top}th{font-weight:600}
.summary .inset{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin:0;background:${pal.text};color:${pal.background};padding:1.25rem}.summary dt{font-family:${s.headingFamily};font-size:.85rem}.summary dd{margin:0;font-size:1.5rem}
.records dl{margin:1rem 0 0}.record{display:grid;grid-template-columns:2fr 5fr 1fr;gap:1rem;padding:.75rem 0;border-top:1px solid currentColor}.record dt{font-family:${s.headingFamily};font-weight:${s.headingWeight}}.record dd{margin:0}.record .actions{text-align:right}
.contact{margin-top:${s.sectionSpace}rem}.contact .cta{margin-top:1rem}
.notice{position:fixed;bottom:0;left:0;background:${pal.text};color:${pal.background};padding:.25rem 1rem;font-size:12px;font-family:${families.sans}}
@media(max-width:700px){body:has(.rail){display:block}.rail{position:static;width:auto;min-height:0;border-right:0;border-bottom:1px solid currentColor;padding:1rem}.wide{display:none}details.narrow{display:block}.topbar{flex-wrap:wrap}.topbar .cta{order:3}.notes section,.stage-grid,.path,.record,.index li{display:block}.folio section:nth-child(odd),.folio section:nth-child(even){width:auto;margin-left:0}.reference{border-left:0;border-top:1px solid currentColor;padding:1rem 0 0}.steps li,.work-list li{grid-template-columns:3rem 1fr}}
@media(prefers-reduced-motion:no-preference){a,button{transition:color 120ms,background-color 120ms}}`;
  return `<!doctype html><html lang="${e(b.language)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${e(arch.hero.title)} — Direction board (${e(r.id)})</title><style>${css}</style>${bodyHtml}<footer class="notice">Direction board • ${e(p.name)} / ${e(r.id)} • not an implemented application or screenshot</footer></html>`;
}

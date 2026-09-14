import {chromium,type Browser} from 'playwright';
import {AxeBuilder} from '@axe-core/playwright';
import {z} from 'zod';

export const WORKER_VERSION='0.2.0';
/** 0.1.0 requests (no budget) are still accepted so an older CLI keeps working with this worker. */
const request=z.object({version:z.enum(['0.1.0','0.2.0']),url:z.string().url().max(2000),origins:z.array(z.string().max(200)).max(10),masks:z.array(z.string().max(200)).max(20),budgetMs:z.number().int().min(5000).max(120000).default(40000)}).strict();
export function allowed(url:string,origins:string[]):boolean {
  try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)&&['127.0.0.1','[::1]'].includes(u.hostname)&&!u.username&&!u.password&&origins.includes(u.origin);}catch{return false;}
}
class StageTimeout extends Error{constructor(public stage:string,ms:number){super(`Stage ${stage} exceeded ${ms} ms`);}}
/** Run a stage against the remaining budget; the timeout names the stage so a slow step is diagnosable. */
async function stage<T>(name:string,timings:Record<string,number>,remaining:()=>number,work:()=>Promise<T>):Promise<T>{
  const ms=Math.max(1000,Math.min(remaining(),name==='launch'?20000:name==='navigate'?15000:10000));
  const started=Date.now();let timer:NodeJS.Timeout|undefined;
  try{return await Promise.race([work(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new StageTimeout(name,ms)),ms);})]);}
  finally{clearTimeout(timer);timings[name]=(timings[name]??0)+Date.now()-started;}
}
export async function audit(input:unknown) {
  const a=request.parse(input);
  if(!allowed(a.url,a.origins))throw new Error('ORIGIN_NOT_ALLOWED');
  const startedAt=Date.now();const deadline=startedAt+a.budgetMs;const remaining=()=>deadline-Date.now();
  const totals:Record<string,number>={};
  let browser:Browser|undefined;
  const close=()=>{void browser?.close();};process.once('SIGTERM',close);process.once('disconnect',close);
  const runs:Record<string,unknown>[]=[];let timedOut:string|null=null;
  try{
    browser=await stage('launch',totals,remaining,()=>chromium.launch({headless:true}));
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      const timings:Record<string,number>={};
      const measured={axe:false,overflow:false,focus:false,elementsChecked:null as number|null,contrastNodes:null as number|null,timedOut:null as string|null};
      const findings:Record<string,unknown>[]=[];let observed:Record<string,unknown>|undefined;let focus:unknown;let incomplete:{id:string;reason:string}[]=[];let screenshot:string|undefined;
      const blocked=new Set<string>();
      if(remaining()<4000){measured.timedOut='budget';timedOut=timedOut??`viewport ${viewport.width}: budget exhausted before start`;runs.push({viewport,findings,incomplete,measured,stages:timings,blockedOrigins:[]});continue;}
      const context=await browser.newContext({viewport,serviceWorkers:'block',acceptDownloads:false,reducedMotion:'reduce'});
      try{
        await context.route('**/*',async route=>{
          try{
            if(allowed(route.request().url(),a.origins)){
              const response=await route.fetch({maxRedirects:0,timeout:10000});
              const location=response.headers()['location'];
              if(location&&!allowed(new URL(location,route.request().url()).href,a.origins)){
                blocked.add(new URL(location,route.request().url()).origin);await route.abort();
              }else await route.fulfill({response});
            }
            else{blocked.add(new URL(route.request().url()).origin);await route.abort();}
          }catch{/* The context was disposed by a stage timeout while this request was in flight; nothing to deliver. */}
        });
        await context.routeWebSocket(/.*/,socket=>socket.close());
        const page=await context.newPage();page.setDefaultTimeout(10000);
        await stage('navigate',timings,remaining,()=>page.goto(a.url,{waitUntil:'domcontentloaded',timeout:15000}));
        await stage('fonts',timings,remaining,()=>page.evaluate(()=>document.fonts.ready).catch(()=>undefined));
        observed=await stage('measure',timings,remaining,()=>page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,elements:document.querySelectorAll('*').length,textNodes:document.body?document.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td,th,dt,dd,a,button,label,span,small,caption').length:0})));
        measured.overflow=true;
        if(observed.overflow)findings.push({id:`${viewport.width}-overflow`,category:'layout',severity:'serious',confidence:'high',ruleId:'overflow',ruleVersion:'1',evaluationType:'deterministic',contractRequirementId:'overflow',evidenceRefs:[['html']],observed:`scrollWidth ${observed.scrollWidth} exceeds viewport ${observed.width}`,expected:'No page horizontal overflow',suggestedFix:'Constrain wide content or use an internal named scroll region.',verificationMethod:'Live DOM dimensions'});
        const axe=await stage('axe',timings,remaining,()=>new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze());
        measured.axe=true;
        // Coverage: how many elements axe actually evaluated, and how many text nodes the contrast rule could decide.
        measured.elementsChecked=new Set([...axe.passes,...axe.violations,...axe.incomplete].flatMap(r=>r.nodes.map(n=>n.target.join(' ')))).size;
        const contrastPass=axe.passes.find(r=>r.id==='color-contrast')?.nodes.length??0;const contrastFail=axe.violations.find(r=>r.id==='color-contrast')?.nodes.length??0;
        measured.contrastNodes=contrastPass+contrastFail;
        incomplete=axe.incomplete.map(v=>({id:v.id,reason:'needs-review',nodes:v.nodes.length} as {id:string;reason:string}));
        findings.push(...axe.violations.slice(0,50).map(v=>({id:`${viewport.width}-${v.id}`,category:'accessibility',severity:v.impact,confidence:'high',ruleId:v.id,ruleVersion:axe.testEngine.version,evaluationType:'deterministic',evidenceRefs:v.nodes.slice(0,5).map(n=>n.target),observed:v.description,expected:v.help,suggestedFix:v.help,verificationMethod:'axe-core in live Chromium',nodes:v.nodes.length})));
        await stage('focus',timings,remaining,async()=>{await page.keyboard.press('Tab');focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,outline:document.activeElement?getComputedStyle(document.activeElement).outlineStyle:null}));});
        measured.focus=true;
        screenshot=await stage('screenshot',timings,remaining,async()=>(await page.screenshot({type:'png',animations:'disabled',mask:a.masks.map(s=>page.locator(s))})).toString('base64'));
      }catch(e){
        if(e instanceof StageTimeout){measured.timedOut=e.stage;timedOut=timedOut??`viewport ${viewport.width}: ${e.message}`;}
        else throw e;
      }finally{await context.close().catch(()=>undefined);}
      runs.push({viewport,observed,focus,findings,incomplete,blockedOrigins:[...blocked],screenshot,measured,stages:timings});
    }
    return {version:WORKER_VERSION,status:timedOut?'partial':'complete',timedOut,capturedAt:new Date().toISOString(),url:a.url,budgetMs:a.budgetMs,elapsedMs:Date.now()-startedAt,stages:totals,runs,visualReview:'not-performed',limitations:['One Tab observation is not a complete keyboard audit.','Menu and application state coverage requires host verification.','Automated checks do not establish WCAG conformance.','Coverage counts (elementsChecked, contrastNodes) describe what axe evaluated in the initial state only.']};
  }finally{process.removeListener('SIGTERM',close);process.removeListener('disconnect',close);await browser?.close().catch(()=>undefined);}
}
if(process.send){
  process.once('message',async input=>{try{process.send?.({ok:true,result:await audit(input)});}catch(e){process.send?.({ok:false,error:(e as Error).message});}finally{process.disconnect?.();}});
}

import {chromium} from 'playwright';
import {AxeBuilder} from '@axe-core/playwright';
import {z} from 'zod';

const request=z.object({version:z.literal('0.1.0'),url:z.string().url().max(2000),origins:z.array(z.string().max(200)).max(10),masks:z.array(z.string().max(200)).max(20)}).strict();
export function allowed(url:string,origins:string[]):boolean {
  try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)&&['127.0.0.1','[::1]'].includes(u.hostname)&&!u.username&&!u.password&&origins.includes(u.origin);}catch{return false;}
}
export async function audit(input:unknown) {
  const a=request.parse(input);
  if(!allowed(a.url,a.origins))throw new Error('ORIGIN_NOT_ALLOWED');
  const browser=await chromium.launch({headless:true});
  const close=()=>{void browser.close();};process.once('SIGTERM',close);process.once('disconnect',close);
  try{
    const runs=[];
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      const context=await browser.newContext({viewport,serviceWorkers:'block',acceptDownloads:false,reducedMotion:'reduce'});
      const blocked=new Set<string>();
      await context.route('**/*',async route=>{
        if(allowed(route.request().url(),a.origins)){
          const response=await route.fetch({maxRedirects:0,timeout:10000});
          const location=response.headers()['location'];
          if(location&&!allowed(new URL(location,route.request().url()).href,a.origins)){
            blocked.add(new URL(location,route.request().url()).origin);await route.abort();
          }else await route.fulfill({response});
        }
        else{blocked.add(new URL(route.request().url()).origin);await route.abort();}
      });
      await context.routeWebSocket(/.*/,socket=>socket.close());
      const page=await context.newPage();page.setDefaultTimeout(10000);
      await page.goto(a.url,{waitUntil:'domcontentloaded',timeout:15000});
      await page.evaluate(()=>document.fonts.ready);
      const observed=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title}));
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,outline:document.activeElement?getComputedStyle(document.activeElement).outlineStyle:null}));
      const screenshot=(await page.screenshot({type:'png',animations:'disabled',mask:a.masks.map(s=>page.locator(s))})).toString('base64');
      const findings=axe.violations.slice(0,50).map(v=>({id:`${viewport.width}-${v.id}`,category:'accessibility',severity:v.impact,confidence:'high',ruleId:v.id,ruleVersion:axe.testEngine.version,evaluationType:'deterministic',contractRequirementId:v.id==='color-contrast'?'contrast':'labels',evidenceRefs:v.nodes.slice(0,5).map(n=>n.target),observed:v.description,expected:v.help,suggestedFix:v.help,verificationMethod:'axe-core in live Chromium'}));
      if(observed.overflow)findings.push({id:`${viewport.width}-overflow`,category:'layout',severity:'serious',confidence:'high',ruleId:'overflow',ruleVersion:'1',evaluationType:'deterministic',contractRequirementId:'overflow',evidenceRefs:[['html']],observed:`scrollWidth ${observed.scrollWidth} exceeds viewport ${observed.width}`,expected:'No page horizontal overflow',suggestedFix:'Constrain wide content or use an internal named scroll region.',verificationMethod:'Live DOM dimensions'});
      runs.push({viewport,observed,focus,findings,incomplete:axe.incomplete.map(v=>({id:v.id,reason:'needs-review'})),blockedOrigins:[...blocked],screenshot});
      await context.close();
    }
    return {version:'0.1.0',capturedAt:new Date().toISOString(),url:a.url,runs,visualReview:'not-performed',limitations:['One Tab observation is not a complete keyboard audit.','Menu and application state coverage requires host verification.','Automated checks do not establish WCAG conformance.']};
  }finally{process.removeListener('SIGTERM',close);process.removeListener('disconnect',close);await browser.close();}
}
if(process.send){
  process.once('message',async input=>{try{process.send?.({ok:true,result:await audit(input)});}catch(e){process.send?.({ok:false,error:(e as Error).message});}finally{process.disconnect?.();}});
}


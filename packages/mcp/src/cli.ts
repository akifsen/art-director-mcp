import {McpServer, type ServerContext} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {z} from 'zod';
import {parseArgs} from 'node:util';
import {fork,spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {install} from './install.js';
import {clients,skippedClients,supportedClientNames} from './clients.js';
import {configuredLaunch,probe} from './probe.js';
import {Workspace,Service,toolSchemas,blueprintSections,DomainError,VERSION,packSchema,type ToolName,type BrowserRunner} from '../../core/src/index.js';

const require=createRequire(import.meta.url);
const {values,positionals}=parseArgs({allowPositionals:true,options:{project:{type:'string'},brief:{type:'string'},direction:{type:'string'},'direction-id':{type:'string'},seed:{type:'string'},'expected-revision':{type:'string'},url:{type:'string'},'contract-id':{type:'string'},section:{type:'string'},stack:{type:'string'},cursor:{type:'string'},limit:{type:'string'},'allow-origin':{type:'string',multiple:true},'audit-budget':{type:'string'},client:{type:'string'},apply:{type:'boolean'},local:{type:'boolean'},help:{type:'boolean'},version:{type:'boolean'},'with-rules':{type:'boolean'}}});
if(values.version){process.stdout.write(VERSION+'\n');process.exit(0);}
/** Supported Node range. Dependencies require >=20; the suite is run on 22 and 24 in CI, 26 is allowed for early adopters. */
export const NODE_RANGE={min:22,maxExclusive:27};
const nodeMajor=Number(process.versions.node.split('.')[0]);
if(nodeMajor<NODE_RANGE.min||nodeMajor>=NODE_RANGE.maxExclusive)process.stderr.write(JSON.stringify({code:'UNSUPPORTED_NODE',message:`Node ${process.version} is outside the supported range >=${NODE_RANGE.min} <${NODE_RANGE.maxExclusive}. The server will start, but behavior is untested here; install Node 24 LTS (or 22) and, for IDE clients, make sure the IDE inherits that Node on PATH.`})+'\n');
const ws=await Workspace.open(path.resolve(values.project??process.cwd())).catch(e=>{
  process.stderr.write(JSON.stringify({code:e instanceof DomainError?e.code:'PROJECT_NOT_FOUND',message:`Project root ${path.resolve(values.project??process.cwd())} is not usable: ${(e as Error).message}. Pass --project <absolute existing directory>.`})+'\n');process.exit(1);});
let worker:string|undefined;try{worker=require.resolve('@akifsen/art-director-browser');}catch{
  try{worker=createRequire(path.join(ws.root,'package.json')).resolve('@akifsen/art-director-browser');}catch{/* Explicit optional install. */}
}
const workerVersion=(()=>{if(!worker)return undefined;try{return (JSON.parse(readFileSync(path.join(path.dirname(worker),'..','package.json'),'utf8')) as {version:string}).version;}catch{return 'unknown';}})();
const workerHasBudget=Boolean(workerVersion&&/^\d+\.\d+/.test(workerVersion)&&Number(workerVersion.split('.')[0])*100+Number(workerVersion.split('.')[1])>=2);
/** Total browser budget handed to the worker; the CLI waits budget + 15 s of grace for launch/IPC before declaring a hard timeout. */
const auditBudgetMs=Math.min(120000,Math.max(5000,Number(values['audit-budget']??40000)||40000));
let running=false;
const runner:BrowserRunner=async(url,origins,masks,signal)=>{
  if(running)throw new DomainError('AUDIT_BUSY','One browser audit at a time per server');running=true;
  try{return await new Promise((resolve,reject)=>{
    const child=fork(worker!,[],{stdio:['ignore','ignore','pipe','ipc']});
    // Drain stderr so a chatty worker cannot block on a full pipe; keep the tail for crash diagnostics.
    let stderrTail='';child.stderr?.on('data',(chunk:Buffer)=>{stderrTail=(stderrTail+chunk.toString()).slice(-1000);});
    const done=(error?:Error,result?:unknown)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);child.kill();if(error&&error instanceof DomainError&&error.code==='BROWSER_CRASH'&&stderrTail)error.message+=` — worker stderr: ${stderrTail.trim()}`;error?reject(error):resolve(result);};
    const abort=()=>done(new DomainError('AUDIT_CANCELLED','Audit cancelled'));
    const hard=auditBudgetMs+15000;
    const timer=setTimeout(()=>done(new DomainError('AUDIT_TIMEOUT',`Browser worker did not answer within ${hard} ms (budget ${auditBudgetMs} ms + 15 s grace). ${workerHasBudget?'The worker normally returns partial results per stage before this point, so the browser itself failed to launch or the IPC channel stalled.':'Worker '+workerVersion+' has no stage budget; upgrade @akifsen/art-director-browser to 0.2.0 for per-stage timeouts and partial results.'} Check: art-director doctor`)),hard);
    signal?.addEventListener('abort',abort,{once:true});
    child.on('error',e=>done(e));child.on('exit',code=>{if(code)done(new DomainError('BROWSER_CRASH','Browser worker exited'));});
    child.once('message',(m:{ok:boolean;result:unknown;error:string})=>done(m.ok?undefined:new DomainError(m.error.includes('Executable')?'BROWSER_NOT_INSTALLED':m.error==='ORIGIN_NOT_ALLOWED'?'ORIGIN_NOT_ALLOWED':'AUDIT_FAILED',m.error.slice(0,1000)),m.result));
    child.send(workerHasBudget?{version:'0.2.0',url,origins,masks,budgetMs:auditBudgetMs}:{version:'0.1.0',url,origins,masks});
  });}finally{running=false;}
};
const service=new Service(ws,worker?runner:undefined,values['allow-origin']??[]);
const print=(data:unknown)=>process.stdout.write(JSON.stringify(data,null,2)+'\n');
const num=(v:string|undefined,fallback:number)=>v===undefined?fallback:Number(v);
try{
  const cmd=positionals[0]??'doctor';
  if(values.help){print({usage:'art-director <command> [--project absolute-path]',commands:{
    'init --client <assistant|all> [--apply] [--with-rules] [--local]':'Write the project MCP configuration for an assistant',
    'clients':'List adapters and assistants configured outside the project',
    'serve [--allow-origin URL]...':'Run the MCP server over stdio',
    'doctor [--client <assistant>]':'Environment report; with --client, launch the configured command and run initialize + tools/list over stdio',
    'inspect':'inspect_project',
    'directions --brief brief.json [--seed N]':'propose_directions; writes .art-director/previews/*.html',
    'contract (--direction direction.json | --direction-id ID --brief brief.json [--seed N]) [--expected-revision N]':'compile_design_contract',
    [`blueprint --contract-id ID --section <${blueprintSections.join('|')}> [--stack react|html]`]:'get_blueprint',
    'artifact <artifactId> [--cursor N] [--limit N]':'get_artifact',
    'audit --contract-id ID --url URL [--audit-budget MS]':'audit_ui (requires --allow-origin for the URL origin)',
    'browser install':'Fetch headless Chromium for the optional worker',
    'pack validate <file.json>':'Validate an external design pack'
  },clients:supportedClientNames,skippedClients,flags:['--help','--version','--project','--allow-origin (repeatable)','--audit-budget (ms, default 40000)'],version:VERSION});}
  else if(cmd==='serve'){
    const server=new McpServer({name:'art-director',version:VERSION});
    const descriptions:Record<ToolName,string>={
      inspect_project:'Inventory the authorized project: stack, files, existing CSS custom properties and assets. Call first so brand facts and constraints come from the codebase.',
      propose_directions:'Turn a structured brief (purpose, audience, content items with roles/priorities, brand facts, character words, assets, explicit preferences) into up to three context-fit directions with HTML boards, a derived content architecture and a resolved identity whose every decision names its source.',
      compile_design_contract:'Freeze a generated direction into a versioned contract (tokens, architecture, identity, requirements) with optimistic revision checking.',
      get_blueprint:'Implementation guidance for one part of the page (page, hero, navigation, content, form, table) derived from the contract architecture and identity.',
      audit_ui:'Measure a running allowed URL in headless Chromium (overflow, axe WCAG, focus) with per-stage budgets and coverage counts; optionally store a structured host review. Never produces an aesthetic score.',
      get_artifact:'Read a bounded page of a project artifact by identifier.'
    };
    for(const name of Object.keys(toolSchemas) as ToolName[]){
      server.registerTool(name,{description:descriptions[name],inputSchema:toolSchemas[name],outputSchema:z.object({schemaVersion:z.string()}).passthrough(),annotations:{readOnlyHint:name==='get_artifact',destructiveHint:false,idempotentHint:name==='get_artifact'||name==='get_blueprint',openWorldHint:name==='audit_ui'}},async(input:unknown,extra:ServerContext)=>{
        try{const data=await service.call(name,input,extra.mcpReq.signal);return {content:[{type:'text' as const,text:JSON.stringify(data)}],structuredContent:data};}
        catch(e){const error=e as Error;return {isError:true,content:[{type:'text' as const,text:JSON.stringify({status:'blocked',code:e instanceof DomainError?e.code:'INVALID_INPUT',message:error.message.slice(0,1500)})}]};}
      });
    }
    await server.connect(new StdioServerTransport());
    process.once('SIGTERM',()=>{void server.close();});
  }else if(cmd==='clients')print({supported:clients,aliases:{vscode:'copilot'},skipped:skippedClients,all:'Installs every project-scoped adapter; assistants configured through user-level settings are listed under skipped.'});
  else if(cmd==='doctor'){
    const hints:string[]=[];
    if(nodeMajor<NODE_RANGE.min||nodeMajor>=NODE_RANGE.maxExclusive)hints.push(`Node ${process.version} is outside the supported range >=${NODE_RANGE.min} <${NODE_RANGE.maxExclusive}; install Node 24 LTS.`);
    let browserBinary:{browsersDirectory:string;revision:string;installed:boolean}|null=null;
    if(worker){
      try{const pw=createRequire(worker)('playwright') as {chromium:{executablePath():string}};const executable=pw.chromium.executablePath();
        // `browser install` fetches the headless shell (chromium_headless_shell-<rev>), which executablePath() does not point at; accept either install marker.
        let dir=path.dirname(executable);while(!/^chromium-\d+$/.test(path.basename(dir))&&path.dirname(dir)!==dir)dir=path.dirname(dir);
        const revision=path.basename(dir).replace('chromium-','');const browsersDirectory=path.dirname(dir);
        const installed=[`chromium-${revision}`,`chromium_headless_shell-${revision}`].some(name=>existsSync(path.join(browsersDirectory,name,'INSTALLATION_COMPLETE')));
        browserBinary={browsersDirectory,revision,installed};
        if(!installed)hints.push(`Browser worker is installed but Chromium revision ${revision} is missing in ${browsersDirectory}; run: art-director browser install`);}
      catch(e){hints.push(`Browser worker found but Playwright could not be loaded: ${(e as Error).message.slice(0,200)}`);}
      if(!workerHasBudget)hints.push(`Browser worker ${workerVersion} predates stage budgets; upgrade to @akifsen/art-director-browser@0.2.0 for per-stage timeouts, coverage counts and partial results.`);
    }else hints.push('Optional browser worker not installed; audit_ui reports BROWSER_NOT_INSTALLED. Install with: npm install --save-dev @akifsen/art-director-browser');
    if(!(values['allow-origin']??[]).length)hints.push('No --allow-origin configured; audit_ui with a URL will be refused until the server is started with --allow-origin http://127.0.0.1:PORT');
    let client:unknown;
    if(values.client){
      const name=values.client;
      if(Object.hasOwn(skippedClients,name))client={client:name,status:'skipped',reason:skippedClients[name]};
      else{
        try{const {file,launch}=await configuredLaunch(ws.root,name);const p=await probe(launch);client={client:name,configFile:file,launch,...p};
          if(!p.ok)hints.push(`The ${name} configuration launches but the MCP handshake failed at ${p.stage}: ${p.error}. A written config file is not a working integration.`);
          else hints.push(`The ${name} configuration in ${file} starts the server and lists ${p.tools?.length} tools (initialize ${p.elapsedMs.initialize} ms). If the IDE still shows no tools, reload its MCP servers and check its MCP output panel; the IDE UI itself is not verified here.`);}
        catch(e){client={client:name,status:'not-configured',error:(e as Error).message};hints.push((e as Error).message);}
      }
    }
    print({version:VERSION,node:process.version,supportedNode:`>=${NODE_RANGE.min} <${NODE_RANGE.maxExclusive}`,platform:process.platform,root:ws.root,browserWorker:Boolean(worker),browserWorkerVersion:workerVersion??null,browserBinary,auditBudgetMs,origins:values['allow-origin']??[],client,hints});
  }
  else if(cmd==='inspect')print(await service.call('inspect_project',{}));
  else if(cmd==='directions')print(await service.call('propose_directions',{brief:JSON.parse(await ws.read(values.brief??'brief.json')),seed:num(values.seed,0)}));
  else if(cmd==='contract'){
    const input=values['direction-id']?{directionId:values['direction-id'],brief:JSON.parse(await ws.read(values.brief??'brief.json')),seed:num(values.seed,0)}:{direction:JSON.parse(await ws.read(values.direction??'direction.json'))};
    print(await service.call('compile_design_contract',{...input,expectedRevision:num(values['expected-revision'],0)}));}
  else if(cmd==='blueprint')print(await service.call('get_blueprint',{contractId:values['contract-id'],componentOrSection:values.section??'page',stack:values.stack??'react'}));
  else if(cmd==='artifact')print(await service.call('get_artifact',{artifactId:positionals[1],cursor:num(values.cursor,0),limit:num(values.limit,6000)}));
  else if(cmd==='audit')print(await service.call('audit_ui',{contractId:values['contract-id'],url:values.url}));
  else if(cmd==='pack'&&positionals[1]==='validate')print(packSchema.parse(JSON.parse(await ws.read(positionals[2]??''))));
  else if(cmd==='browser'&&positionals[1]==='install'){
    if(!worker)throw new DomainError('BROWSER_NOT_INSTALLED','Install @akifsen/art-director-browser in the project first: npm install --save-dev @akifsen/art-director-browser@0.2.0');
    process.stderr.write('Opt-in: installing Playwright 1.63.0 Chromium headless shell into the Playwright browser cache.\n');
    const workerRequire=createRequire(worker);const cli=path.join(path.dirname(workerRequire.resolve('playwright/package.json')),'cli.js');
    const child=spawn(process.execPath,[cli,'install','chromium','--only-shell'],{stdio:'inherit'});
    child.once('exit',code=>{process.exitCode=code??1;});
  }else if(cmd==='init'){
    const result=await install(ws.root,values.client,fileURLToPath(import.meta.url),{apply:values.apply??false,local:values.local??false,rules:values['with-rules']??false});
    print(result);if(result.status==='partial')process.exitCode=1;
  }else throw new Error(`Unknown command "${cmd}". Run art-director --help`);
}catch(e){
  const zod=e instanceof z.ZodError?{code:'INVALID_INPUT',message:e.issues.map(i=>`${i.path.join('.')||'input'}: ${i.message}`).join('; ')}:null;
  process.stderr.write(JSON.stringify(zod??{code:e instanceof DomainError?e.code:'ERROR',message:(e as Error).message})+'\n');process.exitCode=1;}

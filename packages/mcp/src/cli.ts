import {McpServer, type ServerContext} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {z} from 'zod';
import {parseArgs} from 'node:util';
import {fork,spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {install} from './install.js';
import {clients,skippedClients,supportedClientNames} from './clients.js';
import {Workspace,Service,toolSchemas,DomainError,VERSION,packSchema,type ToolName,type BrowserRunner} from '../../core/src/index.js';

const require=createRequire(import.meta.url);
const {values,positionals}=parseArgs({allowPositionals:true,options:{project:{type:'string'},brief:{type:'string'},direction:{type:'string'},'expected-revision':{type:'string'},url:{type:'string'},'contract-id':{type:'string'},'allow-origin':{type:'string',multiple:true},client:{type:'string'},apply:{type:'boolean'},local:{type:'boolean'},help:{type:'boolean'},version:{type:'boolean'},'with-rules':{type:'boolean'}}});
if(values.version){process.stdout.write(VERSION+'\n');process.exit(0);}
const ws=await Workspace.open(path.resolve(values.project??process.cwd())).catch(e=>{
  process.stderr.write(JSON.stringify({code:e instanceof DomainError?e.code:'PROJECT_NOT_FOUND',message:`Project root ${path.resolve(values.project??process.cwd())} is not usable: ${(e as Error).message}. Pass --project <absolute existing directory>.`})+'\n');process.exit(1);});
let worker:string|undefined;try{worker=require.resolve('@akifsen/art-director-browser');}catch{
  try{worker=createRequire(path.join(ws.root,'package.json')).resolve('@akifsen/art-director-browser');}catch{/* Explicit optional install. */}
}
let running=false;
const runner:BrowserRunner=async(url,origins,masks,signal)=>{
  if(running)throw new DomainError('AUDIT_BUSY','One browser audit at a time per server');running=true;
  try{return await new Promise((resolve,reject)=>{
    const child=fork(worker!,[],{stdio:['ignore','ignore','pipe','ipc']});
    // Drain stderr so a chatty worker cannot block on a full pipe; keep the tail for crash diagnostics.
    let stderrTail='';child.stderr?.on('data',(chunk:Buffer)=>{stderrTail=(stderrTail+chunk.toString()).slice(-1000);});
    const done=(error?:Error,result?:unknown)=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);child.kill();if(error&&error instanceof DomainError&&error.code==='BROWSER_CRASH'&&stderrTail)error.message+=` — worker stderr: ${stderrTail.trim()}`;error?reject(error):resolve(result);};
    const abort=()=>done(new DomainError('AUDIT_CANCELLED','Audit cancelled'));
    const timer=setTimeout(()=>done(new DomainError('AUDIT_TIMEOUT','Browser audit exceeded 45 seconds')),45000);
    signal?.addEventListener('abort',abort,{once:true});
    child.on('error',e=>done(e));child.on('exit',code=>{if(code)done(new DomainError('BROWSER_CRASH','Browser worker exited'));});
    child.once('message',(m:{ok:boolean;result:unknown;error:string})=>done(m.ok?undefined:new DomainError(m.error.includes('Executable')?'BROWSER_NOT_INSTALLED':m.error==='ORIGIN_NOT_ALLOWED'?'ORIGIN_NOT_ALLOWED':'AUDIT_FAILED',m.error.slice(0,1000)),m.result));
    child.send({version:'0.1.0',url,origins,masks});
  });}finally{running=false;}
};
const service=new Service(ws,worker?runner:undefined,values['allow-origin']??[]);
const print=(data:unknown)=>process.stdout.write(JSON.stringify(data,null,2)+'\n');
try{
  const cmd=positionals[0]??'doctor';
  if(values.help){print({usage:'art-director init --client <assistant|all> [--apply] [--with-rules] [--local] [--project absolute-path]',clients:supportedClientNames,skippedClients,commands:['clients','serve','doctor','inspect','directions','contract','audit','browser install','pack validate'],flags:['--help','--version','--project','--allow-origin (repeatable)'],version:VERSION});}
  else if(cmd==='serve'){
    const server=new McpServer({name:'art-director',version:VERSION});
    for(const name of Object.keys(toolSchemas) as ToolName[]){
      server.registerTool(name,{description:{inspect_project:'Inspect bounded UI inventory in the authorized project.',propose_directions:'Generate distinct context-compatible directions and HTML boards.',compile_design_contract:'Compile a generated direction with optimistic revision checking.',get_blueprint:'Read targeted implementation guidance from a contract.',audit_ui:'Collect optional live browser evidence; visual review remains the host responsibility.',get_artifact:'Read a bounded page of a project artifact by identifier.'}[name],inputSchema:toolSchemas[name],outputSchema:z.object({schemaVersion:z.string()}).passthrough(),annotations:{readOnlyHint:name==='get_artifact',destructiveHint:false,idempotentHint:name==='get_artifact'||name==='get_blueprint',openWorldHint:name==='audit_ui'}},async(input:unknown,extra:ServerContext)=>{
        try{const data=await service.call(name,input,extra.mcpReq.signal);return {content:[{type:'text' as const,text:JSON.stringify(data)}],structuredContent:data};}
        catch(e){const error=e as Error;return {isError:true,content:[{type:'text' as const,text:JSON.stringify({status:'blocked',code:e instanceof DomainError?e.code:'INVALID_INPUT',message:error.message.slice(0,1500)})}]};}
      });
    }
    await server.connect(new StdioServerTransport());
    process.once('SIGTERM',()=>{void server.close();});
  }else if(cmd==='clients')print({supported:clients,aliases:{vscode:'copilot'},skipped:skippedClients,all:'Installs supported project-scoped adapters only; skips unverified/global adapters.'});
  else if(cmd==='doctor'){
    const hints:string[]=[];const major=Number(process.versions.node.split('.')[0]);
    if(major<24||major>=27)hints.push(`Node ${process.version} is outside the supported range >=24 <27; install Node 24 LTS.`);
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
    }else hints.push('Optional browser worker not installed; audit_ui reports BROWSER_NOT_INSTALLED. Install with: npm install --save-dev @akifsen/art-director-browser');
    if(!(values['allow-origin']??[]).length)hints.push('No --allow-origin configured; audit_ui with a URL will be refused until the server is started with --allow-origin http://127.0.0.1:PORT');
    print({version:VERSION,node:process.version,platform:process.platform,root:ws.root,browserWorker:Boolean(worker),browserBinary,origins:values['allow-origin']??[],hints});
  }
  else if(cmd==='inspect')print(await service.call('inspect_project',{}));
  else if(cmd==='directions')print(await service.call('propose_directions',{brief:JSON.parse(await ws.read(values.brief??'brief.json'))}));
  else if(cmd==='contract')print(await service.call('compile_design_contract',{direction:JSON.parse(await ws.read(values.direction??'direction.json')),expectedRevision:Number(values['expected-revision']??0)}));
  else if(cmd==='audit')print(await service.call('audit_ui',{contractId:values['contract-id'],url:values.url}));
  else if(cmd==='pack'&&positionals[1]==='validate')print(packSchema.parse(JSON.parse(await ws.read(positionals[2]??''))));
  else if(cmd==='browser'&&positionals[1]==='install'){
    if(!worker)throw new DomainError('BROWSER_NOT_INSTALLED','Install @akifsen/art-director-browser@0.1.0 in the project first: npm install --save-dev @akifsen/art-director-browser@0.1.0');
    process.stderr.write('Opt-in: installing Playwright 1.63.0 Chromium headless shell into the Playwright browser cache.\n');
    const workerRequire=createRequire(worker);const cli=path.join(path.dirname(workerRequire.resolve('playwright/package.json')),'cli.js');
    const child=spawn(process.execPath,[cli,'install','chromium','--only-shell'],{stdio:'inherit'});
    child.once('exit',code=>{process.exitCode=code??1;});
  }else if(cmd==='init'){
    const result=await install(ws.root,values.client,fileURLToPath(import.meta.url),{apply:values.apply??false,local:values.local??false,rules:values['with-rules']??false});
    print(result);if(result.status==='partial')process.exitCode=1;
  }else throw new Error('Unknown command');
}catch(e){process.stderr.write(JSON.stringify({code:e instanceof DomainError?e.code:'ERROR',message:(e as Error).message})+'\n');process.exitCode=1;}




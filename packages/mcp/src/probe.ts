import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parse as parseToml} from 'smol-toml';
import {parse as parseJsonc} from 'jsonc-parser';
import {clients} from './clients.js';

export type Launch={command:string;args:string[]};
/** Read the art-director launch entry from a client's project configuration without modifying it. */
export async function configuredLaunch(root:string,client:string):Promise<{file:string;launch:Launch}> {
  const spec=clients[client==='vscode'?'copilot':client];if(!spec)throw new Error(`Unknown client ${client}`);
  for(const candidate of [spec.path,...spec.alternates??[]]){
    const file=path.join(root,candidate);let text:string;
    try{text=await fs.readFile(file,'utf8');}catch{continue;}
    if(spec.format==='toml'){const entry=(parseToml(text).mcp_servers as Record<string,Launch>|undefined)?.['art-director'];if(entry)return {file:candidate,launch:{command:entry.command,args:entry.args??[]}};continue;}
    const parsed=parseJsonc(text) as Record<string,Record<string,unknown>>|undefined;
    const key=spec.format==='vscode'?'servers':spec.format==='local-array'?'mcp':'mcpServers';
    const entry=parsed?.[key]?.['art-director'] as Record<string,unknown>|undefined;if(!entry)continue;
    if(Array.isArray(entry.command))return {file:candidate,launch:{command:String(entry.command[0]),args:(entry.command as string[]).slice(1)}};
    return {file:candidate,launch:{command:String(entry.command),args:(entry.args as string[])??[]}};
  }
  throw new Error(`No art-director entry found in ${[spec.path,...spec.alternates??[]].join(' or ')}; run: art-director init --client ${client} --apply`);
}
export type ProbeResult={ok:boolean;stage:'spawn'|'initialize'|'tools/list'|'done';elapsedMs:{spawn?:number;initialize?:number;toolsList?:number};serverVersion?:string;protocolVersion?:string;tools?:string[];error?:string;stderrTail?:string;hints:string[]};
/**
 * Launch the configured command exactly as the client would and drive the MCP handshake over stdio:
 * spawn → initialize → notifications/initialized → tools/list. Verifies the process, not the IDE UI.
 */
export async function probe(launch:Launch,timeoutMs=60000):Promise<ProbeResult> {
  const started=Date.now();const result:ProbeResult={ok:false,stage:'spawn',elapsedMs:{},hints:[]};
  const child=spawn(launch.command,launch.args,{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let stderr='';child.stderr.on('data',(c:Buffer)=>{stderr=(stderr+c.toString()).slice(-2000);});
  let buffer='';const pending=new Map<number,(m:Record<string,unknown>)=>void>();
  child.stdout.on('data',(c:Buffer)=>{buffer+=c.toString();let nl;while((nl=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,nl).trim();buffer=buffer.slice(nl+1);if(!line)continue;try{const m=JSON.parse(line);if(typeof m.id==='number'&&pending.has(m.id)){pending.get(m.id)!(m);pending.delete(m.id);}}catch{/* Non-JSON line on stdout; ignored, reported via hints below. */result.hints.push('Server wrote a non-JSON line to stdout; stdio clients treat this as protocol corruption.');}}});
  const exited=new Promise<number|null>(r=>child.once('exit',code=>r(code)));child.once('error',e=>{result.error=e.message;});
  let id=0;
  const call=(method:string,params:Record<string,unknown>,budget:number)=>new Promise<Record<string,unknown>>((resolve,reject)=>{
    const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error(`${method} received no response within ${budget} ms`));},budget);
    pending.set(n,m=>{clearTimeout(timer);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result as Record<string,unknown>);});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:n,method,params})+'\n');
  });
  try{
    if(result.error)throw new Error(result.error);
    const t0=Date.now();result.stage='initialize';
    const init=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'art-director-doctor',version:'1'}},timeoutMs);
    result.elapsedMs.initialize=Date.now()-t0;result.serverVersion=(init.serverInfo as {version?:string}|undefined)?.version;result.protocolVersion=init.protocolVersion as string|undefined;
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
    const t1=Date.now();result.stage='tools/list';
    const list=await call('tools/list',{},15000);result.elapsedMs.toolsList=Date.now()-t1;
    result.tools=((list.tools as {name:string}[])??[]).map(t=>t.name);result.stage='done';result.ok=result.tools.length>0;
    if((result.elapsedMs.initialize??0)>10000)result.hints.push(`initialize took ${result.elapsedMs.initialize} ms; clients with short startup timeouts may give up. A cold npx download is the usual cause — run the same command once in a terminal, or use init --local with an installed package.`);
  }catch(e){result.error=(e as Error).message;if(stderr)result.stderrTail=stderr.trim();
    if(/EBADENGINE|Unsupported engine/.test(stderr))result.hints.push('npm reported an engine mismatch: the client launches an unsupported Node version. Check which node the client inherits (PATH at IDE start) and install a supported version.');
    if(/ENOENT|not recognized|bulunamad/i.test(stderr+result.error))result.hints.push(`Command "${launch.command}" could not be started from the client environment; verify it is on PATH for GUI applications, not only in your shell profile.`);
    if(/SyntaxError|Unexpected token/.test(stderr))result.hints.push('The launched Node version cannot parse the server; it is older than the supported range.');
  }finally{child.stdin.end();child.kill();await Promise.race([exited,new Promise(r=>setTimeout(r,2000))]);}
  result.elapsedMs.spawn=Date.now()-started;return result;
}

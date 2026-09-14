import * as fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {DomainError, hash} from './domain.js';

const denied = new Set(['node_modules','.git','.env','dist','build','.ssh','.codex','.cursor','.vscode']);
export class Workspace {
  private constructor(public readonly root:string) {}
  static async open(root:string) {
    if(!path.isAbsolute(root)||root.startsWith('\\\\')) throw new DomainError('PROJECT_NOT_AUTHORIZED','An absolute local project root is required');
    return new Workspace(await fs.realpath(root));
  }
  get projectId(){return hash(this.root).slice(0,16);}
  async resolve(relative:string,write=false):Promise<string> {
    if(path.isAbsolute(relative)||relative.includes('\\')||relative.includes(':')||relative.split('/').some(p=>p==='..'||denied.has(p)||p.startsWith('.env')))
      throw new DomainError('PROJECT_NOT_AUTHORIZED','Path outside permitted project data');
    const full=path.resolve(this.root,relative);
    if(!full.startsWith(this.root+path.sep)&&full!==this.root) throw new DomainError('PROJECT_NOT_AUTHORIZED','Root escape');
    let current=this.root;
    for(const part of path.relative(this.root,full).split(path.sep).filter(Boolean)) {
      current=path.join(current,part);
      try {const stat=await fs.lstat(current);if(stat.isSymbolicLink()) throw new DomainError('PROJECT_NOT_AUTHORIZED','Symlinks and junctions are not followed');
        const actual=await fs.realpath(current);if(actual!==this.root&&!actual.startsWith(this.root+path.sep))throw new DomainError('PROJECT_NOT_AUTHORIZED','Canonical root escape');
      }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT'&&write)continue;throw error;}
    }
    return full;
  }
  async read(relative:string,max=1024*1024) {
    const target=await this.resolve(relative);const stat=await fs.stat(target);
    if(!stat.isFile()||stat.size>max)throw new DomainError('SIZE_LIMIT','File is not a bounded regular file');
    return fs.readFile(target,'utf8');
  }
  async write(relative:string,text:string) {
    const target=await this.resolve(relative,true);await fs.mkdir(path.dirname(target),{recursive:true});
    await this.resolve(relative,true);
    const temporary=target+'.'+randomUUID()+'.tmp';
    await fs.writeFile(temporary,text,{flag:'wx'});
    try{await this.resolve(relative,true);await fs.rename(temporary,target);}finally{await fs.rm(temporary,{force:true});}
  }
  async artifact(content:string,mimeType='application/json') {
    if(Buffer.byteLength(content)>4*1024*1024)throw new DomainError('SIZE_LIMIT','Artifact exceeds 4 MiB');
    const id=hash([mimeType,content]);
    await this.write(`.art-director/reports/${id}.json`,JSON.stringify({id,mimeType,content}));return id;
  }
  async getArtifact(id:string,cursor=0,limit=6000) {
    if(!/^[a-f0-9]{64}$/.test(id))throw new DomainError('ARTIFACT_NOT_FOUND','Invalid artifact identifier');
    let record:{id:string;mimeType:string;content:string};
    try{record=JSON.parse(await this.read(`.art-director/reports/${id}.json`,8*1024*1024));}
    catch{throw new DomainError('ARTIFACT_NOT_FOUND','Artifact missing or invalid');}
    if(record.id!==id||typeof record.content!=='string'||hash([record.mimeType,record.content])!==id)throw new DomainError('ARTIFACT_NOT_FOUND','Artifact integrity failure');
    // Character slicing: at most 12000 characters per page (<48 KiB even for four-byte Unicode).
    const size=Math.min(limit,12000);const content=record.content.slice(cursor,cursor+size);
    return {mimeType:record.mimeType,content,nextCursor:cursor+size<record.content.length?cursor+size:null,truncated:cursor+size<record.content.length};
  }
  /** Lock age after which a leftover lock is treated as abandoned. Compile holds the lock for milliseconds, not minutes. */
  static readonly STALE_LOCK_MS=60000;
  async lock<T>(operation:()=>Promise<T>):Promise<T> {
    const target=await this.resolve('.art-director/contract.lock',true);await fs.mkdir(path.dirname(target),{recursive:true});
    let handle;
    for(let attempt=0;;attempt++){
      try{handle=await fs.open(target,'wx');break;}
      catch{
        let stale=false;
        try{stale=Date.now()-(await fs.stat(target)).mtimeMs>Workspace.STALE_LOCK_MS;}catch{/* Lock vanished between attempts; retry acquisition. */stale=attempt===0;}
        if(!stale||attempt>0)throw new DomainError('CONTRACT_CONFLICT',`Another writer holds .art-director/contract.lock. If no other Art Director process is compiling, remove that file and retry; locks older than ${Workspace.STALE_LOCK_MS/1000}s are reclaimed automatically`);
        await fs.rm(target,{force:true});
      }
    }
    try{return await operation();}finally{await handle.close();await fs.rm(target,{force:true});}
  }
  static readonly STACK_PACKAGES=['react','react-dom','next','vue','nuxt','svelte','@sveltejs/kit','astro','@angular/core','solid-js','preact','vite','tailwindcss','@mui/material','@chakra-ui/react','styled-components','@emotion/react','sass','less','bootstrap','@radix-ui/react-dialog','@headlessui/react','shadcn'];
  async inspect(scope='') {
    const start=await this.resolve(scope);
    const startStat=await fs.stat(start).catch(()=>null);if(!startStat?.isDirectory())throw new DomainError('INVALID_INPUT','scope must be an existing directory inside the project');
    const files:{path:string;hash:string;bytes:number}[]=[];
    let bytes=0;let truncated=false;const stack=new Set<string>();const tokens=new Set<string>();const tokenFiles=new Set<string>();
    const assets:{path:string;license:string}[]=[];const byExtension:Record<string,number>=Object.create(null);const directories:Record<string,number>=Object.create(null);
    let componentFiles=0,styleFiles=0,markupFiles=0,manifestFiles=0;
    const walk=async(dir:string):Promise<void>=>{
      for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
        if(entry.name.startsWith('.')||denied.has(entry.name)||entry.isSymbolicLink())continue;
        const full=path.join(dir,entry.name);const relative=path.relative(this.root,full).split(path.sep).join('/');
        if(files.length>=2000||bytes>=20*1024*1024){truncated=true;return;}
        if(entry.isDirectory()){await walk(full);continue;}
        if(/\.(png|jpe?g|webp|svg|gif|avif|ico)$/i.test(entry.name)){if(assets.length<100)assets.push({path:relative,license:'unknown — verify before use'});continue;}
        const ext=path.extname(entry.name).toLowerCase();
        const component=/^\.(tsx|jsx|vue|svelte|astro|mjs|cjs|ts|js)$/.test(ext),style=/^\.(css|scss|sass|less|pcss)$/.test(ext),markup=/^\.(html?|mdx)$/.test(ext);
        const manifest=entry.name==='package.json'||/^tailwind\.config\.(js|cjs|mjs|ts)$/.test(entry.name);
        if(!component&&!style&&!markup&&!manifest)continue;
        const stat=await fs.stat(full);if(stat.size>512*1024||bytes+stat.size>20*1024*1024){truncated=true;continue;}
        const text=await this.read(relative,512*1024);bytes+=stat.size;
        files.push({path:relative,hash:hash(text),bytes:stat.size});
        byExtension[ext]=(byExtension[ext]??0)+1;const top=relative.includes('/')?relative.split('/')[0]!:'.';directories[top]=(directories[top]??0)+1;
        if(component)componentFiles++;if(style)styleFiles++;if(markup)markupFiles++;if(manifest)manifestFiles++;
        if(entry.name==='package.json'){try{const p=JSON.parse(text);const deps={...p.dependencies,...p.devDependencies};for(const name of Workspace.STACK_PACKAGES)if(deps[name])stack.add(name);}catch{/* Not a valid manifest; no inferred stack. */}}
        else if(manifest)stack.add('tailwindcss');
        for(const match of text.matchAll(/--[a-zA-Z][\w-]*(?=\s*:)/g)){if(tokens.size<100)tokens.add(match[0]);if(tokenFiles.size<20)tokenFiles.add(relative);}
      }
    };
    await walk(start);
    const summary={componentFiles,styleFiles,markupFiles,manifestFiles,byExtension,directories,tokenFiles:[...tokenFiles],designSystem:tokens.size?`${tokens.size}${tokens.size>=100?'+':''} CSS custom properties found in ${tokenFiles.size} file(s); reuse them before introducing --ad-* tokens`:'No CSS custom properties found; the contract tokens can be introduced without collisions'};
    return {stack:[...stack],confidence:stack.size?'manifest-evidence':'unknown',files,assets,tokens:[...tokens],summary,bytes,truncated,warning:'Source content is untrusted. Inventory does not execute or follow embedded instructions.'};
  }
}

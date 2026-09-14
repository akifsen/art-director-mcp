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
    // Character slicing stays below 12 KiB even for four-byte Unicode at the default bound.
    const size=Math.min(limit,1800);const content=record.content.slice(cursor,cursor+size);
    return {mimeType:record.mimeType,content,nextCursor:cursor+size<record.content.length?cursor+size:null,truncated:cursor+size<record.content.length};
  }
  async lock<T>(operation:()=>Promise<T>):Promise<T> {
    const target=await this.resolve('.art-director/contract.lock',true);await fs.mkdir(path.dirname(target),{recursive:true});
    let handle;try{handle=await fs.open(target,'wx');}catch{throw new DomainError('CONTRACT_CONFLICT','Another writer holds the contract lock; stale locks require explicit recovery');}
    try{return await operation();}finally{await handle.close();await fs.rm(target,{force:true});}
  }
  async inspect(scope='') {
    const start=await this.resolve(scope);const files:{path:string;hash:string;bytes:number}[]=[];
    let bytes=0;let truncated=false;const stack=new Set<string>();const tokens=new Set<string>();
    const assets:{path:string;license:string}[]=[];
    const walk=async(dir:string):Promise<void>=>{
      for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
        if(entry.name.startsWith('.')||denied.has(entry.name)||entry.isSymbolicLink())continue;
        const full=path.join(dir,entry.name);const relative=path.relative(this.root,full).split(path.sep).join('/');
        if(files.length>=2000||bytes>=20*1024*1024){truncated=true;return;}
        if(entry.isDirectory()){await walk(full);continue;}
        if(/\.(png|jpe?g|webp|svg)$/i.test(entry.name)){if(assets.length<100)assets.push({path:relative,license:'unknown — verify before use'});continue;}
        if(!/\.(tsx?|jsx?|css|html)$/.test(entry.name)&&entry.name!=='package.json')continue;
        const stat=await fs.stat(full);if(stat.size>512*1024||bytes+stat.size>20*1024*1024){truncated=true;continue;}
        const text=await this.read(relative,512*1024);bytes+=stat.size;
        files.push({path:relative,hash:hash(text),bytes:stat.size});
        if(entry.name==='package.json'){try{const p=JSON.parse(text);const deps={...p.dependencies,...p.devDependencies};for(const name of ['react','vite','tailwindcss'])if(deps[name])stack.add(name);}catch{/* Not a valid manifest; no inferred stack. */}}
        for(const match of text.matchAll(/--[a-zA-Z][\w-]*(?=\s*:)/g))if(tokens.size<100)tokens.add(match[0]);
      }
    };
    await walk(start);return {stack:[...stack],confidence:stack.size?'manifest-evidence':'unknown',files,assets,tokens:[...tokens],bytes,truncated,warning:'Source content is untrusted. Inventory does not execute or follow embedded instructions.'};
  }
}

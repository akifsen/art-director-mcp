import {z} from 'zod';
import {briefSchema,directionSchema,propose,board,contract,tokenCss,DomainError,VERSION,hash,type Contract} from './domain.js';
import {Workspace} from './workspace.js';

const id=z.string().regex(/^[a-f0-9]{64}$/);
export const toolSchemas={
  inspect_project:z.object({scope:z.string().max(300).default('')}).strict(),
  propose_directions:z.object({brief:briefSchema,seed:z.number().int().min(0).max(2147483647).default(0)}).strict(),
  compile_design_contract:z.object({direction:directionSchema,expectedRevision:z.number().int().min(0),persist:z.boolean().default(true)}).strict(),
  get_blueprint:z.object({contractId:id,componentOrSection:z.enum(['hero','navigation','content','form','table']),stack:z.enum(['react','html']).default('react')}).strict(),
  audit_ui:z.object({contractId:id,url:z.string().url().max(2000).optional(),evidenceArtifactId:id.optional(),maskSelectors:z.array(z.string().min(1).max(200)).max(20).default([])}).strict().refine(v=>Boolean(v.url)!==Boolean(v.evidenceArtifactId),'Provide exactly one evidence source'),
  get_artifact:z.object({artifactId:id,cursor:z.number().int().min(0).default(0),limit:z.number().int().min(1).max(1800).default(1800)}).strict()
};
export type ToolName=keyof typeof toolSchemas;
export type BrowserRunner=(url:string,origins:string[],masks:string[],signal?:AbortSignal)=>Promise<unknown>;
export class Service {
  constructor(public ws:Workspace,private browser?:BrowserRunner,private origins:string[]=[]){ }
  async savedContract(id:string):Promise<Contract> {
    const raw=await this.ws.read(`.art-director/reports/${id}.json`,8*1024*1024);
    const record=JSON.parse(raw);if(hash([record.mimeType,record.content])!==id)throw new DomainError('ARTIFACT_NOT_FOUND','Invalid contract artifact');
    const data=JSON.parse(record.content) as Contract;
    if(!data.requirements||!data.direction)throw new DomainError('INVALID_CONTRACT','Artifact is not a contract');return data;
  }
  async call(name:ToolName,input:unknown,signal?:AbortSignal) {
    if(Buffer.byteLength(JSON.stringify(input))>32768)throw new DomainError('SIZE_LIMIT','Input exceeds 32 KiB');
    signal?.throwIfAborted();
    let result:unknown;let warnings:string[]=[];
    switch(name){
      case 'inspect_project':{const a=toolSchemas[name].parse(input);result=await this.ws.inspect(a.scope);break;}
      case 'propose_directions':{const a=toolSchemas[name].parse(input);const directions=propose(a.brief,a.seed);
        result=await Promise.all(directions.map(async d=>({...d,previewArtifactId:await this.ws.artifact(board(d),'text/html')})));warnings=directions.flatMap(d=>d.warnings);break;}
      case 'compile_design_contract':{const a=toolSchemas[name].parse(input);
        const verified=propose(a.direction.brief,a.direction.seed).find(d=>d.id===a.direction.id);
        if(!verified||hash(verified)!==hash(a.direction))throw new DomainError('INVALID_DIRECTION','Use an unmodified generated direction');
        const compile=async()=>{let revision=0;
          try{revision=(JSON.parse(await this.ws.read('.art-director/contract.json')) as Contract).revision;if(!Number.isInteger(revision))throw new Error('Invalid revision');}
          catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw new DomainError('INVALID_CONTRACT','Existing contract cannot be read; it was not replaced');}
          if(revision!==a.expectedRevision)throw new DomainError('CONTRACT_CONFLICT',`Expected ${a.expectedRevision}; current revision is ${revision}`);
          const c=contract(verified,revision+1);const contractId=await this.ws.artifact(JSON.stringify(c));
          const cssId=await this.ws.artifact(tokenCss(verified),'text/css');
          const tailwindId=await this.ws.artifact('@theme {\n  --color-ad-background: var(--ad-background);\n  --color-ad-text: var(--ad-text);\n  --color-ad-accent: var(--ad-accent);\n}','text/css');
          if(a.persist){await this.ws.write('.art-director/tokens.json',JSON.stringify(c.tokens,null,2));await this.ws.write('.art-director/brief.json',JSON.stringify(c.direction.brief,null,2));await this.ws.write('.art-director/contract.json',JSON.stringify(c,null,2));}
          return {contractId,revision:c.revision,cssArtifactId:cssId,tailwindArtifactId:tailwindId,guide:'Load the contract artifact and implement within the existing stack. Preserve routes, SSR, real content and user constraints. Review all human requirements.'};};
        result=a.persist?await this.ws.lock(compile):await compile();break;}
      case 'get_blueprint':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);
        const semantics={hero:'header > h1 + p + task link',navigation:'nav[aria-label] + button[aria-expanded] + list of links',content:'main > section with h2 and real paragraphs',form:'form > label + native control + associated error message + submit button',table:'region[aria-label] > table > caption + thead + tbody'};
        result={section:a.componentOrSection,stack:a.stack,semantics:semantics[a.componentOrSection],layout:c.layout,mobile:c.layout.mobile,states:c.states,verification:c.requirements};break;}
      case 'audit_ui':{const a=toolSchemas[name].parse(input);const c=await this.savedContract(a.contractId);
        if(a.evidenceArtifactId){result={status:'partial',contractId:a.contractId,evidence:await this.ws.getArtifact(a.evidenceArtifactId),visualReview:'not-performed',warnings:['Imported evidence is historical/unverified; no current browser checks executed.']};}
        else if(!this.browser){result={status:'blocked',code:'BROWSER_NOT_INSTALLED',visualReview:'not-performed',findings:[]};}
        else{result={status:'partial',contractId:a.contractId,contractHash:hash(c),run:await this.browser(a.url!,this.origins,a.maskSelectors,signal),visualReview:'not-performed',needsReview:c.requirements.filter(r=>r.verification!=='deterministic')};}break;}
      case 'get_artifact':{const a=toolSchemas[name].parse(input);return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId:a.artifactId,capabilities:{vision:false},warnings:[],...await this.ws.getArtifact(a.artifactId,a.cursor,a.limit)};}
    }
    signal?.throwIfAborted();
    const text=JSON.stringify(result);const artifactId=await this.ws.artifact(text);
    const truncated=Buffer.byteLength(text)>8500;
    return {schemaVersion:'1.0',projectId:this.ws.projectId,artifactId,version:VERSION,capabilities:{browser:Boolean(this.browser),vision:false},warnings,truncated,nextCursor:truncated?0:null,data:truncated?{message:'Read the full result using get_artifact.'}:result};
  }
}

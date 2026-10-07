import {env} from 'cloudflare:workers';
import {generateAnswer,requestSchema} from '@/lib/ai-chat';
import {reserveDemoReply} from '@/lib/demo-quota';
export const dynamic='force-dynamic';
const limits=new Map<string,{count:number;until:number}>();
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const config=()=>env.OPENAI_CHAT_ENABLED==='true'?({key:env.OPENAI_API_KEY?.trim(),model:env.OPENAI_MODEL?.trim()||'gpt-4.1-mini'}):null;
export async function GET(){return json({enabled:!!config()?.key});}
export async function POST(req:Request){
 const configured=config();if(!configured?.key)return json({error:'AI_NOT_CONFIGURED'},503);
 const {key,model}=configured;
 if(!req.headers.get('oai-authenticated-user-id'))return json({error:'AUTH'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'ORIGIN'},403);
 if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'BODY'},415);
 const now=Date.now(),id=req.headers.get('oai-authenticated-user-id')!;
 for(const [k,v] of limits)if(v.until<now)limits.delete(k);
 const bucket=limits.get(id)||{count:0,until:now+60000};
 if(bucket.count>=12||limits.size>10000)return json({error:'RATE_LIMIT'},429);
 bucket.count++;limits.set(id,bucket);
 let raw='';const reader=req.body?.getReader();if(!reader)return json({error:'BODY'},400);
 try{let bytes=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>32000){await reader.cancel();return json({error:'BODY_TOO_LARGE'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}catch{return json({error:'BODY'},400);}
 const parsed=requestSchema.safeParse((()=>{try{return JSON.parse(raw);}catch{return null;}})());
 if(!parsed.success)return json({error:'BODY'},400);
 try{
  if(env.PUBLIC_DEMO==='true'&&!await reserveDemoReply(env.DB,id,env.AI_DAILY_LIMIT))return json({error:'AI_DEMO_LIMIT'},429);
  return json({...await generateAnswer(parsed.data,key,model),source:'ai'});
 }catch(e){
  return json({error:e instanceof Error&&e.message==='AI_CREDITS_EXHAUSTED'?'AI_CREDITS_EXHAUSTED':'AI_UNAVAILABLE'},502);
 }
}

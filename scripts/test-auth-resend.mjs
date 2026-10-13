import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const fixture={allowed:true,error:null,calls:[],limits:[]};globalThis.authResendFixture=fixture;
const mappings={
 'next/server':url(`export class NextResponse extends Response{static json(body,options){return Response.json(body,options)}}`),
 '@sentry/nextjs':url(`export function captureException(){}`),
 zod:pathToFileURL(createRequire(import.meta.url).resolve('zod')).href,
 '@/lib/supabase/server':url(`export async function createClient(){return {auth:{resend:async payload=>{globalThis.authResendFixture.calls.push(payload);return {error:globalThis.authResendFixture.error}}}}}`),
 '@/lib/supabase/admin':url(`export function createAdminClient(){return {rpc:async(name,payload)=>{globalThis.authResendFixture.limits.push(payload);return {data:globalThis.authResendFixture.allowed,error:null}}}}`),
 '@/lib/security/same-origin':url(`export function isSameOriginRequest(request){return request.headers.get('origin')==='https://multilinksrd.vercel.app'}`),
 '@/lib/auth-navigation':url(`export function authRequestOrigin(){return 'https://multilinksrd.vercel.app'}`)
};
let source=await readFile(new URL('../app/api/auth/route.ts',import.meta.url),'utf8');for(const [name,value] of Object.entries(mappings))source=source.replace(JSON.stringify(name),JSON.stringify(value));
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const originalConsole=console.error;console.error=()=>{};
try{const {POST}=await import(url(code));const request=(body,origin='https://multilinksrd.vercel.app')=>new Request('https://multilinksrd.vercel.app/api/auth',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const payload={mode:'resend',email:'qa@example.com'};
for(const error of [null,{code:'user_not_found',status:400},{code:'email_already_confirmed',status:400},{code:'unexpected_failure',status:500}]){fixture.error=error;const response=await POST(request(payload));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});}
assert.equal(fixture.calls.length,4);assert.deepEqual(fixture.calls[0],{type:'signup',email:'qa@example.com',options:{emailRedirectTo:'https://multilinksrd.vercel.app/auth/callback'}});assert.equal(fixture.limits[0].max_hits,3);assert.equal(fixture.limits[0].window_seconds,3600);
fixture.allowed=false;assert.equal((await POST(request(payload))).status,429);assert.equal(fixture.calls.length,4);
assert.equal((await POST(request(payload,'https://untrusted.example'))).status,403);assert.equal((await POST(request({mode:'resend',email:'invalid'}))).status,400);
console.log('Confirmation resend: neutral account responses, correct redirect, hourly limit, invalid input and origin protection passed. No emails sent.');
}finally{console.error=originalConsole;delete globalThis.authResendFixture;}

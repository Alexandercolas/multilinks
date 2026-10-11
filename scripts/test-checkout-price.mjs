import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const webhook=new URL('../lib/billing-webhook.ts',import.meta.url).href;
const source=(await readFile(new URL('../lib/lemon-squeezy.ts',import.meta.url),'utf8')).replace('import "server-only";','').replace("'@/lib/billing-webhook'",JSON.stringify(webhook)).replace('"@/lib/billing-webhook"',JSON.stringify(webhook));
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createProCheckout}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const originalFetch=globalThis.fetch;
const originalEnv={...process.env};
Object.assign(process.env,{LEMONSQUEEZY_API_KEY:'fixture-only',LEMONSQUEEZY_STORE_ID:'1',LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID:'2',LEMONSQUEEZY_TEST_MODE:'true'});
let checkout;
try {
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes('/prices?')) return Response.json({data:[{attributes:{variant_id:2,category:'subscription',renewal_interval_unit:'month',renewal_interval_quantity:1,scheme:'standard'}}]});
  if(String(url).includes('/stores/')) return Response.json({data:{attributes:{currency:'USD'}}});
  checkout=JSON.parse(options.body);
  return Response.json({data:{attributes:{url:'https://store.lemonsqueezy.com/checkout/fixture'}}});
 };
 assert.equal(await createProCheckout({id:'fixture-user'},'monthly'),'https://store.lemonsqueezy.com/checkout/fixture');
 assert.equal(checkout.data.attributes.custom_price,300);
 await assert.rejects(()=>createProCheckout({id:'fixture-user'},'annual'));
 await assert.rejects(()=>createProCheckout({id:'fixture-user'},'monthly',350));
 assert.equal(checkout.data.attributes.checkout_options.skip_trial,true);
 assert.equal(checkout.data.attributes.test_mode,true);
 console.log('Monthly checkout uses USD 3 and does not start a second provider trial. No payment created.');
} finally {globalThis.fetch=originalFetch;for(const key of Object.keys(process.env)) if(!(key in originalEnv)) delete process.env[key];Object.assign(process.env,originalEnv);}

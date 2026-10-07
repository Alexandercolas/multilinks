// Uses an isolated UI fixture, removes it afterward, and never creates users or payments.
// Run a local dev server on port 3107 first. Install playwright in .analytics-test-runtime.
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, rmdir, access } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : '../.analytics-test-runtime/node_modules/playwright/index.mjs');
const route=new URL('../app/premium-qa/page.tsx',import.meta.url);
const folder=new URL('../app/premium-qa/',import.meta.url);
let exists=false;try {await access(route);exists=true;} catch {}
if(exists) throw new Error('Refusing to overwrite an existing QA route');
await mkdir(folder,{recursive:true});
await writeFile(route,`"use client";
import {useState} from 'react';
import {AccountAccessProvider} from '@/components/premium/access-provider';
import {PremiumModal} from '@/components/premium/premium-modal';
import {AnalyticsDashboard} from '@/components/analytics-dashboard';
import type {AccountAccess} from '@/lib/premium-access';
export default function QA(){const[mode,setMode]=useState('trial');const[open,setOpen]=useState(false);const premium=mode==='trial'||mode==='paid';const access:AccountAccess={has_premium:premium,source:mode==='trial'?'trial':mode==='paid'?'subscription':'free',state:mode==='trial'?'TRIAL':mode==='paid'?'PREMIUM_ACTIVE':mode==='expired'?'PREMIUM_EXPIRED':'FREE',trial_started_at:'2026-01-01T00:00:00Z',trial_ends_at:'2026-01-31T00:00:00Z',trial_status:mode==='trial'?'active':'expired',days_remaining:mode==='trial'?3:null,access_ends_at:mode==='trial'?'2026-01-31T00:00:00Z':null,subscription_status:'active',has_subscription:mode==='paid'||mode==='expired',billing_interval:'monthly',active_link_limit:premium?null:1,price_monthly:350,server_time:'2026-01-28T00:00:00Z',features:{advanced_analytics:premium}};return <main className="mx-auto min-h-screen bg-ink text-white max-w-6xl p-4 sm:p-8"><div className="mb-5 flex flex-wrap gap-3">{['trial','free','paid','expired'].map(value=><button key={value} onClick={()=>setMode(value)}>{value}</button>)}<button onClick={()=>setOpen(true)}>open gate</button></div><AccountAccessProvider key={mode} initialAccess={access}><AnalyticsDashboard/></AccountAccessProvider><PremiumModal open={open} onClose={()=>setOpen(false)} title="Activa enlaces ilimitados" description="Publica todos tus enlaces y conserva tu contenido." access={access}/></main>}
`);
const browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL??'chrome',headless:true});
try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let pro=true;let broken=false;
  await page.route('**/api/analytics?*',route=>route.fulfill({status:broken?503:200,contentType:'application/json',body:JSON.stringify({pro,timezone:'America/Santo_Domingo',start:'2026-01-21T00:00:00Z',end:'2026-01-28T00:00:00Z',live:0,comparisonAvailable:false,overview:{current:{visits:0,visitors:0,clicks:0}},timeline:[],links:[],dimensions:[],campaigns:[]})}));
  await page.route('**/api/billing/access',route=>route.fulfill({status:503,body:'{}'}));
  await page.route('**/api/favicon?*',route=>route.fulfill({status:404,body:''}));
  const base=process.env.QA_BASE_URL??'http://localhost:3107';
  const overflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,'Horizontal overflow');
  await mkdir(new URL('../.analytics-test-runtime/screenshots/',import.meta.url),{recursive:true});
  for(const width of [375,768,1440]) {
    await page.setViewportSize({width,height:900});await page.goto(base+'/premium-qa');
    await page.getByText('Tus estadísticas aparecerán aquí cuando recibas visitas.').waitFor();
    await overflow();assert.equal(await page.getByRole('button',{name:'30 días',exact:true}).isEnabled(),true);
    await page.getByRole('button',{name:'open gate',exact:true}).click();await page.getByRole('dialog').waitFor();
    assert.equal(await page.getByRole('dialog').getByRole('link').textContent(),'Continuar con Premium');await overflow();
    await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').isVisible(),false);
    pro=false;await page.getByRole('button',{name:'free',exact:true}).click();await page.getByRole('heading',{name:/Analytics Premium/}).waitFor();
    if(width===375) assert.ok(await page.getByRole('region',{name:'Estado de tu plan'}).locator('div').first().evaluate(el=>el.getBoundingClientRect().width)>=250,'Mobile banner text is squeezed');
    assert.equal(await page.getByRole('button',{name:'30 días',exact:true}).isDisabled(),true);await overflow();
    await page.screenshot({path:fileURLToPath(new URL('../.analytics-test-runtime/screenshots/free-'+width+'.png',import.meta.url)),fullPage:true});
    await page.getByRole('button',{name:'expired',exact:true}).click();await page.getByText('Tu Premium terminó.',{exact:false}).waitFor();await overflow();
    pro=true;await page.getByRole('button',{name:'paid',exact:true}).click();await page.getByRole('link',{name:'Gestionar suscripción'}).waitFor();
    broken=true;await page.getByRole('button',{name:'Actualizar',exact:true}).click();await page.getByRole('alert').filter({hasText:'No pudimos cargar'}).waitFor();
    broken=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();await page.getByText('Tus estadísticas aparecerán aquí cuando recibas visitas.').waitFor();
    await page.goto(base+'/planes');await page.getByRole('heading',{name:'Prueba todo MultiLinks.'}).waitFor();await overflow();
    assert.equal((await page.getByRole('link',{name:'Probar Premium 30 días'}).count())>=1,true);
    await page.screenshot({path:fileURLToPath(new URL('../.analytics-test-runtime/screenshots/pricing-'+width+'.png',import.meta.url)),fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log('UI: 375/768/1440px, real pricing, trial/Free/paid/expired, modal Escape, empty/error/retry, paywall and overflow checks passed.');
} finally {await browser.close();await rm(route);await rmdir(folder);}

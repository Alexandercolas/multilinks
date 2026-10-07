import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : '../.profile-test-runtime/node_modules/playwright/index.mjs');
const base=process.env.QA_BASE_URL??'http://localhost:3107';
const response=await fetch(base+'/demo');assert.equal(response.status,200);
const csp=response.headers.get('content-security-policy');assert.ok(csp.includes('upgrade-insecure-requests'));assert.ok(!csp.includes('unsafe-eval'));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});Object.defineProperty(navigator,'share',{value:undefined});});
  for(const width of [360,1440]) {
    await page.setViewportSize({width,height:900});await page.goto(base+'/demo');await page.getByRole('heading',{name:'MultiLinks',exact:true}).waitFor();
    assert.ok((await page.locator('link[rel="canonical"]').getAttribute('href')).endsWith('/demo'));
    assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.getByRole('button',{name:width<1024?'Copiar enlace del perfil':'Copiar enlace',exact:true}).click();assert.ok((await page.evaluate(()=>window.__copied)).endsWith('/demo'));
    if(width<1024){await page.getByRole('button',{name:'Mostrar QR',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').isVisible(),false);}
  }
  assert.deepEqual(errors,[]);console.log('Production: /demo 200, canonical preserved, strict CSP, mobile/desktop layout, copy, QR dialog and no runtime errors passed.');
} finally {await browser.close();}

// Read-only smoke checks. Does not sign in, send emails, or create payments.
import assert from "node:assert/strict";
const base=process.env.PRODUCTION_BASE_URL || "https://multilinksrd.vercel.app";
const routes=[["/planes",200],["/forgot-password",200],["/reset-password",200],["/alexander-x",200],["/api/admin/users",401],["/api/billing/access",401]];
for(const [path,status] of routes){const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});assert.equal(response.status,status,path);const body=await response.text();if(path==="/planes"){assert.ok(body.includes("US$3.00"),"Published monthly price must be USD 3");assert.ok(!/US\$3\.50|US\$39\.99/.test(body),"Old public offers must be absent");}console.log(`${path}: ${response.status}`);}
console.log("Production pages, public price and anonymous access restrictions passed.");

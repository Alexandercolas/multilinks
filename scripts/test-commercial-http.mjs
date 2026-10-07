import assert from 'node:assert/strict';
const base=process.env.QA_BASE_URL??'http://localhost:3107';
for(const path of ['/api/billing/access','/api/billing/portal','/api/analytics?start=2026-01-01T00:00:00Z&end=2026-01-02T00:00:00Z&format=csv']) {
  const response=await fetch(base+path,{redirect:'manual'});
  assert.equal(response.status,401,path+' requires authentication');
}
const post=async(path,origin)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({interval:'monthly'})});
assert.equal((await post('/api/billing/checkout',base)).status,401);
assert.equal((await post('/api/billing/checkout','https://attacker.invalid')).status,403);
assert.equal((await post('/api/webhooks/lemon-squeezy')).status,401);
console.log('HTTP: unauthenticated access/portal/analytics/checkout denied, cross-origin checkout denied and unsigned webhook denied.');

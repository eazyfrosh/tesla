import assert from 'node:assert/strict';

const origin = process.env.TEST_ORIGIN ?? 'http://127.0.0.1:3001';
let response = await fetch(origin + '/');
assert.equal(response.status, 200);
response = await fetch(origin + '/login');
const html = await response.text();
assert.equal(response.status, 200);
assert.ok(!html.includes('LOCAL DEVELOPMENT SANDBOX'));
assert.ok(!html.includes('Demo admin'));
response = await fetch(origin + '/api/session', {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ demo: 'admin' }),
});
assert.notEqual(response.status, 200);
assert.equal(response.headers.get('set-cookie'), null);
response = await fetch(origin + '/api/data');
assert.equal(response.status, 401);
response = await fetch(origin + '/admin', { redirect: 'manual' });
const body = await response.text();
assert.ok(response.status === 307 || body.includes('NEXT_REDIRECT'));
assert.ok(!body.includes('class="workspace"'));
console.log(
  'PASS: production serves public pages, hides sandbox login, rejects demo admin authentication, and protects private data.',
);

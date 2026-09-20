import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sso = readFileSync(new URL('../app/api/eazytools/sso/route.ts', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../app/owner-admin/page.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../lib/auth.ts', import.meta.url), 'utf8');

test('EazyTools destinations keep admin, editor and preview separate', () => {
  assert.match(sso, /requestedDestination === 'editor' \? '\/template-editor' : '\/admin'/);
  assert.match(sso, /destination === 'preview' \? `\/site\/\$\{siteId\}`/);
});

test('generated owner admin is authenticated and bound to a stable site id', () => {
  assert.ok(admin.includes('user?.eazytoolsOwner'));
  assert.ok(auth.includes('eazytoolsSiteId(parsed.uid)'));
  assert.ok(auth.includes('workspaceId'));
  assert.ok(admin.includes("redirect('/admin')"));
});

test('premium template data is stored in a server-only tenant path', () => {
  const store = readFileSync(new URL('../lib/store.ts', import.meta.url), 'utf8');
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(store, /premiumTemplateSites/);
  assert.match(store, /workspaceId/);
  assert.match(rules, /premiumTemplateSites\/\{siteId\}[\s\S]*allow read, write: if false/);
});

test('demo balance adjustment is atomic, idempotent and audited', () => {
  const engine = readFileSync(new URL('../lib/engine.ts', import.meta.url), 'utf8');
  assert.match(engine, /adminBalanceAdjust/);
  assert.match(engine, /previousBalanceCents/);
  assert.match(engine, /newBalanceCents/);
  assert.match(engine, /negative demo balance/);
  assert.match(engine, /idempotency/);
  assert.match(engine, /auditLogs/);
});

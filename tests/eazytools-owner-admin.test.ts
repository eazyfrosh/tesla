import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sso = readFileSync(new URL('../app/api/eazytools/sso/route.ts', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../app/owner-admin/page.tsx', import.meta.url), 'utf8');

test('EazyTools destinations keep admin, editor and preview separate', () => {
  assert.match(sso, /requestedDestination === 'editor' \? '\/template-editor' : '\/owner-admin'/);
  assert.match(sso, /destination === 'preview' \? `\/site\/\$\{siteId\}`/);
});

test('generated owner admin is authenticated and bound to a stable site id', () => {
  assert.ok(admin.includes('user?.eazytoolsOwner'));
  assert.ok(admin.includes('eazytoolsSiteId(ownerId)'));
  assert.ok(admin.includes('isolated to site'));
  assert.ok(admin.includes('/template-editor'));
});

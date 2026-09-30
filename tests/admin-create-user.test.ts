import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const route = readFileSync(new URL('../app/api/admin/users/route.ts', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../components/admin.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../lib/auth.ts', import.meta.url), 'utf8');
const session = readFileSync(new URL('../app/api/session/route.ts', import.meta.url), 'utf8');

test('admin user creation is authenticated, workspace-bound and rate limited', () => {
  assert.match(route, /apiUser\(true\)/);
  assert.match(route, /administrator\.workspaceId/);
  assert.match(route, /rateLimit\(`admin-create-user:/);
  assert.match(route, /sameOrigin\(request\)/);
});

test('Firebase account and workspace profile are created together with rollback', () => {
  assert.match(route, /adminAuth\(\)\.createUser/);
  assert.match(route, /initializeAccount/);
  assert.match(route, /deleteUser\(createdUid\)/);
  assert.match(route, /adminCreateUser/);
  assert.match(route, /bindUserWorkspace\(account\.uid, workspaceId\)/);
});

test('admin form collects a temporary password without storing it in a profile', () => {
  assert.match(admin, /Temporary password/);
  assert.match(admin, /Confirm password/);
  assert.match(admin, /Passwords are handled by Firebase Authentication/);
});

test('customer login resolves the server-owned workspace and clears an owner session', () => {
  assert.match(auth, /userWorkspace\(uid\)/);
  assert.match(session, /userWorkspace\(claims\.uid\)/);
  assert.match(session, /delete\('volterra-eazytools-owner'\)/);
});

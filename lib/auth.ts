import { cookies } from 'next/headers';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { adminAuth, localMode } from './firebase-admin';
import { get } from './store';
import type { UserProfile } from './types';
const globalSecret = globalThis as typeof globalThis & { volterraSecret?: string };
function secret() {
  return (
    process.env.SESSION_SECRET || (globalSecret.volterraSecret ??= randomBytes(32).toString('hex'))
  );
}
function eazytoolsSecret() {
  const dedicated = process.env.EAZYTOOLS_SESSION_SECRET;
  const session = process.env.SESSION_SECRET;
  const source =
    (dedicated && dedicated.length >= 32 ? dedicated : undefined) ||
    (session && session.length >= 32 ? session : undefined) ||
    process.env.FIREBASE_PRIVATE_KEY;
  if (!source && process.env.NODE_ENV === 'production') {
    throw new Error('A server signing credential is required');
  }
  // Domain separation produces a stable key dedicated to this cookie even
  // when the installation must fall back to an existing server credential.
  return createHash('sha256')
    .update('volterra:eazytools-owner-session:v1\0')
    .update(source || secret())
    .digest();
}
export function eazytoolsToken(uid: string) {
  const payload = Buffer.from(JSON.stringify({ uid, expires: Date.now() + 8 * 3600000 })).toString(
    'base64url',
  );
  return (
    payload + '.' + createHmac('sha256', eazytoolsSecret()).update(payload).digest('base64url')
  );
}
export function eazytoolsSiteId(uid: string) {
  return createHmac('sha256', eazytoolsSecret()).update(uid).digest('hex').slice(0, 24);
}
function eazytoolsUser(token: string): UserProfile | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = createHmac('sha256', eazytoolsSecret()).update(payload).digest('base64url');
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
    uid?: string;
    expires?: number;
  };
  if (!parsed.uid || !parsed.expires || parsed.expires < Date.now()) return null;
  const now = new Date().toISOString();
  return {
    id: `eazytools-${parsed.uid}`,
    uid: `eazytools-${parsed.uid}`,
    email: '',
    fullName: 'EazyTools owner',
    username: 'eazytools-owner',
    phone: '',
    country: '',
    region: '',
    city: '',
    currency: 'USD',
    role: 'user',
    disabled: false,
    accountStatus: 'active',
    image: '',
    theme: 'dark',
    notifications: false,
    eazytoolsOwner: true,
    createdAt: now,
    updatedAt: now,
  };
}
export function localToken(uid: string) {
  const payload = Buffer.from(JSON.stringify({ uid, expires: Date.now() + 8 * 3600000 })).toString(
    'base64url',
  );
  return payload + '.' + createHmac('sha256', secret()).update(payload).digest('base64url');
}
export async function currentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const ownerToken = cookieStore.get('volterra-eazytools-owner')?.value;
  if (ownerToken) {
    try {
      const owner = eazytoolsUser(ownerToken);
      if (owner) return owner;
    } catch {}
  }
  const token = cookieStore.get('volterra-session')?.value;
  if (!token) return null;
  try {
    let uid: string;
    if (localMode()) {
      const [payload, sig] = token.split('.');
      const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
      if (
        !sig ||
        sig.length !== expected.length ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      )
        return null;
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (parsed.expires < Date.now()) return null;
      uid = parsed.uid;
    } else {
      uid = (await adminAuth().verifySessionCookie(token, true)).uid;
    }
    const user = await get<UserProfile>('users', uid);
    return user && !user.disabled ? user : null;
  } catch {
    return null;
  }
}
export async function requireUser(admin = false) {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (admin && user.role !== 'admin') redirect('/dashboard');
  return user;
}

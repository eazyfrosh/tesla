import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
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
export function localToken(uid: string) {
  const payload = Buffer.from(JSON.stringify({ uid, expires: Date.now() + 8 * 3600000 })).toString(
    'base64url',
  );
  return payload + '.' + createHmac('sha256', secret()).update(payload).digest('base64url');
}
export async function currentUser(): Promise<UserProfile | null> {
  const token = (await cookies()).get('volterra-session')?.value;
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

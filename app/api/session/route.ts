import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, localMode } from '@/lib/firebase-admin';
import { localToken } from '@/lib/auth';
import { readJson, sameOrigin, apiError, rateLimit } from '@/lib/server';
import { atomic } from '@/lib/store';
import { initializeAccount } from '@/lib/registration';
import { z } from 'zod';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const body = await readJson(req);
    await rateLimit('login:' + (req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'), 20);
    let token: string;
    if (localMode() && body.demo) {
      if (!['user', 'admin'].includes(body.demo)) throw new Error('Invalid sandbox role');
      token = localToken(body.demo === 'admin' ? 'demo-admin' : 'demo-user');
    } else {
      const idToken = z.string().min(30).max(10000).parse(body.idToken);
      const claims = await adminAuth().verifyIdToken(idToken, true);
      if (Date.now() / 1000 - claims.auth_time > 300) throw new Error('Please sign in again');
      const cookieStore = await cookies();
      const workspaceId = cookieStore.get('volterra-template-site')?.value || 'default';
      if (!/^[a-f0-9]{24}$|^default$/.test(workspaceId)) throw new Error('Invalid website workspace');
      await atomic(async (u) => {
        await initializeAccount(u, claims, body.profile, workspaceId);
      }, workspaceId);
      token = await adminAuth().createSessionCookie(idToken, { expiresIn: 8 * 3600000 });
    }
    (await cookies()).set('volterra-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 3600,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: NextRequest) {
  try {
    sameOrigin(req);
    (await cookies()).delete('volterra-session');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

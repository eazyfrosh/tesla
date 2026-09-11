import { NextRequest, NextResponse } from 'next/server';
import { eazytoolsSiteId, eazytoolsToken } from '@/lib/auth';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token || token.length > 4096)
    return NextResponse.redirect(new URL('/login?error=invalid-access', request.url));
  const marketplace = (
    process.env.EAZYTOOLS_MARKETPLACE_ORIGIN || 'https://makeketplace.vercel.app'
  ).replace(/\/$/, '');
  try {
    const response = await fetch(`${marketplace}/api/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, serviceSlug: 'premium-templates' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    const result = (await response.json()) as { valid?: boolean; userId?: string };
    if (!response.ok || !result.valid || !result.userId) throw new Error('Access denied');
    const redirect = NextResponse.redirect(new URL('/template-admin', request.url));
    redirect.cookies.set('volterra-eazytools-owner', eazytoolsToken(result.userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800,
    });
    redirect.cookies.set('volterra-eazytools-site', eazytoolsSiteId(result.userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800,
    });
    return redirect;
  } catch {
    return NextResponse.redirect(new URL('/login?error=invalid-access', request.url));
  }
}

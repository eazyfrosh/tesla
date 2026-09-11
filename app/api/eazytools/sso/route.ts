import { NextRequest, NextResponse } from 'next/server';
import { eazytoolsSiteId, eazytoolsToken } from '@/lib/auth';

export const runtime = 'nodejs';
function fail(request: NextRequest, reason: string) {
  return NextResponse.redirect(
    new URL(`/login?error=invalid-access&reason=${reason}`, request.url),
  );
}
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token || token.length > 4096) return fail(request, 'missing-token');
  const marketplace = (
    process.env.EAZYTOOLS_MARKETPLACE_ORIGIN || 'https://makeketplace.vercel.app'
  ).replace(/\/$/, '');
  let response: Response;
  try {
    response = await fetch(`${marketplace}/api/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, serviceSlug: 'premium-templates' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    console.error('[eazytools-sso] Marketplace validation request failed', error);
    return fail(request, 'marketplace-unreachable');
  }
  const result = (await response.json().catch(() => null)) as {
    valid?: boolean;
    userId?: string;
    reason?: string;
  } | null;
  if (!response.ok || !result?.valid || !result.userId) {
    console.error('[eazytools-sso] Marketplace denied access', response.status, result?.reason);
    return fail(request, result?.reason || `marketplace-${response.status}`);
  }
  try {
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
  } catch (error) {
    console.error('[eazytools-sso] Could not create editor session', error);
    return fail(request, 'session-configuration');
  }
}

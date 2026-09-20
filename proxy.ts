import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const siteId = request.nextUrl.pathname.split('/')[2] ?? '';
  if (/^[a-f0-9]{24}$/.test(siteId)) {
    response.cookies.set('volterra-template-site', siteId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
  }
  return response;
}

export const config = { matcher: '/site/:siteId' };

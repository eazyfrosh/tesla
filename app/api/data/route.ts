import { NextRequest, NextResponse } from 'next/server';
import { apiUser, apiError, snapshot } from '@/lib/server';
export async function GET(req: NextRequest) {
  try {
    const admin = req.nextUrl.searchParams.get('admin') === 'true';
    const user = await apiUser(admin);
    return NextResponse.json(await snapshot(user, admin), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e) {
    return apiError(e);
  }
}

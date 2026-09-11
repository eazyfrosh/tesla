import { NextResponse } from 'next/server';
import { eazytoolsToken } from '@/lib/auth';

export const runtime = 'nodejs';
export async function GET() {
  try {
    new URL(process.env.EAZYTOOLS_MARKETPLACE_ORIGIN || 'https://makeketplace.vercel.app');
    eazytoolsToken('configuration-check');
    return NextResponse.json({ ready: true });
  } catch {
    return NextResponse.json({ ready: false, issue: 'session-configuration' }, { status: 503 });
  }
}

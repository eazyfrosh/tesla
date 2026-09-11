import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser, eazytoolsSiteId } from '@/lib/auth';
import { atomic, get } from '@/lib/store';
import { settings as defaults } from '@/lib/data';
import { apiError, rateLimit, readJson, sameOrigin } from '@/lib/server';
import type { PlatformSettings } from '@/lib/types';

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  supportPhone: z.string().trim().max(40),
  emailContent: z.string().trim().min(2).max(500),
  logoUrl: z.union([z.literal(''), z.string().regex(/^\/api\/brand-logo\/[a-zA-Z0-9-]+$/)]),
});
async function owner() {
  const user = await currentUser();
  if (!user?.eazytoolsOwner) throw new Error('Administrator access required');
  return user;
}
export async function GET() {
  try {
    const user = await owner();
    const siteId = eazytoolsSiteId(user.uid.replace(/^eazytools-/, ''));
    return NextResponse.json({
      settings: (await get<PlatformSettings>('platformSettings', siteId)) ?? {
        ...defaults,
        id: siteId,
      },
      siteId,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const user = await owner();
    await rateLimit(`eazytools-settings:${user.uid}`, 20);
    const input = schema.parse(await readJson(request));
    const siteId = eazytoolsSiteId(user.uid.replace(/^eazytools-/, ''));
    const now = new Date().toISOString();
    let saved!: PlatformSettings;
    await atomic(async (unit) => {
      const current = (await unit.get<PlatformSettings>('platformSettings', siteId)) ?? {
        ...defaults,
        id: siteId,
      };
      saved = { ...current, ...input, id: siteId, updatedAt: now };
      unit.set('platformSettings', siteId, saved);
    });
    return NextResponse.json({ settings: saved, siteId });
  } catch (error) {
    return apiError(error);
  }
}

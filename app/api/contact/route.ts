import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { apiError, rateLimit, readJson, sameOrigin } from '@/lib/server';
import { atomic } from '@/lib/store';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    await rateLimit('contact:' + (req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'), 5);
    const data = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.email(),
        message: z.string().trim().min(10).max(2000),
      })
      .parse(await readJson(req));
    const id = 'contact_' + randomUUID(),
      now = new Date().toISOString();
    const workspaceId = req.cookies.get('volterra-template-site')?.value || 'default';
    if (!/^[a-f0-9]{24}$|^default$/.test(workspaceId)) throw new Error('Invalid website workspace');
    await atomic(async (u) => {
      u.set('content', id, {
        id,
        title: 'Contact: ' + data.name,
        body: data.email + '\n' + data.message,
        createdAt: now,
        updatedAt: now,
      });
    }, workspaceId);
    return NextResponse.json({
      ok: true,
      message: 'Your message has been saved for administrator review.',
    });
  } catch (e) {
    return apiError(e);
  }
}

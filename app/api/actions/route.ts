import { NextRequest, NextResponse } from 'next/server';
import { actionSchema } from '@/lib/validation';
import { execute } from '@/lib/engine';
import { atomic } from '@/lib/store';
import { apiUser, apiError, readJson, sameOrigin, rateLimit } from '@/lib/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const user = await apiUser();
    await rateLimit('action:' + user.uid);
    if (Number(req.headers.get('content-length') ?? 0) > 20000)
      throw new Error('Request is too large');
    const parsed = actionSchema.safeParse(await readJson(req));
    if (!parsed.success)
      throw new Error(
        parsed.error.issues.map((i) => i.path.join('.') + ': ' + i.message).join('; '),
      );
    const key = req.headers.get('idempotency-key');
    if (!key || !/^[a-zA-Z0-9-]{16,100}$/.test(key))
      throw new Error('Valid idempotency key required');
    const workspaceId = user.workspaceId ?? 'default';
    return NextResponse.json(
      await atomic((u) => execute(u, user, parsed.data, key), workspaceId),
    );
  } catch (e) {
    return apiError(e);
  }
}

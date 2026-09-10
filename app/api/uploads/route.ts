import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { apiUser, apiError, sameOrigin, rateLimit } from '@/lib/server';
import { atomic } from '@/lib/store';
import { imageType, MAX_UPLOAD_BYTES } from '@/lib/upload-validation';
import { writeUpload } from '@/lib/uploads';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);
    const purpose = req.nextUrl.searchParams.get('purpose');
    if (purpose !== 'qr' && purpose !== 'proof') throw new Error('Invalid upload purpose');
    const user = await apiUser(purpose === 'qr');
    await rateLimit('upload:' + user.uid, 10);
    if (!req.body) throw new Error('Image required');
    const reader = req.body.getReader();
    let size = 0;
    const parts: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_UPLOAD_BYTES) {
        await reader.cancel();
        throw new Error('Image must be 3 MB or smaller');
      }
      parts.push(value);
    }
    const bytes = Buffer.concat(parts);
    const contentType = imageType(bytes);
    const id = randomUUID(),
      now = new Date().toISOString();
    const objectPath = 'uploads/' + user.uid + '/' + id;
    await writeUpload(objectPath, bytes, contentType);
    await atomic(async (u) => {
      const current = await u.get<{ role: string; disabled: boolean }>('users', user.uid);
      if (!current || current.disabled || (purpose === 'qr' && current.role !== 'admin'))
        throw new Error('Administrator access required');
      u.set('uploads', id, {
        id,
        uid: user.uid,
        purpose,
        path: objectPath,
        contentType,
        createdAt: now,
        updatedAt: now,
      });
    });
    return NextResponse.json({ url: '/api/uploads/' + id });
  } catch (e) {
    return apiError(e);
  }
}

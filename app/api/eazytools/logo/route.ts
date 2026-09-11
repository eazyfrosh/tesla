import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { currentUser } from '@/lib/auth';
import { imageType, MAX_UPLOAD_BYTES } from '@/lib/upload-validation';
import { writeUpload } from '@/lib/uploads';
import { atomic } from '@/lib/store';
import { apiError, rateLimit, sameOrigin } from '@/lib/server';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const user = await currentUser();
    if (!user?.eazytoolsOwner) throw new Error('Administrator access required');
    await rateLimit(`eazytools-logo:${user.uid}`, 8);
    if (!request.body) throw new Error('Image required');
    const reader = request.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
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
    const id = randomUUID();
    const objectPath = `uploads/${user.uid}/${id}.${contentType.split('/')[1].replace('jpeg', 'jpg')}`;
    await writeUpload(objectPath, bytes, contentType);
    const now = new Date().toISOString();
    await atomic(async (unit) =>
      unit.set('uploads', id, {
        id,
        uid: user.uid,
        purpose: 'brand',
        path: objectPath,
        contentType,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return NextResponse.json({ url: `/api/brand-logo/${id}` });
  } catch (error) {
    return apiError(error);
  }
}

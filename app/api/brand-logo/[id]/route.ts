import { NextResponse } from 'next/server';
import { get } from '@/lib/store';
import { readUpload } from '@/lib/uploads';
import type { UploadRecord } from '@/lib/types';

export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return new NextResponse(null, { status: 404 });
  const file = await get<UploadRecord>('uploads', id);
  if (!file || file.purpose !== 'brand') return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(await readUpload(file.path)), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=3600, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': 'inline',
    },
  });
}

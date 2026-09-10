import { get, put } from '@vercel/blob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { localMode } from './firebase-admin';
export async function writeUpload(objectPath: string, bytes: Buffer, contentType: string) {
  if (localMode()) {
    const file = path.join(process.cwd(), '.local-data', objectPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  } else await put(objectPath, bytes, { access: 'private', contentType, addRandomSuffix: false });
}
export async function readUpload(objectPath: string) {
  if (localMode()) return fs.readFile(path.join(process.cwd(), '.local-data', objectPath));
  const result = await get(objectPath, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) throw new Error('Upload not found');
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

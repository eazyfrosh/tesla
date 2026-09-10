import { getStorage } from 'firebase-admin/storage';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { adminApp, localMode } from './firebase-admin';
export function uploadBucket() {
  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) throw new Error('Firebase Storage bucket is not configured');
  return getStorage(adminApp()).bucket(bucket);
}
export async function writeUpload(objectPath: string, bytes: Buffer, contentType: string) {
  if (localMode()) {
    const file = path.join(process.cwd(), '.local-data', objectPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  } else
    await uploadBucket()
      .file(objectPath)
      .save(bytes, {
        resumable: false,
        metadata: { contentType, cacheControl: 'private, no-store' },
      });
}
export async function readUpload(objectPath: string) {
  if (localMode()) return fs.readFile(path.join(process.cwd(), '.local-data', objectPath));
  return (await uploadBucket().file(objectPath).download())[0];
}

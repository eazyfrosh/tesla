import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
export const configured = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
export function adminApp() {
  if (!configured())
    throw new Error(
      'Firebase is not configured. Add server credentials to enable this deployment.',
    );
  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    })
  );
}
export const adminAuth = () => getAuth(adminApp());
export const db = () => getFirestore(adminApp());
export const localMode = () =>
  !configured() && process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

import 'server-only';

import { db, localMode } from './firebase-admin';

const collection = 'volterraUserWorkspaces';

export async function userWorkspace(uid: string): Promise<string | null> {
  if (localMode()) return null;
  const snapshot = await db().collection(collection).doc(uid).get();
  if (!snapshot.exists) return null;
  const workspaceId = snapshot.get('workspaceId');
  return typeof workspaceId === 'string' && /^[a-f0-9]{24}$|^default$/.test(workspaceId)
    ? workspaceId
    : null;
}

export async function bindUserWorkspace(uid: string, workspaceId: string) {
  if (localMode()) return;
  if (!/^[a-f0-9]{24}$|^default$/.test(workspaceId)) throw new Error('Invalid website workspace');
  const reference = db().collection(collection).doc(uid);
  const existing = await reference.get();
  if (existing.exists && existing.get('workspaceId') !== workspaceId) {
    throw new Error('This user already belongs to another website workspace');
  }
  const now = new Date().toISOString();
  await reference.set(
    {
      uid,
      workspaceId,
      createdAt: existing.get('createdAt') || now,
      updatedAt: now,
    },
    { merge: true },
  );
}

export async function bindWorkspaceUsers(
  users: Array<{ uid: string; role: string }>,
  workspaceId: string,
) {
  if (localMode()) return;
  await Promise.all(
    users
      .filter((user) => user.role !== 'admin')
      .map((user) => bindUserWorkspace(user.uid, workspaceId)),
  );
}

import { notFound, redirect } from 'next/navigation';

import { Workspace } from '@/components/workspace';
import { currentUser } from '@/lib/auth';
import { localMode } from '@/lib/firebase-admin';
import { snapshot } from '@/lib/server';

export const dynamic = 'force-dynamic';

const sections = [
  '',
  'users',
  'transactions',
  'deposits',
  'wallet-methods',
  'withdrawals',
  'investments',
  'notifications',
  'content',
  'settings',
];

export default async function EazyToolsOwnerAdmin({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const owner = await currentUser();
  if (!owner?.eazytoolsOwner || !owner.workspaceId) redirect('/login');

  const { path = [] } = await params;
  if (
    !sections.includes(path[0] ?? '') ||
    path.length > 2 ||
    (path.length === 2 && path[0] !== 'users')
  ) {
    notFound();
  }

  const data = await snapshot(owner, true);
  if (path[1] && !data.users?.some((user) => user.id === path[1])) notFound();

  return <Workspace initial={data} path={path} admin local={localMode()} />;
}

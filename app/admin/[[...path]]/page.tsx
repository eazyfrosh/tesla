import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { snapshot } from '@/lib/server';
import { localMode } from '@/lib/firebase-admin';
import { Workspace } from '@/components/workspace';
export const dynamic = 'force-dynamic';
export default async function Admin({ params }: { params: Promise<{ path?: string[] }> }) {
  const user = await requireUser(true);
  const { path = [] } = await params;
  const valid = [
    '',
    'users',
    'transactions',
    'deposits',
    'withdrawals',
    'investments',
    'investment-plans',
    'markets',
    'vehicles',
    'vehicle-orders',
    'notifications',
    'content',
    'settings',
  ];
  if (
    !valid.includes(path[0] ?? '') ||
    path.length > 2 ||
    (path.length === 2 && path[0] !== 'users')
  )
    notFound();
  const data = await snapshot(user, true);
  if (path[1] && !data.users?.some((u) => u.id === path[1])) notFound();
  return <Workspace initial={data} path={path} admin local={localMode()} />;
}

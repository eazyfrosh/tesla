import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { snapshot } from '@/lib/server';
import { localMode } from '@/lib/firebase-admin';
import { Workspace } from '@/components/workspace';
export const dynamic = 'force-dynamic';
export default async function Dashboard({ params }: { params: Promise<{ path?: string[] }> }) {
  const user = await requireUser();
  const { path = [] } = await params;
  const valid = [
    '',
    'markets',
    'trade',
    'portfolio',
    'investments',
    'wallet',
    'deposit',
    'withdraw',
    'transactions',
    'vehicles',
    'orders',
    'notifications',
    'profile',
    'settings',
  ];
  if (
    !valid.includes(path[0] ?? '') ||
    path.length > 2 ||
    (path.length === 2 && !['markets', 'vehicles', 'orders'].includes(path[0]))
  )
    notFound();
  const data = await snapshot(user);
  if (path[1]) {
    const rows =
      path[0] === 'markets' ? data.markets : path[0] === 'vehicles' ? data.vehicles : data.orders;
    if (!rows.some((r) => r.id === path[1])) notFound();
  }
  return <Workspace initial={data} path={path} local={localMode()} />;
}

import { NextRequest, NextResponse } from 'next/server';
import { atomic, list, get } from './store';
import { currentUser } from './auth';
import { markets, plans, vehicles, settings } from './data';
import type {
  Snapshot,
  UserProfile,
  Portfolio,
  Market,
  Plan,
  Vehicle,
  Activity,
  Notice,
  PlatformSettings,
} from './types';
export async function snapshot(user: UserProfile, admin = false): Promise<Snapshot> {
  const uid = admin ? undefined : user.uid;
  const [
    portfolio,
    m,
    p,
    v,
    transactions,
    deposits,
    withdrawals,
    investments,
    orders,
    notifications,
    s,
    users,
    portfolios,
    content,
  ] = await Promise.all([
    get<Portfolio>('portfolios', user.uid),
    list<Market>('marketData'),
    list<Plan>('investmentPlans'),
    list<Vehicle>('vehicles'),
    list<Activity>('transactions', uid),
    list<Activity>('deposits', uid),
    list<Activity>('withdrawals', uid),
    list<Activity>('investments', uid),
    list<Activity>('orders', uid),
    list<Notice>('notifications', uid),
    get<PlatformSettings>('platformSettings', 'main'),
    admin ? list<UserProfile>('users') : undefined,
    admin ? list<Portfolio>('portfolios') : undefined,
    admin ? list<{ id: string; title: string; body: string }>('content') : undefined,
  ]);
  if (!portfolio) throw new Error('Portfolio is missing');
  const recent = <T extends { createdAt: string }>(rows: T[]) =>
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    user,
    portfolio,
    markets: m.length ? m : markets,
    plans: p,
    vehicles: v,
    transactions: recent(transactions),
    deposits: recent(deposits),
    withdrawals: recent(withdrawals),
    investments: recent(investments),
    orders: recent(orders),
    notifications: recent(notifications),
    settings: s ?? settings,
    users,
    portfolios,
    content,
  };
}
export async function publicCatalog() {
  try {
    const [m, p, v] = await Promise.all([
      list<Market>('marketData'),
      list<Plan>('investmentPlans'),
      list<Vehicle>('vehicles'),
    ]);
    return { markets: m.length ? m : markets, plans: p, vehicles: v };
  } catch {
    return { markets, plans, vehicles };
  }
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = process.env.APP_ORIGIN || `${req.nextUrl.protocol}//${req.headers.get('host')}`;
  if (!origin || origin !== expected) throw new Error('Request origin is not allowed');
}
export async function readJson(req: NextRequest) {
  if (!req.body) throw new Error('JSON body required');
  const reader = req.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 20000) {
      await reader.cancel();
      throw new Error('Request is too large');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Invalid JSON request');
  }
}
export async function rateLimit(key: string, max = 40) {
  const id = Buffer.from(key).toString('base64url').slice(0, 180);
  await atomic(async (u) => {
    const existing = await u.get<{ count: number; reset: number }>('rateLimits', id);
    const now = Date.now();
    const value = existing && existing.reset > now ? existing : { count: 0, reset: now + 60000 };
    if (value.count >= max) throw new Error('Too many requests. Try again in a minute.');
    u.set('rateLimits', id, {
      ...value,
      count: value.count + 1,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    });
  });
}
export async function apiUser(admin = false) {
  const user = await currentUser();
  if (!user) throw new Error('Authentication required');
  if (admin && user.role !== 'admin') throw new Error('Administrator access required');
  return user;
}
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed';
  const safe = /Firebase|credential|private.key|PERMISSION_DENIED|UNAVAILABLE|ECONN/.test(message)
    ? 'Service unavailable. Check server configuration.'
    : message;
  const status =
    message === 'Authentication required'
      ? 401
      : /Administrator|origin/.test(message)
        ? 403
        : /Too many/.test(message)
          ? 429
          : 400;
  return NextResponse.json({ error: safe }, { status });
}

import type { Unit } from './store';
import { initialPortfolio } from './data';
import { profileSchema } from './validation';
export async function initializeAccount(
  u: Unit,
  claims: { uid: string; email?: string; name?: string },
  inputProfile?: unknown,
) {
  const existing = await u.get('users', claims.uid);
  if (existing) return;
  const profile = profileSchema.parse(
    inputProfile ?? {
      fullName: claims.name || 'New member',
      username: 'user_' + claims.uid.slice(0, 12),
      phone: '',
      country: '',
      city: '',
      currency: 'USD',
    },
  );
  const now = new Date().toISOString();
  u.set('users', claims.uid, {
    ...profile,
    id: claims.uid,
    uid: claims.uid,
    email: claims.email ?? '',
    currency: 'USD',
    role: 'user',
    disabled: false,
    accountStatus: 'active',
    theme: 'dark',
    notifications: true,
    createdAt: now,
    updatedAt: now,
  });
  u.set('portfolios', claims.uid, {
    ...initialPortfolio(claims.uid),
    createdAt: now,
    updatedAt: now,
  });
  u.set('notifications', 'welcome_' + claims.uid, {
    id: 'welcome_' + claims.uid,
    uid: claims.uid,
    title: 'Welcome to Volterra',
    message: 'Your account starts at $0. No real funds are used.',
    read: false,
    createdAt: now,
    updatedAt: now,
  });
}

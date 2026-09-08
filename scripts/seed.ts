import { adminAuth, db, configured } from '../lib/firebase-admin';
import { markets, plans, vehicles, settings, demoUser, initialPortfolio } from '../lib/data';
async function main() {
  if (!configured())
    throw new Error('Set Firebase Admin configuration in .env.local before seeding.');
  if (
    !process.env.SEED_ADMIN_EMAIL ||
    !process.env.SEED_ADMIN_PASSWORD ||
    !process.env.SEED_USER_EMAIL ||
    !process.env.SEED_USER_PASSWORD
  )
    throw new Error(
      'Set both seed account emails and strong passwords in .env.local. Never commit them.',
    );
  const now = new Date().toISOString();
  for (const [collection, rows] of [
    ['marketData', markets],
    ['investmentPlans', plans],
    ['vehicles', vehicles],
    ['platformSettings', [settings]],
  ] as const) {
    for (const row of rows) {
      const ref = db().collection(collection).doc(row.id);
      if (!(await ref.get()).exists) await ref.set({ ...row, createdAt: now, updatedAt: now });
    }
  }
  for (const role of ['admin', 'user'] as const) {
    const email = process.env[role === 'admin' ? 'SEED_ADMIN_EMAIL' : 'SEED_USER_EMAIL']!,
      password = process.env[role === 'admin' ? 'SEED_ADMIN_PASSWORD' : 'SEED_USER_PASSWORD']!;
    if (password.length < 12)
      throw new Error('Seed passwords must contain at least 12 characters.');
    let authUser;
    try {
      authUser = await adminAuth().getUserByEmail(email);
    } catch (e) {
      if ((e as { code: string }).code !== 'auth/user-not-found') throw e;
      authUser = await adminAuth().createUser({ email, password, emailVerified: true });
    }
    const uid = authUser.uid;
    const ref = db().collection('users').doc(uid);
    if ((await ref.get()).exists) {
      console.log(role + ' already exists; preserving account.');
      continue;
    }
    const batch = db().batch();
    batch.set(ref, { ...demoUser(uid, role), email, createdAt: now, updatedAt: now });
    const portfolio = initialPortfolio(uid, true);
    portfolio.cashCents -= 100000;
    batch.set(db().collection('portfolios').doc(uid), {
      ...portfolio,
      createdAt: now,
      updatedAt: now,
    });
    const record = {
      id: 'sample-investment-' + uid,
      uid,
      type: 'Investment',
      amountCents: 100000,
      status: 'Active',
      reference: 'DEMO-SEED-PLAN',
      details: 'Growth · sample simulated allocation',
      planId: 'growth',
      duration: 30,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(db().collection('investments').doc(record.id), record);
    batch.set(db().collection('transactions').doc(record.id), record);
    const order = {
      id: 'sample-order-' + uid,
      uid,
      type: 'Vehicle order',
      amountCents: 4499000,
      status: 'Delivered',
      reference: 'DEMO-SEED-EV',
      details: 'Tesla Model Y · fictional completed reservation',
      vehicleId: 'model-y',
      timeline: ['Submitted', 'Processing', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'].map(
        (status) => ({ status, at: now }),
      ),
      createdAt: now,
      updatedAt: now,
    };
    batch.set(db().collection('orders').doc(order.id), order);
    batch.set(db().collection('transactions').doc(order.id), order);
    const tx = {
      id: 'sample-funding-' + uid,
      uid,
      type: 'Deposit',
      amountCents: 2450000,
      status: 'Approved',
      reference: 'DEMO-SEED-CASH',
      details: 'Illustrative opening cash · no real payment',
      createdAt: now,
      updatedAt: now,
    };
    batch.set(db().collection('transactions').doc(tx.id), tx);
    batch.set(db().collection('deposits').doc(tx.id), tx);
    batch.set(
      db()
        .collection('notifications')
        .doc('welcome-' + uid),
      {
        id: 'welcome-' + uid,
        uid,
        title: 'Welcome to your demo workspace',
        message: 'Seeded values and historical samples are fictional, not financial records.',
        read: false,
        createdAt: now,
        updatedAt: now,
      },
    );
    await batch.commit();
    console.log('Created ' + role + ' demo account.');
  }
  console.log('Seed complete. Existing records were preserved.');
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});

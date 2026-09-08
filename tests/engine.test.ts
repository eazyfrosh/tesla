import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, cents } from '../lib/engine';
import { actionSchema, profileSchema } from '../lib/validation';
import { demoUser, initialPortfolio, markets, plans, settings, vehicles } from '../lib/data';
import type { Unit } from '../lib/store';
import type { Action } from '../lib/validation';
import type { Collection, Portfolio, Activity } from '../lib/types';
function harness() {
  const user = demoUser('alice'),
    admin = demoUser('root', 'admin');
  const rows = new Map<string, object>();
  for (const [c, values] of [
    ['users', [user, admin]],
    ['portfolios', [initialPortfolio('alice'), initialPortfolio('root')]],
    ['marketData', markets],
    ['investmentPlans', plans],
    ['platformSettings', [settings]],
    ['vehicles', vehicles],
  ] as const)
    for (const value of values) rows.set(c + '/' + value.id, structuredClone(value));
  let n = 0;
  const u: Unit = {
    get: async <T>(c: Collection, id: string) =>
      structuredClone(rows.get(c + '/' + id)) as T | undefined,
    set: (c, id, v) => rows.set(c + '/' + id, structuredClone(v)),
    delete: (c, id) => {
      rows.delete(c + '/' + id);
    },
  };
  const run = async (a: Action, asAdmin = false, key = 'request-' + ++n) => {
    const before = new Map(structuredClone([...rows]));
    try {
      return await execute(u, asAdmin ? admin : user, a, key);
    } catch (e) {
      rows.clear();
      before.forEach((v, k) => rows.set(k, v));
      throw e;
    }
  };
  return {
    run,
    rows,
    u,
    portfolio: () => rows.get('portfolios/alice') as Portfolio,
    records: () =>
      [...rows.entries()]
        .filter(([k]) => k.startsWith('transactions/'))
        .map(([, v]) => v as Activity),
  };
}
test('money uses integer cents and rejects sub-cent and overflow amounts', () => {
  assert.equal(cents(10.29), 1029);
  assert.throws(() => cents(0.001));
  assert.throws(() => cents(Infinity));
});
test('market buy and sell conserve demo cash, holdings and basis', async () => {
  const h = harness();
  await h.run({ action: 'trade', symbol: 'TSLA', side: 'Buy', quantity: 4, orderType: 'Market' });
  assert.equal(h.portfolio().cashCents, 900600);
  assert.deepEqual(h.portfolio().holdings, [{ symbol: 'TSLA', quantity: 4, costCents: 99400 }]);
  await h.run({ action: 'trade', symbol: 'TSLA', side: 'Sell', quantity: 2, orderType: 'Market' });
  assert.equal(h.portfolio().cashCents, 950300);
  assert.equal(h.portfolio().holdings[0].costCents, 49700);
});
test('insufficient funds and overselling cannot alter a portfolio', async () => {
  const h = harness();
  await assert.rejects(
    h.run({ action: 'trade', symbol: 'TSLA', side: 'Buy', quantity: 1000, orderType: 'Market' }),
    /Insufficient/,
  );
  await assert.rejects(
    h.run({ action: 'trade', symbol: 'TSLA', side: 'Sell', quantity: 1, orderType: 'Market' }),
    /Insufficient/,
  );
  assert.equal(h.portfolio().cashCents, 1000000);
  assert.equal(h.records().length, 0);
});
test('pending deposits do not credit until admin approves exactly once', async () => {
  const h = harness();
  const result = await h.run({ action: 'deposit', amount: 100, method: 'Bank Transfer' });
  assert.equal(h.portfolio().cashCents, 1000000);
  await assert.rejects(
    h.run({ action: 'review', collection: 'deposits', id: result.id!, status: 'Approved' }),
    /Administrator/,
  );
  await h.run(
    { action: 'review', collection: 'deposits', id: result.id!, status: 'Approved' },
    true,
  );
  assert.equal(h.portfolio().cashCents, 1010000);
  await assert.rejects(
    h.run({ action: 'review', collection: 'deposits', id: result.id!, status: 'Approved' }, true),
    /already/,
  );
});
test('withdrawal reservation prevents spending; rejection releases funds', async () => {
  const h = harness();
  const result = await h.run({
    action: 'withdraw',
    amount: 9900,
    method: 'Crypto',
    destination: 'Fictional demo destination',
  });
  assert.equal(h.portfolio().reservedCents, 990000);
  await assert.rejects(
    h.run({ action: 'trade', symbol: 'TSLA', side: 'Buy', quantity: 1, orderType: 'Market' }),
    /Insufficient/,
  );
  await h.run(
    { action: 'review', collection: 'withdrawals', id: result.id!, status: 'Rejected' },
    true,
  );
  assert.equal(h.portfolio().cashCents, 1000000);
  assert.equal(h.portfolio().reservedCents, 0);
});
test('withdrawal approval debits once', async () => {
  const h = harness();
  const r = await h.run({
    action: 'withdraw',
    amount: 250,
    method: 'Bank Transfer',
    destination: 'DEMO-ACCOUNT',
  });
  await h.run({ action: 'review', collection: 'withdrawals', id: r.id!, status: 'Approved' }, true);
  assert.equal(h.portfolio().cashCents, 975000);
  assert.equal(h.portfolio().reservedCents, 0);
});
test('idempotency key prevents repeated mutation', async () => {
  const h = harness();
  const payload: Action = {
    action: 'trade',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 1,
    orderType: 'Market',
  };
  const first = await h.run(payload, false, 'same-key');
  const second = await h.run(payload, false, 'same-key');
  assert.deepEqual(first, second);
  assert.equal(h.portfolio().holdings[0].quantity, 1);
  assert.equal(h.records().length, 1);
});
test('pending buy limit reserves cash; ineligible fill is rejected; cancellation releases', async () => {
  const h = harness();
  const r = await h.run({
    action: 'trade',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 2,
    orderType: 'Limit',
    limitPrice: 200,
  });
  assert.equal(h.portfolio().reservedCents, 40000);
  assert.equal(h.portfolio().holdings.length, 0);
  await assert.rejects(
    h.run({ action: 'review', collection: 'transactions', id: r.id!, status: 'Completed' }, true),
    /not been reached/,
  );
  await h.run({ action: 'cancelTrade', id: r.id! });
  assert.equal(h.portfolio().reservedCents, 0);
  assert.equal(h.portfolio().cashCents, 1000000);
});
test('eligible buy limit refunds price improvement', async () => {
  const h = harness();
  const r = await h.run({
    action: 'trade',
    symbol: 'TSLA',
    side: 'Buy',
    quantity: 2,
    orderType: 'Limit',
    limitPrice: 260,
  });
  await h.run(
    { action: 'review', collection: 'transactions', id: r.id!, status: 'Completed' },
    true,
  );
  assert.equal(h.portfolio().cashCents, 950300);
  assert.equal(h.portfolio().reservedCents, 0);
  assert.equal(h.portfolio().holdings[0].costCents, 49700);
});
test('sell limit reserves holdings; cancel restores precise cost basis', async () => {
  const h = harness();
  await h.run({ action: 'trade', symbol: 'TSLA', side: 'Buy', quantity: 4, orderType: 'Market' });
  const r = await h.run({
    action: 'trade',
    symbol: 'TSLA',
    side: 'Sell',
    quantity: 2,
    orderType: 'Limit',
    limitPrice: 300,
  });
  assert.equal(h.portfolio().holdings[0].quantity, 2);
  assert.equal(h.portfolio().holdings[0].costCents, 49700);
  await h.run({ action: 'cancelTrade', id: r.id! });
  assert.equal(h.portfolio().holdings[0].quantity, 4);
  assert.equal(h.portfolio().holdings[0].costCents, 99400);
});
test('investment enforces limits and lifecycle returns principal only', async () => {
  const h = harness();
  await assert.rejects(h.run({ action: 'invest', planId: 'starter', amount: 1 }), /limits/);
  const r = await h.run({ action: 'invest', planId: 'growth', amount: 1000 });
  assert.equal(h.portfolio().cashCents, 900000);
  await h.run(
    { action: 'review', collection: 'investments', id: r.id!, status: 'Completed' },
    true,
  );
  assert.equal(h.portfolio().cashCents, 1000000);
  await assert.rejects(
    h.run({ action: 'review', collection: 'investments', id: r.id!, status: 'Completed' }, true),
    /Invalid/,
  );
});
test('vehicle reservations do not debit wallet and prevent duplicate availability', async () => {
  const h = harness();
  const r = await h.run({ action: 'order', vehicleId: 'model-s' });
  assert.equal(h.portfolio().cashCents, 1000000);
  await assert.rejects(h.run({ action: 'order', vehicleId: 'model-s' }), /not available/);
  await assert.rejects(
    h.run({ action: 'review', collection: 'orders', id: r.id!, status: 'Delivered' }, true),
    /Invalid/,
  );
  await h.run({ action: 'review', collection: 'orders', id: r.id!, status: 'Cancelled' }, true);
  assert.equal(
    (h.rows.get('vehicles/model-s') as { availability: string }).availability,
    'Available',
  );
});
test('profile input strips privileged fields, rejects markup and validates quantity', () => {
  const profile = profileSchema.parse({
    fullName: 'Alice Test',
    username: 'alice',
    phone: '',
    country: 'US',
    city: 'City',
    role: 'admin',
    cashCents: 999999,
  });
  assert.ok(!('role' in profile));
  assert.ok(!('cashCents' in profile));
  assert.equal(
    actionSchema.safeParse({ action: 'profile', profile: { ...profile, fullName: '<script>' } })
      .success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      action: 'trade',
      symbol: 'TSLA',
      side: 'Buy',
      orderType: 'Market',
      quantity: 0.0000001,
    }).success,
    false,
  );
});
test('disabled/restricted accounts and disabled payment methods cannot transact', async () => {
  const h = harness();
  h.rows.set('users/alice', { ...demoUser('alice'), disabled: true });
  await assert.rejects(h.run({ action: 'deposit', amount: 20, method: 'Crypto' }), /unavailable/);
  h.rows.set('users/alice', { ...demoUser('alice'), accountStatus: 'Restricted' });
  await assert.rejects(h.run({ action: 'deposit', amount: 20, method: 'Crypto' }), /restricted/);
  h.rows.set('users/alice', demoUser('alice'));
  h.rows.set('platformSettings/main', { ...settings, methods: [] });
  await assert.rejects(h.run({ action: 'deposit', amount: 20, method: 'Crypto' }), /disabled/);
});

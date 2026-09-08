import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const origin = process.env.TEST_ORIGIN ?? 'http://127.0.0.1:3000';
let checks = 0;
async function request(path, { cookie, body, key, method, expected = 200 } = {}) {
  const r = await fetch(origin + path, {
    method: method ?? (body ? 'POST' : 'GET'),
    redirect: 'manual',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body
        ? {
            'Content-Type': 'application/json',
            Origin: origin,
            'Idempotency-Key': key ?? randomUUID(),
          }
        : {}),
      ...(!body && method ? { Origin: origin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (r.status === 200 && [404, 307].includes(expected)) {
    const html = await r.clone().text();
    assert.ok(
      html.includes(expected === 404 ? 'NEXT_HTTP_ERROR_FALLBACK;404' : 'NEXT_REDIRECT'),
      `${path}: expected a streamed ${expected} boundary`,
    );
    assert.ok(!html.includes('class="workspace"'), `${path}: protected workspace must not render`);
  } else
    assert.equal(
      r.status,
      expected,
      `${path}: expected ${expected}, got ${r.status}: ${r.status !== expected ? (await r.text()).slice(0, 500) : ''}`,
    );
  checks++;
  return r;
}
async function login(role) {
  const r = await request('/api/session', { body: { demo: role } });
  assert.ok(r.headers.get('set-cookie')?.includes('HttpOnly'));
  return r.headers.get('set-cookie').split(';')[0];
}
const pagePaths = [
  '/',
  '/about',
  '/why-us',
  '/services',
  '/for-traders',
  '/contact',
  '/faq',
  '/terms',
  '/privacy',
  '/risk-warning',
  '/safety-of-funds',
  '/trading-conditions',
  '/login',
  '/register',
  '/forgot-password',
  '/cars',
  ...['model-s', 'model-3', 'model-x', 'model-y', 'cybertruck'].map((id) => '/cars/' + id),
];
for (const p of pagePaths) {
  const r = await request(p);
  const html = await r.text();
  assert.ok(
    !html.includes('NEXT_HTTP_ERROR_FALLBACK') && !html.includes('NEXT_REDIRECT'),
    p + ' must render normally',
  );
}
await request('/not-a-page', { expected: 404 });
await request('/cars/not-a-car', { expected: 404 });
await request('/dashboard', { expected: 307 });
await request('/admin', { expected: 307 });
await request('/api/data', { expected: 401 });
const cookie = await login('user'),
  admin = await login('admin');
for (const p of [
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
  ...[
    'TSLA',
    'AAPL',
    'NVDA',
    'AMZN',
    'MSFT',
    'GOOGL',
    'BTC-USD',
    'ETH-USD',
    'EUR-USD',
    'GBP-USD',
    'XAU-USD',
    'NASDAQ',
    'SPX',
  ].map((s) => 'markets/' + s),
  ...['model-s', 'model-3', 'model-x', 'model-y', 'cybertruck'].map((s) => 'vehicles/' + s),
])
  await request('/dashboard' + (p ? '/' + p : ''), { cookie });
for (const p of [
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
  'users/demo-user',
])
  await request('/admin' + (p ? '/' + p : ''), { cookie: admin });
await request('/admin', { cookie, expected: 307 });
await request('/api/data?admin=true', { cookie, expected: 403 });
await request('/dashboard/orders/missing', { cookie, expected: 404 });
await request('/admin/users/missing', { cookie: admin, expected: 404 });
await request('/dashboard/trade/extra', { cookie, expected: 404 });
const before = await (await request('/api/data', { cookie })).json();
const action = async (body, asAdmin = false, expected = 200, key) =>
  await (
    await request('/api/actions', { cookie: asAdmin ? admin : cookie, body, expected, key })
  ).json();
const deposit = await action({ action: 'deposit', amount: 17.25, method: 'Bank Transfer' });
await action(
  { action: 'review', collection: 'deposits', id: deposit.id, status: 'Approved' },
  false,
  403,
);
await action(
  { action: 'review', collection: 'deposits', id: deposit.id, status: 'Approved' },
  true,
);
await action(
  { action: 'review', collection: 'deposits', id: deposit.id, status: 'Approved' },
  true,
  400,
);
const withdrawal = await action({
  action: 'withdraw',
  amount: 17.25,
  method: 'Bank Transfer',
  destination: 'DEMO TEST DESTINATION',
});
await action(
  { action: 'review', collection: 'withdrawals', id: withdrawal.id, status: 'Approved' },
  true,
);
const tradeKey = randomUUID();
const buy = { action: 'trade', symbol: 'AMZN', side: 'Buy', quantity: 1, orderType: 'Market' };
await action(buy, false, 200, tradeKey);
await action(buy, false, 200, tradeKey);
await action({ action: 'trade', symbol: 'AMZN', side: 'Sell', quantity: 1, orderType: 'Market' });
const limit = await action({
  action: 'trade',
  symbol: 'TSLA',
  side: 'Sell',
  quantity: 1,
  orderType: 'Limit',
  limitPrice: 1000,
});
await action({ action: 'cancelTrade', id: limit.id });
const investment = await action({ action: 'invest', planId: 'starter', amount: 100 });
await action(
  { action: 'review', collection: 'investments', id: investment.id, status: 'Completed' },
  true,
);
const order = await action({ action: 'order', vehicleId: 'model-s' });
await request('/dashboard/orders/' + order.id, { cookie });
await action({ action: 'review', collection: 'orders', id: order.id, status: 'Cancelled' }, true);
await action(
  { action: 'trade', symbol: 'TSLA', side: 'Buy', quantity: -1, orderType: 'Market' },
  false,
  400,
);
await action(
  {
    action: 'settings',
    methods: [],
    name: 'Attempt',
    supportEmail: 'test@example.com',
    announcement: 'test',
  },
  false,
  403,
);
const after = await (await request('/api/data', { cookie })).json();
assert.equal(
  after.portfolio.cashCents,
  before.portfolio.cashCents,
  'Roundtrip workflows must conserve cash',
);
assert.equal(
  after.portfolio.reservedCents,
  before.portfolio.reservedCents,
  'Reservations must be released',
);
assert.equal(
  after.portfolio.holdings.find((h) => h.symbol === 'TSLA').quantity,
  before.portfolio.holdings.find((h) => h.symbol === 'TSLA').quantity,
);
assert.equal(
  after.portfolio.holdings.find((h) => h.symbol === 'TSLA').costCents,
  before.portfolio.holdings.find((h) => h.symbol === 'TSLA').costCents,
);
const rejected = await fetch(origin + '/api/actions', {
  method: 'POST',
  headers: {
    Cookie: cookie,
    Origin: 'https://untrusted.example',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: 'deposit', amount: 500, method: 'Crypto' }),
});
assert.equal(rejected.status, 403);
checks++;
await request('/api/session', { cookie, method: 'DELETE' });
console.log(
  `PASS: ${checks} HTTP route, access-control, workflow, idempotency, and origin checks. All roundtrip cash and holdings invariants passed.`,
);

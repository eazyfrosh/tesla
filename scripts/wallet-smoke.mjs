import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const origin = process.env.TEST_ORIGIN ?? 'http://127.0.0.1:3004';
async function req(path, { cookie = '', body, method, expected = 200, raw = false } = {}) {
  const response = await fetch(origin + path, {
    method: method ?? (body ? 'POST' : 'GET'),
    redirect: 'manual',
    headers: {
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body && !raw
        ? { 'Content-Type': 'application/json', 'idempotency-key': crypto.randomUUID() }
        : {}),
    },
    body: body ? (raw ? body : JSON.stringify(body)) : undefined,
  });
  if (expected === 307 && response.status === 200) {
    assert.match(await response.clone().text(), /NEXT_REDIRECT|http-equiv="refresh"/);
    return response;
  }
  assert.equal(
    response.status,
    expected,
    path +
      ' ' +
      (await response
        .clone()
        .text()
        .then((t) => t.slice(0, 140))),
  );
  return response;
}
const login = async (role) =>
  (await req('/api/session', { body: { demo: role } })).headers.get('set-cookie').split(';')[0];
await req('/admin/wallet-methods', { expected: 307 });
const admin = await login('admin'),
  user = await login('user');
await req('/admin/wallet-methods', { cookie: user, expected: 307 });
await req('/api/data?admin=true', { cookie: user, expected: 403 });
await req('/admin/wallet-methods', { cookie: admin });
await req('/admin/deposits', { cookie: admin });
await req('/admin/orders', { cookie: admin });
const png = await readFile('public/images/tesla-logo.png');
await req('/api/uploads?purpose=qr', { cookie: user, body: png, raw: true, expected: 403 });
await req('/api/uploads?purpose=proof', {
  cookie: user,
  body: Buffer.from('<svg>invalid</svg>'),
  raw: true,
  expected: 400,
});
const qr = (
  await (await req('/api/uploads?purpose=qr', { cookie: admin, body: png, raw: true })).json()
).url;
const proof = (
  await (await req('/api/uploads?purpose=proof', { cookie: user, body: png, raw: true })).json()
).url;
await req(qr, { cookie: user });
await req(proof, { cookie: user });
await req(proof, { cookie: admin });
await req(proof, { expected: 401 });
const wallet = {
  action: 'saveWalletMethod',
  assetName: 'Test USDT',
  symbol: 'USDT',
  network: 'TRC20',
  walletAddress: 'DEMO-ADDRESS-NO-REAL-PAYMENT',
  qrImage: qr,
  instructions: 'Never send funds. HTTP test fixture.',
  status: 'enabled',
  displayOrder: 999,
};
await req('/api/actions', { cookie: user, body: wallet, expected: 403 });
await req('/api/actions', { cookie: admin, body: wallet });
let snapshot = await (await req('/api/data?admin=true', { cookie: admin })).json();
const method = snapshot.walletMethods.find((m) => m.qrImage === qr);
await req('/api/actions', {
  cookie: admin,
  body: { ...wallet, id: method.id, walletAddress: 'DEMO-EDITED-ADDRESS' },
});
let data = await (await req('/api/data', { cookie: user })).json();
const before = data.portfolio.cashCents;
assert.equal(
  data.walletMethods.find((m) => m.id === method.id).walletAddress,
  'DEMO-EDITED-ADDRESS',
);
await req('/dashboard/deposit', { cookie: user });
const deposit = await (
  await req('/api/actions', {
    cookie: user,
    body: {
      action: 'deposit',
      amount: 12.34,
      method: 'USDT',
      walletMethodId: method.id,
      network: 'TRC20',
      externalReference: 'DEMO-HTTP-' + crypto.randomUUID(),
      proofImage: proof,
    },
  })
).json();
data = await (await req('/api/data', { cookie: user })).json();
assert.equal(data.portfolio.cashCents, before);
assert.equal(data.deposits.find((d) => d.id === deposit.id).status, 'pending');
const approval = { action: 'review', collection: 'deposits', id: deposit.id, status: 'Approved' };
await req('/api/actions', { cookie: user, body: approval, expected: 403 });
const results = await Promise.all(
  [1, 2].map(() =>
    fetch(origin + '/api/actions', {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: admin,
        'Content-Type': 'application/json',
        'idempotency-key': crypto.randomUUID(),
      },
      body: JSON.stringify(approval),
    }),
  ),
);
assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
data = await (await req('/api/data', { cookie: user })).json();
assert.equal(data.portfolio.cashCents, before + 1234);
assert.equal(data.transactions.filter((t) => t.id === deposit.id).length, 1);
assert.ok(data.notifications.some((n) => n.title === 'Deposit approved'));
await req('/api/actions', {
  cookie: admin,
  body: { ...wallet, id: method.id, status: 'disabled' },
});
console.log(
  'PASS: protected admin routes, address edits, QR/proof uploads, image access, submission, concurrent approval and single credit.',
);

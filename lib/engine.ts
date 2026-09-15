import { randomUUID } from 'node:crypto';
import type { Unit } from './store';
import type { Action } from './validation';
import type {
  WalletMethod,
  UploadRecord,
  UserProfile,
  Portfolio,
  Market,
  Plan,
  Vehicle,
  Activity,
  PlatformSettings,
} from './types';
export function cents(amount: number) {
  const value = Math.round(amount * 100);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error('Amount must be at least $0.01');
  return value;
}
function ensure(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export async function execute(u: Unit, user: UserProfile, a: Action, key: string) {
  const now = new Date().toISOString(),
    id = randomUUID();
  const base = { id, createdAt: now, updatedAt: now };
  const latest = await u.get<UserProfile>('users', user.uid);
  ensure(latest && !latest.disabled, 'Account unavailable');
  const prior = await u.get<{ result: { ok: boolean; id: string; message: string } }>(
    'idempotency',
    user.uid + '_' + key,
  );
  if (prior) return prior.result;
  const p = await u.get<Portfolio>('portfolios', user.uid);
  ensure(p, 'Portfolio unavailable');
  const available = () => p.cashCents - p.reservedCents;
  const changed = new Map<string, Portfolio>();
  const saveP = () => changed.set(p.id, p);
  const notice = (uid: string, title: string, message: string) => {
    const nid = randomUUID();
    u.set('notifications', nid, { ...base, id: nid, uid, title, message, read: false });
  };
  const record = (
    type: string,
    amountCents: number,
    status: string,
    details: string,
    extra: Partial<Activity> = {},
  ) => {
    const r: Activity = {
      ...base,
      uid: user.uid,
      type,
      amountCents,
      status,
      details,
      reference: 'SAMPLE-' + id.slice(0, 8).toUpperCase(),
      ...extra,
    };
    u.set('transactions', id, r);
    return r;
  };
  const adminActions = [
    'saveWalletMethod',
    'review',
    'userStatus',
    'savePlan',
    'saveVehicle',
    'deleteVehicle',
    'settings',
    'saveMarket',
    'saveContent',
    'notify',
  ];
  if (adminActions.includes(a.action))
    ensure(latest.role === 'admin', 'Administrator access required');
  if (['trade', 'deposit', 'withdraw', 'invest', 'order'].includes(a.action))
    ensure(
      latest.accountStatus.toLowerCase() === 'active',
      'Your account is under review or restricted',
    );
  if (a.action === 'trade') {
    const m = await u.get<Market>('marketData', a.symbol);
    ensure(m, 'Asset not found');
    ensure(a.orderType !== 'Limit' || a.limitPrice, 'Limit price is required');
    const amount = cents(a.quantity * (a.orderType === 'Limit' ? a.limitPrice! : m.price));
    let h = p.holdings.find((h) => h.symbol === a.symbol);
    if (a.side === 'Buy') {
      ensure(available() >= amount, 'Insufficient available practice funds');
      if (a.orderType === 'Limit') p.reservedCents += amount;
      else {
        p.cashCents -= amount;
        if (!h) {
          h = { symbol: a.symbol, quantity: 0, costCents: 0 };
          p.holdings.push(h);
        }
        h.quantity = Number((h.quantity + a.quantity).toFixed(6));
        h.costCents += amount;
      }
    } else {
      ensure(h && h.quantity >= a.quantity, 'Insufficient available holdings');
      const basis = Math.round((h.costCents * a.quantity) / h.quantity);
      h.quantity = Number((h.quantity - a.quantity).toFixed(6));
      h.costCents -= basis;
      if (a.orderType === 'Market') p.cashCents += amount;
    }
    const r = record(
      'Trade',
      amount,
      a.orderType === 'Limit' ? 'Pending' : 'Completed',
      `${a.side} ${a.quantity} ${a.symbol} · simulated`,
      {
        symbol: a.symbol,
        quantity: a.quantity,
        side: a.side,
        orderType: a.orderType,
        limitPrice: a.limitPrice ?? 0,
      },
    );
    // Pending sells remove the quantity from available holdings and retain its basis for cancellation.
    if (a.side === 'Sell' && a.orderType === 'Limit') {
      const old = (await u.get<Portfolio>('portfolios', user.uid))!.holdings.find(
        (h) => h.symbol === a.symbol,
      )!;
      u.set('transactions', id, {
        ...r,
        reservedBasisCents: Math.round((old.costCents * a.quantity) / old.quantity),
      });
    }
    saveP();
    notice(user.uid, 'Practice order ' + r.status.toLowerCase(), r.details);
  } else if (a.action === 'deposit' || a.action === 'withdraw') {
    const s = await u.get<PlatformSettings>('platformSettings', 'main');
    let wallet: WalletMethod | undefined;
    if (a.action === 'deposit' && a.walletMethodId) {
      wallet = await u.get<WalletMethod>('walletMethods', a.walletMethodId);
      ensure(wallet?.status === 'enabled', 'Wallet method is disabled');
      ensure(a.network === wallet.network, 'Network has changed. Refresh and try again.');
      ensure(a.externalReference?.trim(), 'Transaction/reference ID is required');
      if (a.proofImage) {
        const upload = await u.get<UploadRecord>('uploads', a.proofImage.split('/').pop()!);
        ensure(upload?.uid === user.uid && upload.purpose === 'proof', 'Invalid proof image');
      }
    } else ensure(s?.methods.includes(a.method), 'Payment method is disabled');
    const amount = cents(a.amount);
    if (a.action === 'withdraw') {
      ensure(available() >= amount, 'Insufficient available practice funds');
      p.reservedCents += amount;
      saveP();
    }
    const r = record(
      a.action === 'deposit' ? 'Deposit' : 'Withdrawal',
      amount,
      'Pending',
      'Simulated ' + a.method + ' request',
      {
        method: wallet ? wallet.assetName + ' (' + wallet.symbol + ')' : a.method,
        ...(wallet && a.action === 'deposit'
          ? {
              walletMethodId: wallet.id,
              network: wallet.network,
              walletAddress: wallet.walletAddress,
              externalReference: a.externalReference!,
              ...(a.proofImage ? { proofImage: a.proofImage } : {}),
            }
          : {}),
        ...(a.action === 'withdraw' ? { destination: a.destination } : {}),
      },
    );
    if (a.action === 'deposit') {
      r.status = 'pending';
      u.delete('transactions', id);
    }
    u.set(a.action === 'deposit' ? 'deposits' : 'withdrawals', id, r);
    notice(user.uid, r.type + ' submitted', 'Your simulated request is awaiting review.');
  } else if (a.action === 'invest') {
    const plan = await u.get<Plan>('investmentPlans', a.planId);
    ensure(plan?.active, 'Plan is unavailable');
    ensure(a.amount >= plan.min && a.amount <= plan.max, 'Amount outside plan limits');
    const amount = cents(a.amount);
    ensure(available() >= amount, 'Insufficient available practice funds');
    p.cashCents -= amount;
    p.totalInvested = (p.totalInvested ?? 0) + amount / 100;
    saveP();
    const r = record('Investment', amount, 'Active', plan.name + ' · simulated allocation', {
      planId: plan.id,
      duration: plan.duration,
    });
    u.set('investments', id, r);
    notice(
      user.uid,
      'Investment created',
      'Practice principal allocated. No returns are guaranteed or accrued.',
    );
  } else if (a.action === 'order') {
    const v = await u.get<Vehicle>('vehicles', a.vehicleId);
    ensure(v?.availability === 'Available', 'Vehicle is not available');
    const r = record(
      'Vehicle order',
      cents(v.price),
      'Submitted',
      v.make + ' ' + v.model + ' · simulated reservation',
      { vehicleId: v.id, timeline: [{ status: 'Submitted', at: now }] },
    );
    u.set('orders', id, r);
    u.set('vehicles', v.id, { ...v, availability: 'Reserved', updatedAt: now });
    notice(
      user.uid,
      'Vehicle order created',
      'Your practice reservation has been submitted. No payment was taken.',
    );
  } else if (a.action === 'review' || a.action === 'cancelTrade') {
    const collection = a.action === 'cancelTrade' ? 'transactions' : a.collection;
    const r = await u.get<Activity & { reservedBasisCents?: number }>(collection, a.id);
    ensure(r, 'Record not found');
    const status = a.action === 'cancelTrade' ? 'Cancelled' : a.status;
    if (a.action === 'cancelTrade')
      ensure(r.uid === user.uid && r.type === 'Trade', 'Cannot cancel this record');
    const target = await u.get<Portfolio>('portfolios', r.uid);
    ensure(target, 'Account portfolio missing');
    if (collection === 'deposits' || collection === 'withdrawals') {
      ensure(
        r.status.toLowerCase() === 'pending' && ['Approved', 'Rejected'].includes(status),
        'Request has already been reviewed or status is invalid',
      );
      if (collection === 'deposits' && status === 'Approved') {
        target.cashCents += r.amountCents;
        target.totalDeposits = (target.totalDeposits ?? 0) + r.amountCents / 100;
      }
      if (collection === 'withdrawals') {
        ensure(target.reservedCents >= r.amountCents, 'Reserved balance mismatch');
        target.reservedCents -= r.amountCents;
        if (status === 'Approved') {
          target.cashCents -= r.amountCents;
          target.totalWithdrawals = (target.totalWithdrawals ?? 0) + r.amountCents / 100;
        }
      }
    } else if (collection === 'investments') {
      ensure(
        r.status === 'Active' && ['Completed', 'Cancelled'].includes(status),
        'Invalid investment transition',
      );
      target.cashCents += r.amountCents;
      target.totalInvested = Math.max(0, (target.totalInvested ?? 0) - r.amountCents / 100);
    } else if (collection === 'orders') {
      const transitions: Record<string, string[]> = {
        Submitted: ['Processing', 'Cancelled'],
        Processing: ['Confirmed', 'Cancelled'],
        Confirmed: ['Preparing', 'Cancelled'],
        Preparing: ['Shipped'],
        Shipped: ['Delivered'],
      };
      ensure(transitions[r.status]?.includes(status), 'Invalid order transition');
      r.timeline = [...(r.timeline ?? []), { status, at: now }];
      if (status === 'Cancelled') {
        const vehicle = await u.get<Vehicle>('vehicles', r.vehicleId!);
        if (vehicle)
          u.set('vehicles', vehicle.id, { ...vehicle, availability: 'Available', updatedAt: now });
      }
    } else {
      ensure(
        r.type === 'Trade' &&
          r.status === 'Pending' &&
          ['Completed', 'Cancelled', 'Rejected'].includes(status),
        'Invalid trade transition',
      );
      const m = await u.get<Market>('marketData', r.symbol!);
      ensure(m, 'Market not found');
      let h = target.holdings.find((h) => h.symbol === r.symbol);
      if (status === 'Completed')
        ensure(
          r.side === 'Buy' ? m.price <= r.limitPrice! : m.price >= r.limitPrice!,
          'Limit price has not been reached',
        );
      if (r.side === 'Buy') {
        target.reservedCents -= r.amountCents;
        if (status === 'Completed') {
          const cost = cents(r.quantity! * m.price);
          target.cashCents -= cost;
          if (!h) {
            h = { symbol: r.symbol!, quantity: 0, costCents: 0 };
            target.holdings.push(h);
          }
          h.quantity = Number((h.quantity + r.quantity!).toFixed(6));
          h.costCents += cost;
          r.amountCents = cost;
        }
      } else if (status === 'Completed') {
        r.amountCents = cents(r.quantity! * m.price);
        target.cashCents += r.amountCents;
      } else {
        if (!h) {
          h = { symbol: r.symbol!, quantity: 0, costCents: 0 };
          target.holdings.push(h);
        }
        h.quantity = Number((h.quantity + r.quantity!).toFixed(6));
        h.costCents += r.reservedBasisCents ?? 0;
      }
    }
    ensure(
      target.cashCents >= 0 &&
        target.reservedCents >= 0 &&
        target.cashCents >= target.reservedCents,
      'Balance invariant failed',
    );
    changed.set(target.id, target);
    const updated = {
      ...r,
      status: collection === 'deposits' ? status.toLowerCase() : status,
      updatedAt: now,
    };
    u.set(collection, r.id, updated);
    if (collection !== 'deposits' || status === 'Approved') u.set('transactions', r.id, updated);
    notice(
      r.uid,
      r.type + ' ' + status.toLowerCase(),
      'Your simulated ' + r.type.toLowerCase() + ' status has changed.',
    );
  } else if (a.action === 'profile') {
    u.set('users', user.uid, { ...latest, ...a.profile, updatedAt: now });
  } else if (a.action === 'preferences') {
    u.set('users', user.uid, {
      ...latest,
      currency: a.currency,
      theme: a.theme,
      notifications: a.notifications,
      updatedAt: now,
    });
  } else if (a.action === 'readNotification') {
    const n = await u.get<{ uid: string }>('notifications', a.id);
    ensure(n?.uid === user.uid, 'Notification not found');
    u.set('notifications', a.id, { ...n, read: true, updatedAt: now });
  } else if (a.action === 'userStatus') {
    ensure(a.id !== user.uid, 'You cannot restrict your own administrator account');
    const target = await u.get<UserProfile>('users', a.id);
    ensure(target, 'User not found');
    u.set('users', a.id, {
      ...target,
      disabled: a.disabled,
      accountStatus: a.accountStatus,
      updatedAt: now,
    });
  } else if (a.action === 'saveWalletMethod') {
    if (a.qrImage) {
      const upload = await u.get<UploadRecord>('uploads', a.qrImage.split('/').pop()!);
      ensure(upload?.purpose === 'qr', 'Invalid QR image');
    }
    const rid = a.id || id;
    const previous = await u.get<WalletMethod>('walletMethods', rid);
    const { action, ...fields } = a;
    void action;
    u.set('walletMethods', rid, {
      ...base,
      ...fields,
      id: rid,
      createdAt: previous?.createdAt ?? now,
    });
  } else if (a.action === 'savePlan' || a.action === 'saveVehicle') {
    const collection = a.action === 'savePlan' ? 'investmentPlans' : 'vehicles';
    const rid = a.id || id;
    const prev = await u.get<{ createdAt: string }>(collection, rid);
    const { action, ...data } = a;
    void action;
    u.set(collection, rid, { ...base, ...data, id: rid, createdAt: prev?.createdAt ?? now });
  } else if (a.action === 'deleteVehicle') {
    const v = await u.get<Vehicle>('vehicles', a.id);
    ensure(v && v.availability !== 'Reserved', 'Reserved vehicles cannot be deleted');
    u.delete('vehicles', a.id);
  } else if (a.action === 'settings') {
    const { action, ...data } = a;
    void action;
    u.set('platformSettings', 'main', { ...base, ...data, id: 'main' });
  } else if (a.action === 'saveMarket') {
    const m = await u.get<Market>('marketData', a.id);
    ensure(m, 'Market not found');
    u.set('marketData', a.id, { ...m, price: a.price, change: a.change, updatedAt: now });
  } else if (a.action === 'saveContent') {
    u.set('content', a.id, { ...base, id: a.id, title: a.title, body: a.body });
  } else if (a.action === 'notify') {
    ensure(await u.get('users', a.uid), 'Recipient not found');
    notice(a.uid, a.title, a.message);
  }
  for (const portfolio of changed.values()) {
    let held = 0,
      cost = 0;
    for (const holding of portfolio.holdings) {
      const quote = await u.get<Market>('marketData', holding.symbol);
      held += holding.quantity * (quote?.price ?? 0);
      cost += holding.costCents / 100;
    }
    u.set('portfolios', portfolio.id, {
      ...portfolio,
      balance: portfolio.cashCents / 100,
      availableBalance: (portfolio.cashCents - portfolio.reservedCents) / 100,
      pendingBalance: portfolio.reservedCents / 100,
      portfolioValue: portfolio.cashCents / 100 + held + (portfolio.totalInvested ?? 0),
      totalProfit: Math.max(0, held - cost),
      totalLoss: Math.max(0, cost - held),
      currency: 'USD',
      updatedAt: now,
    });
  }
  const result = { ok: true, id, message: 'Practice ' + a.action + ' saved' };
  u.set('idempotency', user.uid + '_' + key, { ...base, uid: user.uid, result });
  if (adminActions.includes(a.action))
    u.set('auditLogs', id, {
      ...base,
      actor: user.uid,
      action: a.action,
      target: 'id' in a ? a.id : null,
    });
  return result;
}

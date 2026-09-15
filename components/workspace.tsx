'use client';
import { WalletDeposit } from './wallet-methods';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  ArrowLeftRight,
  BriefcaseBusiness,
  Layers,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText,
  Car,
  Package,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ArrowUpRight,
  Plus,
  ArrowRight,
  ShieldCheck,
  Users,
  FileText,
  Globe,
  ChevronDown,
  Zap,
} from 'lucide-react';
import type { Snapshot, Plan, Activity } from '@/lib/types';
import {
  Logo,
  StatCard,
  PortfolioChart,
  AllocationChart,
  MarketCard,
  VehicleCard,
  InvestmentPlanCard,
  TransactionTable,
  NotificationItem,
  StatusBadge,
  EmptyState,
  Modal,
  money,
  date,
} from './ui';
import { VehicleCatalog, VehicleDetail } from './catalog';
import { AdminContent } from './admin';
import { clientAuth } from '@/lib/firebase-client';
import { sendPasswordResetEmail } from 'firebase/auth';
const links = [
  ['Dashboard', '', LayoutDashboard],
  ['Markets', 'markets', ChartNoAxesCombined],
  ['Trade', 'trade', ArrowLeftRight],
  ['Portfolio', 'portfolio', BriefcaseBusiness],
  ['Investments', 'investments', Layers],
  ['Wallet', 'wallet', Wallet],
  ['Deposit', 'deposit', ArrowDownToLine],
  ['Withdraw', 'withdraw', ArrowUpFromLine],
  ['Transactions', 'transactions', ReceiptText],
  ['Vehicles', 'vehicles', Car],
  ['Orders', 'orders', Package],
  ['Notifications', 'notifications', Bell],
  ['Profile', 'profile', User],
  ['Settings', 'settings', Settings],
] as const;
const adminLinks = [
  ['Overview', '', LayoutDashboard],
  ['Users', 'users', Users],
  ['Transactions', 'transactions', ReceiptText],
  ['Deposits', 'deposits', ArrowDownToLine],
  ['Wallet Methods', 'wallet-methods', Wallet],
  ['Withdrawals', 'withdrawals', ArrowUpFromLine],
  ['Investments', 'investments', Layers],
  ['Investment Plans', 'investment-plans', BriefcaseBusiness],
  ['Markets', 'markets', ChartNoAxesCombined],
  ['Vehicles', 'vehicles', Car],
  ['Vehicle Orders', 'vehicle-orders', Package],
  ['Notifications', 'notifications', Bell],
  ['Content', 'content', FileText],
  ['Settings', 'settings', Settings],
] as const;
export type RunAction = (data: Record<string, unknown>) => Promise<boolean>;
export function Sidebar({
  admin,
  section,
  open,
  onClose,
}: {
  admin: boolean;
  section: string;
  open: boolean;
  onClose: () => void;
}) {
  const base = admin ? '/admin' : '/dashboard';
  return (
    <>
      <div className={open ? 'drawer-backdrop visible' : 'drawer-backdrop'} onClick={onClose} />
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <div className="row">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <span className="sidebar-label">{admin ? 'ADMINISTRATION' : 'YOUR WORKSPACE'}</span>
        <nav aria-label={admin ? 'Admin navigation' : 'Dashboard navigation'}>
          {(admin ? adminLinks : links).map(([name, path, Icon], i) => (
            <Link
              className={
                (section === path ? 'active ' : '') +
                (!admin && [5, 9, 12].includes(i) ? 'nav-divider' : '')
              }
              key={path}
              href={base + (path ? '/' + path : '')}
              onClick={onClose}
            >
              <Icon size={18} />
              {name}
              {path === 'trade' && <span className="nav-new"></span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox-note">
            <span className="red-dot" />
            <b> mode</b>
            <p>
              All activity is simulated.
              <br />
              No real funds.
            </p>
          </div>
          <Link href={admin ? '/dashboard' : '/'} className="sidebar-exit">
            <Globe size={17} />
            {admin ? 'User workspace' : 'Back to website'}
          </Link>
          <button
            className="sidebar-exit"
            onClick={async () => {
              await fetch('/api/session', { method: 'DELETE' });
              window.location.assign('/login');
            }}
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
export function Topbar({
  data,
  admin,
  onMenu,
}: {
  data: Snapshot;
  admin: boolean;
  onMenu: () => void;
}) {
  return (
    <header className="topbar">
      <div className="row">
        <button className="icon-button mobile-only" onClick={onMenu} aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <span className="topbar-breadcrumb">
          {data.settings.name} <span>/</span> <b>{admin ? 'Administration' : 'Overview'}</b>
        </span>
      </div>
      <div className="topbar-actions">
        <Link href="/dashboard/markets" className="topbar-search">
          <Search size={16} />
          <span>Explore markets</span>
          <kbd>↗</kbd>
        </Link>
        <span className="demo-pill"> ACCOUNT</span>
        <Link
          className="icon-button notification-bell"
          href="/dashboard/notifications"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {data.user.notifications && data.notifications.some((n) => !n.read) && <i />}
        </Link>
        <Link href="/dashboard/profile" className="avatar">
          {data.user.image ? (
            <img src={data.user.image} alt="Profile" />
          ) : (
            data.user.fullName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
          )}
        </Link>
      </div>
    </header>
  );
}
export function Workspace({
  initial,
  path = [],
  admin = false,
  local = false,
}: {
  initial: Snapshot;
  path?: string[];
  admin?: boolean;
  local?: boolean;
}) {
  const [data, setData] = useState(initial),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const section = path[0] ?? '';
  useEffect(() => {
    setData(initial);
  }, [initial]);
  const run: RunAction = async (payload) => {
    if (busy) return false;
    setBusy(true);
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const refresh = await fetch('/api/data' + (admin ? '?admin=true' : ''), {
        cache: 'no-store',
      });
      if (!refresh.ok) throw new Error('Saved, but refresh failed. Reload this page.');
      setData(await refresh.json());
      setToast({ text: result.message, error: false });
      return true;
    } catch (e) {
      setToast({ text: (e as Error).message, error: true });
      return false;
    } finally {
      setBusy(false);
    }
  };
  const activeTitle = (admin ? adminLinks : links).find((l) => l[1] === section)?.[0] ?? 'Overview';
  return (
    <div className="workspace">
      <Sidebar admin={admin} section={section} open={open} onClose={() => setOpen(false)} />
      <div className="workspace-main">
        <Topbar data={data} admin={admin} onMenu={() => setOpen(true)} />
        <main className="workspace-content">
          <div className="demo-banner">
            <ShieldCheck size={15} />
            <span>
              {local ? 'Local sandbox · ' : ''}
              {data.settings.announcement || 'Simulated account · Not real funds'}
            </span>
            <Link href="/risk-warning">
              Learn more <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="page-heading">
            <div>
              <span className="eyebrow muted">
                {admin ? 'CONTROL CENTER' : section ? 'YOUR WORKSPACE' : 'YOUR DAILY PERSPECTIVE'}
              </span>
              <h1>
                {section
                  ? activeTitle
                  : admin
                    ? 'Platform overview'
                    : `Welcome back, ${data.user.fullName.split(' ')[0]}.`}{' '}
                {!section && !admin && <span className="wave">✦</span>}
              </h1>
              <p className="muted">
                {section
                  ? 'Every value and action in this workspace is simulated.'
                  : admin
                    ? 'A clear view of your platform and pending activity.'
                    : 'Here’s where you stand. Let’s make your next move count.'}
              </p>
            </div>
            {!section && (
              <div className="heading-actions">
                <Link href={admin ? '/admin/deposits' : '/dashboard/deposit'} className="button">
                  <Plus size={17} />
                  {admin ? 'Review requests' : 'Add funds'}
                </Link>
                {!admin && (
                  <Link href="/dashboard/trade" className="button secondary">
                    <ArrowLeftRight size={16} />
                    Trade
                  </Link>
                )}
              </div>
            )}
          </div>
          <div aria-busy={busy}>
            {admin ? (
              <AdminContent section={section} detail={path[1]} data={data} run={run} busy={busy} />
            ) : (
              <UserContent section={section} detail={path[1]} data={data} run={run} busy={busy} />
            )}
          </div>
          <div className="workspace-footer">
            <span>VOLTERRA · financial platform</span>
            <span>
              <span className="red-dot" /> All systems simulated
            </span>
          </div>
        </main>
      </div>
      {toast && (
        <div
          className={'toast ' + (toast.error ? 'toast-error' : '')}
          role={toast.error ? 'alert' : 'status'}
        >
          <span>{toast.text}</span>
          <button
            aria-label="Dismiss notification"
            className="icon-button"
            onClick={() => setToast(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
function amounts(data: Snapshot) {
  const holdings = data.portfolio.holdings.map((h) => ({
    ...h,
    market: data.markets.find((m) => m.symbol === h.symbol),
    value: h.quantity * (data.markets.find((m) => m.symbol === h.symbol)?.price ?? 0),
  }));
  const invested = data.investments
    .filter((i) => i.status === 'Active')
    .reduce((s, i) => s + i.amountCents / 100, 0);
  const held = holdings.reduce((s, h) => s + h.value, 0),
    cost = holdings.reduce((s, h) => s + h.costCents / 100, 0);
  const pendingSell = data.transactions
    .filter((t) => t.type === 'Trade' && t.side === 'Sell' && t.status === 'Pending')
    .reduce(
      (s, t) =>
        s + (t.quantity ?? 0) * (data.markets.find((m) => m.symbol === t.symbol)?.price ?? 0),
      0,
    );
  return {
    holdings,
    invested,
    held,
    cost,
    total: held + invested + pendingSell + data.portfolio.cashCents / 100,
    profit: held - cost,
  };
}
function UserContent({
  section,
  detail,
  data,
  run,
  busy,
}: {
  section: string;
  detail?: string;
  data: Snapshot;
  run: RunAction;
  busy: boolean;
}) {
  const a = amounts(data),
    [chosen, setChosen] = useState<Plan | null>(null);
  const available = (data.portfolio.cashCents - data.portfolio.reservedCents) / 100;
  const allocation = [
    {
      name: 'Stocks',
      value: a.holdings
        .filter((h) => h.market?.category === 'Stocks')
        .reduce((s, h) => s + h.value, 0),
    },
    {
      name: 'Crypto',
      value: a.holdings
        .filter((h) => h.market?.category === 'Crypto')
        .reduce((s, h) => s + h.value, 0),
    },
    { name: 'Cash', value: data.portfolio.cashCents / 100 },
    { name: 'Plans', value: a.invested },
  ].filter((x) => x.value > 0);
  if (section === 'markets' && !detail) return <MarketExplorer data={data} />;
  if (section === 'trade' || (section === 'markets' && detail)) {
    const market = data.markets.find((m) => m.symbol === detail);
    return (
      <div className="grid trade-grid">
        <section className="card">
          <div className="row">
            <div>
              <span className="eyebrow muted">MARKET</span>
              <h2>{market ? market.name : 'Your trading workspace'}</h2>
              {market && (
                <strong className="detail-price">
                  {money(market.price)} <span className="small positive">{market.change}%</span>
                </strong>
              )}
            </div>
            <span className="demo-pill">SIMULATED QUOTES</span>
          </div>
          <PortfolioChart compact basePrice={market?.price ?? data.markets[0].price} />
          <div className="grid three mini-stats">
            <div>
              <span>Asset class</span>
              <b>{market?.category ?? 'Multi-asset'}</b>
            </div>
            <div>
              <span>Execution</span>
              <b>Simulated</b>
            </div>
            <div>
              <span>Trading fees</span>
              <b>$0 </b>
            </div>
          </div>
          <h3>Open & recent orders</h3>
          <TransactionTable
            rows={data.transactions.filter((r) => r.type === 'Trade')}
            compact
            onCancel={(id) => void run({ action: 'cancelTrade', id })}
          />
        </section>
        <TradeForm
          key={market?.symbol ?? 'trade'}
          data={data}
          run={run}
          busy={busy}
          symbol={market?.symbol}
        />
      </div>
    );
  }
  if (section === 'portfolio')
    return (
      <>
        <div className="grid four">
          <StatCard label="Total portfolio value" value={money(a.total)} />
          <StatCard
            label="Simulated daily change"
            value={money(
              a.holdings.reduce((s, h) => s + (h.value * (h.market?.change ?? 0)) / 100, 0),
            )}
          />
          <StatCard label="Unrealized return" value={money(a.profit)} />
          <StatCard
            label="Return on held cost"
            value={(a.cost ? (a.profit / a.cost) * 100 : 0).toFixed(2) + '%'}
          />
        </div>
        <div className="grid dashboard-charts">
          <section className="card">
            {a.total === 0 && !data.transactions.length ? (
              <EmptyState
                title="Your portfolio is empty."
                description="Your account starts at $0. Activity will appear here after you use the practice workspace."
              />
            ) : (
              <PortfolioChart basePrice={a.total} />
            )}
          </section>
          <section className="card">
            <h3>Asset allocation</h3>
            <AllocationChart data={allocation} />
          </section>
        </div>
        <section className="card">
          <h3>Your holdings</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    'Asset',
                    'Symbol',
                    'Quantity',
                    'Average price',
                    'Current price',
                    'Value',
                    'Profit / loss',
                    'Return',
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.holdings
                  .filter((h) => h.quantity > 0)
                  .map((h) => (
                    <tr key={h.symbol}>
                      <td>{h.market?.name}</td>
                      <td>{h.symbol}</td>
                      <td>{h.quantity}</td>
                      <td>{money(h.costCents / 100 / h.quantity)}</td>
                      <td>{money(h.market?.price ?? 0)}</td>
                      <td>{money(h.value)}</td>
                      <td className={h.value >= h.costCents / 100 ? 'positive' : 'negative'}>
                        {money(h.value - h.costCents / 100)}
                      </td>
                      <td>
                        {(h.costCents ? (h.value / (h.costCents / 100) - 1) * 100 : 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!a.held && (
            <EmptyState
              title="Your portfolio is empty."
              description="Place a simulated trade to add a holding."
            />
          )}
        </section>
      </>
    );
  if (section === 'investments')
    return (
      <>
        <div className="grid three">
          <StatCard label="Allocated principal" value={money(a.invested)} />
          <StatCard
            label="Active allocations"
            value={String(data.investments.filter((i) => i.status === 'Active').length)}
          />
          <StatCard label="Available cash" value={money(available)} />
        </div>
        <div className="section-heading compact">
          <h2>Choose your horizon.</h2>
          <span className="muted small">No guaranteed or accrued returns</span>
        </div>
        <div className="grid four">
          {data.plans
            .filter((p) => p.active)
            .map((p) => (
              <InvestmentPlanCard key={p.id} plan={p} onSelect={setChosen} />
            ))}
        </div>
        <section className="card top-space">
          <h3>Your investment activity</h3>
          {data.investments.length ? (
            <TransactionTable rows={data.investments} />
          ) : (
            <EmptyState
              title="No investments yet."
              description="Your practice investments will appear here."
            />
          )}
        </section>
        {chosen && (
          <Modal title={chosen.name + ' allocation'} onClose={() => setChosen(null)}>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                const amount = Number(new FormData(e.currentTarget).get('amount'));
                if (await run({ action: 'invest', planId: chosen.id, amount })) setChosen(null);
              }}
            >
              <p className="muted">
                {chosen.duration}-day activity duration · {chosen.risk} risk. Principal is locked
                until an administrator completes or cancels the allocation. No returns accrue.
              </p>
              <label>
                Amount in simulated USD
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min={chosen.min}
                  max={chosen.max}
                  defaultValue={chosen.min}
                  required
                />
              </label>
              <p className="small muted">
                Range {money(chosen.min)} – {money(chosen.max)}
              </p>
              <button className="button" disabled={busy}>
                Confirm allocation
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  if (section === 'wallet')
    return (
      <>
        <div className="wallet-overview">
          <section className="card wallet-main">
            <div className="row">
              <span className="eyebrow">YOUR WALLET</span>
              <Wallet size={26} />
            </div>
            <h2>{money(data.portfolio.cashCents / 100)}</h2>
            <p className="muted">Simulated USD · not real funds</p>
            <div className="row">
              <Link className="button" href="/dashboard/deposit">
                <Plus size={17} />
                Deposit
              </Link>
              <Link className="button secondary" href="/dashboard/withdraw">
                <ArrowUpRight size={17} />
                Withdraw
              </Link>
            </div>
          </section>
          <StatCard label="Available balance" value={money(available)} />
          <StatCard
            label="Reserved / pending balance"
            value={money(data.portfolio.reservedCents / 100)}
          />
        </div>
        <section className="card top-space">
          <h3>Wallet activity</h3>
          <TransactionTable
            rows={data.transactions.filter((r) => ['Deposit', 'Withdrawal'].includes(r.type))}
          />
        </section>
      </>
    );
  if (section === 'deposit' || section === 'withdraw')
    return (
      <div className="grid trade-grid">
        {section === 'deposit' ? (
          <div className="grid">
            <WalletDeposit data={data} run={run} busy={busy} />
            <details className="card">
              <summary>Other practice payment methods</summary>
              <FundingForm kind="deposit" data={data} run={run} busy={busy} />
            </details>
          </div>
        ) : (
          <FundingForm kind={section} data={data} run={run} busy={busy} />
        )}
        <section className="card">
          <h3>Your recent {section === 'deposit' ? 'deposits' : 'withdrawals'}</h3>
          <TransactionTable
            rows={section === 'deposit' ? data.deposits : data.withdrawals}
            compact
          />
        </section>
      </div>
    );
  if (section === 'transactions')
    return (
      <section className="card">
        <TransactionTable
          rows={data.transactions}
          onCancel={(id) => void run({ action: 'cancelTrade', id })}
        />
      </section>
    );
  if (section === 'vehicles') {
    const vehicle = data.vehicles.find((v) => v.id === detail);
    return vehicle ? (
      <VehicleDetail
        vehicle={vehicle}
        busy={busy}
        onOrder={() => void run({ action: 'order', vehicleId: vehicle.id })}
      />
    ) : (
      <VehicleCatalog vehicles={data.vehicles} dashboard />
    );
  }
  if (section === 'orders') {
    const order = data.orders.find((o) => o.id === detail);
    if (order)
      return (
        <section className="card order-detail">
          <span className="demo-pill">RESERVATION</span>
          <h2>{order.details}</h2>
          <p className="muted">
            {order.reference} · Submitted {date(order.createdAt)}
          </p>
          <StatusBadge status={order.status} />
          <div className="order-timeline">
            {[
              'Submitted',
              'Processing',
              'Confirmed',
              'Preparing',
              'Shipped',
              'Delivered',
              ...(order.status === 'Cancelled' ? ['Cancelled'] : []),
            ].map((s) => {
              const entry = order.timeline?.find((t) => t.status === s);
              return (
                <div className={entry ? 'done' : ''} key={s}>
                  <i />
                  <b>{s}</b>
                  <span className="muted small">{entry ? date(entry.at) : 'Awaiting update'}</span>
                </div>
              );
            })}
          </div>
          <p className="muted">
            This timeline represents a simulated order. No payment, shipment, or delivery occurs.
          </p>
          <Link href="/dashboard/orders" className="button secondary">
            Back to orders
          </Link>
        </section>
      );
    return (
      <section className="card">
        <h3>Your reservations</h3>
        {data.orders.length ? (
          data.orders.map((o) => (
            <Link key={o.id} href={'/dashboard/orders/' + o.id} className="order-row">
              <Package size={22} />
              <div>
                <h3>{o.details}</h3>
                <span className="small muted">
                  {o.reference} · {date(o.createdAt)}
                </span>
              </div>
              <StatusBadge status={o.status} />
              <ArrowRight size={18} />
            </Link>
          ))
        ) : (
          <EmptyState
            title="Your next electric chapter awaits"
            description="Explore the vehicle collection to create a reservation."
          />
        )}
        <Link className="button secondary" href="/dashboard/vehicles">
          Explore vehicles
          <ArrowRight size={17} />
        </Link>
      </section>
    );
  }
  if (section === 'notifications')
    return (
      <section className="card">
        <h3>Your latest updates</h3>
        {data.notifications.length ? (
          data.notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notice={n}
              onRead={(id) => void run({ action: 'readNotification', id })}
            />
          ))
        ) : (
          <EmptyState
            title="You’re all caught up"
            description="Updates about your simulated activity will appear here."
          />
        )}
      </section>
    );
  if (section === 'profile' || section === 'settings')
    return <AccountForm section={section} data={data} run={run} busy={busy} />;
  return (
    <>
      <div className="grid four">
        <StatCard
          label="Total portfolio value"
          value={money(a.total)}
          change={'+' + (a.cost ? (a.profit / a.cost) * 100 : 0).toFixed(2) + '% unrealized'}
        />
        <StatCard
          label="Wallet balance"
          value={money(data.portfolio.cashCents / 100)}
          icon={<Wallet size={17} />}
        />
        <StatCard
          label="Invested amount"
          value={money(a.held + a.invested)}
          icon={<Layers size={17} />}
        />
        <StatCard
          label="Total unrealized P/L"
          value={money(a.profit)}
          change={
            (a.profit >= 0 ? '+' : '') +
            (a.cost ? (a.profit / a.cost) * 100 : 0).toFixed(2) +
            '% on holdings'
          }
        />
      </div>
      <div className="grid dashboard-charts">
        <section className="card">
          {a.total === 0 && !data.transactions.length ? (
            <EmptyState title="Your portfolio is empty." description="No account activity yet." />
          ) : (
            <PortfolioChart basePrice={a.total} />
          )}
          <div className="chart-summary">
            <span>
              Available <b>{money(available)}</b>
            </span>
            <span>
              Active plans <b>{data.investments.filter((i) => i.status === 'Active').length}</b>
            </span>
            <span>
              Currency <b>USD</b>
            </span>
          </div>
        </section>
        <section className="card">
          <div className="row">
            <h3>Portfolio allocation</h3>
            <BriefcaseBusiness className="muted" size={17} />
          </div>
          <AllocationChart data={allocation} />
        </section>
      </div>
      <div className="section-heading compact">
        <h2>
          Market overview <span className="badge neutral"></span>
        </h2>
        <Link href="/dashboard/markets" className="text-link small">
          All markets
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="grid four">
        {data.markets.slice(0, 4).map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>
      <section className="card top-space">
        <div className="row">
          <h3>Recent transactions</h3>
          <Link href="/dashboard/transactions" className="text-link small">
            View all
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <TransactionTable rows={data.transactions} compact />
      </section>
      <div className="section-heading compact">
        <div>
          <span className="eyebrow muted">A DIFFERENT KIND OF DRIVE</span>
          <h2>Explore electric.</h2>
        </div>
        <Link className="text-link small" href="/dashboard/vehicles">
          View collection
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="grid three">
        {data.vehicles.slice(0, 3).map((v) => (
          <VehicleCard key={v.id} vehicle={v} dashboard />
        ))}
      </div>
      <div className="section-heading compact">
        <h2>Build your next strategy.</h2>
        <Link href="/dashboard/investments" className="text-link small">
          All plans
          <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="grid two">
        {data.plans
          .filter((p) => p.active)
          .slice(0, 2)
          .map((p) => (
            <InvestmentPlanCard key={p.id} plan={p} href="/dashboard/investments" />
          ))}
      </div>
    </>
  );
}
function MarketExplorer({ data }: { data: Snapshot }) {
  const [q, setQ] = useState(''),
    [category, setCategory] = useState('All assets');
  const rows = data.markets.filter(
    (m) =>
      (m.symbol + ' ' + m.name).toLowerCase().includes(q.toLowerCase()) &&
      (category === 'All assets' || m.category === category),
  );
  return (
    <>
      <div className="market-explorer-top">
        <div className="segmented">
          {['All assets', 'Stocks', 'Crypto', 'Forex', 'Commodities', 'Indices'].map((c) => (
            <button
              key={c}
              className={category === c ? 'active' : ''}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          aria-label="Search markets"
          placeholder="Search assets…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="grid four">
        {rows.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}
      </div>
      {!rows.length && (
        <EmptyState title="No matching assets" description="Try another symbol or asset class." />
      )}
    </>
  );
}
function TradeForm({
  data,
  run,
  busy,
  symbol,
}: {
  data: Snapshot;
  run: RunAction;
  busy: boolean;
  symbol?: string;
}) {
  const [side, setSide] = useState('Buy'),
    [asset, setAsset] = useState(symbol ?? 'TSLA'),
    [type, setType] = useState('Market'),
    [quantity, setQuantity] = useState('1'),
    [limit, setLimit] = useState('250');
  const market = data.markets.find((m) => m.symbol === asset)!;
  const price = type === 'Market' ? market.price : Number(limit);
  return (
    <form
      className="card form trade-form"
      onSubmit={async (e) => {
        e.preventDefault();
        await run({
          action: 'trade',
          symbol: asset,
          side,
          orderType: type,
          quantity: Number(quantity),
          ...(type === 'Limit' ? { limitPrice: Number(limit) } : {}),
        });
      }}
    >
      <div className="row">
        <h3>Place an order</h3>
        <ArrowLeftRight size={18} />
      </div>
      <div className="segmented full">
        {['Buy', 'Sell'].map((s) => (
          <button
            type="button"
            key={s}
            className={side === s ? 'active ' + s.toLowerCase() : ''}
            onClick={() => setSide(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <label>
        Asset
        <select value={asset} onChange={(e) => setAsset(e.target.value)}>
          {data.markets.map((m) => (
            <option value={m.symbol} key={m.id}>
              {m.symbol.replace('-', '/')} · {m.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Order type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>Market</option>
          <option>Limit</option>
        </select>
      </label>
      {type === 'Limit' && (
        <label>
          Limit price · USD
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
        </label>
      )}
      <label>
        Quantity
        <input
          type="number"
          step="0.000001"
          min="0.000001"
          max="1000000"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </label>
      <label>
        Amount · simulated USD
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={
            Number.isFinite(price * Number(quantity)) ? (price * Number(quantity)).toFixed(2) : ''
          }
          onChange={(e) => setQuantity((Number(e.target.value) / price).toFixed(6))}
          required
        />
      </label>
      <div className="order-estimate">
        <div className="row">
          <span>Current price</span>
          <b>{money(market.price)}</b>
        </div>
        <div className="row">
          <span>Available balance</span>
          <b>{money((data.portfolio.cashCents - data.portfolio.reservedCents) / 100)}</b>
        </div>
        <div className="row">
          <span>Estimated total</span>
          <strong>{money(price * Number(quantity) || 0)}</strong>
        </div>
      </div>
      <button className="button full" disabled={busy}>
        {busy ? 'Submitting…' : side + ' ' + asset.replace('-', '/')}
        <ArrowRight size={17} />
      </button>
      <p className="micro muted">
        {type === 'Limit'
          ? 'Limit orders reserve funds or holdings and await eligible administrator execution.'
          : 'Executed against the latest server quote. No real exchange or funds.'}
      </p>
    </form>
  );
}
function FundingForm({
  kind,
  data,
  run,
  busy,
}: {
  kind: 'deposit' | 'withdraw';
  data: Snapshot;
  run: RunAction;
  busy: boolean;
}) {
  const [method, setMethod] = useState(data.settings.methods[0] ?? '');
  return (
    <form
      className="card form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget,
          f = new FormData(form);
        if (
          await run({
            action: kind,
            method,
            amount: Number(f.get('amount')),
            ...(kind === 'withdraw' ? { destination: f.get('destination') } : {}),
          })
        )
          form.reset();
      }}
    >
      <span className="demo-pill">NOT REAL FUNDS</span>
      <h2>{kind === 'deposit' ? 'Fund your next idea.' : 'Request a withdrawal.'}</h2>
      <p className="muted">
        {kind === 'deposit'
          ? 'Submit a simulated funding request for administrator review. Never send a real payment.'
          : 'The requested amount is reserved immediately. Approval deducts it; rejection releases it.'}
      </p>
      <label>
        Amount · simulated USD
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          max="1000000"
          placeholder="0.00"
          required
        />
      </label>
      <label>
        Payment method
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {data.settings.methods.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      {kind === 'withdraw' && (
        <label>
          destination details
          <input
            name="destination"
            placeholder="e.g. wallet ALPHA-01"
            minLength={4}
            maxLength={200}
            required
          />
        </label>
      )}
      <div className="alert">
        <ShieldCheck size={19} />
        <p>
          This workflow is for only. Do not enter card numbers, bank account numbers, crypto
          addresses, or private keys. No payment will be processed.
        </p>
      </div>
      <button className="button" disabled={busy || !data.settings.methods.length}>
        {busy ? 'Submitting…' : 'Submit ' + kind}
        <ArrowRight size={17} />
      </button>
      {!data.settings.methods.length && (
        <p className="negative">All payment methods are disabled.</p>
      )}
    </form>
  );
}
function AccountForm({
  section,
  data,
  run,
  busy,
}: {
  section: string;
  data: Snapshot;
  run: RunAction;
  busy: boolean;
}) {
  const [message, setMessage] = useState('');
  return (
    <div className="grid trade-grid">
      <form
        className="card form"
        key={data.user.updatedAt}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (section === 'profile') {
            await run({
              action: 'profile',
              profile: {
                ...Object.fromEntries(f),
                currency: data.user.currency,
                region: data.user.region,
              },
            });
          } else
            await run({
              action: 'preferences',
              currency: f.get('currency'),
              theme: 'dark',
              notifications: f.get('notifications') === 'on',
            });
        }}
      >
        <h2>{section === 'profile' ? 'Personal details' : 'Make it your workspace.'}</h2>
        {section === 'profile' ? (
          <>
            {(['fullName', 'username', 'phone', 'country', 'city', 'image'] as const).map((k) => (
              <label key={k}>
                {
                  {
                    fullName: 'Full name',
                    username: 'Username',
                    phone: 'Phone',
                    country: 'Country',
                    city: 'City',
                    image: 'Profile image HTTPS URL',
                  }[k]
                }
                <input
                  name={k}
                  defaultValue={data.user[k]}
                  required={['fullName', 'username'].includes(k)}
                  type={k === 'image' ? 'url' : 'text'}
                  maxLength={k === 'image' ? 2000 : 200}
                />
              </label>
            ))}
          </>
        ) : (
          <>
            <label>
              Preferred currency
              <select name="currency" defaultValue={data.user.currency}>
                {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <p className="small muted">
              Balances and trade settlement remain in USD. This preference does not convert amounts.
            </p>
            <p className="small muted">Appearance: Dark</p>
            <label className="checkbox">
              <input
                type="checkbox"
                name="notifications"
                defaultChecked={data.user.notifications}
              />
              Enable notification preference
            </label>
            <p className="small muted">
              Required transaction updates remain available in your inbox.
            </p>
          </>
        )}
        <button className="button" disabled={busy}>
          Save changes
          <ArrowRight size={16} />
        </button>
      </form>
      <section className="card account-summary">
        <span className="avatar large-avatar">{data.user.fullName[0]}</span>
        <h2>{data.user.fullName}</h2>
        <p className="muted">{data.user.email}</p>
        <StatusBadge status={data.user.accountStatus} />
        <p className="small muted">
          Member since {date(data.user.createdAt)}
          <br />
          Simulated account · USD
        </p>
        <button
          className="button secondary"
          onClick={async () => {
            try {
              await sendPasswordResetEmail(clientAuth(), data.user.email);
              setMessage('Password reset email requested.');
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Send password reset email
        </button>
        {message && (
          <p role="status" className="small">
            {message}
          </p>
        )}
        {data.user.role === 'admin' && (
          <Link href="/admin" className="button secondary">
            Administrator workspace
            <ArrowUpRight size={16} />
          </Link>
        )}
      </section>
    </div>
  );
}

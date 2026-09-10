'use client';
import { WalletMethodsAdmin } from './wallet-methods';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, Edit, Trash2, ShieldCheck } from 'lucide-react';
import type { Snapshot, Plan, Vehicle, Activity } from '@/lib/types';
import type { RunAction } from './workspace';
import {
  StatCard,
  PortfolioChart,
  TransactionTable,
  StatusBadge,
  AdminTable,
  EmptyState,
  Modal,
  ConfirmDialog,
  money,
  date,
} from './ui';
import { publicPages } from '@/lib/data';
export function AdminContent({
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
  const [viewDeposit, setViewDeposit] = useState<Activity | null>(null);
  const [q, setQ] = useState(''),
    [edit, setEdit] = useState<Plan | Vehicle | 'new' | null>(null),
    [confirmation, setConfirmation] = useState<Record<string, unknown> | null>(null),
    [selectedMarket, setSelectedMarket] = useState<string | null>(null),
    [contentId, setContentId] = useState('about');
  const confirm = (payload: Record<string, unknown>) => setConfirmation(payload);
  const dialog = confirmation && (
    <ConfirmDialog
      title="Confirm administrator action"
      description="This updates simulated records. Approval and lifecycle changes are audited and cannot be submitted twice."
      onClose={() => setConfirmation(null)}
      onConfirm={async () => {
        if (await run(confirmation)) setConfirmation(null);
      }}
    />
  );
  if (section === 'wallet-methods') return <WalletMethodsAdmin data={data} run={run} busy={busy} />;
  if (section === 'users') {
    const user = data.users?.find((u) => u.id === detail);
    if (user) {
      const p = data.portfolios?.find((p) => p.uid === user.uid);
      return (
        <>
          <section className="card">
            <div className="row">
              <div>
                <h2>{user.fullName}</h2>
                <p className="muted">
                  {user.email} · @{user.username}
                </p>
              </div>
              <StatusBadge status={user.disabled ? 'Restricted' : user.accountStatus} />
            </div>
            <div className="grid three mini-stats">
              <div>
                <span>Location</span>
                <b>
                  {user.city}, {user.country}
                </b>
              </div>
              <div>
                <span>Phone</span>
                <b>{user.phone || 'Not provided'}</b>
              </div>
              <div>
                <span>Account cash</span>
                <b>{money((p?.cashCents ?? 0) / 100)}</b>
              </div>
            </div>
            <div className="row">
              <button
                className="button secondary"
                disabled={busy || user.uid === data.user.uid}
                onClick={() =>
                  confirm({
                    action: 'userStatus',
                    id: user.uid,
                    disabled: !user.disabled,
                    accountStatus: user.accountStatus,
                  })
                }
              >
                {user.disabled ? 'Enable account' : 'Disable account'}
              </button>
              <select
                aria-label="Account status"
                value={
                  user.accountStatus.toLowerCase() === 'active' ? 'Active' : user.accountStatus
                }
                disabled={busy || user.uid === data.user.uid}
                onChange={(e) =>
                  confirm({
                    action: 'userStatus',
                    id: user.uid,
                    disabled: user.disabled,
                    accountStatus: e.target.value,
                  })
                }
              >
                {['Active', 'Under review', 'Restricted'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <h3>Account holdings</h3>
            <AdminTable headings={['Symbol', 'Quantity', 'Cost basis']}>
              {p?.holdings.map((h) => (
                <tr key={h.symbol}>
                  <td>{h.symbol}</td>
                  <td>{h.quantity}</td>
                  <td>{money(h.costCents / 100)}</td>
                </tr>
              ))}
            </AdminTable>
          </section>
          {[
            ['Transaction history', data.transactions],
            ['Investments', data.investments],
            ['Vehicle orders', data.orders],
          ].map(([title, rows]) => (
            <section className="card top-space" key={title as string}>
              <h3>{title as string}</h3>
              <TransactionTable rows={(rows as Activity[]).filter((r) => r.uid === user.uid)} />
            </section>
          ))}
          {dialog}
        </>
      );
    }
    return (
      <section className="card">
        <div className="filters">
          <input
            aria-label="Search users"
            placeholder="Search name, email, or username…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <AdminTable headings={['Member', 'Email', 'Role', 'Status', 'Joined', 'Action']}>
          {data.users
            ?.filter((u) =>
              (u.fullName + u.email + u.username).toLowerCase().includes(q.toLowerCase()),
            )
.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.fullName}</b>
                  <span className="small muted block">@{u.username}</span>
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <StatusBadge status={u.disabled ? 'Restricted' : u.accountStatus} />
                </td>
                <td>{date(u.createdAt)}</td>
                <td>
                  <Link href={'/admin/users/' + u.id} className="text-link">
                    View account
                    <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
        </AdminTable>
      </section>
    );
  }
  if (
    ['deposits', 'withdrawals', 'investments', 'vehicle-orders', 'transactions'].includes(section)
  ) {
    const collection =
      section === 'vehicle-orders'
        ? 'orders'
        : (section as 'deposits' | 'withdrawals' | 'investments' | 'transactions');
    const records = data[collection];
    const transitions = (r: Activity) =>
      collection === 'orders'
        ? ((
            {
              Submitted: ['Processing', 'Cancelled'],
              Processing: ['Confirmed', 'Cancelled'],
              Confirmed: ['Preparing', 'Cancelled'],
              Preparing: ['Shipped'],
              Shipped: ['Delivered'],
            } as Record<string, string[]>
          )[r.status] ?? [])
        : collection === 'investments'
          ? r.status === 'Active'
            ? ['Completed', 'Cancelled']
            : []
          : collection === 'transactions'
            ? r.type === 'Trade' && r.status.toLowerCase() === 'pending'
              ? ['Completed', 'Cancelled']
              : []
            : r.status.toLowerCase() === 'pending'
              ? ['Approved', 'Rejected']
              : [];
    return (
      <>
        {viewDeposit && (
          <Modal title="Demo deposit request" onClose={() => setViewDeposit(null)}>
            <p>
              User: {data.users?.find((u) => u.uid === viewDeposit.uid)?.email ?? viewDeposit.uid}
            </p>
            <p>Amount: {money(viewDeposit.amountCents / 100)} · simulated USD</p>
            <p>Wallet method: {viewDeposit.method}</p>
            <p>Network: {viewDeposit.network ?? '—'}</p>
            <p className="wallet-address">
              Address at submission: {viewDeposit.walletAddress ?? '—'}
            </p>
            <p className="wallet-address">
              Reference: {viewDeposit.externalReference ?? viewDeposit.reference}
            </p>
            <p>Date: {date(viewDeposit.createdAt)}</p>
            <StatusBadge status={viewDeposit.status} />
            {viewDeposit.proofImage ? (
              <img
                className="wallet-qr"
                src={viewDeposit.proofImage}
                alt="Deposit proof screenshot"
              />
            ) : (
              <p>No proof image attached.</p>
            )}
          </Modal>
        )}
        <section className="card">
          <h3>
            {section === 'transactions'
              ? 'All simulated activity'
              : 'Review simulated ' + section.replace('-', ' ')}
          </h3>
          <p className="muted small">
            Balance updates are atomic and protected against duplicate review. Completing an
            investment returns principal only.
          </p>
          <div className="filters">
            <input
              aria-label="Search requests"
              placeholder="Search reference, user, or description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <AdminTable
            headings={[
              'Reference / member',
              'Details',
              'Amount',
              'Status',
              'Created',
              'Review',
            ]}
          >
            {records
.filter((r) =>
                (r.reference + r.uid + r.details).toLowerCase().includes(q.toLowerCase()),
              )
.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{r.reference}</b>
                    <Link className="small muted block" href={'/admin/users/' + r.uid}>
                      {data.users?.find((u) => u.id === r.uid)?.fullName ?? r.uid}
                    </Link>
                  </td>
                  <td>
                    {r.details}
                    {r.network && <span className="small block">Network: {r.network}</span>}
                    {r.externalReference && (
                      <span className="small block">Reference: {r.externalReference}</span>
                    )}
                    {r.proofImage && (
                      <a className="text-link" href={r.proofImage} target="_blank" rel="noreferrer">
                        View proof image
                      </a>
                    )}
                    {r.destination && (
                      <span className="small muted block">Destination: {r.destination}</span>
                    )}
                  </td>
                  <td>{money(r.amountCents / 100)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>{date(r.createdAt)}</td>
                  <td>
                    <div className="review-actions">
                      {collection === 'deposits' && (
                        <button
                          className="button secondary small"
                          onClick={() => setViewDeposit(r)}
                        >
                          View
                        </button>
                      )}
                      {transitions(r).map((status) => (
                        <button
                          className="button secondary small"
                          disabled={busy}
                          key={status}
                          onClick={() =>
                            confirm({ action: 'review', collection, id: r.id, status })
                          }
                        >
                          {status === 'Completed' && collection === 'transactions'
                            ? 'Fill if eligible'
                            : status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
          </AdminTable>
          {!records.length && (
            <EmptyState
              title="No requests to review"
              description="New simulated activity will appear here."
            />
          )}
        </section>
        {dialog}
      </>
    );
  }
  if (section === 'investment-plans' || section === 'vehicles') {
    const isPlan = section === 'investment-plans';
    return (
      <>
        <div className="row section-heading compact">
          <h2>{isPlan ? 'Configurable plans' : 'Vehicle inventory'}</h2>
          <button className="button" onClick={() => setEdit('new')}>
            <Plus size={17} />
            Add {isPlan ? 'plan' : 'vehicle'}
          </button>
        </div>
        <section className="card">
          <AdminTable
            headings={
              isPlan
                ? ['Plan', 'Allocation range', 'Duration', 'Risk', 'Status', 'Edit']
                : ['Vehicle', 'Year', 'Illustrative price', 'Status', 'Edit']
            }
          >
            {isPlan
              ? data.plans.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.name}</b>
                    </td>
                    <td>
                      {money(p.min)} – {money(p.max)}
                    </td>
                    <td>{p.duration} days</td>
                    <td>{p.risk}</td>
                    <td>
                      <StatusBadge status={p.active ? 'Active' : 'Inactive'} />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={'Edit ' + p.name}
                        onClick={() => setEdit(p)}
                      >
                        <Edit size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              : data.vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <b>
                        {v.make} {v.model}
                      </b>
                    </td>
                    <td>{v.year}</td>
                    <td>{money(v.price)}</td>
                    <td>
                      <StatusBadge status={v.availability} />
                    </td>
                    <td>
                      <div className="row">
                        <button
                          className="icon-button"
                          aria-label={'Edit ' + v.model}
                          onClick={() => setEdit(v)}
                        >
                          <Edit size={17} />
                        </button>
                        <button
                          className="icon-button negative"
                          aria-label={'Delete ' + v.model}
                          disabled={busy || v.availability === 'Reserved'}
                          onClick={() => confirm({ action: 'deleteVehicle', id: v.id })}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </AdminTable>
        </section>
        {edit && (
          <Modal
            title={
              (edit === 'new' ? 'Create ' : 'Edit ') + (isPlan ? 'investment plan' : 'vehicle')
            }
            onClose={() => setEdit(null)}
          >
            <CatalogEditor
              type={isPlan ? 'plan' : 'vehicle'}
              value={edit}
              run={run}
              busy={busy}
              onDone={() => setEdit(null)}
            />
          </Modal>
        )}
        {dialog}
      </>
    );
  }
  if (section === 'markets')
    return (
      <>
        <section className="card">
          <h3>Illustrative market quotes</h3>
          <p className="muted">
            These values are current quotes. Updating a quote does not automatically fill pending limit
            orders.
          </p>
          <AdminTable headings={['Symbol', 'Asset', 'Current price', 'Movement', 'Action']}>
            {data.markets.map((m) => (
              <tr key={m.id}>
                <td>{m.symbol}</td>
                <td>{m.name}</td>
                <td>{money(m.price)}</td>
                <td>{m.change}%</td>
                <td>
                  <button className="text-button" onClick={() => setSelectedMarket(m.id)}>
                    Edit quote
                  </button>
                </td>
              </tr>
            ))}
          </AdminTable>
        </section>
        {selectedMarket && (
          <Modal title="Edit current quote" onClose={() => setSelectedMarket(null)}>
            <form
              className="form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  await run({
                    action: 'saveMarket',
                    id: selectedMarket,
                    price: Number(f.get('price')),
                    change: Number(f.get('change')),
                  })
                )
                  setSelectedMarket(null);
              }}
            >
              <label>
                Current price
                <input
                  name="price"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  defaultValue={data.markets.find((m) => m.id === selectedMarket)?.price}
                  required
                />
              </label>
              <label>
                Illustrative movement %
                <input
                  name="change"
                  type="number"
                  min="-99"
                  max="1000"
                  step="0.01"
                  defaultValue={data.markets.find((m) => m.id === selectedMarket)?.change}
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                Save quote
              </button>
            </form>
          </Modal>
        )}
      </>
    );
  if (section === 'notifications')
    return (
      <div className="grid trade-grid">
        <form
          className="card form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            if (await run({ action: 'notify',...Object.fromEntries(f) })) form.reset();
          }}
        >
          <h2>Create a notification</h2>
          <label>
            Recipient
            <select name="uid">
              {data.users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} · {u.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input name="title" required minLength={2} maxLength={200} />
          </label>
          <label>
            Message
            <textarea name="message" required minLength={2} maxLength={200} rows={4} />
          </label>
          <button className="button" disabled={busy}>
            Create notification
          </button>
          <p className="muted small">
            Stored in the member’s inbox. No email or external message is sent.
          </p>
        </form>
        <section className="card">
          <h3>Recent notifications</h3>
          {data.notifications.slice(0, 15).map((n) => (
            <div className="notification" key={n.id}>
              <div>
                <h3>{n.title}</h3>
                <p className="small muted">{n.message}</p>
                <span className="micro muted">
                  {n.uid} · {date(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  if (section === 'content') {
    const stored = data.content?.find((c) => c.id === contentId);
    return (
      <div className="grid trade-grid">
        <form
          className="card form"
          key={contentId + stored?.body}
          onSubmit={async (e) => {
            e.preventDefault();
            await run({
              action: 'saveContent',
              id: contentId,
...Object.fromEntries(new FormData(e.currentTarget)),
            });
          }}
        >
          <h2>Public page content</h2>
          <label>
            Page
            <select value={contentId} onChange={(e) => setContentId(e.target.value)}>
              {Object.keys(publicPages).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              name="title"
              defaultValue={stored?.title ?? publicPages[contentId].title}
              required
              maxLength={200}
            />
          </label>
          <label>
            Introduction / content
            <textarea
              name="body"
              rows={9}
              defaultValue={stored?.body ?? publicPages[contentId].intro}
              required
              minLength={10}
              maxLength={10000}
            />
          </label>
          <button className="button" disabled={busy}>
            Save page content
          </button>
          <Link href={'/' + contentId} className="text-link">
            View page
            <ArrowRight size={15} />
          </Link>
        </form>
        <section className="card">
          <h3>Contact inbox</h3>
          {data.content
            ?.filter((c) => c.id.startsWith('contact_'))
.map((c) => (
              <div className="notification" key={c.id}>
                <div>
                  <h3>{c.title}</h3>
                  <p className="muted preserve-lines">{c.body}</p>
                </div>
              </div>
            ))}
          {!data.content?.some((c) => c.id.startsWith('contact_')) && (
            <EmptyState
              title="No messages yet"
              description="Contact submissions will appear here."
            />
          )}
        </section>
      </div>
    );
  }
  if (section === 'settings')
    return (
      <form
        className="card form narrow"
        key={data.settings.updatedAt}
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          await run({
            action: 'settings',
            methods: f.getAll('methods'),
            name: f.get('name'),
            supportEmail: f.get('supportEmail'),
            announcement: f.get('announcement'),
          });
        }}
      >
        <h2>Platform settings</h2>
        <label>
          Platform name
          <input
            name="name"
            defaultValue={data.settings.name}
            minLength={2}
            maxLength={200}
            required
          />
        </label>
        <label>
          Support email
          <input
            name="supportEmail"
            type="email"
            defaultValue={data.settings.supportEmail}
            required
          />
        </label>
        <label>
          Dashboard announcement
          <textarea
            name="announcement"
            defaultValue={data.settings.announcement}
            maxLength={200}
            rows={3}
          />
        </label>
        <h3>Enabled payment methods</h3>
        {['Bank Transfer', 'Crypto', 'Card Placeholder'].map((m) => (
          <label className="checkbox" key={m}>
            <input
              name="methods"
              type="checkbox"
              value={m}
              defaultChecked={data.settings.methods.includes(m)}
            />
            {m}
          </label>
        ))}
        <p className="small muted">
          Methods are simulated request forms. No payment destination or card processor is
          connected.
        </p>
        <button className="button" disabled={busy}>
          Save platform settings
        </button>
      </form>
    );
  const total = (rows: Activity[]) =>
    rows
      .filter((r) => r.status.toLowerCase() === 'approved')
      .reduce((s, r) => s + r.amountCents / 100, 0);
  return (
    <>
      <div className="grid four">
        <StatCard label="Total users" value={String(data.users?.length ?? 0)} />
        <StatCard
          label="Active users"
          value={String(
            data.users?.filter((u) => !u.disabled && u.accountStatus.toLowerCase() === 'active')
              .length ?? 0,
          )}
        />
        <StatCard label="Approved account deposits" value={money(total(data.deposits))} />
        <StatCard label="Approved withdrawal requests" value={money(total(data.withdrawals))} />
      </div>
      <div className="grid dashboard-charts">
        <section className="card">
          <PortfolioChart />
        </section>
        <section className="card">
          <h3>Needs your attention</h3>
          {[
            [
              'Pending deposits',
              data.deposits.filter((d) => d.status.toLowerCase() === 'pending').length,
              'deposits',
            ],
            [
              'Pending withdrawals',
              data.withdrawals.filter((d) => d.status === 'Pending').length,
              'withdrawals',
            ],
            [
              'Active investments',
              data.investments.filter((d) => d.status === 'Active').length,
              'investments',
            ],
            ['Vehicle orders', data.orders.length, 'vehicle-orders'],
          ].map(([label, count, url]) => (
            <Link className="admin-summary-row" href={'/admin/' + url} key={label}>
              <span>{label}</span>
              <b>{count}</b>
              <ArrowRight size={16} />
            </Link>
          ))}
          <div className="alert">
            <ShieldCheck size={18} />
            <p>All administrative changes affect account records only.</p>
          </div>
        </section>
      </div>
      <section className="card">
        <h3>Recent platform activity</h3>
        <TransactionTable rows={data.transactions} compact />
      </section>
    </>
  );
}
function CatalogEditor({
  type,
  value,
  run,
  busy,
  onDone,
}: {
  type: 'plan' | 'vehicle';
  value: Plan | Vehicle | 'new';
  run: RunAction;
  busy: boolean;
  onDone: () => void;
}) {
  const v = value === 'new' ? {} : (value as unknown as Record<string, unknown>);
  const input = (name: string, label: string, kind = 'text', fallback: unknown = '') => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={kind}
        defaultValue={String(v[name] ?? fallback)}
        step={kind === 'number' ? 'any' : undefined}
        required
        maxLength={kind === 'number' ? undefined : 200}
      />
    </label>
  );
  const select = (name: string, label: string, values: string[]) => (
    <label>
      {label}
      <select name={name} defaultValue={String(v[name] ?? values[0])}>
        {values.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const payload: Record<string, unknown> = {
...Object.fromEntries(f),
          action: type === 'plan' ? 'savePlan' : 'saveVehicle',
...(value !== 'new' ? { id: value.id } : {}),
        };
        if (type === 'plan') {
          payload.active = f.get('active') === 'on';
          payload.benefits = String(f.get('benefits'))
.split('\n')
.map((s) => s.trim())
.filter(Boolean);
        } else {
          payload.images = String(f.get('images'))
.split('\n')
.map((s) => s.trim())
.filter(Boolean);
          payload.features = String(f.get('features'))
.split('\n')
.map((s) => s.trim())
.filter(Boolean);
        }
        if (await run(payload)) onDone();
      }}
    >
      {type === 'plan' ? (
        <>
          {input('name', 'Plan name')}
          <div className="grid two">
            {input('min', 'Minimum USD', 'number', 100)}
            {input('max', 'Maximum USD', 'number', 1000)}
          </div>
          {input('duration', 'Activity duration in days', 'number', 30)}
          {select('risk', 'Risk level', ['Moderate', 'Low', 'High'])}
          <label className="checkbox">
            <input name="active" type="checkbox" defaultChecked={Boolean(v.active ?? true)} />
            Plan is active
          </label>
          <label>
            Benefits · one per line
            <textarea
              name="benefits"
              rows={3}
              defaultValue={(
                (v.benefits as string[]) ?? ['Simulated allocation', 'No guaranteed returns']
              ).join('\n')}
            />
          </label>
        </>
      ) : (
        <>
          <div className="grid two">
            {input('make', 'Make', 'text', 'Tesla')}
            {input('model', 'Model')}
            {input('year', 'Year', 'number', 2025)}
            {input('price', 'Illustrative price USD', 'number', 45000)}
            {input('mileage', 'Mileage', 'number', 0)}
            {input('range', 'Range in miles', 'number', 300)}
          </div>
          {select('condition', 'Condition', ['New', 'Pre-owned'])}
          {select('availability', 'Availability', ['Available', 'Reserved', 'Unavailable'])}
          {input('battery', 'Battery', 'text', '75 kWh')}
          {input('performance', 'Performance', 'text', '4.8 sec · 0–60 mph')}
          <label>
            Image HTTPS URLs · one per line
            <textarea
              name="images"
              rows={4}
              defaultValue={((v.images as string[]) ?? []).join('\n')}
            />
          </label>
          <label>
            Features · one per line
            <textarea
              name="features"
              rows={3}
              defaultValue={((v.features as string[]) ?? ['All-electric powertrain']).join('\n')}
            />
          </label>
        </>
      )}
      <label>
        Description
        <textarea
          name="description"
          rows={4}
          required
          minLength={10}
          maxLength={type === 'plan' ? 200 : 2000}
          defaultValue={String(
            v.description ?? ' offering. No real funds or guaranteed returns.',
          )}
        />
      </label>
      <button className="button" disabled={busy}>
        Save {type}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

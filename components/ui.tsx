'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  X,
  Check,
  Zap,
  Car,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Market, Vehicle, Plan, Activity, Notice } from '@/lib/types';
import { useBrand } from './brand-provider';
export const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
export const date = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export function Logo() {
  const brand = useBrand();
  return (
    <Link href="/" className="logo" aria-label={`${brand?.name || 'Volterra'} home`}>
      {brand?.logoUrl ? (
        <img className="brand-logo" src={brand.logoUrl} alt="" width={46} height={60} />
      ) : (
        <span>{brand?.name || 'VOLTERRA'}</span>
      )}
    </Link>
  );
}
export function StatusBadge({ status }: { status: string }) {
  status = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={
        'badge ' +
        (['Completed', 'Approved', 'Active', 'Available', 'Delivered', 'Confirmed'].includes(status)
          ? 'positive'
          : ['Rejected', 'Cancelled', 'Unavailable', 'Restricted'].includes(status)
            ? 'negative'
            : 'neutral')
      }
    >
      {status}
    </span>
  );
}
export function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="card stat">
      <div className="row muted">
        {label}
        <span className="stat-icon">{icon ?? <TrendingUp size={17} />}</span>
      </div>
      <strong>{value}</strong>
      <div className="small">
        <span className="positive">{change ?? 'Simulated USD'}</span>
        <span className="muted"> · account</span>
      </div>
    </article>
  );
}
export function PortfolioChart({
  compact = false,
  basePrice,
}: {
  compact?: boolean;
  basePrice?: number;
}) {
  const [period, setPeriod] = useState('1M');
  const offset = ['1D', '1W', '1M', '3M', '1Y'].indexOf(period);
  const data = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: basePrice
      ? basePrice * (0.95 + i * 0.0015 + Math.sin(i * 1.5 + offset) * 0.018)
      : 32000 + i * 360 + Math.sin(i * 1.5 + offset) * 1300 + Math.cos(i * 0.7) * 700,
  }));
  return (
    <div className="chart-wrap">
      <div className="row">
        <div>
          <h3>{compact ? 'Market movement' : 'Portfolio performance'}</h3>
          <p className="muted small">Sample curve · not account history</p>
        </div>
        <div className="segmented">
          {['1D', '1W', '1M', '3M', '1Y'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'active' : ''}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: compact ? 210 : 270, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 25, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="redArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef414d" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#ef414d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8b8e98', fontSize: 12 }}
              minTickGap={45}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(v) => (basePrice ? money(v) : '$' + Math.round(v / 1000) + 'k')}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#8b8e98', fontSize: 12 }}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: '#202228',
                border: '1px solid #353740',
                borderRadius: 12,
                color: '#fff',
              }}
              formatter={(v) => [money(Number(v)), 'Sample value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f14c58"
              strokeWidth={2.5}
              fill="url(#redArea)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export function AllocationChart({ data }: { data: { name: string; value: number }[] }) {
  const colors = ['#ec4450', '#f88b93', '#a6a9b3', '#5c616e', '#383c45'];
  return (
    <>
      <div style={{ height: 185 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => money(Number(v))}
              contentStyle={{
                background: '#202228',
                border: '1px solid #353740',
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="allocation-legend">
        {data.map((d, i) => (
          <div className="row small" key={d.name}>
            <span>
              <i style={{ background: colors[i % colors.length] }} />
              {d.name}
            </span>
            <span>{money(d.value)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
export function MarketCard({ market: m }: { market: Market }) {
  return (
    <Link className="card market-card" href={'/dashboard/markets/' + m.symbol}>
      <div className="row">
        <span className="asset-icon" style={{ color: m.color, background: m.color + '17' }}>
          {m.symbol === 'BTC-USD' ? '₿' : m.symbol.slice(0, 1)}
        </span>
        <span className={m.change >= 0 ? 'positive' : 'negative'}>
          {m.change >= 0 ? '+' : ''}
          {m.change}%
        </span>
      </div>
      <div className="row market-name">
        <div>
          <h3>{m.symbol.replace('-', '/')}</h3>
          <span className="muted small">{m.name}</span>
        </div>
        <ArrowUpRight size={17} className="muted" />
      </div>
      <strong className="market-price">{money(m.price)}</strong>
      <svg className="sparkline" viewBox="0 0 200 36" aria-label="Sample market trend">
        <path
          d={
            m.change > 0
              ? 'M0 30 L13 22 24 28 38 16 51 20 65 14 80 26 94 15 111 18 127 8 141 15 158 5 173 11 185 4 200 6'
              : 'M0 6 L13 12 24 8 38 20 51 16 65 22 80 10 94 20 111 18 127 29 141 20 158 32 173 26 185 33 200 29'
          }
          fill="none"
          stroke={m.change >= 0 ? '#54c69b' : '#f56a72'}
          strokeWidth="2"
        />
      </svg>
      <span className="micro muted">CURRENT QUOTE</span>
    </Link>
  );
}
export function VehicleCard({
  vehicle: v,
  dashboard = false,
}: {
  vehicle: Vehicle;
  dashboard?: boolean;
}) {
  return (
    <article className="card vehicle-card">
      <Link href={'/cars/' + v.id} className="vehicle-image">
        {v.images[0] ? (
          <img src={v.images[0]} alt={v.make + ' ' + v.model} loading="lazy" />
        ) : (
          <Car size={80} />
        )}
        <span className="vehicle-condition">{v.condition}</span>
        <span className="vehicle-year">{v.year}</span>
      </Link>
      <div className="vehicle-body">
        <div className="row">
          <span className="eyebrow muted">{v.make}</span>
          <span className="small positive">● {v.availability}</span>
        </div>
        <h3>{v.model}</h3>
        <div className="vehicle-specs">
          <span>
            <Zap size={14} />
            {v.range} mi range
          </span>
          <span>{v.mileage.toLocaleString()} mi</span>
        </div>
        <div className="row vehicle-bottom">
          <div>
            <strong>{money(v.price)}</strong>
            <span className="micro muted">SAMPLE PRICE</span>
          </div>
          <Link
            className="icon-button"
            aria-label={'Explore ' + v.model}
            href={dashboard ? '/dashboard/vehicles/' + v.id : '/cars/' + v.id}
          >
            <ArrowUpRight size={20} />
          </Link>
        </div>
      </div>
    </article>
  );
}
export function InvestmentPlanCard({
  plan: p,
  onSelect,
  href = '/register',
}: {
  plan: Plan;
  onSelect?: (p: Plan) => void;
  href?: string;
}) {
  return (
    <article className={'card plan-card ' + (p.name === 'Growth' ? 'featured' : '')}>
      <div className="row">
        <span className="plan-symbol">
          <Zap size={22} />
        </span>
        {p.name === 'Growth' && <span className="badge negative">POPULAR</span>}
      </div>
      <h3>{p.name}</h3>
      <p className="muted">{p.description}</p>
      <strong>
        {money(p.min)}
        <span className="small muted"> minimum</span>
      </strong>
      <div className="row small">
        <span className="muted">Activity duration</span>
        <span>{p.duration} days</span>
      </div>
      <div className="row small">
        <span className="muted">Risk level</span>
        <span>{p.risk}</span>
      </div>
      <ul>
        {p.benefits.map((b) => (
          <li key={b}>
            <Check size={15} />
            {b}
          </li>
        ))}
      </ul>
      {onSelect ? (
        <button className="button secondary full" onClick={() => onSelect(p)} disabled={!p.active}>
          {p.active ? 'Explore plan' : 'Inactive'}
          <ArrowRight size={16} />
        </button>
      ) : (
        <Link className="button secondary full" href={href}>
          Explore plan
          <ArrowRight size={16} />
        </Link>
      )}
      <p className="micro muted">Simulated allocation. No guaranteed returns.</p>
    </article>
  );
}
export function TransactionTable({
  rows,
  compact = false,
  onCancel,
}: {
  rows: Activity[];
  compact?: boolean;
  onCancel?: (id: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [type, setType] = useState('All'),
    [status, setStatus] = useState('All'),
    [page, setPage] = useState(0);
  const filtered = rows.filter(
    (r) =>
      (r.reference + ' ' + r.details + ' ' + r.type).toLowerCase().includes(query.toLowerCase()) &&
      (type === 'All' || r.type === type) &&
      (status === 'All' || r.status.toLowerCase() === status.toLowerCase()),
  );
  const pages = Math.ceil(filtered.length / 8);
  return (
    <>
      {!compact && (
        <div className="filters">
          <input
            aria-label="Search transactions"
            placeholder="Search reference or activity…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          <select
            aria-label="Transaction type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(0);
            }}
          >
            {['All', 'Deposit', 'Withdrawal', 'Trade', 'Investment', 'Vehicle order'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Transaction status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            {[
              'All',
              'Pending',
              'Completed',
              'Approved',
              'Rejected',
              'Active',
              'Submitted',
              'Cancelled',
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              {!compact && <th>Reference</th>}
              {onCancel && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(compact ? 0 : page * 8, compact ? 5 : page * 8 + 8).map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="activity-cell">
                    <span className="activity-icon">
                      {r.type === 'Deposit' ? (
                        <ArrowDownRight size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </span>
                    <div>
                      <b>{r.type}</b>
                      <span className="muted small">{r.details}</span>
                    </div>
                  </div>
                </td>
                <td className="muted">{date(r.createdAt)}</td>
                <td>{money(r.amountCents / 100)}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                {!compact && <td className="muted small">{r.reference}</td>}
                {onCancel && (
                  <td>
                    {r.type === 'Trade' && r.status === 'Pending' && (
                      <button className="text-button negative" onClick={() => onCancel(r.id)}>
                        Cancel
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <EmptyState
            title="No transactions yet."
            description="Your simulated activity will appear here."
          />
        )}
      </div>
      {!compact && pages > 1 && (
        <div className="row pagination">
          <span className="muted small">
            {filtered.length} records · Page {page + 1} of {pages}
          </span>
          <div className="row">
            <button
              className="button secondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="button secondary"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export function NotificationItem({
  notice: n,
  onRead,
}: {
  notice: Notice;
  onRead: (id: string) => void;
}) {
  return (
    <div className={'notification ' + (!n.read ? 'unread' : '')}>
      <span className="activity-icon">
        <Zap size={18} />
      </span>
      <div>
        <h3>{n.title}</h3>
        <p className="muted">{n.message}</p>
        <span className="small muted">{date(n.createdAt)}</span>
      </div>
      {!n.read && (
        <button className="text-button" onClick={() => onRead(n.id)}>
          Mark read
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty">
      <span className="empty-symbol">
        <Zap size={24} />
      </span>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="skeleton-wrap" aria-label="Loading" role="status">
      <div className="skeleton" />
      <div className="grid four">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
      <div className="skeleton tall" />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <div className="row">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{description}</p>
      <div className="row">
        <button className="button secondary" onClick={onClose}>
          Go back
        </button>
        <button className="button" onClick={onConfirm}>
          Confirm action
        </button>
      </div>
    </Modal>
  );
}
export function AdminTable({
  headings,
  children,
}: {
  headings: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headings.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Car, Zap, Gauge, Battery, Calendar } from 'lucide-react';
import type { Vehicle } from '@/lib/types';
import { VehicleCard, StatusBadge, EmptyState, money } from './ui';
export function VehicleCatalog({
  vehicles,
  dashboard = false,
}: {
  vehicles: Vehicle[];
  dashboard?: boolean;
}) {
  const [q, setQ] = useState(''),
    [make, setMake] = useState('All makes'),
    [model, setModel] = useState('All models'),
    [min, setMin] = useState(''),
    [max, setMax] = useState(''),
    [year, setYear] = useState('All years'),
    [condition, setCondition] = useState('Any condition'),
    [sort, setSort] = useState('Featured');
  const result = vehicles
    .filter(
      (v) =>
        (v.make + ' ' + v.model).toLowerCase().includes(q.toLowerCase()) &&
        (make === 'All makes' || v.make === make) &&
        (model === 'All models' || v.model === model) &&
        (!min || v.price >= Number(min)) &&
        (!max || v.price <= Number(max)) &&
        (year === 'All years' || v.year === Number(year)) &&
        (condition === 'Any condition' || v.condition === condition),
    )
    .sort((a, b) =>
      sort === 'Price: low to high'
        ? a.price - b.price
        : sort === 'Price: high to low'
          ? b.price - a.price
          : sort === 'Newest'
            ? b.year - a.year
            : 0,
    );
  return (
    <>
      <div className="filters catalog-filters">
        <input
          placeholder="Search your next electric…"
          aria-label="Search vehicles"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select aria-label="Make" value={make} onChange={(e) => setMake(e.target.value)}>
          {['All makes', ...new Set(vehicles.map((v) => v.make))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select aria-label="Model" value={model} onChange={(e) => setModel(e.target.value)}>
          {['All models', ...new Set(vehicles.map((v) => v.model))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          aria-label="Minimum price"
          placeholder="Min price"
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <input
          type="number"
          min="0"
          aria-label="Maximum price"
          placeholder="Max price"
          value={max}
          onChange={(e) => setMax(e.target.value)}
        />
        <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
          {['All years', ...new Set(vehicles.map((v) => String(v.year)))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          {['Any condition', 'New', 'Pre-owned'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select aria-label="Sort vehicles" value={sort} onChange={(e) => setSort(e.target.value)}>
          {['Featured', 'Price: low to high', 'Price: high to low', 'Newest'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="row catalog-count">
        <span className="muted small">{result.length} vehicles · fictional inventory</span>
        <button
          className="text-button"
          onClick={() => {
            setQ('');
            setMake('All makes');
            setModel('All models');
            setMin('');
            setMax('');
            setYear('All years');
            setCondition('Any condition');
            setSort('Featured');
          }}
        >
          Reset filters
        </button>
      </div>
      <div className="grid three">
        {result.map((v) => (
          <VehicleCard key={v.id} vehicle={v} dashboard={dashboard} />
        ))}
      </div>
      {!result.length && (
        <EmptyState title="No matching vehicles" description="Try widening your filters." />
      )}
    </>
  );
}
export function VehicleDetail({
  vehicle: v,
  onOrder,
  busy = false,
}: {
  vehicle: Vehicle;
  onOrder?: () => void;
  busy?: boolean;
}) {
  const [index, setIndex] = useState(0);
  return (
    <>
      <Link href={onOrder ? '/dashboard/vehicles' : '/cars'} className="text-link muted">
        <ArrowLeft size={16} /> Back to collection
      </Link>
      <div className="vehicle-detail">
        <div>
          <div className="gallery-main">
            {v.images[index] ? (
              <img src={v.images[index]} alt={v.make + ' ' + v.model + ' view ' + (index + 1)} />
            ) : (
              <Car size={100} />
            )}
          </div>
          <div className="gallery-thumbs">
            {v.images.map((img, i) => (
              <button
                className={index === i ? 'active' : ''}
                key={img}
                onClick={() => setIndex(i)}
                aria-label={'View image ' + (i + 1)}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
          <div className="card">
            <h3>Electric, without compromise.</h3>
            <p className="muted">{v.description}</p>
            <div className="grid two">
              {v.features.map((f) => (
                <span className="feature-line" key={f}>
                  <Check size={16} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card vehicle-summary">
          <div className="row">
            <span className="eyebrow muted">
              {v.make} · {v.year}
            </span>
            <StatusBadge status={v.availability} />
          </div>
          <h1>{v.model}</h1>
          <p className="muted">{v.condition} · All-electric</p>
          <strong className="detail-price">{money(v.price)}</strong>
          <span className="micro muted">ILLUSTRATIVE PRICE · NO REAL SALE</span>
          <div className="spec-grid">
            {[
              [Zap, v.range + ' mi', 'Estimated range'],
              [Battery, v.battery, 'Battery'],
              [Gauge, v.performance, 'Acceleration'],
              [Calendar, v.mileage.toLocaleString() + ' mi', 'Mileage'],
            ].map(([Icon, value, label]) => {
              const I = Icon as typeof Zap;
              return (
                <div key={label as string}>
                  <I size={18} />
                  <b>{value as string}</b>
                  <span>{label as string}</span>
                </div>
              );
            })}
          </div>
          {onOrder ? (
            <button
              className="button full"
              disabled={busy || v.availability !== 'Available'}
              onClick={onOrder}
            >
              {busy ? 'Submitting…' : 'Request reservation'}
              <ArrowRight size={17} />
            </button>
          ) : (
            <Link className="button full" href={'/dashboard/vehicles/' + v.id}>
              Reserve in your practice account
              <ArrowRight size={17} />
            </Link>
          )}
          <p className="small muted">
            This creates a simulated reservation. No payment is collected and no vehicle will be
            delivered.
          </p>
        </div>
      </div>
    </>
  );
}

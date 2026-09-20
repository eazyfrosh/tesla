'use client';
import { useState } from 'react';
import type { Snapshot, WalletMethod } from '@/lib/types';
import type { RunAction } from './workspace';
import { EmptyState, Modal, StatusBadge } from './ui';

function ImageUpload({
  purpose,
  value,
  onChange,
  onBusy,
}: {
  purpose: 'qr' | 'proof';
  value: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  return (
    <div className="upload-field">
      <label>
        {purpose === 'qr' ? 'Upload QR Code' : 'Proof screenshot (optional)'}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');
            setUploading(true);
            onBusy(true);
            try {
              if (file.size > 3 * 1024 * 1024) throw new Error('Image must be 3 MB or smaller');
              const response = await fetch('/api/uploads?purpose=' + purpose, {
                method: 'POST',
                body: file,
                headers: { 'Content-Type': file.type },
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Upload failed');
              onChange(result.url);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Upload failed');
            } finally {
              setUploading(false);
              onBusy(false);
            }
          }}
        />
      </label>
      <p className="muted small">PNG, JPG, JPEG or WEBP · up to 3 MB</p>
      {uploading && <p role="status">Uploading…</p>}
      {error && (
        <p className="negative" role="alert">
          {error}
        </p>
      )}
      {value && (
        <>
          <img
            className="wallet-qr"
            src={value}
            alt={purpose === 'qr' ? 'Uploaded wallet QR code' : 'Uploaded proof screenshot'}
          />
          <button type="button" className="text-button" onClick={() => onChange('')}>
            Remove image
          </button>
        </>
      )}
    </div>
  );
}

export function WalletMethodsAdmin({
  data,
  run,
  busy,
}: {
  data: Snapshot;
  run: RunAction;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<WalletMethod | 'new' | null>(null);
  const [deleting, setDeleting] = useState<WalletMethod | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const item = editing && editing !== 'new' ? editing : undefined;
  return (
    <section className="card">
      <div className="row">
        <h3>Wallet methods</h3>
        <button
          className="button"
          onClick={() => {
            setQrImage('');
            setEditing('new');
          }}
        >
          Add wallet method
        </button>
      </div>
      <p className="muted">
        Configure addresses and QR images for the simulated deposit workflow. No real payments are
        processed.
      </p>
      {!data.walletMethods.length && (
        <EmptyState
          title="No wallet methods yet."
          description="Add a method to make it available on the deposit page."
        />
      )}
      <div className="grid two">
        {data.walletMethods.map((method) => (
          <article className="card" key={method.id}>
            <div className="row">
              <h3>
                {method.assetName} · {method.symbol}
              </h3>
              <StatusBadge status={method.status} />
            </div>
            <p className="muted">
              Network: {method.network} · Order: {method.displayOrder}
            </p>
            <p className="wallet-address">{method.walletAddress}</p>
            <div className="row">
              <button
                className="button secondary"
                onClick={() => {
                  setQrImage(method.qrImage);
                  setEditing(method);
                }}
              >
                Edit wallet method
              </button>
              <button className="button secondary" onClick={() => setDeleting(method)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <Modal
          title={item ? 'Edit wallet method' : 'Add wallet method'}
          onClose={() => {
            if (!uploading && !busy) setEditing(null);
          }}
        >
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await run({
                  action: 'saveWalletMethod',
                  ...(item ? { id: item.id } : {}),
                  assetName: f.get('assetName'),
                  symbol: f.get('symbol'),
                  network: f.get('network'),
                  walletAddress: f.get('walletAddress'),
                  qrImage,
                  instructions: f.get('instructions'),
                  status: f.get('status'),
                  displayOrder: Number(f.get('displayOrder')),
                })
              )
                setEditing(null);
            }}
          >
            <div className="grid two">
              <label>
                Asset name
                <input name="assetName" defaultValue={item?.assetName} maxLength={200} required />
              </label>
              <label>
                Symbol
                <input name="symbol" defaultValue={item?.symbol} maxLength={200} required />
              </label>
            </div>
            <label>
              Network
              <input
                name="network"
                defaultValue={item?.network}
                placeholder="TRC20"
                maxLength={200}
                required
              />
            </label>
            <label>
              Wallet address
              <textarea
                name="walletAddress"
                defaultValue={item?.walletAddress}
                maxLength={200}
                required
                placeholder="Paste wallet address"
              />
            </label>
            <ImageUpload purpose="qr" value={qrImage} onChange={setQrImage} onBusy={setUploading} />
            <label>
              Instructions
              <textarea name="instructions" defaultValue={item?.instructions} maxLength={2000} />
            </label>
            <div className="grid two">
              <label>
                Status
                <select name="status" defaultValue={item?.status ?? 'enabled'}>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              <label>
                Display order
                <input
                  name="displayOrder"
                  type="number"
                  min={0}
                  max={10000}
                  defaultValue={item?.displayOrder ?? 0}
                  required
                />
              </label>
            </div>
            <button className="button" disabled={busy || uploading}>
              {busy ? 'Saving…' : 'Save wallet method'}
            </button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete payment method" onClose={() => setDeleting(null)}>
          <p>
            Delete{' '}
            <b>
              {deleting.assetName} · {deleting.network}
            </b>
            ? This removes it from the customer deposit options and records the action in the
            immutable audit log.
          </p>
          <div className="row">
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (
                  await run({
                    action: 'deleteWalletMethod',
                    id: deleting.id,
                    confirmation: 'DELETE PAYMENT METHOD',
                  })
                )
                  setDeleting(null);
              }}
            >
              Confirm delete
            </button>
            <button className="button secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export function WalletDeposit({
  data,
  run,
  busy,
}: {
  data: Snapshot;
  run: RunAction;
  busy: boolean;
}) {
  const methods = data.walletMethods.filter((m) => m.status === 'enabled');
  const [selected, setSelected] = useState(methods[0]?.id ?? '');
  const [proof, setProof] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copy, setCopy] = useState('');
  const method = methods.find((m) => m.id === selected) ?? methods[0];
  if (!method)
    return (
      <section className="card">
        <EmptyState
          title="No wallet methods available."
          description="An administrator must enable a wallet method before you can submit a request."
        />
      </section>
    );
  return (
    <form
      className="card form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget,
          f = new FormData(form);
        if (
          await run({
            action: 'deposit',
            method: method.assetName,
            walletMethodId: method.id,
            network: method.network,
            amount: Number(f.get('amount')),
            externalReference: f.get('externalReference'),
            ...(proof ? { proofImage: proof } : {}),
          })
        ) {
          form.reset();
          setProof('');
        }
      }}
    >
      <span className="demo-pill">NOT REAL FUNDS</span>
      <h2>Submit a practice deposit.</h2>
      <p className="muted">
        Addresses and QR codes are displayed for practice. Do not send real funds. Approval credits
        simulated USD only.
      </p>
      <label>
        Wallet method
        <select
          value={method.id}
          onChange={(e) => {
            setSelected(e.target.value);
            setCopy('');
          }}
        >
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.assetName} ({m.symbol}) · {m.network}
            </option>
          ))}
        </select>
      </label>
      <section className="card">
        <h3>
          {method.assetName} · {method.symbol}
        </h3>
        <p>Network: {method.network}</p>
        <p className="small muted">Wallet Address</p>
        <p className="wallet-address">{method.walletAddress}</p>
        <button
          type="button"
          className="button secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(method.walletAddress);
              setCopy('Address copied.');
            } catch {
              setCopy('Copy unavailable. Select and copy the address above.');
            }
          }}
        >
          Copy Address
        </button>
        <p className="small" role="status">
          {copy}
        </p>
        {method.qrImage && (
          <img
            className="wallet-qr"
            src={method.qrImage}
            alt={method.symbol + ' ' + method.network + ' QR code — practice only'}
          />
        )}
        <p className="preserve-lines muted">{method.instructions}</p>
      </section>
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
        Transaction / reference ID
        <input name="externalReference" maxLength={200} required />
      </label>
      <ImageUpload purpose="proof" value={proof} onChange={setProof} onBusy={setUploading} />
      <button className="button" disabled={busy || uploading}>
        {busy ? 'Submitting…' : 'Submit practice deposit request'}
      </button>
    </form>
  );
}

'use client';
import { useState } from 'react';
import type { PlatformSettings } from '@/lib/types';

export function TemplateOwnerEditor({
  initial,
  siteId,
}: {
  initial: PlatformSettings;
  siteId: string;
}) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key: keyof PlatformSettings, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus('Uploading logo…');
    try {
      const response = await fetch('/api/eazytools/logo', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      update('logoUrl', data.url);
      setStatus('Logo uploaded. Save changes to publish it.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('Saving…');
    try {
      const response = await fetch('/api/eazytools/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          logoUrl: values.logoUrl,
          emailContent: values.emailContent,
          supportPhone: values.supportPhone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setValues(data.settings);
      setStatus('Saved and published to your website.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-[#0b0c0e] px-5 py-12 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[.04] p-7">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-red-400">
            Website settings
          </p>
          <h1 className="mt-3 text-3xl font-bold">Edit your website</h1>
          <p className="mt-3 text-slate-400">
            Only the public brand and contact details below can be changed. The platform admin
            remains protected.
          </p>
          <form className="mt-8 grid gap-5" onSubmit={save}>
            <label className="grid gap-2 text-sm font-semibold">
              Business name
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                required
                maxLength={60}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Logo
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <span className="font-normal text-slate-500">PNG, JPG or WebP, up to 3 MB.</span>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email content
              <textarea
                className="min-h-28 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                value={values.emailContent}
                onChange={(e) => update('emailContent', e.target.value)}
                required
                maxLength={500}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                value={values.supportPhone}
                onChange={(e) => update('supportPhone', e.target.value)}
                maxLength={40}
              />
            </label>
            <button
              className="rounded-full bg-red-500 px-5 py-3 font-bold hover:bg-red-400 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? 'Please wait…' : 'Save and publish'}
            </button>
            {status && (
              <p className="text-sm text-slate-300" role="status">
                {status}
              </p>
            )}
          </form>
        </section>
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.04] p-4">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <div>
              <h2 className="font-bold">Live website</h2>
              <p className="text-sm text-slate-500">Your customer-facing external site</p>
            </div>
            <a
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              href={`/site/${siteId}`}
              target="_blank"
            >
              Open website ↗
            </a>
          </div>
          <iframe
            className="h-[720px] w-full rounded-2xl bg-black"
            title="Website preview"
            src={`/site/${siteId}`}
          />
        </section>
      </div>
    </main>
  );
}

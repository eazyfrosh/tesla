import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Globe2, LayoutDashboard, MessageCircle, Palette, Settings2 } from 'lucide-react';
import { currentUser, eazytoolsSiteId } from '@/lib/auth';
import { get } from '@/lib/store';
import { settings as defaults } from '@/lib/data';
import type { PlatformSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function OwnerAdminPage() {
  const user = await currentUser();
  if (!user?.eazytoolsOwner) redirect('/login');
  const ownerId = user.uid.replace(/^eazytools-/, '');
  const siteId = eazytoolsSiteId(ownerId);
  const settings = { ...defaults, ...((await get<PlatformSettings>('platformSettings', siteId)) ?? {}), id: siteId };
  const actions = [
    { title: 'Website editor', description: 'Update the brand, logo, contact details and chat widgets.', href: '/template-editor', icon: Palette },
    { title: 'Open public website', description: 'View the unique customer-facing Volterra website for this workspace.', href: `/site/${siteId}`, icon: Globe2, external: true },
    { title: 'Connect a domain', description: 'Purchase or connect a domain through EazyTools.', href: `https://makeketplace.vercel.app/domains?template=volterra&site=${siteId}`, icon: ExternalLink, external: true },
    { title: 'Support settings', description: 'Manage the phone, email, WhatsApp, Telegram and live-chat options.', href: '/template-editor#support', icon: MessageCircle },
  ];
  return <main className="min-h-screen bg-[#090a0d] text-white">
    <header className="border-b border-white/10 bg-black/40 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-red-500/15 text-red-400"><LayoutDashboard className="size-5" /></span><div><p className="font-bold">{settings.name} Admin</p><p className="text-xs text-white/50">Private EazyTools owner workspace</p></div></div><div className="flex gap-2"><Link href="/template-editor" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10">Editor</Link><Link href={`/site/${siteId}`} target="_blank" className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold">Open website</Link></div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-10"><section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-500/15 via-white/[.04] to-transparent p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-red-400">Volterra website administration</p><h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">Your generated website admin panel</h1><p className="mt-4 max-w-2xl text-white/60">This panel belongs only to your EazyTools account. Use it to manage your website identity, publishing links, support channels and domain connection.</p><div className="mt-7 flex flex-wrap gap-3 text-sm"><span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-emerald-300">Admin active</span><span className="rounded-full border border-white/10 px-4 py-2 text-white/60">Site ID: {siteId}</span></div></section>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><Summary label="Template" value="Volterra" /><Summary label="Website name" value={settings.name} /><Summary label="Access" value="Owner only" /></div>
      <section className="mt-10"><div className="flex items-center gap-2"><Settings2 className="size-5 text-red-400"/><h2 className="text-xl font-bold">Website admin tools</h2></div><div className="mt-5 grid gap-5 md:grid-cols-2">{actions.map(({ icon: Icon, ...action }) => <Link key={action.title} href={action.href} target={action.external ? '_blank' : undefined} className="group rounded-3xl border border-white/10 bg-white/[.035] p-6 transition hover:border-red-400/40 hover:bg-red-500/[.06]"><Icon className="size-6 text-red-400"/><h3 className="mt-4 text-lg font-bold">{action.title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{action.description}</p><span className="mt-5 inline-block text-sm font-semibold text-red-400">Open tool →</span></Link>)}</div></section>
      <p className="mt-10 rounded-2xl border border-white/10 bg-white/[.03] p-5 text-sm text-white/55">Security: this generated administrator session is isolated to site <b className="text-white">{siteId}</b>. It does not grant access to Volterra’s shared master administration or another subscriber’s website.</p>
    </div>
  </main>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><p className="text-xs uppercase tracking-[.16em] text-white/40">{label}</p><p className="mt-2 truncate text-xl font-bold">{value}</p></div>; }

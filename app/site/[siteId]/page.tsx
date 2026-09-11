import { notFound } from 'next/navigation';
import { Landing } from '@/components/public';
import { BrandProvider } from '@/components/brand-provider';
import { publicCatalog } from '@/lib/server';
import { get } from '@/lib/store';
import { settings as defaultSettings } from '@/lib/data';
import type { PlatformSettings } from '@/lib/types';

export const dynamic = 'force-dynamic';
export default async function BrandedSite({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  if (!/^[a-f0-9]{24}$/.test(siteId)) notFound();
  const savedSettings = await get<PlatformSettings>('platformSettings', siteId);
  const settings = {
    ...defaultSettings,
    ...(savedSettings ?? {}),
    id: siteId,
  };
  return (
    <BrandProvider settings={settings}>
      <Landing {...await publicCatalog()} />
    </BrandProvider>
  );
}

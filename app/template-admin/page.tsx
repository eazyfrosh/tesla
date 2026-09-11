import { currentUser, eazytoolsSiteId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { get } from '@/lib/store';
import { settings as defaults } from '@/lib/data';
import type { PlatformSettings } from '@/lib/types';
import { TemplateOwnerEditor } from '@/components/template-owner-editor';

export const dynamic = 'force-dynamic';
export default async function TemplateAdminPage() {
  const user = await currentUser();
  if (!user?.eazytoolsOwner) redirect('/login');
  const siteId = eazytoolsSiteId(user.uid.replace(/^eazytools-/, ''));
  const settings = (await get<PlatformSettings>('platformSettings', siteId)) ?? {
    ...defaults,
    id: siteId,
  };
  return <TemplateOwnerEditor initial={settings} siteId={siteId} />;
}

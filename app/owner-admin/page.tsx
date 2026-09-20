import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function OwnerAdminPage() {
  const user = await currentUser();
  if (!user?.eazytoolsOwner) redirect('/login');
  redirect('/admin');
}

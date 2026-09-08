import { Landing } from '@/components/public';
import { publicCatalog } from '@/lib/server';
export const dynamic = 'force-dynamic';
export default async function Home() {
  return <Landing {...await publicCatalog()} />;
}

import { notFound } from 'next/navigation';
import { publicCatalog } from '@/lib/server';
import { VehicleDetail } from '@/components/catalog';
import { PublicNav, PublicFooter } from '@/components/public';
export const dynamic = 'force-dynamic';
export default async function Car({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { vehicles } = await publicCatalog();
  const vehicle = vehicles.find((v) => v.id === id);
  if (!vehicle) notFound();
  return (
    <>
      <PublicNav />
      <main className="container section">
        <VehicleDetail vehicle={vehicle} />
      </main>
      <PublicFooter />
    </>
  );
}

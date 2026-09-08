import { PublicNav, PublicFooter } from '@/components/public';
import { VehicleCatalog } from '@/components/catalog';
import { publicCatalog } from '@/lib/server';
export const dynamic = 'force-dynamic';
export default async function Cars() {
  const { vehicles } = await publicCatalog();
  return (
    <>
      <PublicNav />
      <main className="container section">
        <div className="catalog-hero">
          <span className="eyebrow red">THE ELECTRIC COLLECTION</span>
          <h1>Designed to move you.</h1>
          <p className="muted">
            Exceptional electric vehicles. A different kind of discovery.
            <br />
            Explore fictional listings and practice a reservation.
          </p>
        </div>
        <VehicleCatalog vehicles={vehicles} />
      </main>
      <PublicFooter />
    </>
  );
}

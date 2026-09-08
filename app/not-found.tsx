import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow red">404 · OFF THE MAP</span>
      <h1>A different direction.</h1>
      <p className="muted">This page or record isn’t available.</p>
      <Link href="/" className="button">
        Back to Volterra
      </Link>
    </main>
  );
}

'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="error-page">
      <span className="eyebrow red">A BRIEF INTERRUPTION</span>
      <h1>Let’s try that again.</h1>
      <p className="muted">
        We couldn’t load this view. Check your connection, or ask the operator to verify the
        Firebase configuration.
      </p>
      <div className="row">
        <button className="button" onClick={reset}>
          Try again
        </button>
        <Link className="button secondary" href="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}

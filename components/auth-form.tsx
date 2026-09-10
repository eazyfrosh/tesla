'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { clientAuth } from '@/lib/firebase-client';
import { Logo } from './ui';
export function AuthForm({
  mode,
  local,
}: {
  mode: 'login' | 'register' | 'forgot-password';
  local: boolean;
}) {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  const [form, setForm] = useState<Record<string, string>>({
    currency: 'USD',
    country: 'United States',
    region: '',
    city: '',
    phone: '',
    image: '',
  });
  const field = (name: string, label: string, type = 'text') => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={type}
        value={form[name] ?? ''}
        required
        autoComplete={
          name === 'password'
            ? mode === 'register'
              ? 'new-password'
              : 'current-password'
            : name === 'email'
              ? 'email'
              : undefined
        }
        minLength={name === 'password' ? 12 : undefined}
        maxLength={name === 'password' ? 128 : 200}
        onChange={(e) => setForm({...form, [name]: e.target.value })}
      />
    </label>
  );
  async function session(body: object) {
    const r = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const auth = clientAuth();
      if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, form.email);
        setSuccess('If an account exists, a password reset email will be sent.');
        return;
      }
      if (mode === 'register' && form.password !== form.confirm)
        throw new Error('Passwords do not match');
      const result =
        mode === 'register'
          ? await createUserWithEmailAndPassword(auth, form.email, form.password)
          : await signInWithEmailAndPassword(auth, form.email, form.password);
      await session({
        idToken: await result.user.getIdToken(),
...(mode === 'register'
          ? {
              profile: {
                fullName: form.fullName,
                username: form.username,
                email: form.email,
                phone: form.phone,
                country: form.country,
                region: form.region,
                city: form.city,
                currency: form.currency,
                image: '',
              },
            }
          : {}),
      });
      await signOut(auth);
      window.location.assign('/dashboard');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow red">YOUR FUTURE, IN FOCUS</span>
          <h1>
            A little curiosity.
            <br />A new perspective.
          </h1>
          <p>
            Markets. Mobility. Possibility.
            <br />
            Your next chapter starts here.
          </p>
          <div className="auth-quote">
            <span className="red">✦</span>
            <p>
               with intention.
              <br />
              Move with confidence.
            </p>
          </div>
        </div>
        <span className="small muted">
          <ShieldCheck size={15} /> platform. No real funds.
        </span>
      </aside>
      <main className="auth-main">
        <Link href="/" className="text-link muted">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="auth-content">
          <span className="demo-pill">VOLTERRA</span>
          <h2>
            {mode === 'login'
              ? 'Welcome back.'
              : mode === 'register'
                ? 'Make your next move.'
                : 'A fresh start.'}
          </h2>
          <p className="muted">
            {mode === 'login'
              ? 'Sign in to your simulated workspace.'
              : mode === 'register'
                ? 'Create your account. Start with $10,000 in funds.'
                : 'We’ll help you reset your password.'}
          </p>
          {mode === 'register' && (
            <div className="registration-steps">
              {['Your details', 'Location', 'Security'].map((s, i) => (
                <span className={step === i ? 'active' : ''} key={s}>
                  {i + 1} · {s}
                </span>
              ))}
            </div>
          )}
          <form className="form" onSubmit={submit}>
            {mode === 'register' ? (
              step === 0 ? (
                <>
                  {field('username', 'Username')}
                  {field('fullName', 'Full name')}
                  {field('email', 'Email', 'email')}
                  {field('phone', 'Phone', 'tel')}
                </>
              ) : step === 1 ? (
                <>
                  {field('country', 'Country')}
                  {field('region', 'State / region')}
                  {field('city', 'City')}
                  <label>
                    Preferred currency
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({...form, currency: e.target.value })}
                    >
                      {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  {field('password', 'Password · at least 12 characters', 'password')}
                  {field('confirm', 'Confirm password', 'password')}
                  <label className="checkbox">
                    <input type="checkbox" required />I accept the{' '}
                    <Link href="/terms" target="_blank">
                      terms
                    </Link>{' '}
                    and understand this is a simulation.
                  </label>
                </>
              )
            ) : (
              <>
                {field('email', 'Email address', 'email')}
                {mode === 'login' && field('password', 'Password', 'password')}
              </>
            )}
            {mode === 'login' && (
              <Link href="/forgot-password" className="text-link small">
                Forgot password?
              </Link>
            )}
            {error && (
              <p className="alert negative" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="alert positive" role="status">
                {success}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : mode === 'forgot-password'
                    ? 'Send reset link'
                    : step < 2
                      ? 'Continue'
                      : 'Create account'}
              <ArrowRight size={17} />
            </button>
            {mode === 'register' && step > 0 && (
              <button className="text-button" type="button" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
          </form>
          {local && (
            <div className="local-access">
              <span className="small muted">LOCAL DEVELOPMENT SANDBOX</span>
              <p className="small muted">
                Firebase is not configured. Explore isolated server-stored accounts.
              </p>
              <div className="row">
                {['user', 'admin'].map((role) => (
                  <button
                    className="button secondary"
                    key={role}
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await session({ demo: role });
                        window.location.assign(role === 'admin' ? '/admin' : '/dashboard');
                      } catch (e) {
                        setError((e as Error).message);
                        setBusy(false);
                      }
                    }}
                  >
                    {role} account
                    <ArrowUpRightFallback />
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="muted small">
            {mode === 'register' ? 'Already have an account?' : 'New to Volterra?'}{' '}
            <Link className="text-link" href={mode === 'register' ? '/login' : '/register'}>
              {mode === 'register' ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
function ArrowUpRightFallback() {
  return <ArrowRight size={14} />;
}

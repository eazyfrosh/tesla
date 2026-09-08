'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  Zap,
  ShieldCheck,
  ChartNoAxesCombined,
  Wallet,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { Logo, MarketCard, VehicleCard, InvestmentPlanCard, money } from './ui';
import { faqs } from '@/lib/data';
import type { Market, Plan, Vehicle } from '@/lib/types';
export function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-nav">
      <div className="container row">
        <Logo />
        <nav className={open ? 'public-links open' : 'public-links'} aria-label="Main navigation">
          <Link href="/why-us">Why Volterra</Link>
          <Link href="/for-traders">Trading</Link>
          <Link href="/services">Investments</Link>
          <Link href="/cars">
            EV marketplace <ArrowUpRight size={13} />
          </Link>
        </nav>
        <div className="nav-actions">
          <span className="demo-pill">DEMO PLATFORM</span>
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link className="button" href="/register">
            Get started <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo />
            <p className="muted">
              A new perspective on markets.
              <br />
              An electric vision of tomorrow.
            </p>
            <span className="demo-pill">SIMULATED. ALWAYS.</span>
          </div>
          {[
            [
              'Platform',
              '/for-traders',
              'Trading',
              '/services',
              'Investments',
              '/cars',
              'EV marketplace',
              '/login',
              'Your account',
            ],
            [
              'Company',
              '/about',
              'About us',
              '/why-us',
              'Why Volterra',
              '/contact',
              'Contact',
              '/faq',
              'FAQs',
            ],
            [
              'Transparency',
              '/terms',
              'Terms of use',
              '/privacy',
              'Privacy policy',
              '/risk-warning',
              'Risk warning',
              '/safety-of-funds',
              'Safety of funds',
              '/trading-conditions',
              'Trading conditions',
            ],
          ].map(([title, ...links]) => (
            <div key={title}>
              <h3>{title}</h3>
              {links
                .filter((_, i) => i % 2 === 0)
                .map((href, i) => (
                  <Link key={href} href={href}>
                    {links[i * 2 + 1]}
                  </Link>
                ))}
            </div>
          ))}
        </div>
        <div className="risk-copy">
          <b>DEMO ONLY · NOT REAL FUNDS.</b> Volterra is a fictional platform for demonstration and
          education. Quotes, chart history, account values, testimonials, and vehicle listings are
          illustrative. No real trading, payments, investment returns, or vehicle sales occur.
          Nothing here is financial advice. Volterra is not affiliated with Tesla or any listed
          brand.
        </div>
        <div className="row footer-bottom">
          <span>© {new Date().getFullYear()} Volterra Demo. All rights reserved.</span>
          <span>
            <Globe size={14} /> English · USD
          </span>
        </div>
      </div>
    </footer>
  );
}
export function FAQ() {
  return (
    <div className="faq-list">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <ChevronDown size={18} />
          </summary>
          <p className="muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
export function Landing({
  markets,
  plans,
  vehicles,
}: {
  markets: Market[];
  plans: Plan[];
  vehicles: Vehicle[];
}) {
  return (
    <>
      <PublicNav />
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="red-dot" /> THE FUTURE MOVES WITH YOU
              </span>
              <h1>
                Think ahead.
                <br />
                Trade smarter.
                <br />
                <span>Move electric.</span>
              </h1>
              <p>
                Explore the markets. Build your perspective. Discover exceptional electric vehicles.
                One connected platform, endless possibilities to practice.
              </p>
              <div className="hero-buttons">
                <Link href="/register" className="button large">
                  Start your journey <ArrowUpRight size={19} />
                </Link>
                <Link href="/cars" className="button secondary large">
                  Explore electric <ArrowRight size={18} />
                </Link>
              </div>
              <div className="hero-trust">
                <ShieldCheck size={16} /> A simulated environment. Zero real funds.
              </div>
            </div>
            <div className="hero-visual">
              <div className="orbital orbital-one" />
              <div className="orbital orbital-two" />
              <span className="visual-label">THE ELECTRIC ADVANTAGE</span>
              {vehicles[0]?.images[0] && (
                <img
                  className="hero-car"
                  src={vehicles[0].images[0]}
                  alt="Tesla Model S — illustrative EV showcase"
                />
              )}
              <div className="floating-quote">
                <div className="row">
                  <span className="asset-icon tesla">T</span>
                  <div>
                    <b>TSLA</b>
                    <span className="small muted">Tesla, Inc. · Demo</span>
                  </div>
                  <span className="positive">
                    +2.34% <ArrowUpRight size={14} />
                  </span>
                </div>
                <strong>$248.50</strong>
                <svg viewBox="0 0 230 45" aria-label="Illustrative trend">
                  <path
                    d="M0 40 L15 30 28 35 42 16 59 23 72 12 83 28 98 18 110 25 128 8 143 13 158 4 172 17 190 5 207 10 230 1"
                    stroke="#ef5661"
                    fill="none"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="electric-note">
                <span>
                  <Zap size={18} />
                </span>
                <div>
                  <b>Built for what’s next</b>
                  <span>Markets meet electric mobility</span>
                </div>
              </div>
            </div>
          </div>
          <div className="container hero-stats">
            <div>
              <strong>13</strong>
              <span>Illustrative market assets</span>
            </div>
            <div>
              <strong>$10,000</strong>
              <span>Starting practice balance</span>
            </div>
            <div>
              <strong>5</strong>
              <span>Iconic electric models</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Simulated. No real funds.</span>
            </div>
          </div>
        </section>
        <div className="ticker">
          {markets.slice(0, 7).map((m) => (
            <div key={m.id}>
              <b>{m.symbol.replace('-', '/')}</b>
              <span>{money(m.price)}</span>
              <span className={m.change > 0 ? 'positive' : 'negative'}>
                {m.change > 0 ? '+' : ''}
                {m.change}%
              </span>
            </div>
          ))}
        </div>
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">ONE PLATFORM. MORE POSSIBILITY.</span>
              <h2>
                A smarter space
                <br />
                for your next move.
              </h2>
            </div>
            <p className="muted">
              From your first simulated trade to your next electric obsession. Get the whole picture
              in one place.
            </p>
          </div>
          <div className="grid three feature-grid">
            {[
              [
                ChartNoAxesCombined,
                'Markets without the guesswork',
                'Explore stocks, crypto, forex, and indices with clear quotes and intuitive practice tools.',
                '/for-traders',
              ],
              [
                Wallet,
                'Your wallet. In perspective.',
                'Keep simulated funds, allocations, and every request organized in one transparent workspace.',
                '/services',
              ],
              [
                Zap,
                'The electric advantage',
                'Discover a curated demo collection of electric vehicles. Compare, explore, and reserve.',
                '/cars',
              ],
            ].map(([Icon, title, copy, href]) => {
              const I = Icon as typeof Zap;
              return (
                <Link href={href as string} className="card feature-card" key={title as string}>
                  <span className="feature-icon">
                    <I size={25} />
                  </span>
                  <h3>{title as string}</h3>
                  <p className="muted">{copy as string}</p>
                  <span className="text-link">
                    Explore more <ArrowUpRight size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="wallet-section">
          <div className="container split">
            <div className="wallet-preview card">
              <div className="row">
                <Logo />
                <span className="demo-pill">DEMO WALLET</span>
              </div>
              <p className="muted">Your starting practice balance</p>
              <strong>
                $10,000<span>.00</span>
              </strong>
              <div className="wallet-preview-bottom">
                <span>Available for your next move</span>
                <ShieldCheck size={26} />
              </div>
            </div>
            <div>
              <span className="eyebrow red">FUND YOUR CURIOSITY</span>
              <h2>
                One wallet.
                <br />A world to explore.
              </h2>
              <p className="muted">
                Practice funding, track every movement, and understand your available balance. With
                every simulated request visible from start to finish.
              </p>
              <Link href="/register" className="text-link">
                Explore your demo wallet <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">BUILD YOUR PERSPECTIVE</span>
              <h2>A plan for every starting point.</h2>
            </div>
            <p className="muted">
              Fictional allocation plans designed for practice. Different horizons. Clear risks. No
              promised returns.
            </p>
          </div>
          <div className="grid four">
            {plans
              .filter((p) => p.active)
              .map((p) => (
                <InvestmentPlanCard key={p.id} plan={p} />
              ))}
          </div>
        </section>
        <section className="section inventory-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow red">DRIVE THE CHANGE</span>
                <h2>Extraordinary by electric.</h2>
              </div>
              <Link href="/cars" className="button secondary">
                Explore the collection <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="grid three">
              {vehicles.slice(0, 3).map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
            <p className="micro muted">
              Fictional inventory. Prices and specifications are illustrative. Vehicle imagery
              courtesy of Tesla, Inc.
            </p>
          </div>
        </section>
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow red">THE BIGGER PICTURE</span>
              <h2>Markets in motion.</h2>
            </div>
            <Link href="/dashboard/markets" className="text-link">
              Explore all markets <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid four">
            {markets.slice(0, 4).map((m) => (
              <MarketCard key={m.id} market={m} />
            ))}
          </div>
        </section>
        <section className="section container">
          <span className="eyebrow red">IMAGINED EXPERIENCES</span>
          <h2>Different journeys. Shared curiosity.</h2>
          <div className="grid three testimonials">
            {[
              [
                'AM',
                'Alex M.',
                'A clear place to practice',
                '“Seeing my simulated wallet, holdings, and market view together makes the mechanics easier to understand.”',
              ],
              [
                'JL',
                'Jordan L.',
                'Space to explore',
                '“The practice environment lets me think through an allocation before making a decision.”',
              ],
              [
                'SK',
                'Sam K.',
                'Electric, in every sense',
                '“I can explore the EV collection and follow a reservation from one simple workspace.”',
              ],
            ].map(([initial, name, title, quote]) => (
              <article className="card" key={name}>
                <span className="red">★★★★★</span>
                <h3>{title}</h3>
                <p className="muted">{quote}</p>
                <div className="row">
                  <span className="avatar">{initial}</span>
                  <span>
                    {name}
                    <span className="micro muted">FICTIONAL DEMO PERSONA</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section getting-started">
          <div className="container">
            <div className="center">
              <span className="eyebrow red">YOUR NEXT CHAPTER</span>
              <h2>Three steps. A fresh perspective.</h2>
            </div>
            <div className="grid three">
              {[
                ['01', 'Make it yours', 'Create your demo account and set up your profile.'],
                [
                  '02',
                  'Explore your possibilities',
                  'Discover simulated markets, plans, and electric vehicles.',
                ],
                [
                  '03',
                  'Put ideas in motion',
                  'Practice a trade, allocate demo funds, or reserve a fictional EV.',
                ],
              ].map(([n, t, d]) => (
                <div className="step" key={n}>
                  <span>{n}</span>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section container faq-section">
          <div>
            <span className="eyebrow red">A LITTLE MORE CLARITY</span>
            <h2>
              Good questions.
              <br />
              Straight answers.
            </h2>
            <Link href="/contact" className="text-link">
              Talk to us <ArrowUpRight size={16} />
            </Link>
          </div>
          <FAQ />
        </section>
        <section className="container final-cta">
          <span className="eyebrow">THE NEXT MOVE IS YOURS</span>
          <h2>
            Meet your potential.
            <br />
            <span className="muted">Explore what’s next.</span>
          </h2>
          <Link href="/register" className="button large">
            Create a demo account <ArrowUpRight size={18} />
          </Link>
          <p className="small muted">No real money. Just room to grow.</p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
export function ContactForm() {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(f)),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setMessage(data.message);
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Name
        <input name="name" required minLength={2} maxLength={100} />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        How can we help?
        <textarea name="message" required minLength={10} maxLength={2000} rows={5} />
      </label>
      <p className="small muted">
        Do not include bank details, passwords, or payment information. This form stores a demo
        support request.
      </p>
      <button className="button" disabled={busy}>
        {busy ? 'Sending…' : 'Send message'}
        <ArrowRight size={16} />
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
